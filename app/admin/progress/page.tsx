"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface LearnerProgress {
  id: string;
  userId: string;
  batchId: string;
  status: string;
  progressPercentage: number;
  totalModules: number;
  completedModules: number;
  user: {
    fullName: string;
    email: string;
  };
  batch: {
    batchTitle: string;
  };
}

interface Batch {
  id: string;
  batchTitle: string;
}

export default function AdminProgressPage() {
  const [learners, setLearners] = useState<LearnerProgress[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [learnersRes, batchesRes] = await Promise.all([
      apiFetch("/learner/admin/all"),
      apiFetch("/batches")
    ]);
    
    if (learnersRes.success && learnersRes.data) {
      setLearners(learnersRes.data);
    }
    
    if (batchesRes.success && batchesRes.data) {
      setBatches(batchesRes.data);
    }
    setLoading(false);
  };

  const filteredLearners = learners.filter((l) => {
    const matchesSearch = l.user.fullName.toLowerCase().includes(search.toLowerCase()) || 
                          l.user.email.toLowerCase().includes(search.toLowerCase());
    const matchesBatch = selectedBatchId ? l.batchId === selectedBatchId : true;
    return matchesSearch && matchesBatch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Learner Progress</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor training completion and performance</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search learners..."
          className="w-full sm:max-w-md rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={selectedBatchId}
          onChange={(e) => setSelectedBatchId(e.target.value)}
          className="w-full sm:max-w-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Batches</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.batchTitle}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : filteredLearners.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-sm text-slate-400 dark:text-slate-500">No learners match your criteria.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider bg-slate-100/60 dark:bg-slate-950/50">
                  <th className="px-6 py-4 font-medium">Learner</th>
                  <th className="px-6 py-4 font-medium">Batch</th>
                  <th className="px-6 py-4 font-medium">Completion Progress</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredLearners.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{l.user.fullName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{l.user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {l.batch.batchTitle}
                    </td>
                    <td className="px-6 py-4 min-w-[250px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400">{l.completedModules} of {l.totalModules} Modules</span>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{l.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${l.progressPercentage}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/learners/${l.userId}`}
                        className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg"
                      >
                        View Details
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