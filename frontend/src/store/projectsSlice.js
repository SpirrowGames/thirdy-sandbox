import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../api/apiClient';

export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get('/projects');
      return data.projects;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error);
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/projects', payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error);
    }
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    items: [],
    selected: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    selectProject(state, action) {
      state.selected = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.items.push(action.payload);
      });
  },
});

export const { selectProject } = projectsSlice.actions;
export default projectsSlice.reducer;