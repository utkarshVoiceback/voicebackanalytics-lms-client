import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface EnrollmentState {
  generatedLink: string | null;
  loading: boolean;
  error: string | null;
  uploadResults: any | null;
  invitations: any[];
}

const initialState: EnrollmentState = {
  generatedLink: null,
  loading: false,
  error: null,
  uploadResults: null,
  invitations: [],
};

export const enrollmentSlice = createSlice({
  name: "enrollment",
  initialState,
  reducers: {
    setGeneratedLink: (state, action: PayloadAction<string | null>) => {
      state.generatedLink = action.payload;
      state.loading = false;
      state.error = null;
    },
    setEnrollmentLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setEnrollmentError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setUploadResults: (state, action: PayloadAction<any | null>) => {
      state.uploadResults = action.payload;
    },
    setInvitations: (state, action: PayloadAction<any[]>) => {
      state.invitations = action.payload;
    },
  },
});

export const { 
  setGeneratedLink, 
  setEnrollmentLoading, 
  setEnrollmentError,
  setUploadResults,
  setInvitations
} = enrollmentSlice.actions;

export default enrollmentSlice.reducer;
