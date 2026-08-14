"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user && user.role !== "ADMIN") {
      router.push("/");
    } else if (isAuthenticated && user?.role === "ADMIN") {
      fetchStats();
    }
  }, [isAuthenticated, user, router]);

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

  if (!isAuthenticated || !user || user.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back, {user.fullName}</p>
      </div>

      {/* Stats Summary */}
      {!loading && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-sm text-slate-400 mb-1">Total Learners</p>
            <p className="text-3xl font-bold text-white">{stats.totalLearners}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-sm text-slate-400 mb-1">Active Batches</p>
            <p className="text-3xl font-bold text-white">{stats.activeBatches} <span className="text-sm font-normal text-slate-500">/ {stats.totalBatches}</span></p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-sm text-slate-400 mb-1">Total Modules</p>
            <p className="text-3xl font-bold text-white">{stats.totalModules}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-sm text-slate-400 mb-1">Total Enrollments</p>
            <p className="text-3xl font-bold text-white">{stats.totalEnrollments}</p>
          </div>
        </div>
      )}

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Batch Management Card */}
        <Link href="/admin/batches" className="block">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-600/50 transition-colors group h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">Batches</h3>
            </div>
            <p className="text-sm text-slate-400">Manage training batches, enrollment periods, and batch settings.</p>
          </div>
        </Link>

        {/* Enrollment Card */}
        <Link href="/admin/enrollments/upload" className="block">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-emerald-600/50 transition-colors group h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">Enrollments</h3>
            </div>
            <p className="text-sm text-slate-400">Generate enrollment forms, upload learner data, and track invitations.</p>
          </div>
        </Link>

        {/* Modules Card */}
        <Link href="/admin/modules" className="block">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-purple-600/50 transition-colors group h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">Modules</h3>
            </div>
            <p className="text-sm text-slate-400">Create learning modules, manage content, and configure MCQ assessments.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
