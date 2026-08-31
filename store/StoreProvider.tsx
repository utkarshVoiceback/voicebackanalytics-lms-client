"use client";

import { Provider } from "react-redux";
import { useEffect } from "react";
import { store, useAppDispatch } from "./index";
import { fetchAppConfig } from "./appConfigSlice";

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchAppConfig());
  }, [dispatch]);
  
  return <>{children}</>;
}

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AppInitializer>{children}</AppInitializer>
    </Provider>
  );
}
