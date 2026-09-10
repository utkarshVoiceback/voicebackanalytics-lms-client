"use client";

import { Suspense, useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { addModule } from "@/store/moduleSlice";
import { setCourses } from "@/store/courseSlice";

function CreateModuleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { courses } = useAppSelector((state) => state.course);

  const initialCourseId = searchParams.get("courseId") || "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(initialCourseId ? [initialCourseId] : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCoursesDropdownOpen, setIsCoursesDropdownOpen] = useState(false);

  useEffect(() => {
    fetchcourses();
  }, []);

  const fetchcourses = async () => {
    const res = await apiFetch("/courses");
    if (res.success && res.data && res.data.length > 0) {
      dispatch(setCourses(res.data));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (selectedCourseIds.length === 0) {
      setError("Please select at least one course.");
      return;
    }

    setLoading(true);

    // Step 1: Create global Module master
    const moduleRes = await apiFetch("/modules", {
      method: "POST",
      body: JSON.stringify({ title: title.trim(), description: description.trim() }),
    });

    if (!moduleRes.success || !moduleRes.data) {
      setError(moduleRes.message || "Failed to create module");
      setLoading(false);
      return;
    }

    const newModuleId = moduleRes.data.id;

    // Step 2: Add the new module to each selected course
    let hasError = false;
    for (const courseId of selectedCourseIds) {
      const addRes = await apiFetch(`/courses/${courseId}/modules`, {
        method: "POST",
        body: JSON.stringify({ moduleId: newModuleId }),
      });
      if (!addRes.success) {
        hasError = true;
        console.error(`Failed to add module to course ${courseId}:`, addRes.message);
      }
    }

    setLoading(false);
    
    if (hasError) {
      setError("Module created, but failed to add to one or more selected courses.");
    } else {
      dispatch(addModule(moduleRes.data));
      router.push("/admin/modules");
    }
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

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                Select Courses <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <div className="relative z-20">
                <button
                  type="button"
                  onClick={() => setIsCoursesDropdownOpen(!isCoursesDropdownOpen)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors flex items-center justify-between"
                >
                  <span className="text-sm">
                    {selectedCourseIds.length === 0
                      ? "Select courses..."
                      : `${selectedCourseIds.length} course${selectedCourseIds.length > 1 ? "s" : ""} selected`}
                  </span>
                  <svg
                    className={`w-5 h-5 transition-transform ${isCoursesDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {isCoursesDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg z-20">
                    <div className="max-h-48 overflow-y-auto">
                      {courses.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-slate-500">No courses available</p>
                      ) : (
                        courses.map((course) => (
                          <label
                            key={course.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCourseIds.includes(course.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCourseIds([...selectedCourseIds, course.id]);
                                } else {
                                  setSelectedCourseIds(selectedCourseIds.filter(id => id !== course.id));
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-sm text-slate-900 dark:text-slate-100">{course.title}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

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
