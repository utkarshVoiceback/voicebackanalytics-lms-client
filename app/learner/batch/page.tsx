"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAppSelector } from "@/store";

interface BatchInfo {
  id: string;
  batchTitle: string;
  startDate: string;
  endDate: string;
  enrollmentDate: string;
  status: string;
}

interface ProfileData {
  id: string;
  userId: string;
  batchId: string;
  status: string;
  batch: BatchInfo | null;
}

interface ModuleProgress {
  status: string;
}

export default function MyBatchPage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Module stats
  const [moduleStats, setModuleStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await apiFetch("/learner/profile");
      if (!profileRes.success || !profileRes.data) {
        setError("You are not enrolled in any batch yet.");
        setLoading(false);
        return;
      }
      const profileData: ProfileData = profileRes.data;
      setProfile(profileData);

      if (profileData.batchId) {
        const [modulesRes, progressRes] = await Promise.all([
          apiFetch(`/modules?batchId=${profileData.batchId}`),
          apiFetch(`/modules/progress?batchId=${profileData.batchId}`),
        ]);

        if (modulesRes.success && modulesRes.data) {
          const total = modulesRes.data.length;
          const progressMap: Record<string, ModuleProgress> = {};
          if (progressRes.success && progressRes.data) {
            for (const p of progressRes.data) {
              progressMap[p.moduleId] = p;
            }
          }

          let completed = 0;
          let inProgress = 0;
          for (const mod of modulesRes.data) {
            const prog = progressMap[mod.id];
            if (prog?.status === "COMPLETED") completed++;
            else if (
              prog?.status === "IN_PROGRESS" ||
              prog?.status === "CONTENT_COMPLETED" ||
              prog?.status === "MCQ_AVAILABLE"
            )
              inProgress++;
          }
          setModuleStats({
            total,
            completed,
            inProgress,
            notStarted: total - completed - inProgress,
          });
        }
      }
    } catch {
      setError("Failed to load batch information. Please try again.");
    }
    setLoading(false);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getBatchStatusConfig = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return { label: "Active", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" };
      case "INACTIVE":
        return { label: "Inactive", bg: "bg-slate-500/10 text-slate-400 border-slate-500/30" };
      default:
        return { label: status, bg: "bg-slate-500/10 text-slate-400 border-slate-500/30" };
    }
  };

  const overallProgress =
    moduleStats.total > 0
      ? Math.round((moduleStats.completed / moduleStats.total) * 100)
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !profile || !profile.batch) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">My Batch</h1>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No Batch Assigned</h2>
            <p className="text-slate-400">
              {error || "You are currently not assigned to any training batch. Please contact your administrator."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const batch = profile.batch;
  const statusConfig = getBatchStatusConfig(batch.status);

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">My Batch</h1>
          <p className="text-slate-400 mt-1">Your enrolled training batch and progress overview.</p>
        </div>

        {/* Batch Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-6">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-900/30 to-slate-900 border-b border-slate-800 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig.bg}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{batch.batchTitle}</h2>
                <p className="text-sm text-slate-400 mt-1">Skilvo Training Program</p>
              </div>
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                </svg>
              </div>
            </div>
          </div>

          {/* Batch Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
            <div className="px-6 py-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Start Date</p>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                <p className="text-sm font-semibold text-white">{formatDate(batch.startDate)}</p>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">End Date</p>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                <p className="text-sm font-semibold text-white">{formatDate(batch.endDate)}</p>
              </div>
            </div>
            <div className="px-6 py-4 sm:col-span-2 border-t border-slate-800">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Enrollment Date</p>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" />
                </svg>
                <p className="text-sm font-semibold text-white">{formatDate(batch.enrollmentDate)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Learner Enrollment Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Your Enrollment</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
              {user?.fullName
                ?.split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() || "?"}
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-white">{user?.fullName}</p>
              <p className="text-sm text-slate-400">{user?.email}</p>
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                profile.status === "ACTIVE"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-slate-500/10 text-slate-400 border-slate-500/30"
              }`}
            >
              {profile.status}
            </span>
          </div>
        </div>

        {/* Overall Training Progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Training Progress</h3>
            <span className="text-2xl font-bold text-white">{overallProgress}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-3 mb-6">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-3 rounded-full transition-all duration-700"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 rounded-xl p-4 text-center border border-slate-700/50">
              <p className="text-2xl font-bold text-white">{moduleStats.total}</p>
              <p className="text-xs text-slate-400 mt-1">Total Modules</p>
            </div>
            <div className="bg-emerald-950/40 rounded-xl p-4 text-center border border-emerald-900/50">
              <p className="text-2xl font-bold text-emerald-400">{moduleStats.completed}</p>
              <p className="text-xs text-emerald-500/70 mt-1">Completed</p>
            </div>
            <div className="bg-blue-950/40 rounded-xl p-4 text-center border border-blue-900/50">
              <p className="text-2xl font-bold text-blue-400">{moduleStats.inProgress}</p>
              <p className="text-xs text-blue-500/70 mt-1">In Progress</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-4 text-center border border-slate-700/50">
              <p className="text-2xl font-bold text-slate-400">{moduleStats.notStarted}</p>
              <p className="text-xs text-slate-500 mt-1">Not Started</p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 pt-5 border-t border-slate-800 flex gap-3">
            <button
              onClick={() => router.push("/learner/modules")}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              Go to My Modules
            </button>
            <button
              onClick={() => router.push("/learner/assessments")}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
              View Assessments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}