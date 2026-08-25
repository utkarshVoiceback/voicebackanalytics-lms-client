"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { setModules, setModuleLoading } from "@/store/moduleSlice";
import { setCourses } from "@/store/courseSlice";

export default function AdminModulesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { modules, loading } = useAppSelector((state) => state.module);
  const { courses } = useAppSelector((state) => state.course);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  useEffect(() => {
    fetchcourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchModules(selectedCourseId);
    }
  }, [selectedCourseId]);

  const fetchcourses = async () => {
    const res = await apiFetch("/courses");
    if (res.success && res.data) {
      dispatch(setCourses(res.data));
      if (res.data.length > 0 && !selectedCourseId) {
        setSelectedCourseId(res.data[0].id);
      }
    }
  };

  const fetchModules = async (courseId: string) => {
    dispatch(setModuleLoading(true));
    const res = await apiFetch(`/modules?courseId=${courseId}`);
    if (res.success && res.data) {
      dispatch(setModules(res.data));
    }
    dispatch(setModuleLoading(false));
  };

  const getStatusColor = (status: string) => {
    return status === "ACTIVE"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      : "bg-slate-500/10 text-slate-400 border-slate-500/30";
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Learning Modules</h1>
            <p className="text-slate-400 mt-1">Manage course-specific learning modules and sequence order</p>
          </div>
          <button
            onClick={() => router.push("/admin/modules/create")}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Module
          </button>
        </div>

        {/* course Selector */}
        <div className="mb-6">
          {/* <label className="block text-sm font-medium text-slate-300 mb-2">Select course</label> */}
          <select
          disabled={true}
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          >
            <option value="">-- Select a course --</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Empty State */}
        {!loading && selectedCourseId && modules.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-full mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No modules yet</h3>
            <p className="text-slate-400 mb-6">Create your first learning module for this course</p>
            <button
              onClick={() => router.push(`/admin/modules/create?courseId=${selectedCourseId}`)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add First Module
            </button>
          </div>
        )}

        {/* Modules List */}
        {!loading && modules.length > 0 && (
          <div className="space-y-4">
            {modules.map((module, index) => (
              <div
                key={module.id}
                onClick={() => router.push(`/admin/modules/${module.id}`)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:bg-slate-900/80 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-5">
                  {/* Sequence Number */}
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 text-blue-400 font-bold text-lg">
                    {module.sequenceOrder}
                  </div>

                  {/* Module Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                        {module.title}
                      </h3>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(module.status)}`}>
                        {module.status}
                      </span>
                    </div>
                    {module.description && (
                      <p className="text-sm text-slate-400 truncate">{module.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                        {module.contents?.length || 0} content item(s)
                      </span>
                      {module.isSequential && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-amber-400">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                          </svg>
                          Sequential
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>

                {/* Connector line between modules */}
                {index < modules.length - 1 && (
                  <div className="flex justify-start ml-6 -mb-4">
                    <div className="w-px h-4 bg-slate-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
