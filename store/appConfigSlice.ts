import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch } from "../lib/api";

interface AppConfigState {
  dynamicEmailText: string;
  useCustomLogo: boolean;
  customLogoUrl: string;
  loading: boolean;
}

const initialState: AppConfigState = {
  dynamicEmailText: "",
  useCustomLogo: false,
  customLogoUrl: "",
  loading: false,
};

export const fetchAppConfig = createAsyncThunk("appConfig/fetchAppConfig", async () => {
  const res = await apiFetch("/app-config");
  if (res.success && res.data) {
    return res.data;
  }
  throw new Error("Failed to load app config");
});

const appConfigSlice = createSlice({
  name: "appConfig",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppConfig.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAppConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.dynamicEmailText = action.payload.DYNAMIC_EMAIL_TEXT || "";
        state.useCustomLogo = action.payload.USE_CUSTOM_LOGO === "true";
        state.customLogoUrl = action.payload.CUSTOM_LOGO_URL || "";
      })
      .addCase(fetchAppConfig.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default appConfigSlice.reducer;
