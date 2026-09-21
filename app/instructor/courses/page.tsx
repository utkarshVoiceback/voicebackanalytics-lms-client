"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface Batch {
  id: string;
  batchTitle: string;
  courseId: string;
  course?: {
    id: string;
    title: string;
  };
  startDate?: string;
  endDate?: string;
  status?: string;
}

interface CourseData {
  id: string;
  title: string;
  batchCount: number;
  batches: Batch[];
}

export default function InstructorCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/instructor-panel/batches");
      if (!res.success || !Array.isArray(res.data) || res.data.length === 0) {
        setError("You are not assigned to any courses yet.");
        setLoading(false);
        return;
      }

      // Group batches by course
      const courseMap = new Map<string, CourseData>();
      res.data.forEach((batch: Batch) => {
        const courseId = batch.course?.id || batch.courseId;
        const courseTitle = batch.course?.title || "Unknown Course";

        if (!courseMap.has(courseId)) {
          courseMap.set(courseId, {
            id: courseId,
            title: courseTitle,
            batchCount: 0,
            batches: [],
          });
        }

        const course = courseMap.get(courseId)!;
        course.batchCount++;
        course.batches.push(batch);
      });

      setCourses(Array.from(courseMap.values()));
    } catch (err) {
      setError("Failed to load your courses. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (courseId: string, courseName: string) => {
    router.push(`/instructor/modules?courseId=${courseId}&courseName=${encodeURIComponent(courseName)}`);
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
          <p className="text-slate-500 dark:text-slate-400 mt-2">View all courses you are assigned to teach</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchCourses}
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
                onClick={() => handleCourseClick(course.id, course.title)}
                className="text-left group"
              >
                {/* Course Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {course.title}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {course.batchCount} {course.batchCount === 1 ? "batch" : "batches"}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      👨‍🏫 Teaching
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-200 dark:border-slate-800 my-4" />

                  {/* Batches List */}
                  <div className="space-y-2 mb-6">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Assigned Batches
                    </p>
                    <ul className="space-y-1">
                      {course.batches.slice(0, 3).map((batch) => (
                        <li key={batch.id} className="text-sm text-slate-600 dark:text-slate-300">
                          • {batch.batchTitle}
                        </li>
                      ))}
                      {course.batchCount > 3 && (
                        <li className="text-sm text-slate-500 dark:text-slate-400 italic">
                          + {course.batchCount - 3} more
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
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
