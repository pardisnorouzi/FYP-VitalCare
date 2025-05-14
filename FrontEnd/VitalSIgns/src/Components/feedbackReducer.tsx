
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Feedback {
  name: string;
  comment: string;
  rating: number;
}

interface FeedbackState {
  feedbacks: Feedback[];
}

const initialState: FeedbackState = {
  feedbacks: [],
};

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    addFeedback: (state, action: PayloadAction<Feedback>) => {
      state.feedbacks.push(action.payload);
    },
  },
});

export const { addFeedback } = feedbackSlice.actions;
export default feedbackSlice.reducer;
