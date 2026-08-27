"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface ModuleContent {
  id: string;
  contentType: string;
}

interface ModuleProgress {
  status: string;
  percentage: number | null;
  obtainedMarks: number | null;
  totalMarks: number | null;
  completedAt?: string | null;
}

interface ModuleWithProgress {
  id: string;
  title: string;
  description: string | null;
  sequenceOrder: number;
  isSequential: boolean;
  status: string;
  contents: ModuleContent[];
  progress: ModuleProgress | null;
  isLocked?: boolean;
}

export default function MyProgressPage() {
  const router = useRouter();
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batchTitle, setBatchTitle] = useState<string>("");

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await apiFetch("/learner/profile");
      if (!profileRes.success || !profileRes.data) {
        setError("You are not enrolled in any batch.");
        setLoading(false);
        return;
      }
      const { batchId, batch } = profileRes.data;
      if (batch?.batchTitle) setBatchTitle(batch.batchTitle);

      const [modulesRes, progressRes] = await Promise.all([
        apiFetch(`/modules?courseId=${batch?.courseId}`),
        apiFetch(`/modules/progress?courseId=${batch?.courseId}`),
      ]);

      if (!modulesRes.success || !modulesRes.data) {
        setError("Failed to load progress data.");
        setLoading(false);
        return;
      }

      const progressMap: Record<string, ModuleProgress> = {};
      if (progressRes.success && progressRes.data) {
        for (const p of progressRes.data) {
          progressMap[p.moduleId] = p;
        }
      }

      const sortedMods = [...modulesRes.data].sort(
        (a: any, b: any) => a.sequenceOrder - b.sequenceOrder
      );

      const merged: ModuleWithProgress[] = sortedMods.map((mod: any, index: number) => {
        const progress = progressMap[mod.id] || null;

        let isLocked = false;
        if (mod.isSequential && index > 0) {
          const prevMod = sortedMods
            .slice(0, index)
            .reverse()
            .find((m: any) => m.isSequential);
          if (prevMod) {
            const prevProgress = progressMap[prevMod.id];
            if (!prevProgress || prevProgress.status !== "COMPLETED") {
              isLocked = true;
            }
          }
        }

        return { ...mod, progress, isLocked };
      });

      setModules(merged);
    } catch {
      setError("Failed to load your progress. Please try again.");
    }
    setLoading(false);
  };

  const getStatusConfig = (mod: ModuleWithProgress) => {
    if (mod.isLocked) {
      return {
        label: "Locked",
        badgeClass: "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700/60 dark:text-slate-400 dark:border-slate-600/40",
        actionLabel: "Locked",
        actionClass: "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed",
        icon: (
          <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        ),
      };
    }

    const status = mod.progress?.status;

    if (!status || status === "NOT_STARTED") {
      return {
        label: "Not Started",
        badgeClass: "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700/60 dark:text-slate-300 dark:border-slate-600/40",
        actionLabel: "Start",
        actionClass: "bg-blue-600 hover:bg-blue-500 text-white",
        icon: (
          <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        ),
      };
    }
    if (status === "IN_PROGRESS" || status === "CONTENT_COMPLETED") {
      return {
        label: "In Progress",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
        actionLabel: "Continue",
        actionClass: "bg-blue-600 hover:bg-blue-500 text-white",
        icon: (
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
          </svg>
        ),
      };
    }
    if (status === "MCQ_AVAILABLE") {
      return {
        label: "Assessment Ready",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
        actionLabel: "Take Assessment",
        actionClass: "bg-amber-600 hover:bg-amber-500 text-white",
        icon: (
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
          </svg>
        ),
      };
    }
    if (status === "COMPLETED") {
      return {
        label: "Completed",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
        actionLabel: "View Result",
        actionClass: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-700/30 dark:hover:bg-emerald-700/50 dark:text-emerald-300 dark:border-emerald-700/50",
        icon: (
          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        ),
      };
    }
    return {
      label: status,
      badgeClass: "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
      actionLabel: "Open",
      actionClass: "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white",
      icon: null,
    };
  };

  const getActionRoute = (mod: ModuleWithProgress): string | null => {
    if (mod.isLocked) return null;
    const status = mod.progress?.status;
    if (!status || status === "NOT_STARTED" || status === "IN_PROGRESS" || status === "CONTENT_COMPLETED") {
      return `/learner/modules/${mod.id}`;
    }
    if (status === "MCQ_AVAILABLE") {
      return `/learner/modules/${mod.id}/mcq`;
    }
    if (status === "COMPLETED") {
      return `/learner/modules/${mod.id}`;
    }
    return null;
  };

  const completedCount = modules.filter((m) => m.progress?.status === "COMPLETED").length;
  const inProgressCount = modules.filter((m) => m.progress?.status === "IN_PROGRESS" || m.progress?.status === "CONTENT_COMPLETED").length;
  const mcqAvailableCount = modules.filter((m) => m.progress?.status === "MCQ_AVAILABLE").length;
  const remainingCount = modules.filter((m) => m.isLocked || !m.progress || m.progress.status === "NOT_STARTED").length;
  const overallProgress = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

  const totalObtained = modules.reduce((sum, m) => sum + (m.progress?.obtainedMarks || 0), 0);
  const totalPossible = modules.reduce((sum, m) => sum + (m.progress?.totalMarks || 0), 0);

  const getPreviousModuleTitle = (modules: ModuleWithProgress[], currentIndex: number): string | null => {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (modules[i].isSequential) {
        return modules[i].title;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">My Progress</h1>
          {batchTitle && (
            <p className="text-slate-500 dark:text-slate-400 mt-1">{batchTitle}</p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchProgress}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!error && modules.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Modules Available</h2>
            <p className="text-slate-500 dark:text-slate-400">Your batch has no training modules yet. Check back soon.</p>
          </div>
        )}

        {/* Progress Content */}
        {!error && modules.length > 0 && (
          <>
            {/* Summary Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Overall</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{overallProgress}%</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Progress</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-5">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-500/70 uppercase tracking-wider mb-1">Completed</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500/70 mt-1">Modules</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl p-5">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-500/70 uppercase tracking-wider mb-1">In Progress</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgressCount + mcqAvailableCount}</p>
                <p className="text-xs text-blue-600 dark:text-blue-500/70 mt-1">Modules</p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-500/70 uppercase tracking-wider mb-1">Remaining</p>
                <p className="text-2xl font-bold text-slate-600 dark:text-slate-300">{remainingCount}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500/70 mt-1">Modules</p>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                <span>{completedCount} of {modules.length} modules completed</span>
                <span>{overallProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            {/* Total Marks Card */}
            {totalPossible > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6">
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Total Marks</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {totalObtained}/{totalPossible}
                  {totalPossible > 0 && <span className="text-slate-500 dark:text-slate-400 text-sm ml-2">({Math.round((totalObtained/totalPossible)*100)}%)</span>}
                </p>
              </div>
            )}

            {/* Module List */}
            <div className="space-y-4">
              {modules.map((mod, index) => {
                const config = getStatusConfig(mod);
                const actionRoute = getActionRoute(mod);
                const prevTitle = mod.isLocked ? getPreviousModuleTitle(modules, index) : null;

                return (
                  <div
                    key={mod.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Sequence Number */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">
                          {mod.sequenceOrder}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {config.icon}
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
                              {mod.title}
                            </h3>
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.badgeClass}`}>
                              {config.label}
                            </span>
                          </div>
                        </div>

                        {mod.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{mod.description}</p>
                        )}

                        {/* Score (if completed) */}
                        {mod.progress?.status === "COMPLETED" && mod.progress.obtainedMarks !== null && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-3">
                            Score: {mod.progress.obtainedMarks}/{mod.progress.totalMarks} marks
                            {mod.progress.percentage !== null && ` (${mod.progress.percentage.toFixed(1)}%)`}
                          </p>
                        )}

                        {/* Locked Message */}
                        {mod.isLocked && prevTitle && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                            🔒 Complete Module "{prevTitle}" first to unlock this module.
                          </p>
                        )}

                        {/* Action Button */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              if (actionRoute) router.push(actionRoute);
                            }}
                            disabled={mod.isLocked || !actionRoute}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${config.actionClass} ${mod.isLocked || !actionRoute ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {config.actionLabel}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
