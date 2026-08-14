"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface AttemptData {
  id: string;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  submittedAt: string;
}

interface ProgressData {
  status: string;
  obtainedMarks: number | null;
  totalMarks: number | null;
  percentage: number | null;
  completedAt: string | null;
}

interface AssessmentItem {
  moduleId: string;
  moduleTitle: string;
  moduleSequence: number;
  questionCount: number;
  assessmentStatus: string;
  progress: ProgressData | null;
  latestAttempt: AttemptData | null;
}

export default function ResultsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<AssessmentItem | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch("/learner/assessments");
    if (res.success && res.data) {
      setAssessments(res.data);
    } else {
      setError(res.message || "Failed to load results.");
    }
    setLoading(false);
  };

  const completedItems = assessments.filter((a) => a.assessmentStatus === "COMPLETED" && a.latestAttempt);

  const overallAverage =
    completedItems.length > 0
      ? completedItems.reduce((sum, a) => sum + (a.latestAttempt?.percentage || 0), 0) / completedItems.length
      : null;

  const totalObtained = completedItems.reduce((sum, a) => sum + (a.latestAttempt?.obtainedMarks || 0), 0);
  const totalPossible = completedItems.reduce((sum, a) => sum + (a.latestAttempt?.totalMarks || 0), 0);

  const bestScore =
    completedItems.length > 0
      ? Math.max(...completedItems.map((a) => a.latestAttempt?.percentage || 0))
      : null;

  const sortedResults = [...completedItems].sort((a, b) => {
    const dateA = new Date(a.latestAttempt?.submittedAt || 0).getTime();
    const dateB = new Date(b.latestAttempt?.submittedAt || 0).getTime();
    return dateB - dateA;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Results</h1>
          <p className="text-slate-400 mt-1">View your assessment scores and performance across all training modules.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchResults}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!error && completedItems.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">No Results Yet</h2>
            <p className="text-slate-400">Complete assessments to see your results here.</p>
          </div>
        )}

        {/* Results Content */}
        {!error && completedItems.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Overall Average</p>
                <p className="text-2xl font-bold text-white">{overallAverage !== null ? overallAverage.toFixed(1) : "—"}%</p>
                <p className="text-xs text-slate-500 mt-1">Performance</p>
              </div>
              <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-5">
                <p className="text-xs font-medium text-emerald-500/70 uppercase tracking-wider mb-1">Assessments</p>
                <p className="text-2xl font-bold text-emerald-400">{completedItems.length}</p>
                <p className="text-xs text-emerald-500/70 mt-1">Completed</p>
              </div>
              <div className="bg-blue-950/30 border border-blue-900/50 rounded-xl p-5">
                <p className="text-xs font-medium text-blue-500/70 uppercase tracking-wider mb-1">Total Marks</p>
                <p className="text-2xl font-bold text-blue-400">
                  {totalObtained}/{totalPossible}
                </p>
                <p className="text-xs text-blue-500/70 mt-1">Obtained</p>
              </div>
              <div className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-5">
                <p className="text-xs font-medium text-amber-500/70 uppercase tracking-wider mb-1">Best Score</p>
                <p className="text-2xl font-bold text-amber-400">{bestScore !== null ? bestScore.toFixed(1) : "—"}%</p>
                <p className="text-xs text-amber-500/70 mt-1">Highest</p>
              </div>
            </div>

            {/* Results Table (Desktop) */}
            <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">#</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Module</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Marks</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Percentage</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Date</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sortedResults.map((item) => (
                    <tr key={item.moduleId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500 font-mono">{item.moduleSequence}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-white">{item.moduleTitle}</p>
                      </td>
                      <td className="px-6 py-4">
                        {item.latestAttempt ? (
                          <p className="text-sm font-bold text-emerald-400">
                            {item.latestAttempt.obtainedMarks}/{item.latestAttempt.totalMarks}
                          </p>
                        ) : (
                          <span className="text-sm text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.latestAttempt ? (
                          <p className="text-sm font-semibold text-white">
                            {item.latestAttempt.percentage.toFixed(1)}%
                          </p>
                        ) : (
                          <span className="text-sm text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-400">
                          {item.latestAttempt
                            ? new Date(item.latestAttempt.submittedAt).toLocaleDateString()
                            : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedResult(item)}
                          className="rounded-lg bg-emerald-700/30 hover:bg-emerald-700/50 border border-emerald-700/50 px-4 py-2 text-sm font-semibold text-emerald-300 transition-colors whitespace-nowrap"
                        >
                          View Result
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Results Cards (Mobile) */}
            <div className="md:hidden space-y-4">
              {sortedResults.map((item) => (
                <div key={item.moduleId} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-500 font-mono">#{item.moduleSequence}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-white">{item.moduleTitle}</h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 text-sm">
                      {item.latestAttempt && (
                        <>
                          <span className="text-slate-400">
                            {item.latestAttempt.obtainedMarks}/{item.latestAttempt.totalMarks} marks
                          </span>
                          <span className="font-bold text-emerald-400">
                            {item.latestAttempt.percentage.toFixed(1)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {item.latestAttempt
                        ? new Date(item.latestAttempt.submittedAt).toLocaleDateString()
                        : "—"}
                    </span>
                    <button
                      onClick={() => setSelectedResult(item)}
                      className="rounded-lg bg-emerald-700/30 hover:bg-emerald-700/50 border border-emerald-700/50 px-4 py-2 text-sm font-semibold text-emerald-300 transition-colors whitespace-nowrap"
                    >
                      View Result
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Result Detail Modal */}
      {selectedResult && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedResult(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white mb-2">{selectedResult.moduleTitle}</h2>
              <p className="text-xs text-slate-500">
                Module {selectedResult.moduleSequence}
              </p>
            </div>

            {selectedResult.latestAttempt && (
              <>
                <div className="space-y-4 mb-6">
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Marks Obtained</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {selectedResult.latestAttempt.obtainedMarks}/{selectedResult.latestAttempt.totalMarks}
                    </p>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Percentage</p>
                    <p className="text-2xl font-bold text-white">
                      {selectedResult.latestAttempt.percentage.toFixed(1)}%
                    </p>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Date Submitted</p>
                    <p className="text-sm text-slate-300">
                      {new Date(selectedResult.latestAttempt.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Progress Ring Visualization */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="8"
                        strokeDasharray={`${selectedResult.latestAttempt.percentage * 2.827} 282.7`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">
                          {selectedResult.latestAttempt.percentage.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedResult(null)}
                className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  router.push(`/learner/modules/${selectedResult.moduleId}`);
                  setSelectedResult(null);
                }}
                className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors"
              >
                Review Module
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
