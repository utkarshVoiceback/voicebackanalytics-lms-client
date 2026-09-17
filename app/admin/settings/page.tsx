"use client";

import { useEffect, useState, FormEvent } from "react";
import { apiFetch } from "@/lib/api";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [archiveAfterDays, setArchiveAfterDays] = useState(30);
  const [archiveModulesAssignments, setArchiveModulesAssignments] = useState(false);
  const [archiveCommunicationRecords, setArchiveCommunicationRecords] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const res = await apiFetch("/app-config");
    if (res.success && res.data) {
      const archivePref = res.data.find((c: any) => c.key === "ARCHIVE_PREFERENCES");
      if (archivePref && archivePref.value) {
        try {
          const parsed = JSON.parse(archivePref.value);
          setArchiveAfterDays(parsed.archiveAfterDays || 30);
          setArchiveModulesAssignments(!!parsed.archiveModulesAssignments);
          setArchiveCommunicationRecords(!!parsed.archiveCommunicationRecords);
        } catch (e) {
          console.error("Failed to parse preferences");
        }
      }
    }
    setLoading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (!archiveModulesAssignments && !archiveCommunicationRecords) {
      setMessage({ type: "error", text: "Please select at least one content type to archive." });
      setSaving(false);
      return;
    }

    const payload = [
      {
        key: "ARCHIVE_PREFERENCES",
        value: JSON.stringify({
          archiveAfterDays: Number(archiveAfterDays),
          archiveModulesAssignments,
          archiveCommunicationRecords
        })
      }
    ];

    const res = await apiFetch("/app-config", {
      method: "PUT",
      body: JSON.stringify({ configs: payload })
    });

    if (res.success) {
      setMessage({ type: "success", text: "Archiving preferences saved successfully!" });
    } else {
      setMessage({ type: "error", text: res.message || "Failed to save preferences." });
    }
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Settings</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Manage application-wide configurations</p>

      {message && (
        <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Archiving Preferences</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Configure how and when batches and their content are archived.</p>
          </div>

          <div className="p-6 space-y-8">
            <div>
              <label htmlFor="days" className="block font-medium text-slate-900 dark:text-white mb-2">
                Archive after batch ends
              </label>
              <select
                id="days"
                required
                value={archiveAfterDays}
                onChange={(e) => setArchiveAfterDays(Number(e.target.value))}
                className="w-full sm:w-64 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value={7}>7 Days</option>
                <option value={15}>15 Days</option>
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
                <option value={180}>180 Days</option>
                <option value={365}>365 Days</option>
              </select>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Select how many days after the batch end date the selected content should be archived.</p>
            </div>

            <div>
              <div className="font-medium text-slate-900 dark:text-white mb-3">Archive these Content</div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={archiveModulesAssignments}
                    onChange={(e) => setArchiveModulesAssignments(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Modules and Assignments</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={archiveCommunicationRecords}
                    onChange={(e) => setArchiveCommunicationRecords(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Communication Records</span>
                </label>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}