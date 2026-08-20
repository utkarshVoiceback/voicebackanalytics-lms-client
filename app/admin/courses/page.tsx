"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { setCourses, setCourseLoading } from "@/store/courseSlice";

export default function AdminCoursesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { courses, loading } = useAppSelector((state) => state.course);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    dispatch(setCourseLoading(true));
    const res = await apiFetch("/courses");
    if (res.success && res.data) {
      dispatch(setCourses(res.data));
    }
    dispatch(setCourseLoading(false));
  };

  const getStatusColor = (status: string) => {
    return status === "ACTIVE"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      : "bg-slate-500/10 text-slate-400 border-slate-500/30";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Courses</h1>
          <p className="text-slate-400">Manage courses and their modules</p>
        </div>
        <Link
          href="/admin/courses/create"
          className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)]"
        >
          Create Course
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-[#1e293b]/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 transition-all hover:bg-[#1e293b]/80 hover:border-slate-600/50"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white line-clamp-1 flex-1 pr-4" title={course.title}>
                  {course.title}
                </h3>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(
                    course.status
                  )}`}
                >
                  {course.status}
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-6 line-clamp-2">
                {course.description || "No description provided."}
              </p>
              
              <div className="flex flex-col gap-2">
                <Link
                  href={`/admin/modules?courseId=${course.id}`}
                  className="w-full text-center bg-slate-700/50 hover:bg-slate-600 text-white py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  Manage Modules
                </Link>
              </div>
            </div>
          ))}

          {courses.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 bg-[#1e293b]/30 border border-slate-700/50 rounded-2xl border-dashed">
              <p className="text-slate-400 mb-4">No courses found</p>
              <Link
                href="/admin/courses/create"
                className="text-primary-400 hover:text-primary-300 font-medium"
              >
                Create your first course
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
