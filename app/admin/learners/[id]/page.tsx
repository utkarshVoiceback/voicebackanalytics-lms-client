"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Learner {
  id: string;
  userId: string;
  batchId: string;
  status: string;
  extraData?: string | null;
  user: {
    fullName: string;
    email: string;
    mobile: string | null;
  };
  batch: {
    batchTitle: string;
    startDate: string;
    endDate: string;
  };
}

interface Assessment {
  moduleId: string;
  moduleTitle: string;
  moduleSequence: number;
  questionCount: number;
  assessmentStatus: string;
  progress: {
    status: string;
    obtainedMarks: number | null;
    totalMarks: number | null;
    percentage: string | null;
    completedAt: string | null;
  } | null;
  latestAttempt: {
    id: string;
    obtainedMarks: number;
    totalMarks: number;
    percentage: number;
    submittedAt: string;
  } | null;
}

export default function AdminLearnerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [learner, setLearner] = useState<Learner | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchLearnerDetails();
    }
  }, [id]);

  const fetchLearnerDetails = async () => {
    setLoading(true);
    
    try {
      const [learnerRes, assessmentsRes] = await Promise.all([
        apiFetch(`/learner/admin/${id}`),
        apiFetch(`/learner/admin/${id}/assessments`)
      ]);

      if (learnerRes.success && learnerRes.data) {
        setLearner(learnerRes.data);
      } else {
        setError(learnerRes.message || "Failed to fetch learner details");
      }

      if (assessmentsRes.success && assessmentsRes.data) {
        setAssessments(assessmentsRes.data);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    }
    
    setLoading(false);
  };

  const calculateOverallProgress = () => {
    if (!assessments || assessments.length === 0) return 0;
    const completed = assessments.filter((a) => a.assessmentStatus === "COMPLETED").length;
    return Math.round((completed / assessments.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !learner) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Learner Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
        <Link href="/admin/learners" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
          ← Back to Learners
        </Link>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/learners" className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-2 inline-block">
          ← Back to Learners
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
          <div className="flex items-start gap-4">
            {(() => {
              let profilePic = null;
              if (learner.extraData) {
                try {
                  const extraData = JSON.parse(learner.extraData);
                  profilePic = extraData?.profilePic;
                } catch (e) {
                  // Invalid JSON, skip
                }
              }

              return profilePic ? (
                <img
                  src={profilePic}
                  alt={learner.user.fullName}
                  className="w-16 h-16 rounded-lg object-cover border border-slate-300 dark:border-slate-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg border border-slate-300 dark:border-slate-700">
                  {learner.user.fullName.charAt(0).toUpperCase()}
                </div>
              );
            })()}
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{learner.user.fullName}</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{learner.user.email} {learner.user.mobile ? `• ${learner.user.mobile}` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href={`/admin/feedback?learnerId=${learner.userId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
              Chat
            </Link>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
              learner.status === "ACTIVE"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                : learner.status === "COMPLETED"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                : "bg-slate-100 text-slate-600 dark:bg-slate-600/20 dark:text-slate-400"
            }`}>
              {learner.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Training Progress / Assessments */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Training & Assessments</h3>

            {assessments.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                No modules found for this batch.
              </div>
            ) : (
              <div className="space-y-4">
                {assessments.map((a) => (
                  <div key={a.moduleId} className="bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                            {a.moduleSequence}
                          </span>
                          <h4 className="font-medium text-slate-900 dark:text-white text-lg">{a.moduleTitle}</h4>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 ml-9">
                          <span>{a.questionCount} Questions</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                          a.assessmentStatus === "COMPLETED" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                          a.assessmentStatus === "AVAILABLE" ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                          a.assessmentStatus === "CONTENT_PENDING" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" :
                          "bg-slate-200/70 text-slate-400 dark:bg-slate-700/50 dark:text-slate-500"
                        }`}>
                          {a.assessmentStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Latest Attempt Results */}
                    {a.latestAttempt && (
                      <div className="mt-4 ml-9 p-3 bg-slate-50/70 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Latest Assessment Score</p>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            {a.latestAttempt.obtainedMarks} / {a.latestAttempt.totalMarks} ({a.latestAttempt.percentage}%)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Attempted On</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {new Date(a.latestAttempt.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Profile Info & Progress Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Enrollment Details</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-slate-400 dark:text-slate-500 mb-1">Batch</p>
                <p className="font-medium text-slate-600 dark:text-slate-300">{learner.batch.batchTitle}</p>
              </div>
              <div>
                <p className="text-slate-400 dark:text-slate-500 mb-1">Duration</p>
                <p className="font-medium text-slate-600 dark:text-slate-300">
                  {new Date(learner.batch.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} – {new Date(learner.batch.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Overall Progress</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">Completion</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{overallProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
