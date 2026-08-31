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
  lockedReason?: string;
  dependency?: {
    hasDependency: boolean;
    isUnlocked: boolean;
    dependencies: { moduleId: string; title: string; completed: boolean }[];
  };
}

export default function MyModulesPage() {
  const router = useRouter();
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const GROUND_STAFF_COURSE_ID = "25F5B4C7-BE1C-4D1E-9590-205854065B99";

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    setLoading(true);
    setError(null);
    try {
      const [modulesRes, progressRes] = await Promise.all([
        apiFetch(`/modules?courseId=${GROUND_STAFF_COURSE_ID}`),
        apiFetch(`/modules/progress?courseId=${GROUND_STAFF_COURSE_ID}`),
      ]);

      if (!modulesRes.success || !modulesRes.data) {
        setError("Failed to load modules.");
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
        let lockedReason = "";

        // 1. Check custom dependencies
        if (mod.dependency?.hasDependency && !mod.dependency?.isUnlocked) {
          isLocked = true;
          const remaining = mod.dependency.dependencies.filter((d: any) => !d.completed).map((d: any) => `"${d.title}"`).join(", ");
          lockedReason = `Requires: ${remaining}`;
        }
        // 2. Check sequential access (only if not already locked by deps)
        else if (mod.isSequential && index > 0) {
          const prevMod = sortedMods.slice(0, index).reverse().find((m: any) => m.isSequential);
          if (prevMod) {
            const prevProgress = progressMap[prevMod.id];
            if (!prevProgress || prevProgress.status !== "COMPLETED") {
              isLocked = true;
              lockedReason = "Complete the previous module first.";
            }
          }
        }

        return { ...mod, progress, isLocked, lockedReason };
      });

      setModules(merged);
    } catch {
      setError("Failed to load your modules. Please try again.");
    }
    setLoading(false);
  };

  const getStatusConfig = (mod: ModuleWithProgress) => {
    if (mod.isLocked) {
      return {
        label: "Locked",
        subLabel: mod.lockedReason,
        badgeClass: "bg-slate-200 text-slate-500 border-slate-300 dark:bg-slate-700/60 dark:text-slate-400 dark:border-slate-600/40",
        cardClass: "border-slate-200 bg-slate-100/60 dark:border-slate-800 dark:bg-slate-900/50 opacity-70",
        actionLabel: "Locked",
        actionClass: "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed",
        progressColor: "bg-slate-300 dark:bg-slate-700",
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
        cardClass: "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
        actionLabel: "Start Module",
        actionClass: "bg-blue-600 hover:bg-blue-500 text-white",
        progressColor: "bg-slate-300 dark:bg-slate-700",
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
        cardClass: "border-blue-200 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/10",
        actionLabel: "Continue Learning",
        actionClass: "bg-blue-600 hover:bg-blue-500 text-white",
        progressColor: "bg-blue-500",
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
        cardClass: "border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/10",
        actionLabel: "Take Assessment",
        actionClass: "bg-amber-600 hover:bg-amber-500 text-white",
        progressColor: "bg-amber-500",
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
        cardClass: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/10",
        actionLabel: "Review Module",
        actionClass: "bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-300 dark:bg-emerald-700/30 dark:hover:bg-emerald-700/50 dark:text-emerald-300 dark:border-emerald-700/50",
        progressColor: "bg-emerald-500",
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
      cardClass: "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
      actionLabel: "Open",
      actionClass: "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white",
      progressColor: "bg-slate-400 dark:bg-slate-600",
      icon: null,
    };
  };

  const getProgressPercent = (mod: ModuleWithProgress): number => {
    const status = mod.progress?.status;
    if (!status || status === "NOT_STARTED") return 0;
    if (status === "IN_PROGRESS") return 30;
    if (status === "CONTENT_COMPLETED") return 60;
    if (status === "MCQ_AVAILABLE") return 75;
    if (status === "COMPLETED") return 100;
    return 0;
  };

  const completedCount = modules.filter((m) => m.progress?.status === "COMPLETED").length;
  const overallProgress = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

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
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">My Modules</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Ground Staff</p>
          </div>
          {modules.length > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{overallProgress}%</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Overall Progress</p>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchModules}
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

        {/* Modules List */}
        {!error && modules.length > 0 && (
          <>
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

            <div className="space-y-4">
              {modules.map((mod, index) => {
                const config = getStatusConfig(mod);
                const progressPercent = getProgressPercent(mod);

                return (
                  <div
                    key={mod.id}
                    className={`border rounded-xl p-5 transition-all ${config.cardClass}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Sequence Number */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">
                          {mod.sequenceOrder}
                        </div>
                        {index < modules.length - 1 && (
                          <div className="w-px h-4 bg-slate-300/60 dark:bg-slate-700/60" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {config.icon}
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
                              {mod.title}
                            </h3>
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.badgeClass}`}
                            >
                              {config.label}
                            </span>
                            {mod.isSequential && (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                                Sequential
                              </span>
                            )}
                          </div>
                        </div>

                        {mod.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{mod.description}</p>
                        )}

                        {config.subLabel && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-md inline-flex border border-amber-100 dark:border-amber-500/20">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              {config.subLabel}
                            </p>
                          </div>
                        )}

                        {/* Content type tags */}
                        {mod.contents && mod.contents.length > 0 && (
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            {Array.from(new Set(mod.contents.map((c) => c.contentType))).map((type) => (
                              <span
                                key={type}
                                className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 rounded px-2 py-0.5 border border-slate-300 dark:border-slate-700"
                              >
                                {type === "VIDEO" && "🎥"}
                                {type === "PDF" && "📄"}
                                {type === "PPT" && "📊"}
                                {type === "TEXT" && "📖"}
                                {type}
                              </span>
                            ))}
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {mod.contents.length} item{mod.contents.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}

                        {/* Score (if completed) */}
                        {mod.progress?.status === "COMPLETED" && mod.progress.obtainedMarks !== null && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-3">
                            Score: {mod.progress.obtainedMarks}/{mod.progress.totalMarks} marks
                            {mod.progress.percentage !== null && ` (${mod.progress.percentage.toFixed(1)}%)`}
                          </p>
                        )}

                        {/* Locked Message */}
                        {mod.isLocked && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                            🔒 Complete the previous required module to unlock this module.
                          </p>
                        )}

                        {/* Progress Bar (only when started) */}
                        {!mod.isLocked && progressPercent > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-1">
                              <span>Progress</span>
                              <span>{progressPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-500 ${config.progressColor}`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              if (!mod.isLocked) router.push(`/learner/modules/${mod.id}`);
                            }}
                            disabled={mod.isLocked}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${config.actionClass} ${mod.isLocked ? "opacity-50" : ""}`}
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
