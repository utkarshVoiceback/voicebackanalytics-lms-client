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
  assessmentStatus: string; // NOT_STARTED | CONTENT_PENDING | AVAILABLE | COMPLETED | LOCKED
  progress: ProgressData | null;
  latestAttempt: AttemptData | null;
}

interface EnrolledCourse {
  id: string;
  batchTitle: string;
  courseId: string;
  course: {
    id: string;
    title: string;
  };
}

export default function AssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [allAssessments, setAllAssessments] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [courseName, setCourseName] = useState<string>("My Course");
  const [courseModuleMap, setCourseModuleMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all enrolled courses
      const coursesRes = await apiFetch("/learner/batches");
      if (!coursesRes.success || !Array.isArray(coursesRes.data)) {
        setError("Failed to load your courses.");
        setLoading(false);
        return;
      }

      setEnrolledCourses(coursesRes.data);

      // Build course-module mapping by fetching modules for each course
      const moduleMap: Record<string, string> = {};
      for (const course of coursesRes.data) {
        const modulesRes = await apiFetch(`/modules?courseId=${course.course.id}`);
        if (modulesRes.success && Array.isArray(modulesRes.data)) {
          modulesRes.data.forEach((mod: any) => {
            moduleMap[mod.id] = course.course.id;
          });
        }
      }
      setCourseModuleMap(moduleMap);

      // Fetch all assessments
      const assessRes = await apiFetch("/learner/assessments");
      if (!assessRes.success) {
        if (assessRes.errorCode === "BATCH_ARCHIVED" || assessRes.message?.includes("archived")) {
          setError("BATCH_ARCHIVED");
          setLoading(false);
          return;
        }
      }

      if (assessRes.success && Array.isArray(assessRes.data)) {
        setAllAssessments(assessRes.data);
      }

      if (coursesRes.data.length > 0) {
        const defaultCourse = coursesRes.data[0];
        setCourseId(defaultCourse.course.id);
        setCourseName(defaultCourse.course.title);
        filterAssessmentsByCourse(defaultCourse.course.id, assessRes.data || [], moduleMap);
      } else {
        setError("You are not enrolled in any courses.");
        setLoading(false);
      }
    } catch (err: any) {
      if (err.message === "BATCH_ARCHIVED" || err.errorCode === "BATCH_ARCHIVED") {
        setError("BATCH_ARCHIVED");
      } else {
        setError("Failed to load courses. Please try again.");
      }
      setLoading(false);
    }
  };

  const filterAssessmentsByCourse = (course: string, allAssess: AssessmentItem[], map?: Record<string, string>) => {
    setLoading(false);
    setError(null);
    const mapToUse = map || courseModuleMap;
    // Filter assessments based on course-module mapping
    const filtered = allAssess.filter(item => mapToUse[item.moduleId] === course);
    setAssessments(filtered);
  };


  const handleCourseChange = (newCourseId: string) => {
    const selectedCourse = enrolledCourses.find(c => c.course.id === newCourseId);
    if (selectedCourse) {
      setCourseId(newCourseId);
      setCourseName(selectedCourse.course.title);
      filterAssessmentsByCourse(newCourseId, allAssessments);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return {
          label: "Completed",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
          icon: (
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          ),
        };
      case "AVAILABLE":
        return {
          label: "Available",
          badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
          icon: (
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          ),
        };
      case "CONTENT_PENDING":
        return {
          label: "Content Pending",
          badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
          icon: (
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          ),
        };
      case "NOT_STARTED":
        return {
          label: "Not Started",
          badgeClass: "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700/60 dark:text-slate-400 dark:border-slate-600/40",
          icon: (
            <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <circle cx="12" cy="12" r="10" />
            </svg>
          ),
        };
      default:
        return {
          label: "Locked",
          badgeClass: "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700/60 dark:text-slate-400 dark:border-slate-600/40",
          icon: (
            <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          ),
        };
    }
  };

  const getActionButton = (item: AssessmentItem) => {
    switch (item.assessmentStatus) {
      case "AVAILABLE":
        return (
          <button
            onClick={() => router.push(`/learner/modules/${item.moduleId}/mcq`)}
            className="rounded-lg bg-amber-600 hover:bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors whitespace-nowrap"
          >
            Start Assessment
          </button>
        );
      case "COMPLETED":
        return (
          <button
            onClick={() => router.push(`/learner/modules/${item.moduleId}`)}
            className="rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 dark:bg-emerald-700/30 dark:hover:bg-emerald-700/50 dark:border-emerald-700/50 px-4 py-2 text-sm font-semibold dark:text-emerald-300 transition-colors whitespace-nowrap"
          >
            View Result
          </button>
        );
      case "CONTENT_PENDING":
        return (
          <button
            onClick={() => router.push(`/learner/modules/${item.moduleId}`)}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors whitespace-nowrap"
          >
            Continue Module
          </button>
        );
      case "NOT_STARTED":
        return (
          <button
            onClick={() => router.push(`/learner/modules/${item.moduleId}`)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            Start Module
          </button>
        );
      default:
        return (
          <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-400 dark:text-slate-500 cursor-not-allowed whitespace-nowrap">
            Locked
          </span>
        );
    }
  };

  // Stats
  const completedCount = assessments.filter((a) => a.assessmentStatus === "COMPLETED").length;
  const availableCount = assessments.filter((a) => a.assessmentStatus === "AVAILABLE").length;
  const avgScore =
    completedCount > 0
      ? assessments
          .filter((a) => a.latestAttempt)
          .reduce((sum, a) => sum + (a.latestAttempt?.percentage || 0), 0) / completedCount
      : null;

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Assessments</h1>
          {/* Course Selector Dropdown */}
          {enrolledCourses.length > 0 && (
            <div className="mt-3 w-fit">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Select Course
              </label>
              <select
                value={courseId || ""}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
              >
                {enrolledCourses.map((course) => (
                  <option key={course.id} value={course.course.id}>
                    {course.course.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <p className="text-slate-500 dark:text-slate-400 mt-3">Track your assessment progress across all training modules.</p>
        </div>

        {/* Error */}
        {error && error === "BATCH_ARCHIVED" && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">Batch Archived</h2>
            <p className="text-red-700 dark:text-red-300">Your batch has been archived. Modules and assessments are no longer accessible.</p>
          </div>
        )}
        {error && error !== "BATCH_ARCHIVED" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchInitialData}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!error && assessments.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Assessments Available</h2>
            <p className="text-slate-500 dark:text-slate-400">Assessments will appear here as your training modules are set up.</p>
          </div>
        )}

        {!error && assessments.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{assessments.length}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Assessments</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-5">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-500/70 uppercase tracking-wider mb-1">Completed</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500/70 mt-1">Passed</p>
              </div>
              {avgScore !== null ? (
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl p-5 col-span-2 sm:col-span-1">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-500/70 uppercase tracking-wider mb-1">Avg Score</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{avgScore.toFixed(1)}%</p>
                  <p className="text-xs text-blue-600 dark:text-blue-500/70 mt-1">Across completed</p>
                </div>
              ) : availableCount > 0 ? (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-5 col-span-2 sm:col-span-1">
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-500/70 uppercase tracking-wider mb-1">Available</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{availableCount}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500/70 mt-1">Ready to take</p>
                </div>
              ) : null}
            </div>

            {/* Assessment Table (desktop) */}
            <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-6 py-4">#</th>
                    <th className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-6 py-4">Module</th>
                    <th className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-6 py-4">Questions</th>
                    <th className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-6 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-6 py-4">Score</th>
                    <th className="text-right text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {assessments.map((item) => {
                    const statusConfig = getStatusConfig(item.assessmentStatus);
                    return (
                      <tr key={item.moduleId} className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-400 dark:text-slate-500 font-mono">{item.moduleSequence}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{item.moduleTitle}</p>
                          {item.latestAttempt && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                              Last: {new Date(item.latestAttempt.submittedAt).toLocaleDateString()}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {item.questionCount > 0 ? `${item.questionCount} Qs` : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig.badgeClass}`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {item.latestAttempt ? (
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {item.latestAttempt.obtainedMarks}/{item.latestAttempt.totalMarks}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{item.latestAttempt.percentage.toFixed(1)}%</p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {getActionButton(item)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Assessment Cards (mobile) */}
            <div className="md:hidden space-y-4">
              {assessments.map((item) => {
                const statusConfig = getStatusConfig(item.assessmentStatus);
                return (
                  <div key={item.moduleId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">#{item.moduleSequence}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusConfig.badgeClass}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{item.moduleTitle}</h3>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        {item.questionCount > 0 && (
                          <span className="text-slate-500 dark:text-slate-400">{item.questionCount} Questions</span>
                        )}
                        {item.latestAttempt && (
                          <span className="font-bold text-slate-900 dark:text-white">
                            {item.latestAttempt.percentage.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      {getActionButton(item)}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}