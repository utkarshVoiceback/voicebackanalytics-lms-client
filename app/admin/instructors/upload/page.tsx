"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

export default function BulkUploadInstructorsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    window.location.href = `${API_BASE_URL}/instructors/template/download`;
  };

  const handleUpload = async () => {
    if (!file) {
      window.alert("Please select a file to upload");
      return;
    }

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("lms_auth_token") || sessionStorage.getItem("lms_auth_token");
      const res = await fetch(`${API_BASE_URL}/instructors/bulk-upload`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload file");

      if (data.success) {
        window.alert("Bulk upload processed successfully!");
        setResult(data.data);
      }
    } catch (err: any) {
      window.alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bulk Upload Instructors</h1>
        <Link
          href="/admin/instructors"
          className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          &larr; Back to Instructors
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50">
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Step 1: Download Template</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Download the Excel template and fill in the instructor details. Do not change the column headers.
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="whitespace-nowrap px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              Download Template
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Step 2: Upload Data</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="flex-1 block w-full text-sm text-slate-500 dark:text-slate-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  dark:file:bg-blue-900/30 dark:file:text-blue-300
                  hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50
                  transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-900"
              />
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="whitespace-nowrap px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {uploading ? "Processing..." : "Upload & Process"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-semibold text-slate-900 dark:text-white">Import Summary</h3>
            <div className="flex gap-6 mt-2 text-sm">
              <span className="text-slate-600 dark:text-slate-300">Total Rows: {result.total}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Successfully Imported: {result.imported}</span>
              <span className="text-red-600 dark:text-red-400 font-medium">Failed: {result.failed}</span>
            </div>
          </div>
          
          {result.rows && result.rows.length > 0 && (
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white dark:bg-slate-900 sticky top-0 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-500">Row</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {result.rows.map((row: any, idx: number) => (
                    <tr key={idx} className={row.isValid ? "bg-emerald-50/30 dark:bg-emerald-900/10" : "bg-red-50/50 dark:bg-red-900/10"}>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">Row {row.rowNum}</td>
                      <td className="px-4 py-3">
                        {row.isValid ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {row.isValid ? "Instructor account created." : <span className="text-red-600 dark:text-red-400">{row.errorReason}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
