"use client";

import { useEffect, useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store";
import { apiFetch } from "@/lib/api";

interface FormTemplate {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  batchTitle: string;
}

interface ValidatedRow {
  rowNumber: number;
  studentName: string;
  email: string;
  phone: string;
  isValid: boolean;
  error?: string;
}

interface UploadResult {
  total: number;
  valid: number;
  invalid: number;
  created: number;
  emailsSent: number;
  rows: ValidatedRow[];
}

function UploadContent() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [formTemplate, setFormTemplate] = useState<FormTemplate | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<UploadResult | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user && user.role !== "ADMIN" && user.role !== "INSTRUCTOR") {
      router.push("/");
    } else {
      fetchBatches();
    }
  }, [isAuthenticated, user, router]);

  const fetchBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/batches");
      if (res.success && res.data) {
        setBatches(res.data);
      } else {
        setError(res.message || "Failed to fetch batches");
      }
    } catch (err: any) {
      setError("Failed to fetch batches: " + (err.message || "Network error"));
    }
    setLoading(false);
  };

  const handleBatchChange = async (batchId: string) => {
    setSelectedBatchId(batchId);
    setFormTemplate(null);
    setFile(null);
    setUploadResults(null);
    setError(null);

    if (batchId) {
      try {
        const res = await apiFetch(`/form-templates/batch/${batchId}`);
        if (res.success && res.data) {
          setFormTemplate(res.data);
        } else if (res.data === null) {
          setError("No form template found for this batch. Create one from Batch Management first.");
        } else {
          setError(res.message || "Failed to load form template");
        }
      } catch (err: any) {
        setError("Failed to load form template: " + (err.message || "Network error"));
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedBatchId) {
      setError("Please select a batch");
      return;
    }

    if (!formTemplate) {
      setError("No form template found for this batch");
      return;
    }

    if (!file) {
      setError("Please select an Excel file");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("formTemplateId", formTemplate.id);
    formData.append("file", file);

    const res = await apiFetch("/learner-import/upload", {
      method: "POST",
      body: formData,
    });

    if (res.success && res.data) {
      setUploadResults(res.data);
    } else {
      setError(res.message || "Failed to process Excel file");
    }

    setUploading(false);
  };

  if (!isAuthenticated || !user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/learners" className="text-sm text-blue-400 hover:text-blue-300 transition-colors mb-2 inline-block">
          ← Back to Learners
        </Link>
        <h1 className="text-3xl font-bold text-white tracking-tight">Bulk Upload Learners</h1>
        <p className="text-slate-400 mt-1">Upload an Excel file to create learner accounts in bulk</p>
      </div>

      {/* Errors */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <div>
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            {/* Batch Selection */}
            <div>
              <label htmlFor="batch" className="block text-sm font-medium text-slate-300 mb-1.5">
                Batch <span className="text-red-400">*</span>
              </label>
              <select
                id="batch"
                value={selectedBatchId}
                onChange={(e) => handleBatchChange(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select a batch...</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchTitle}
                  </option>
                ))}
              </select>
              {formTemplate && (
                <p className="text-xs text-emerald-400 mt-2">✓ Form template "{formTemplate.name}" found for this batch</p>
              )}
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Upload Excel File (.xlsx, .xls) <span className="text-red-400">*</span>
              </label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-700 px-6 py-10 hover:border-blue-500 hover:bg-slate-800/50 transition-colors relative">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <div className="mt-4 flex text-sm leading-6 text-slate-400">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-transparent font-semibold text-blue-500 focus-within:outline-none hover:text-blue-400">
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".xlsx,.xls"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        disabled={!formTemplate}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-slate-500 mt-2">Match the columns in your form template</p>
                  {file && <p className="text-sm text-emerald-400 mt-4 break-all">Selected: {file.name}</p>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!formTemplate || uploading}
              className="w-full flex justify-center items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Uploading...
                </>
              ) : (
                "Upload and Create Learners"
              )}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div>
          {uploadResults ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-4">Upload Results</h3>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <p className="text-sm text-slate-500">Total Rows</p>
                  <p className="text-2xl font-bold text-white">{uploadResults.total}</p>
                </div>
                <div className="bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/20">
                  <p className="text-sm text-emerald-500/70">Created</p>
                  <p className="text-2xl font-bold text-emerald-400">{uploadResults.created}</p>
                </div>
                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                  <p className="text-sm text-blue-500/70">Valid</p>
                  <p className="text-2xl font-bold text-blue-400">{uploadResults.valid}</p>
                </div>
                <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                  <p className="text-sm text-red-500/70">Invalid</p>
                  <p className="text-2xl font-bold text-red-400">{uploadResults.invalid}</p>
                </div>
              </div>

              {/* Row Details */}
              <div className="flex-1 overflow-y-auto max-h-64 border border-slate-800 rounded-lg mb-6">
                <table className="w-full text-sm text-left text-slate-300">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Row</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {uploadResults.rows?.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? "bg-slate-900/50" : "bg-red-950/20"}>
                        <td className="px-4 py-3 font-mono text-slate-500 text-xs">{row.rowNumber}</td>
                        <td className="px-4 py-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
                              Invalid
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 truncate max-w-[150px]" title={row.email}>
                          {row.email || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/admin/learners")}
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
                >
                  View New Learners
                </button>
                <button
                  onClick={() => {
                    setUploadResults(null);
                    setFile(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Upload More
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full flex flex-col items-center justify-center text-center opacity-50">
              <svg className="w-16 h-16 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <h3 className="text-lg font-medium text-slate-300">Upload Results</h3>
              <p className="text-sm text-slate-500 mt-1">Upload an Excel file to see validation details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UploadLearnersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[calc(100vh-4rem)]"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>}>
      <UploadContent />
    </Suspense>
  );
}
