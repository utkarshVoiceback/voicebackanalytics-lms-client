export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-busy="true" aria-live="polite">
      {/* Page title */}
      <div className="mb-8 space-y-2">
        <div className="h-7 w-48 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 animate-pulse" />
        <div className="h-4 w-72 rounded-lg bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
          >
            <div className="h-3 w-24 rounded bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
            <div className="h-7 w-16 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Content cards / table area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse flex-shrink-0" />
              <div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-slate-400 dark:text-slate-500">Loading&hellip;</p>
    </div>
  );
}
