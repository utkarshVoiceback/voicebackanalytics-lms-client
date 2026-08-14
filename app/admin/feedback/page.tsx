"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface User {
  id: string;
  fullName: string;
  email: string;
}

interface LearnerProfile {
  id: string;
  userId: string;
  batchId: string;
  user: User;
  batch?: { id: string; batchTitle: string };
}

interface Module {
  id: string;
  title: string;
  batchId: string;
}

interface Feedback {
  id: string;
  learnerId: string;
  moduleId: string | null;
  message: string;
  createdAt: string;
  learner?: User;
  batch?: { id: string; batchTitle: string };
  module?: Module;
}

export default function AdminFeedbackPage() {
  const [learners, setLearners] = useState<LearnerProfile[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [history, setHistory] = useState<Feedback[]>([]);

  const [selectedLearner, setSelectedLearner] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [learnersRes, feedbackRes] = await Promise.all([
        apiFetch("/learner/admin/all"),
        apiFetch("/feedback"),
      ]);

      if (learnersRes.success) setLearners(learnersRes.data || []);
      if (feedbackRes.success) setHistory(feedbackRes.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLearner) {
      const learner = learners.find((l) => l.userId === selectedLearner);
      if (learner?.batchId) {
        apiFetch(`/modules?batchId=${learner.batchId}`).then((res) => {
          if (res.success) setModules(res.data || []);
        });
      } else {
        setModules([]);
      }
    } else {
      setModules([]);
      setSelectedModule("");
    }
  }, [selectedLearner, learners]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedLearner) {
      setError("Please select a learner");
      return;
    }
    if (!message.trim()) {
      setError("Feedback message cannot be empty");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/feedback", {
        method: "POST",
        body: JSON.stringify({
          learnerId: selectedLearner,
          moduleId: selectedModule || null,
          message,
        }),
      });

      if (res.success) {
        setSuccess("Feedback sent successfully.");
        setMessage("");
        setSelectedLearner("");
        setSelectedModule("");
        // refresh history
        const updatedHistory = await apiFetch("/feedback");
        if (updatedHistory.success) setHistory(updatedHistory.data || []);
      } else {
        setError(res.message || "Failed to send feedback");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Feedback to Learner</h1>
          <p className="text-slate-400 mt-1">Send direct feedback and trigger automatic notifications.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg flex items-center gap-2">
                <span>{success}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Select Learner <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedLearner}
                  onChange={(e) => setSelectedLearner(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  <option value="">-- Select a Learner --</option>
                  {learners.map((l) => (
                    <option key={l.userId} value={l.userId}>
                      {l.user?.fullName} ({l.batch?.batchTitle || "No Batch"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Select Module <span className="text-slate-500">(Optional)</span>
                </label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  disabled={!selectedLearner || modules.length === 0}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
                >
                  <option value="">-- Select Module --</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Feedback Message <span className="text-red-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                placeholder="Write feedback for the learner..."
              ></textarea>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20"
              >
                {submitting ? "Sending..." : "Send Feedback"}
              </button>
            </div>
          </form>
        </div>

        {/* History Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Feedback History</h2>
          {history.length === 0 ? (
            <p className="text-slate-400">No feedback sent yet.</p>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-white">{item.learner?.fullName}</h3>
                      <p className="text-sm text-slate-400">
                        {item.batch?.batchTitle} {item.module ? `• ${item.module.title}` : ""}
                      </p>
                    </div>
                    <span className="text-sm text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 text-slate-300 whitespace-pre-wrap">
                    {item.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}