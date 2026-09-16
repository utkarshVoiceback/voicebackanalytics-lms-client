"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { setCourses, setCourseLoading } from "@/store/courseSlice";

export default function AdminCoursesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { courses, loading } = useAppSelector((state) => state.course);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; courseId: string | null; courseName: string | null }>({
    show: false,
    courseId: null,
    courseName: null,
  });
  const [deleting, setDeleting] = useState(false);

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
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
      : "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/30";
  };

  const handleDeleteClick = (courseId: string, courseName: string) => {
    setDeleteConfirm({ show: true, courseId, courseName });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.courseId) return;

    setDeleting(true);
    const res = await apiFetch(`/courses/${deleteConfirm.courseId}`, { method: "DELETE" });

    if (res.success) {
      setDeleteConfirm({ show: false, courseId: null, courseName: null });
      fetchCourses();
    } else {
      alert("Failed to delete course: " + (res.message || "Unknown error"));
    }
    setDeleting(false);
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ show: false, courseId: null, courseName: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Courses</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage courses and their modules</p>
        </div>
        <Link
          href="/admin/courses/create"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
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
              className="bg-slate-100/70 dark:bg-[#1e293b]/50 backdrop-blur-xl border border-slate-300 dark:border-slate-700/50 rounded-2xl p-6 transition-all hover:bg-slate-200/70 dark:hover:bg-[#1e293b]/80 hover:border-slate-400 dark:hover:border-slate-600/50 flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-1 flex-1 pr-4" title={course.title}>
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
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2 flex-1">
                {course.description || "No description provided."}
              </p>

              <div className="flex flex-col gap-2 mt-auto">
                <Link
                  href={`/admin/courses/manage-modules?courseId=${course.id}&courseName=${encodeURIComponent(course.title)}`}
                  className="px-6 py-2 bg-slate-300/70 hover:bg-slate-400 dark:bg-slate-700/50 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors text-sm text-center"
                >
                  Manage Modules
                </Link>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/admin/courses/edit?courseId=${course.id}`)}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(course.id, course.title)}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {courses.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 bg-slate-100/60 dark:bg-[#1e293b]/30 border border-slate-300 dark:border-slate-700/50 rounded-2xl border-dashed">
              <p className="text-slate-500 dark:text-slate-400 mb-4">No courses found</p>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-500/10">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">Delete Course?</h3>
            <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.courseName}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
