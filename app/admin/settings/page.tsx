"use client";

import { useEffect, useState, FormEvent } from "react";
import { apiFetch } from "@/lib/api";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [askForEach, setAskForEach] = useState(false);
  const [daysAfterCompletion, setDaysAfterCompletion] = useState(0);
  const [contentModules, setContentModules] = useState(false);
  const [contentAssignments, setContentAssignments] = useState(false);
  const [contentComm, setContentComm] = useState(false);

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
          setAskForEach(!!parsed.askForEach);
          setDaysAfterCompletion(parsed.daysAfterCompletion || 0);
          setContentModules(!!parsed.content?.modules);
          setContentAssignments(!!parsed.content?.assignments);
          setContentComm(!!parsed.content?.communicationRecords);
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

    const payload = [
      {
        key: "ARCHIVE_PREFERENCES",
        value: JSON.stringify({
          askForEach,
          daysAfterCompletion: Math.max(0, Math.floor(daysAfterCompletion)),
          content: {
            modules: contentModules,
            assignments: contentAssignments,
            communicationRecords: contentComm
          }
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
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">ASK FOR EACH</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">If Yes, an Admin must manually approve archiving for each batch when it becomes eligible.</div>
                </div>
                <div className="relative inline-block w-12 h-6 rounded-full transition-colors ease-in-out duration-200 focus:outline-none" style={{ backgroundColor: askForEach ? '#3b82f6' : '#cbd5e1' }}>
                  <input type="checkbox" className="sr-only" checked={askForEach} onChange={(e) => setAskForEach(e.target.checked)} />
                  <span className={`inline-block w-4 h-4 mt-1 ml-1 transform bg-white rounded-full transition ease-in-out duration-200 ${askForEach ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </label>
            </div>

            <div>
              <label htmlFor="days" className="block font-medium text-slate-900 dark:text-white mb-2">
                Archive after batch completion (Days)
              </label>
              <input
                id="days"
                type="number"
                min="0"
                step="1"
                required
                value={daysAfterCompletion}
                onChange={(e) => setDaysAfterCompletion(Number(e.target.value))}
                className="w-full sm:w-48 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Number of days after a batch's end date before it becomes eligible for archiving.</p>
            </div>

            <div>
              <div className="font-medium text-slate-900 dark:text-white mb-3">Archive these Content</div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contentModules}
                    onChange={(e) => setContentModules(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Modules (Learner Progress)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contentAssignments}
                    onChange={(e) => setContentAssignments(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Assignments (MCQ Attempts)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contentComm}
                    onChange={(e) => setContentComm(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Communication Records (Conversations)</span>
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