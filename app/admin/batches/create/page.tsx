"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/store";
import { apiFetch } from "@/lib/api";

export default function CreateBatchPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [courseId, setCourseId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [enrollmentStartDate, setEnrollmentStartDate] = useState("");
  const [enrollmentEndDate, setEnrollmentEndDate] = useState("");
  const [batchSize, setBatchSize] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/courses").then((res) => {
      if (res.success && res.data) {
        dispatch(require("@/store/courseSlice").setCourses(res.data));
      }
    });
  }, []);

    if (!isAuthenticated) {
      router.push("/login");
    } else if (user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    apiFetch("/courses").then((res) => {
      if (res.success && res.data) setCourses(res.data);
    });
  }, []);

  // Live preview of auto-generated Batch ID
  const selectedCourse = courses.find((c) => c.id === courseId);
  const batchIdPreview =
    selectedCourse && startDate
      ? `${selectedCourse.title}-B???-${startDate.replace(/-/g, "")}`
      : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/batches", {
        method: "POST",
        body: JSON.stringify({
          courseId,
          startDate,
          endDate,
          enrollmentStartDate,
          enrollmentEndDate,
          batchSize: parseInt(batchSize),
        }),
      });

      if (res.success) {
        router.push("/admin/batches");
      } else {
        setError(res.message || "Failed to create batch");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href="/admin/batches"
          className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-2 inline-block"
        >
          &larr; Back to Batches
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Create New Batch
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          The Batch ID is auto-generated from the Course Name, Batch Number, and Start Date.
        </p>
      </div>

      {/* Auto-ID info banner */}
      <div className="mb-6 flex items-start gap-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 px-5 py-4">
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-semibold mb-0.5">Auto-generated Batch ID</p>
          <p className="text-blue-700 dark:text-blue-400">
            Format: <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded text-xs">CourseName-B001-YYYYMMDD</code>
            {batchIdPreview && (
              <span> &nbsp;→ Preview: <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded text-xs">{batchIdPreview}</code></span>
            )}
          </p>
          <p className="mt-1 text-blue-600 dark:text-blue-500 text-xs">The batch number increments automatically for each new batch in the same course.</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        {/* Course */}
        <div>
          <label htmlFor="courseId" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
            Select Course <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <select
            id="courseId"
            required
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          >
            <option value="">-- Select a course --</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        {/* Batch Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Batch Start Date <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <input
              id="startDate"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Batch End Date <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <input
              id="endDate"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Enrollment Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="enrollmentStartDate" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Enrollment Start Date <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <input
              id="enrollmentStartDate"
              type="date"
              required
              value={enrollmentStartDate}
              onChange={(e) => setEnrollmentStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="enrollmentEndDate" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Enrollment End Date <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <input
              id="enrollmentEndDate"
              type="date"
              required
              value={enrollmentEndDate}
              onChange={(e) => setEnrollmentEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Batch Size */}
        <div>
          <label htmlFor="batchSize" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
            Batch Capacity <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <input
            id="batchSize"
            type="number"
            min="1"
            required
            value={batchSize}
            onChange={(e) => setBatchSize(e.target.value)}
            placeholder="e.g. 50"
            className="w-full sm:max-w-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Creating...
              </span>
            ) : (
              "Create Batch"
            )}
          </button>
          <Link
            href="/admin/batches"
            className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
