"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "lms_theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Runs only in the browser, so it's safe to call after mount.
function readThemeFromDom(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyThemeToDom(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

// Runs on both server and client so the very first client render matches
// the server-rendered HTML exactly — required to avoid a hydration
// mismatch, since the server has no way to know the real theme.
const SSR_DEFAULT_THEME: Theme = "light";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(SSR_DEFAULT_THEME);

  // The blocking script in the <head> already applied the correct class
  // to <html> before paint (so there's no visual flash), but React's
  // component state still starts at SSR_DEFAULT_THEME until this runs.
  // useLayoutEffect fires synchronously right after the DOM commits (and
  // before the browser paints), so it corrects the state without ever
  // being visible and without triggering a hydration warning — unlike a
  // mismatch during the initial render, a post-mount state update is a
  // normal client-side re-render as far as React is concerned.
  useLayoutEffect(() => {
    const domTheme = readThemeFromDom();
    setThemeState((current) => (current === domTheme ? current : domTheme));
  }, []);

  const setTheme = useCallback((next: Theme) => {
    applyThemeToDom(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (private mode / disabled) — theme still
      // applies for this page view, it just won't persist.
    }
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === "dark" ? "light" : "dark";
      applyThemeToDom(next);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Keep theme in sync across tabs/windows.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      if (e.newValue === "light" || e.newValue === "dark") {
        applyThemeToDom(e.newValue);
        setThemeState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
