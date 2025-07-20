import { configureStore } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

// Poll slice
const pollSlice = createSlice({
  name: 'poll',
  initialState: {
    activePoll: null,
    pollResults: {},
    pollHistory: [],
    studentName: localStorage.getItem('studentName') || '',
    isTeacher: false,
    students: {},
    chatMessages: []
  },
  reducers: {
    setActivePoll: (state, action) => {
      state.activePoll = action.payload;
    },
    setPollResults: (state, action) => {
      state.pollResults = action.payload;
    },
    setStudentName: (state, action) => {
      state.studentName = action.payload;
      localStorage.setItem('studentName', action.payload);
    },
    setIsTeacher: (state, action) => {
      state.isTeacher = action.payload;
    },
    setPollHistory: (state, action) => {
      state.pollHistory = action.payload;
    },
    setStudents: (state, action) => {
      state.students = action.payload;
    },
    addChatMessage: (state, action) => {
      state.chatMessages.push(action.payload);
    }
  }
});

export const { 
  setActivePoll, 
  setPollResults, 
  setStudentName, 
  setIsTeacher,
  setPollHistory,
  setStudents,
  addChatMessage
} = pollSlice.actions;

// Configure store
const store = configureStore({
  reducer: {
    poll: pollSlice.reducer
  }
});

export default store;