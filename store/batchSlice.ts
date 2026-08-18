import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Batch {
  id: string;
  batchTitle: string;
  startDate: string;
  endDate: string;
  enrollmentDate?: string;
  enrollmentStartDate: string;
  enrollmentEndDate: string;
  batchSize: number;
  enrolledCount?: number;
  dynamicStatus?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface BatchState {
  batches: Batch[];
  activeBatch: Batch | null;
  loading: boolean;
  error: string | null;
}

const initialState: BatchState = {
  batches: [],
  activeBatch: null,
  loading: false,
  error: null,
};

export const batchSlice = createSlice({
  name: "batch",
  initialState,
  reducers: {
    setBatches: (state, action: PayloadAction<Batch[]>) => {
      state.batches = action.payload;
      state.loading = false;
      state.error = null;
    },
    setActiveBatch: (state, action: PayloadAction<Batch | null>) => {
      state.activeBatch = action.payload;
      state.loading = false;
      state.error = null;
    },
    addBatch: (state, action: PayloadAction<Batch>) => {
      state.batches.unshift(action.payload);
    },
    updateBatchInList: (state, action: PayloadAction<Batch>) => {
      const index = state.batches.findIndex((b) => b.id === action.payload.id);
      if (index !== -1) {
        state.batches[index] = action.payload;
      }
      if (state.activeBatch?.id === action.payload.id) {
        state.activeBatch = action.payload;
      }
    },
    setBatchLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setBatchError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setBatches,
  setActiveBatch,
  addBatch,
  updateBatchInList,
  setBatchLoading,
  setBatchError,
} = batchSlice.actions;

export default batchSlice.reducer;
