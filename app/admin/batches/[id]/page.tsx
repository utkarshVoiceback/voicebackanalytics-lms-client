"use client";

import { useEffect, useState, FormEvent, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store";
import { updateBatchInList, setActiveBatch, setBatchLoading, setBatchError } from "@/store/batchSlice";
import { setGeneratedLink } from "@/store/enrollmentSlice";
import { apiFetch } from "@/lib/api";

export default function EditBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = use(params);
  const { activeBatch, loading, error } = useAppSelector((state) => state.batch);
  const { generatedLink } = useAppSelector((state) => state.enrollment);

  const [batchTitle, setBatchTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [enrollmentStartDate, setEnrollmentStartDate] = useState("");
  const [enrollmentEndDate, setEnrollmentEndDate] = useState("");
  const [batchSize, setBatchSize] = useState("50");
  const [status, setStatus] = useState("ACTIVE");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [generatingLink, setGeneratingLink] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBatchDetails(id);
      fetchEnrolledStudents(id);
      dispatch(setGeneratedLink(null));
      fetchExistingEnrollmentForm(id);
    }
  }, [id]);

  const fetchEnrolledStudents = async (batchId: string) => {
    setLoadingStudents(true);
    const res = await apiFetch(`/batches/${batchId}/enrollments`);
    if (res.success && res.data) {
      setEnrolledStudents(res.data);
    }
    setLoadingStudents(false);
  };

  useEffect(() => {
    if (activeBatch) {
      setBatchTitle(activeBatch.batchTitle);
      const startStr = activeBatch.startDate ? new Date(activeBatch.startDate).toISOString().split('T')[0] : "";
      setStartDate(startStr);
      const endStr = activeBatch.endDate ? new Date(activeBatch.endDate).toISOString().split('T')[0] : "";
      setEndDate(endStr);
      // Format date to YYYY-MM-DD for input[type="date"]
      const enrollStartStr = activeBatch.enrollmentStartDate ? new Date(activeBatch.enrollmentStartDate).toISOString().split('T')[0] : "";
      setEnrollmentStartDate(enrollStartStr);
      const enrollEndStr = activeBatch.enrollmentEndDate ? new Date(activeBatch.enrollmentEndDate).toISOString().split('T')[0] : "";
      setEnrollmentEndDate(enrollEndStr);
      setBatchSize(activeBatch.batchSize?.toString() || "50");
      setStatus(activeBatch.status);
    }
  }, [activeBatch]);

  const fetchBatchDetails = async (batchId: string) => {
    dispatch(setBatchLoading(true));
    const res = await apiFetch(`/batches/${batchId}`);
    if (res.success && res.data) {
      dispatch(setActiveBatch(res.data));
    } else {
      dispatch(setBatchError(res.message || "Failed to fetch batch details"));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError(null);

    if (new Date(startDate) > new Date(endDate)) {
      setUpdateError("Start date must not be greater than end date.");
      setUpdateLoading(false);
      return;
    }

    const res = await apiFetch(`/batches/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        batchTitle,
        startDate,
        endDate,
        enrollmentStartDate,
        enrollmentEndDate,
        batchSize: parseInt(batchSize, 10),
        status,
      }),
    });

    if (res.success && res.data) {
      dispatch(updateBatchInList(res.data));
      router.push("/admin/batches");
    } else {
      setUpdateError(res.message || "Failed to update batch");
    }
    setUpdateLoading(false);
  };

  const [formId, setFormId] = useState<string | null>(null);

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    setGenerateError(null);
    dispatch(setGeneratedLink(null));
    setFormId(null);

    const res = await apiFetch("/enrollment-forms", {
      method: "POST",
      body: JSON.stringify({ batchId: id }),
    });

    if (res.success && res.data) {
      const link = `${window.location.origin}/enroll/${res.data.batchId || id}`;
      dispatch(setGeneratedLink(link));
      setFormId(res.data.id);
    } else {
      setGenerateError(res.message || "Failed to generate enrollment link");
    }
    setGeneratingLink(false);
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      alert("Enrollment link copied to clipboard!");
    }
  };

  const fetchExistingEnrollmentForm = async (batchId: string) => {
    const res = await apiFetch("/enrollment-forms");
    if (res.success && res.data) {
      const forms = res.data as any[];
      const batchForms = forms.filter(f => (f.batchId || f.batch?.id) === batchId);
      if (batchForms.length > 0) {
        const latestForm = batchForms[0];
        setFormId(latestForm.id);
        const batchId = latestForm.batchId || latestForm.batch?.id || id;
        const link = `${window.location.origin}/enroll/${batchId}`;
        dispatch(setGeneratedLink(link));
      }
    }
  };

  if (loading && !activeBatch) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/admin/batches" className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-2 inline-block">
            ← Back to Batches
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Edit Batch</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Update batch details and manage enrollments</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Edit Form */}
        <div className="lg:col-span-2">
          {updateError && (
             <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
               <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
               </svg>
               <span>{updateError}</span>
             </div>
          )}

          {activeBatch && (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
              <div>
                <label htmlFor="batchTitle" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Batch Title <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  id="batchTitle"
                  type="text"
                  required
                  value={batchTitle}
                  onChange={(e) => setBatchTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="batchSize" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Batch Size (Capacity) <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <input
                    id="batchSize"
                    type="number"
                    min="1"
                    required
                    value={batchSize}
                    onChange={(e) => setBatchSize(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Status <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <select
                    id="status"
                    required
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
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
          )}
        </div>

        {/* Right Column: Actions / Enrollment Link */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Enrollment Link</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {generatedLink
                ? "Share this token-based link with learners to enroll into this batch."
                : "Generate an enrollment form to create a shareable token-based link for learners."}
            </p>

            <div className="space-y-4">
              {generateError && (
                <div className="flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                  <svg className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  <span>{generateError}</span>
                </div>
              )}
              {generatedLink ? (
                <>
                  <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 break-all text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                    {generatedLink}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                      </svg>
                      Copy Link
                    </button>
                    {/* {formId && (
                      <Link
                        href={`/admin/enrollments/upload?formId=${formId}&batchId=${id}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33A3 3 0 0 1 16.5 19.5H6.75Z" />
                        </svg>
                        Bulk Upload
                      </Link>
                    )} */}
                  </div>
                </>
              ) : (
                <button
                  onClick={handleGenerateLink}
                  disabled={generatingLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingLink ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Generate Enrollment Form
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Enrolled Students</h3>
              <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 text-xs font-bold px-2 py-1 rounded-full">
                Total: {enrolledStudents.length}
              </span>
            </div>
            
            {loadingStudents ? (
               <div className="flex justify-center p-4">
                 <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                 </svg>
               </div>
            ) : enrolledStudents.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No students enrolled yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                  <thead className="text-xs text-slate-400 dark:text-slate-500 uppercase bg-slate-100 dark:bg-slate-950/50">
                    <tr>
                      <th scope="col" className="px-4 py-3 rounded-l-lg">Name</th>
                      <th scope="col" className="px-4 py-3">Email</th>
                      <th scope="col" className="px-4 py-3 rounded-r-lg">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledStudents.map((student) => (
                      <tr key={student.id} className="border-b border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/20">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{student.fullName}</td>
                        <td className="px-4 py-3">{student.email}</td>
                        <td className="px-4 py-3">{student.mobile || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
