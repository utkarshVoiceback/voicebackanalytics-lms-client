import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ModuleContent {
  id: string;
  moduleId: string;
  contentType: string;
  contentUrl: string | null;
  textContent: string | null;
  estimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  batchId: string;
  title: string;
  description: string | null;
  sequenceOrder: number;
  isSequential: boolean;
  status: string;
  contents: ModuleContent[];
  batch?: {
    id: string;
    batchTitle: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ModuleState {
  modules: Module[];
  currentModule: Module | null;
  loading: boolean;
  error: string | null;
}

const initialState: ModuleState = {
  modules: [],
  currentModule: null,
  loading: false,
  error: null,
};

export const moduleSlice = createSlice({
  name: "module",
  initialState,
  reducers: {
    setModules: (state, action: PayloadAction<Module[]>) => {
      state.modules = action.payload;
      state.loading = false;
      state.error = null;
    },
    setCurrentModule: (state, action: PayloadAction<Module | null>) => {
      state.currentModule = action.payload;
      state.loading = false;
      state.error = null;
    },
    addModule: (state, action: PayloadAction<Module>) => {
      state.modules.push(action.payload);
      state.modules.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    },
    updateModuleInList: (state, action: PayloadAction<Module>) => {
      const index = state.modules.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) {
        state.modules[index] = action.payload;
      }
      if (state.currentModule?.id === action.payload.id) {
        state.currentModule = action.payload;
      }
    },
    setModuleLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setModuleError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setModules,
  setCurrentModule,
  addModule,
  updateModuleInList,
  setModuleLoading,
  setModuleError,
} = moduleSlice.actions;

export default moduleSlice.reducer;
