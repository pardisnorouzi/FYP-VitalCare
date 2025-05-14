
import { configureStore } from '@reduxjs/toolkit';
import feedbackReducer from './feedbackReducer';

export const store = configureStore({
  reducer: {
    feedback: feedbackReducer,
  },
});