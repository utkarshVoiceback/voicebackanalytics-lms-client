"use client";

import { useEffect, useState, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store";
import { setUploadResults, setEnrollmentLoading, setEnrollmentError } from "@/store/enrollmentSlice";
import { apiFetch } from "@/lib/api";

function UploadContent() {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { loading, error, uploadResults } = useAppSelector((state) => state.enrollment);

  const initialFormId = searchParams.get("formId") || "";
  const initialBatchId = searchParams.get("batchId") || "";

  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState(initialBatchId);
  const [formId, setFormId] = useState(initialFormId);
  const [checkingForm, setCheckingForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  // New state for sending
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<any>(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      checkFormForBatch(selectedBatchId);
    } else {
      setFormId("");
    }
  }, [selectedBatchId]);

  const fetchBatches = async () => {
    const res = await apiFetch("/batches");
    if (res.success && res.data) {
      setBatches(res.data);
    }
  };

  const checkFormForBatch = async (batchId: string) => {
    if (batchId === initialBatchId && initialFormId) {
      setFormId(initialFormId);
      return;
    }
    setCheckingForm(true);
    setFormId("");
    try {
      const res = await apiFetch(`/form-templates/batch/${batchId}`);
      if (res.success && res.data) {
        setFormId(res.data.id);
      }
    } catch (err) {
      console.error(err);
    }
    setCheckingForm(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) {
      dispatch(setEnrollmentError("Please select a Batch"));
      return;
    }
    if (!formId) {
      dispatch(setEnrollmentError("Please create a form for this batch first"));
      return;
    }
    if (!file) {
      dispatch(setEnrollmentError("Please select an Excel file"));
      return;
    }

    dispatch(setEnrollmentLoading(true));
    dispatch(setEnrollmentError(null));
    dispatch(setUploadResults(null));
    setSendResults(null);

    const formData = new FormData();
    formData.append("enrollmentFormId", formId);
    formData.append("file", file);

    const res = await apiFetch("/enrollment-invitations/upload", {
      method: "POST",
      body: formData,
    });

    if (res.success && res.data) {
      dispatch(setUploadResults(res.data));
    } else {
      dispatch(setEnrollmentError(res.message || "Failed to process Excel file"));
    }
    dispatch(setEnrollmentLoading(false));
  };

  const handleSendInvitations = async () => {
    if (!uploadResults || !uploadResults.savedInvitationIds || uploadResults.savedInvitationIds.length === 0) {
      return;
    }

    setSending(true);
    const res = await apiFetch("/enrollment-invitations/send", {
      method: "POST",
      body: JSON.stringify({ invitationIds: uploadResults.savedInvitationIds }),
    });

    if (res.success && res.data) {
      setSendResults(res.data);
    } else {
      dispatch(setEnrollmentError(res.message || "Failed to send invitations"));
    }
    setSending(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/batches" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors mb-2 inline-block">
          ← Back to Batch Management
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Bulk Upload Enrollments</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">For API integration, contact our support</p>
          </div>
          <Link
            href="/admin/learners/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33A3 3 0 0116.5 19.5H6.75Z" />
            </svg>
            Upload Learners
          </Link>
        </div>
      </div>

      {/* Errors */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <div>
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="batchSelect" className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                  Select Batch <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                {selectedBatchId && !checkingForm && (
                  formId ? (
                    <Link
                      href={`/admin/batches/form-builder/edit?returnTo=/admin/enrollments/upload&batchId=${selectedBatchId}`}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 hover:underline"
                    >
                      ✎ Edit Form
                    </Link>
                  ) : (
                    <Link
                      href={`/admin/batches/form-builder/create?returnTo=/admin/enrollments/upload&batchId=${selectedBatchId}`}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 hover:underline"
                    >
                      + Add Form
                    </Link>
                  )
                )}
              </div>
              <div className="flex gap-2">
                <select
                  id="batchSelect"
                  required
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  disabled={!!initialBatchId}
                  className={`flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors ${initialBatchId ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <option value="">Choose a batch...</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.batchTitle}</option>
                  ))}
                </select>

                {formId && !checkingForm && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
                        const downloadUrl = `${apiBaseUrl}/form-templates/${formId}/download`;
                        const response = await fetch(downloadUrl, {
                          method: "GET",
                          headers: { Authorization: `Bearer ${localStorage.getItem("lms_auth_token")}` },
                        });
                        if (!response.ok) throw new Error("Failed to download template");
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `form-template.xlsx`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                      } catch (err) {
                        dispatch(setEnrollmentError("Failed to download template. Ensure the Form ID is correct."));
                      }
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shadow-sm"
                  >
                    Download Template
                  </button>
                )}
              </div>
              {checkingForm && <p className="text-xs text-slate-500 mt-2">Checking for active form...</p>}
              {!checkingForm && selectedBatchId && !formId && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  No form found for this batch. Please add a form first.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Upload Excel File (.xlsx, .xls) <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700 px-6 py-10 hover:border-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors relative">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <div className="mt-4 flex text-sm leading-6 text-slate-500 dark:text-slate-400">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-transparent font-semibold text-blue-600 dark:text-blue-500 focus-within:outline-none hover:text-blue-500 dark:hover:text-blue-400">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-slate-400 dark:text-slate-500 mt-2">Required Columns: Name, Email, Mobile</p>
                  {file && <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-4 break-all">Selected: {file.name}</p>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || sending}
              className="w-full flex justify-center items-center gap-2 rounded-lg bg-slate-200 dark:bg-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Validating...
                </>
              ) : (
                "Upload and Validate"
              )}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div>
          {uploadResults ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 h-full flex flex-col">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Validation Preview</h3>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-sm text-slate-400 dark:text-slate-500">Total Rows</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{uploadResults.total}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                  <p className="text-sm text-emerald-600/70 dark:text-emerald-500/70">Valid</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{uploadResults.valid}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-500/10 p-4 rounded-lg border border-red-200 dark:border-red-500/20">
                  <p className="text-sm text-red-600/70 dark:text-red-500/70">Invalid</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{uploadResults.invalid}</p>
                </div>
              </div>

              {/* Row Details */}
              <div className="flex-1 overflow-y-auto max-h-64 border border-slate-200 dark:border-slate-800 rounded-lg mb-6">
                <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                  <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Row</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                    {uploadResults.rows?.map((row: any, idx: number) => (
                      <tr key={idx} className={row.isValid ? "bg-white dark:bg-slate-900/50" : "bg-red-50 dark:bg-red-950/20"}>
                        <td className="px-4 py-3 font-mono text-slate-400 dark:text-slate-500">{row.rowNumber}</td>
                        <td className="px-4 py-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                              Invalid
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 truncate max-w-[150px]" title={row.email}>{row.email || '—'}</td>
                        <td className="px-4 py-3 text-red-600 dark:text-red-400 text-xs truncate max-w-[150px]" title={row.error}>{row.error || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Send Action */}
              {sendResults ? (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-4 rounded-lg">
                  <h4 className="text-emerald-700 dark:text-emerald-400 font-semibold mb-2">Invitations Processing Started</h4>
                  <ul className="text-sm text-emerald-600/80 dark:text-emerald-300/80 space-y-1">
                    <li>Emails Sent: {sendResults.emailSent}</li>
                    <li>WhatsApp Sent: {sendResults.whatsappSent}</li>
                  </ul>
                  <Link href={`/admin/enrollments`} className="mt-4 inline-block text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 underline">
                    View All Invitations
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleSendInvitations}
                  disabled={uploadResults.valid === 0 || sending}
                  className="w-full flex justify-center items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-auto"
                >
                  {sending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    `Send ${uploadResults.valid} Invitations`
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 h-full flex flex-col items-center justify-center text-center opacity-50">
              <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">Preview Results</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Upload an Excel file to view validation details and send invitations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UploadInvitationsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[calc(100vh-4rem)]"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>}>
      <UploadContent />
    </Suspense>
  );
}
