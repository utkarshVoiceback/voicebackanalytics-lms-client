"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Admin route error:", error);
  }, [error]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          This page could not be loaded
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {error.message || "Something went wrong while rendering this section."}
        </p>
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={() => retry()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
          If you were signed out, please log in again from the sidebar.
        </p>
      </div>
    </div>
  );
}
