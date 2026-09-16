"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAppSelector } from "@/store";

interface EnrolledCourse {
  id: string;
  batchTitle: string;
  courseId: string;
  course: {
    id: string;
    title: string;
  };
}

interface CourseStats {
  courseId: string;
  courseName: string;
  totalModules: number;
  completed: number;
  inProgress: number;
}

export default function LearnerDashboardPage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all enrolled courses
      const coursesRes = await apiFetch("/learner/batches");
      if (!coursesRes.success || !Array.isArray(coursesRes.data)) {
        setError("You are not enrolled in any courses yet.");
        setLoading(false);
        return;
      }

      const enrolledCourses = coursesRes.data as EnrolledCourse[];
      const stats: CourseStats[] = [];

      // For each course, fetch modules and progress
      for (const enrollment of enrolledCourses) {
        const courseId = enrollment.course.id;
        const courseName = enrollment.course.title;

        const [modulesRes, progressRes] = await Promise.all([
          apiFetch(`/modules?courseId=${courseId}`),
          apiFetch(`/modules/progress?courseId=${courseId}`),
        ]);

        let totalModules = 0;
        let completed = 0;
        let inProgress = 0;

        if (modulesRes.success && Array.isArray(modulesRes.data)) {
          totalModules = modulesRes.data.length;

          const progressMap: Record<string, any> = {};
          if (progressRes.success && Array.isArray(progressRes.data)) {
            for (const p of progressRes.data) {
              progressMap[p.moduleId] = p;
            }
          }

          for (const mod of modulesRes.data) {
            const progress = progressMap[mod.id];
            if (progress?.status === "COMPLETED") {
              completed++;
            } else if (progress?.status === "IN_PROGRESS" || progress?.status === "CONTENT_COMPLETED" || progress?.status === "MCQ_AVAILABLE") {
              inProgress++;
            }
          }
        }

        stats.push({
          courseId,
          courseName,
          totalModules,
          completed,
          inProgress,
        });
      }

      setCourseStats(stats);
    } catch (err) {
      setError("Failed to load dashboard data.");
    }
    setLoading(false);
  };


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome back, <span className="text-blue-600 dark:text-blue-400">{user?.fullName?.split(" ")[0]}</span>
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
            <p className="text-slate-500 dark:text-slate-400">{error}</p>
          </div>
        ) : courseStats.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400">No courses assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {courseStats.map((course) => (
              <div key={course.courseId}>
                {/* Course Title */}
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{course.courseName}</h2>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Total Modules</p>
                    <p className="text-4xl font-bold text-slate-900 dark:text-white">{course.totalModules}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-2">Completed</p>
                    <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{course.completed}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">In Progress</p>
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{course.inProgress}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
