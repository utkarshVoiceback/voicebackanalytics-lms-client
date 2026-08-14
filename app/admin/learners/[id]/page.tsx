"use client";

import { useEffect, useState, use } from "react";
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
  const router = useRouter();
  const { id } = use(params);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  const [learner, setLearner] = useState<Learner | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user && user.role !== "ADMIN") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN" && id) {
      fetchLearnerDetails();
    }
  }, [isAuthenticated, user, id]);

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

  if (!isAuthenticated || !user || user.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

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
        <h2 className="text-2xl font-bold text-white mb-2">Learner Not Found</h2>
        <p className="text-slate-400 mb-6">{error}</p>
        <Link href="/admin/learners" className="text-blue-400 hover:text-blue-300">
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
        <Link href="/admin/learners" className="text-sm text-blue-400 hover:text-blue-300 transition-colors mb-2 inline-block">
          ← Back to Learners
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{learner.user.fullName}</h1>
            <p className="text-slate-400 mt-1">{learner.user.email} {learner.user.mobile ? `• ${learner.user.mobile}` : ''}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
            learner.status === "ACTIVE"
              ? "bg-emerald-500/20 text-emerald-400"
              : learner.status === "COMPLETED"
              ? "bg-blue-500/20 text-blue-400"
              : "bg-slate-600/20 text-slate-400"
          }`}>
            {learner.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Info & Progress Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Enrollment Details</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Batch</p>
                <p className="font-medium text-slate-300">{learner.batch.batchTitle}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Duration</p>
                <p className="font-medium text-slate-300">
                  {new Date(learner.batch.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} – {new Date(learner.batch.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Overall Progress</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Completion</span>
              <span className="text-lg font-bold text-blue-400">{overallProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500" 
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Right Column: Training Progress / Assessments */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Training & Assessments</h3>
            
            {assessments.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No modules found for this batch.
              </div>
            ) : (
              <div className="space-y-4">
                {assessments.map((a) => (
                  <div key={a.moduleId} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-xs font-bold text-slate-300">
                            {a.moduleSequence}
                          </span>
                          <h4 className="font-medium text-white text-lg">{a.moduleTitle}</h4>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400 ml-9">
                          <span>{a.questionCount} Questions</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                          a.assessmentStatus === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400" :
                          a.assessmentStatus === "AVAILABLE" ? "bg-amber-500/10 text-amber-400" :
                          a.assessmentStatus === "CONTENT_PENDING" ? "bg-blue-500/10 text-blue-400" :
                          "bg-slate-700/50 text-slate-500"
                        }`}>
                          {a.assessmentStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Latest Attempt Results */}
                    {a.latestAttempt && (
                      <div className="mt-4 ml-9 p-3 bg-slate-950/50 rounded-lg border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Latest Assessment Score</p>
                          <p className="text-sm font-medium text-slate-300">
                            {a.latestAttempt.obtainedMarks} / {a.latestAttempt.totalMarks} ({a.latestAttempt.percentage}%)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 mb-0.5">Attempted On</p>
                          <p className="text-sm text-slate-400">
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
      </div>
    </div>
  );
}
