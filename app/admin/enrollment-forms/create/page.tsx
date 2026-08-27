"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/store";
import { apiFetch } from "@/lib/api";

interface Batch {
  id: string;
  batchTitle: string;
  status: string;
}

interface EnrollmentFormResponse {
  id: string;
  batchId: string;
  token: string;
  status: string;
  createdAt: string;
}

export default function CreateEnrollmentFormPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("30");
  const [loading, setLoading] = useState(false);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createdForm, setCreatedForm] = useState<EnrollmentFormResponse | null>(null);
  const [enrollmentLink, setEnrollmentLink] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user && user.role !== "ADMIN") {
      router.push("/");
    } else {
      fetchBatches();
    }
  }, [isAuthenticated, user, router]);

  const fetchBatches = async () => {
    setBatchesLoading(true);
    const res = await apiFetch("/batches");
    if (res.success && res.data) {
      setBatches(res.data.filter((b: Batch) => b.status === "ACTIVE"));
    } else {
      setError("Failed to load batches");
    }
    setBatchesLoading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!selectedBatchId) {
      setError("Please select a batch");
      setLoading(false);
      return;
    }

    const res = await apiFetch("/enrollment-forms", {
      method: "POST",
      body: JSON.stringify({
        batchId: selectedBatchId,
        expiresInDays: parseInt(expiresInDays) || 30,
      }),
    });

    if (res.success && res.data) {
      const form = res.data;
      setCreatedForm(form);
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/enroll/${form.token}`;
      setEnrollmentLink(link);
    } else {
      setError(res.message || "Failed to create enrollment form");
    }
    setLoading(false);
  };

  if (!isAuthenticated || !user || user.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <Link
        href="/admin/enrollment-forms"
        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors mb-4 inline-block"
      >
        ← Back to Enrollment Forms
      </Link>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Create Enrollment Form</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Generate a new enrollment form link for a batch</p>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {createdForm ? (
        /* Success State */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
              <h2 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">Enrollment Form Created Successfully!</h2>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Share the following link with learners to enroll in this batch:
              </p>

              {/* Enrollment Link */}
              <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-300 dark:border-slate-700">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 uppercase font-medium">Enrollment Link</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={enrollmentLink}
                    readOnly
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-900 dark:text-white font-mono overflow-auto"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(enrollmentLink);
                      alert("Link copied to clipboard!");
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded transition-colors whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Form Details */}
              <div className="bg-slate-100 dark:bg-slate-800/30 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-500">Form ID:</span>
                  <span className="text-slate-900 dark:text-white font-mono">{createdForm.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-500">Status:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">{createdForm.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-500">Created:</span>
                  <span className="text-slate-900 dark:text-white">{new Date(createdForm.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
                💡 You can now use this form ID in the <Link href="/admin/enrollments/upload" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">Bulk Upload</Link> feature to invite multiple learners at once.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/enrollment-forms"
              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-center font-semibold rounded-lg transition-colors"
            >
              Back to Forms
            </Link>
            <Link
              href={`/admin/enrollments/upload?formId=${createdForm.id}`}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-center font-semibold rounded-lg transition-colors"
            >
              Bulk Upload
            </Link>
          </div>
        </div>
      ) : (
        /* Form State */
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6">
          {/* Select Batch */}
          <div>
            <label htmlFor="batchId" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              Select Batch <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            {batchesLoading ? (
              <div className="animate-pulse bg-slate-100 dark:bg-slate-800 h-10 rounded-lg"></div>
            ) : batches.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No active batches available. <Link href="/admin/batches/create" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">Create a batch first.</Link>
              </p>
            ) : (
              <select
                id="batchId"
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Choose a batch --</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchTitle}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Expires In Days */}
          <div>
            <label htmlFor="expiresInDays" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              Link Expiration (Days)
            </label>
            <input
              id="expiresInDays"
              type="number"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              min="1"
              max="365"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Leave blank or 0 for no expiration</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Link
              href="/admin/enrollment-forms"
              className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || batchesLoading || batches.length === 0}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? "Creating..." : "Create Enrollment Form"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
