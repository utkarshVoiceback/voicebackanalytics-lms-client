"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAppSelector } from "@/store";

interface ModuleWithProgress {
  id: string;
  title: string;
  description: string | null;
  sequenceOrder: number;
  isSequential: boolean;
  status: string;
  contents: any[];
  progress?: {
    status: string;
    percentage: number | null;
    obtainedMarks: number | null;
    totalMarks: number | null;
  };
}

export default function LearnerDashboardPage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [batchInfo, setBatchInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get learner profile (contains batchId)
      const profileRes = await apiFetch("/learner/profile");
      if (!profileRes.success || !profileRes.data) {
        setError("You are not enrolled in any batch yet.");
        setLoading(false);
        return;
      }
      const profile = profileRes.data;
      setBatchInfo(profile.batch);

      const courseId = profile.batch?.courseId;

      // Fetch modules and progress in parallel
      const [modulesRes, progressRes] = await Promise.all([
        apiFetch(`/modules?courseId=${courseId}`),
        apiFetch(`/modules/progress?courseId=${courseId}`),
      ]);

      if (modulesRes.success && modulesRes.data) {
        const progressMap: Record<string, any> = {};
        if (progressRes.success && progressRes.data) {
          for (const p of progressRes.data) {
            progressMap[p.moduleId] = p;
          }
        }

        const merged: ModuleWithProgress[] = modulesRes.data.map((mod: any) => ({
          ...mod,
          progress: progressMap[mod.id] || null,
        }));
        setModules(merged);
      }
    } catch (err) {
      setError("Failed to load dashboard data.");
    }
    setLoading(false);
  };

  const getStatusConfig = (mod: ModuleWithProgress) => {
    const status = mod.progress?.status;
    if (!status || status === "NOT_STARTED") {
      // Check if previous is completed or it's first non-sequential
      return {
        label: "Not Started",
        color: "text-slate-400",
        bg: "bg-slate-800",
        border: "border-slate-700",
        badge: "bg-slate-700 text-slate-300",
        icon: (
          <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        ),
        action: "Start Module",
        actionStyle: "bg-blue-600 hover:bg-blue-500 text-white",
      };
    }
    if (status === "IN_PROGRESS" || status === "CONTENT_COMPLETED") {
      return {
        label: "In Progress",
        color: "text-blue-400",
        bg: "bg-blue-950/30",
        border: "border-blue-800/50",
        badge: "bg-blue-500/20 text-blue-300",
        icon: (
          <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
          </svg>
        ),
        action: "Continue",
        actionStyle: "bg-blue-600 hover:bg-blue-500 text-white",
      };
    }
    if (status === "MCQ_AVAILABLE" || status === "MCQ_COMPLETED") {
      return {
        label: "MCQ Available",
        color: "text-amber-400",
        bg: "bg-amber-950/30",
        border: "border-amber-800/50",
        badge: "bg-amber-500/20 text-amber-300",
        icon: (
          <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
          </svg>
        ),
        action: "Take MCQ",
        actionStyle: "bg-amber-600 hover:bg-amber-500 text-white",
      };
    }
    if (status === "COMPLETED") {
      return {
        label: "Completed",
        color: "text-emerald-400",
        bg: "bg-emerald-950/30",
        border: "border-emerald-800/50",
        badge: "bg-emerald-500/20 text-emerald-300",
        icon: (
          <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        ),
        action: "Review",
        actionStyle: "bg-emerald-700/40 hover:bg-emerald-700/60 text-emerald-300 border border-emerald-700",
      };
    }
    return {
      label: status,
      color: "text-slate-400",
      bg: "bg-slate-800",
      border: "border-slate-700",
      badge: "bg-slate-700 text-slate-300",
      icon: null,
      action: "Open",
      actionStyle: "bg-slate-700 text-white",
    };
  };

  const completedCount = modules.filter((m) => m.progress?.status === "COMPLETED").length;
  const inProgressCount = modules.filter(
    (m) => m.progress?.status === "IN_PROGRESS" || m.progress?.status === "CONTENT_COMPLETED" || m.progress?.status === "MCQ_AVAILABLE"
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome back, <span className="text-blue-400">{user?.fullName?.split(" ")[0]}</span>
          </h1>
          {batchInfo && (
            <p className="text-slate-400 mt-1">
              {batchInfo.batchTitle} · {new Date(batchInfo.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} – {new Date(batchInfo.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
            <p className="text-slate-400">{error}</p>
          </div>
        ) : (
          <>
            {/* Progress Summary */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-sm text-slate-400 mb-1">Total Modules</p>
                <p className="text-3xl font-bold text-white">{modules.length}</p>
              </div>
              <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-5">
                <p className="text-sm text-emerald-400 mb-1">Completed</p>
                <p className="text-3xl font-bold text-emerald-400">{completedCount}</p>
              </div>
              <div className="bg-blue-950/30 border border-blue-900/50 rounded-xl p-5">
                <p className="text-sm text-blue-400 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-blue-400">{inProgressCount}</p>
              </div>
            </div>

            {/* Overall Progress Bar */}
            {modules.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">Overall Progress</span>
                  <span className="text-sm font-bold text-white">{Math.round((completedCount / modules.length) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${(completedCount / modules.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Modules List */}
            {modules.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <p className="text-slate-400">No modules have been assigned to your batch yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((mod, index) => {
                  const config = getStatusConfig(mod);
                  return (
                    <div key={mod.id} className={`border rounded-xl p-5 transition-all ${config.bg} ${config.border}`}>
                      <div className="flex items-center gap-5">
                        {/* Sequence + Status Icon */}
                        <div className="flex-shrink-0 flex flex-col items-center gap-1">
                          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-sm font-bold">
                            {mod.sequenceOrder}
                          </div>
                          {index < modules.length - 1 && (
                            <div className="w-px h-4 bg-slate-700" />
                          )}
                        </div>

                        {/* Module Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            {config.icon}
                            <h3 className="text-base font-semibold text-white">{mod.title}</h3>
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${config.badge}`}>
                              {config.label}
                            </span>
                            {mod.isSequential && (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                                Sequential
                              </span>
                            )}
                          </div>
                          {mod.description && (
                            <p className="text-sm text-slate-400 truncate">{mod.description}</p>
                          )}
                          {mod.progress?.status === "COMPLETED" && mod.progress.obtainedMarks !== null && (
                            <p className="text-xs text-emerald-400 mt-1 font-medium">
                              Score: {mod.progress.obtainedMarks}/{mod.progress.totalMarks} ({mod.progress.percentage?.toFixed(1)}%)
                            </p>
                          )}
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => router.push(`/learner/modules/${mod.id}`)}
                          className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${config.actionStyle}`}
                        >
                          {config.action}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
