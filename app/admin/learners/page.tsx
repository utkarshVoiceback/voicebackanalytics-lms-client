"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/store";
import { apiFetch } from "@/lib/api";

interface Learner {
  id: string;
  userId: string;
  batchId: string;
  status: string;
  user: {
    fullName: string;
    email: string;
    mobile: string | null;
  };
  batch: {
    batchTitle: string;
  };
}

export default function AdminLearnersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("ALL");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user && user.role !== "ADMIN" && user.role !== "INSTRUCTOR") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (
      isAuthenticated &&
      (user?.role === "ADMIN" || user?.role === "INSTRUCTOR")
    ) {
      fetchLearners();
    }
  }, [isAuthenticated, user]);

  const fetchLearners = async () => {
    setLoading(true);
    const res = await apiFetch("/learner/admin/all");
    if (res.success && res.data) {
      setLearners(res.data);
    } else {
      setError(res.message || "Failed to fetch learners");
    }
    setLoading(false);
  };

  const batches = Array.from(
    new Set(learners.map((l) => l.batch.batchTitle)),
  ).sort();

  // const filteredLearners = learners.filter((l) =>
  //   l.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
  //   l.user.email.toLowerCase().includes(search.toLowerCase()) ||
  //   l.batch.batchTitle.toLowerCase().includes(search.toLowerCase())
  // );
  const filteredLearners = learners.filter((l) => {
    const matchesSearch =
      l.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      l.user.email.toLowerCase().includes(search.toLowerCase()) ||
      l.batch.batchTitle.toLowerCase().includes(search.toLowerCase());

    const matchesBatch =
      selectedBatch === "ALL" || l.batch.batchTitle === selectedBatch;

    return matchesSearch && matchesBatch;
  });

  if (
    !isAuthenticated ||
    !user ||
    (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")
  ) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Learners
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage and view all enrolled learners
          </p>
        </div>
        <Link
          href="/admin/learners/upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33A3 3 0 0116.5 19.5H6.75Z" />
          </svg>
          Upload Learners
        </Link>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or batch..."
          className="w-full sm:max-w-md rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        {/* Batch Filter */}
        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="w-full sm:w-64 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="ALL">All Batches</option>

          {batches.map((batch) => (
            <option key={batch} value={batch}>
              {batch}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : filteredLearners.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <svg
            className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
            />
          </svg>
          <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-1">
            No learners found
          </h3>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            There are no learners matching your search.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
                  <th className="px-6 py-4 font-medium">Learner Info</th>
                  <th className="px-6 py-4 font-medium">Batch</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredLearners.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {l.user.fullName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {l.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {l.batch.batchTitle}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          l.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-600/20 dark:text-slate-400"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/learners/${l.userId}`}
                        className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                      >
                        View Profile
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