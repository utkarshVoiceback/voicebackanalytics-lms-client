import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import authReducer from "./authSlice";
import batchReducer from "./batchSlice";
import enrollmentReducer from "./enrollmentSlice";
import moduleReducer from "./moduleSlice";
import courseReducer from "./courseSlice";
import appConfigReducer from "./appConfigSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    batch: batchReducer,
    enrollment: enrollmentReducer,
    module: moduleReducer,
    course: courseReducer,
    appConfig: appConfigReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
