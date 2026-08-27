"use client";

import { useTheme } from "./ThemeProvider";

const SunIcon = (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-full h-full">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v2.25m0 13.5V21m8.25-9H18M6 12H3.75m14.03-6.03-1.59 1.59M7.56 16.44l-1.59 1.59m0-12.06 1.59 1.59m10.88 10.88-1.59-1.59M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
    />
  </svg>
);

const MoonIcon = (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-full h-full">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
    />
  </svg>
);

interface ThemeToggleProps {
  /** Full-width row matching sidebar menu items (icon + label), collapsed-aware. */
  variant?: "sidebar-item" | "icon-button";
  /** When true, renders icon-only (used for the collapsed desktop sidebar rail). */
  collapsed?: boolean;
  className?: string;
}

export default function ThemeToggle({
  variant = "sidebar-item",
  collapsed = false,
  className = "",
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Light Mode" : "Dark Mode";
  const title = isDark ? "Switch to Light Mode" : "Switch to Dark Mode";

  if (variant === "icon-button") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        title={title}
        aria-label={title}
        className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${className}`}
      >
        <span className="w-5 h-5">{isDark ? SunIcon : MoonIcon}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={collapsed ? title : undefined}
      aria-label={title}
      className={`group relative w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-150 ${className}`}
    >
      <span className="flex-shrink-0 w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-amber-500 dark:group-hover:text-blue-300">
        {isDark ? SunIcon : MoonIcon}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
      {collapsed && (
        <span className="absolute left-full ml-3 z-50 hidden group-hover:flex items-center whitespace-nowrap rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 shadow-xl pointer-events-none">
          {label}
        </span>
      )}
    </button>
  );
}
