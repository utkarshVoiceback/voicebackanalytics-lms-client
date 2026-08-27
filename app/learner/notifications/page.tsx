"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: string;
  feedback?: {
    id: string;
    message: string;
    createdAt: string;
    admin?: { fullName: string };
    module?: { title: string };
  };
}

export default function LearnerNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<Notification["feedback"] | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/notifications");
      if (res.success) {
        setNotifications(res.data || []);
      } else {
        setError(res.message || "Failed to load notifications");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (notif.type === "FEEDBACK" && notif.feedback) {
      setSelectedFeedback(notif.feedback);
    }

    if (!notif.isRead) {
      // Mark as read in UI optimistically
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
      );

      // Call API
      try {
        await apiFetch(`/notifications/${notif.id}/read`, { method: "PUT" });
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    }
  };

  const closeFeedbackModal = () => {
    setSelectedFeedback(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 relative">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Notifications</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Stay updated with your latest alerts and feedback.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
              <svg className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No notifications</h3>
              <p className="text-slate-500 dark:text-slate-400">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`cursor-pointer rounded-xl border p-5 transition-all ${
                  notif.isRead
                    ? "bg-white border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/80"
                    : "bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/10 dark:border-blue-500/30 dark:hover:bg-blue-900/20"
                }`}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {notif.type === "FEEDBACK" ? (
                      <div className={`p-2 rounded-lg ${notif.isRead ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" : "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"}`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                        </svg>
                      </div>
                    ) : (
                      <div className={`p-2 rounded-lg ${notif.isRead ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"}`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-semibold ${notif.isRead ? "text-slate-600 dark:text-slate-300" : "text-slate-900 dark:text-white"}`}>
                        {notif.title}
                        {!notif.isRead && (
                          <span className="ml-2 inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                        )}
                      </h3>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-sm ${notif.isRead ? "text-slate-400 dark:text-slate-500" : "text-slate-500 dark:text-slate-400"}`}>
                      {notif.message}
                    </p>
                    {notif.type === "FEEDBACK" && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">Click to view feedback →</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Feedback Modal Overlay */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Feedback Details</h2>
              <button
                onClick={closeFeedbackModal}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-300 dark:border-slate-700/50">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider font-semibold">From</p>
                  <p className="text-slate-900 dark:text-white font-medium">{selectedFeedback.admin?.fullName || "Admin"}</p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-300 dark:border-slate-700/50">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider font-semibold">Date</p>
                  <p className="text-slate-900 dark:text-white font-medium">
                    {new Date(selectedFeedback.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedFeedback.module && (
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-200 dark:border-blue-500/20 flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
                  <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400/80 mb-1 uppercase tracking-wider font-semibold">Related Module</p>
                    <p className="text-blue-900 dark:text-blue-100">{selectedFeedback.module.title}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Feedback Message</p>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-5 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {selectedFeedback.message}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <button
                onClick={closeFeedbackModal}
                className="rounded-lg bg-slate-100 dark:bg-slate-800 px-6 py-2.5 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-300 dark:border-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}