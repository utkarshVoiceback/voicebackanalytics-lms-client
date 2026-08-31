"use client";

import { Suspense, useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { addModule } from "@/store/moduleSlice";
import { setCourses } from "@/store/courseSlice";
import { DependencySelector } from "../components/DependencySelector";

function CreateModuleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { courses } = useAppSelector((state) => state.course);

  const [courseId, setcourseId] = useState(searchParams.get("courseId") || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sequenceOrder, setSequenceOrder] = useState<number>(1);
  const [isSequential, setIsSequential] = useState(true);
  const [hasDependency, setHasDependency] = useState(false);
  const [dependencyModuleIds, setDependencyModuleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchcourses();
  }, []);

  const fetchcourses = async () => {
    const res = await apiFetch("/courses");
    if (res.success && res.data && res.data.length > 0) {
      dispatch(setCourses(res.data));
      if (!courseId) {
        setcourseId(res.data[0].id);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!courseId || !title || !sequenceOrder) {
      setError("course, Title, and Sequence Order are required");
      return;
    }

    if (hasDependency && dependencyModuleIds.length === 0) {
      setError("Please select at least one prerequisite module, or disable the dependency toggle.");
      return;
    }

    setLoading(true);
    const res = await apiFetch("/modules", {
      method: "POST",
      body: JSON.stringify({
        courseId,
        title,
        description,
        sequenceOrder,
        isSequential,
        hasDependency,
        dependencyModuleIds: hasDependency ? dependencyModuleIds : [],
      }),
    });

    if (res.success && res.data) {
      dispatch(addModule(res.data));
      router.push("/admin/modules");
    } else {
      setError(res.message || "Failed to create module");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Modules
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Create Module</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Add a new learning module to a course</p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Selection (Hidden) */}
            <div className="hidden">
              <select value={courseId} onChange={(e) => setcourseId(e.target.value)}>
                <option value="">-- Select a course --</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Module Title <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="e.g. Introduction to Passenger Services"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                placeholder="Brief description of this module"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Sequence Order <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={sequenceOrder}
                  onChange={(e) => setSequenceOrder(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Sequential Access</label>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsSequential(!isSequential)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isSequential ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isSequential ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {isSequential ? "Enabled — Requires previous module completion" : "Disabled — Open access"}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Dependency Section ──────────────────────────────────────────── */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Prerequisite Dependencies
                  </label>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Learners must complete all selected modules before starting this one.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHasDependency(!hasDependency);
                    if (hasDependency) setDependencyModuleIds([]);
                  }}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${hasDependency ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${hasDependency ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              {hasDependency && courseId && (
                <DependencySelector
                  courseId={courseId}
                  selectedIds={dependencyModuleIds}
                  onChange={setDependencyModuleIds}
                />
              )}
            </div>
            {/* ─────────────────────────────────────────────────────────────────── */}

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/20"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Creating...
                  </>
                ) : "Create Module"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CreateModulePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    }>
      <CreateModuleForm />
    </Suspense>
  );
}
