import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from './tasksSlice';
import projectsReducer from './projectsSlice';

const store = configureStore({
  reducer: {
    tasks: tasksReducer,
    projects: projectsReducer,
  },
});

export default store;