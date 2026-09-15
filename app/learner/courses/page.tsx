"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface EnrolledCourse {
  id: string;
  batchTitle: string;
  courseId: string;
  course: {
    id: string;
    title: string;
  };
  startDate?: string;
  endDate?: string;
  status?: string;
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/learner/batches");
      if (!res.success || !Array.isArray(res.data) || res.data.length === 0) {
        setError("You are not enrolled in any courses yet.");
        setLoading(false);
        return;
      }
      setCourses(res.data);
    } catch (err) {
      setError("Failed to load your courses. Please try again.");
      setLoading(false);
    }
    setLoading(false);
  };

  const handleCourseClick = (courseId: string, courseName: string) => {
    router.push(`/learner/modules?courseId=${courseId}&courseName=${encodeURIComponent(courseName)}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">My Courses</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">View all your enrolled courses and access modules</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchEnrolledCourses}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Courses Grid */}
        {!error && courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => handleCourseClick(course.course.id, course.course.title)}
                className="text-left group"
              >
                {/* Course Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {course.course.title}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {course.batchTitle}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      ✓ Enrolled
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-200 dark:border-slate-800 my-4" />

                  {/* Details */}
                  <div className="space-y-3">
                    {/* Enrollment Status */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </p>
                      <p className="text-sm text-slate-900 dark:text-white font-medium mt-1">
                        {course.status || "Active"}
                      </p>
                    </div>

                    {/* Start Date */}
                    {course.startDate && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Started
                        </p>
                        <p className="text-sm text-slate-900 dark:text-white font-medium mt-1">
                          {new Date(course.startDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    )}

                    {/* End Date */}
                    {course.endDate && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Ends
                        </p>
                        <p className="text-sm text-slate-900 dark:text-white font-medium mt-1">
                          {new Date(course.endDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-3 transition-all">
                      View Modules
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-21 0h21m-21 0v6m21-6v6" />
                      </svg>
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
