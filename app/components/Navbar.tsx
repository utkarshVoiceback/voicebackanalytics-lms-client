"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { setCredentials, logout } from "@/store/authSlice";
import { apiFetch } from "@/lib/api";
import ThemeToggle from "@/app/components/theme/ThemeToggle";

export default function Navbar() {
  const router = RouterNav();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  function RouterNav() {
    return useRouter();
  }

  useEffect(() => {
    const token = localStorage.getItem("lms_auth_token");
    if (token && !user) {
      apiFetch("/auth/me").then((res) => {
        if (res.success && res.data) {
          dispatch(setCredentials({ user: res.data, token }));
        } else {
          dispatch(logout());
        }
      });
    }
  }, [dispatch, user]);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-blue-600 dark:text-blue-400">
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-mono">LMS</span>
          Passenger Training
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.fullName}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-mono font-semibold uppercase">{user.role}</p>
              </div>
              <ThemeToggle variant="icon-button" />
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <ThemeToggle variant="icon-button" />
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors shadow-sm"
              >
                Sign In
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
