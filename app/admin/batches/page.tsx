"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store";
import { setBatches, setBatchLoading, setBatchError } from "@/store/batchSlice";
import { apiFetch } from "@/lib/api";
import type { Batch } from "@/store/batchSlice";

export default function BatchListPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { batches, loading, error } = useAppSelector((state) => state.batch);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user && user.role !== "ADMIN") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN") {
      fetchBatches();
    }
  }, [isAuthenticated, user]);

  const fetchBatches = async () => {
    dispatch(setBatchLoading(true));
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (statusFilter) params.append("status", statusFilter);
    const query = params.toString() ? `?${params.toString()}` : "";

    const res = await apiFetch(`/batches${query}`);
    if (res.success && res.data) {
      dispatch(setBatches(res.data));
    } else {
      dispatch(setBatchError(res.message || "Failed to fetch batches"));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBatches();
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Batch Management</h1>
          <p className="text-slate-400 mt-1">Create and manage training batches</p>
        </div>
        <Link
          href="/admin/batches/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Batch
        </Link>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by batch title..."
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2.5 text-sm font-medium text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        >
          Search
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty State */}
      {!loading && batches.length === 0 && (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
          <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
          </svg>
          <h3 className="text-lg font-medium text-slate-300 mb-1">No batches found</h3>
          <p className="text-sm text-slate-500">Create your first batch to get started.</p>
        </div>
      )}

      {/* Batch Table */}
      {!loading && batches.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-xs tracking-wider">
                  <th className="px-6 py-4 font-medium">Batch Title</th>
                  <th className="px-6 py-4 font-medium">Period</th>
                  <th className="px-6 py-4 font-medium">Enrollment Period</th>
                  <th className="px-6 py-4 font-medium">Capacity</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {batches.map((batch: Batch) => (
                  <tr key={batch.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{batch.batchTitle}</td>
                    <td className="px-6 py-4 text-slate-300">
                      {new Date(batch.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} – {new Date(batch.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {new Date(batch.enrollmentStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(batch.enrollmentEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {batch.enrolledCount} / {batch.batchSize}
                      <br/>
                      <span className="text-xs text-slate-500">{batch.batchSize - (batch.enrolledCount || 0)} available</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          batch.dynamicStatus === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : batch.dynamicStatus === "ENROLLMENT_OPEN"
                            ? "bg-blue-500/20 text-blue-400"
                            : batch.dynamicStatus === "FULL" || batch.dynamicStatus === "ENROLLMENT_CLOSED"
                            ? "bg-red-500/20 text-red-400"
                            : batch.dynamicStatus === "COMPLETED"
                            ? "bg-purple-500/20 text-purple-400"
                            : batch.dynamicStatus === "UPCOMING"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-slate-600/20 text-slate-400"
                        }`}
                      >
                        {batch.dynamicStatus || batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/batches/${batch.id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                      >
                        View / Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
