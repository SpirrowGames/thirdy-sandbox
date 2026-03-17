import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../api/apiClient';

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get('/tasks', { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error);
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/tasks', payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error);
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, ...changes }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.put(`/tasks/${id}`, changes);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/tasks/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error);
    }
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    items: [],
    total: 0,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    // Socket.IO経由の楽観的更新
    optimisticallyUpdateStatus(state, action) {
      const { taskId, status } = action.payload;
      const task = state.items.find((t) => String(t.id) === String(taskId));
      if (task) task.status = status;
    },
    // Socket.IOブロードキャスト受信
    socketTaskUpdated(state, action) {
      const updated = action.payload;
      const idx = state.items.findIndex((t) => t.id === updated.id);
      if (idx !== -1) state.items[idx] = updated;
    },
    socketTaskCreated(state, action) {
      state.items.unshift(action.payload);
      state.total += 1;
    },
    socketTaskDeleted(state, action) {
      state.items = state.items.filter((t) => t.id !== action.payload.id);
      state.total = Math.max(0, state.total - 1);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.tasks;
        state.total = action.payload.total;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const idx = state.items.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      });
  },
});

export const {
  optimisticallyUpdateStatus,
  socketTaskUpdated,
  socketTaskCreated,
  socketTaskDeleted,
} = tasksSlice.actions;

export default tasksSlice.reducer;