"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppSelector } from "@/store";
import { apiFetch } from "@/lib/api";

interface DashboardStats {
  totalBatches: number;
  activeBatches: number;
  totalLearners: number;
  totalModules: number;
  totalEnrollments: number;
}

export default function AdminDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/dashboard/admin/stats");
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back, {user?.fullName}</p>
      </div>

      {/* Stats Summary */}
      {!loading && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Active Learners</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalLearners}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Active Batches</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.activeBatches} <span className="text-sm font-normal text-slate-400 dark:text-slate-500">/ {stats.totalBatches}</span></p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Active Modules</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalModules}</p>
          </div>
          
        </div>
      )}

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Batch Management Card */}
        <Link href="/admin/batches" className="block">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-blue-600/50 transition-colors group h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Batches</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage training batches, enrollment periods, and batch settings.</p>
          </div>
        </Link>

        {/* Enrollment Card */}
        <Link href="/admin/enrollments/upload" className="block">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-emerald-600/50 transition-colors group h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Enrollments</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Generate enrollment forms, upload learner data, and track invitations.</p>
          </div>
        </Link>

        {/* Modules Card */}
        <Link href="/admin/modules" className="block">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-purple-600/50 transition-colors group h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Modules</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Create learning modules, manage content, and configure MCQ assessments.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
