"use client";

import { useEffect, useState, FormEvent } from "react";
import { apiFetch } from "@/lib/api";

interface Learner {
  id: string;
  userId: string;
  batchId: string;
  user: {
    fullName: string;
    email: string;
  };
  batch: {
    batchTitle: string;
  };
}

interface Batch {
  id: string;
  batchTitle: string;
  startDate: string;
  endDate: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  recipient: {
    fullName: string;
    email: string;
  } | null;
  batch: {
    batchTitle: string;
  } | null;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [targetType, setTargetType] = useState<"BATCH" | "LEARNER">("BATCH");
  const [batchId, setBatchId] = useState("");
  const [selectedLearnerIds, setSelectedLearnerIds] = useState<string[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const res = await apiFetch("/notifications");
    if (res.success && res.data) {
      setNotifications(res.data);
    } else {
      setError(res.message || "Failed to fetch notifications");
    }
    setLoading(false);
  };

  const fetchBatchesAndLearners = async () => {
    setLoadingData(true);
    try {
      const batchRes = await apiFetch("/batches");
      if (batchRes.success && batchRes.data) {
        setBatches(batchRes.data);
      }

      const learnerRes = await apiFetch("/learner/admin/all");
      if (learnerRes.success && learnerRes.data) {
        setLearners(learnerRes.data);
      }
    } catch (err) {
      setError("Failed to load batches or learners");
    }
    setLoadingData(false);
  };

  const handleSendNotification = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (targetType === "BATCH" && !batchId) {
      setError("Please select a batch");
      setIsSubmitting(false);
      return;
    }

    if (targetType === "LEARNER" && selectedLearnerIds.length === 0) {
      setError("Please select at least one learner");
      setIsSubmitting(false);
      return;
    }

    const payload: any = {
      title,
      message,
      targetType,
    };

    if (targetType === "BATCH") {
      payload.batchId = batchId;
    } else if (targetType === "LEARNER") {
      payload.learnerIds = selectedLearnerIds;
    }

    const res = await apiFetch("/notifications", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.success) {
      setShowForm(false);
      setTitle("");
      setMessage("");
      setTargetType("BATCH");
      setBatchId("");
      setSelectedLearnerIds([]);
      fetchNotifications();
    } else {
      setError(res.message || "Failed to send notification");
    }
    setIsSubmitting(false);
  };

  const toggleLearnerSelection = (learnerId: string) => {
    setSelectedLearnerIds((prev) =>
      prev.includes(learnerId) ? prev.filter((id) => id !== learnerId) : [...prev, learnerId]
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Notifications</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Send and manage system notifications</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Broadcast
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSendNotification} className="mb-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Send Notification</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Title <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. System Maintenance Notice"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Message <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <textarea
                id="message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message here..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Target Type Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2.5">
                Target <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    value="BATCH"
                    checked={targetType === "BATCH"}
                    onChange={() => {
                      setTargetType("BATCH");
                      setSelectedLearnerIds([]);
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Select by Batch</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    value="LEARNER"
                    checked={targetType === "LEARNER"}
                    onChange={() => {
                      setTargetType("LEARNER");
                      setBatchId("");
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Select by Learner</span>
                </label>
              </div>
            </div>

            {/* Batch Selection */}
            {targetType === "BATCH" && (
              <div>
                <label htmlFor="batch" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Batch <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <select
                  id="batch"
                  value={batchId}
                  onChange={(e) => {
                    setBatchId(e.target.value);
                    fetchBatchesAndLearners();
                  }}
                  onFocus={() => {
                    if (batches.length === 0) {
                      fetchBatchesAndLearners();
                    }
                  }}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Select a Batch --</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batchTitle}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Learner Selection */}
            {targetType === "LEARNER" && (
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Learners <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <div className="space-y-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-3 max-h-64 overflow-y-auto border border-slate-300 dark:border-slate-700">
                  {loadingData ? (
                    <div className="text-center py-4 text-slate-500 dark:text-slate-400">Loading learners...</div>
                  ) : learners.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 dark:text-slate-400">No learners found</div>
                  ) : (
                    learners.map((learner) => (
                      <label key={learner.userId} className="flex items-center gap-2 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedLearnerIds.includes(learner.userId)}
                          onChange={() => toggleLearnerSelection(learner.userId)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {learner.user.fullName} ({learner.batch.batchTitle})
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {selectedLearnerIds.length > 0 && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    {selectedLearnerIds.length} learner(s) selected
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setTitle("");
                  setMessage("");
                  setTargetType("BATCH");
                  setBatchId("");
                  setSelectedLearnerIds([]);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loadingData}
                className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Send Notification"}
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <svg className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-1">No Notifications</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500">There are no notifications in the system yet.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider bg-slate-50/50 dark:bg-slate-950/50">
                  <th className="px-6 py-4 font-medium">Notification</th>
                  <th className="px-6 py-4 font-medium">Recipient</th>
                  <th className="px-6 py-4 font-medium">Sent On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white mb-1">{n.title}</div>
                      <div className="text-slate-500 dark:text-slate-400 line-clamp-2 max-w-md">{n.message}</div>
                    </td>
                    <td className="px-6 py-4">
                      {n.recipient ? (
                        <div>
                          <div className="text-slate-900 dark:text-white">{n.recipient.fullName}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">{n.recipient.email}</div>
                        </div>
                      ) : n.batch ? (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">
                          Batch: {n.batch.batchTitle}
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                          Global Broadcast
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}