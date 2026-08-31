"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function InstructorBatchDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [batch, setBatch] = useState<any>(null);
  const [learners, setLearners] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatchData = async () => {
      try {
        const [batchRes, learnersRes, modulesRes] = await Promise.all([
          apiFetch(`/instructor-panel/batches/${id}`),
          apiFetch(`/instructor-panel/batches/${id}/learners`),
          apiFetch(`/instructor-panel/batches/${id}/modules`),
        ]);
        if (!batchRes.success) { setError(batchRes.message || "Access denied"); return; }
        setBatch(batchRes.data);
        if (learnersRes.success) setLearners(learnersRes.data);
        if (modulesRes.success) setModules(modulesRes.data);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchBatchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-8 text-center">
          <p className="text-red-600 dark:text-red-400 font-medium mb-4">{error}</p>
          <button onClick={() => router.push("/instructor/batches")} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
            &larr; Back to My Batches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.push("/instructor/batches")} className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{batch.batchTitle}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Course: {batch.course?.title || "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Learners Table */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Enrolled Learners <span className="text-slate-400 dark:text-slate-500 font-normal text-sm">({learners.length})</span>
              </h2>
            </div>
            {learners.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                No learners enrolled in this batch yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {learners.map((learner) => (
                      <tr key={learner.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{learner.fullName}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{learner.email}</td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/instructor/learners/${learner.id}`} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                            View Profile
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modules Panel */}
        <div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Assigned Modules</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Modules you are authorized to teach</p>
            </div>
            {modules.length === 0 ? (
              <div className="px-6 py-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                No modules assigned for this batch.
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {modules.map((module) => (
                  <li key={module.id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{module.title}</p>
                    <Link href={`/instructor/modules/${module.id}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-0.5 inline-block">
                      View Module &rarr;
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
