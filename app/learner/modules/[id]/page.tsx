"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface Content {
  id: string;
  contentType: string;
  contentUrl: string | null;
  textContent: string | null;
  estimatedMinutes: number;
}

interface ModuleData {
  id: string;
  title: string;
  description: string | null;
  sequenceOrder: number;
  isSequential: boolean;
  contents: Content[];
  batch?: { id: string; batchTitle: string };
}

interface ProgressData {
  id: string;
  status: string;
  startedAt: string | null;
  contentCompletedAt: string | null;
  completedAt: string | null;
  obtainedMarks: number | null;
  totalMarks: number | null;
  percentage: number | null;
}

export default function LearnerModuleViewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [module, setModule] = useState<ModuleData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchModuleAndProgress();
  }, [id]);

  const fetchModuleAndProgress = async () => {
    setLoading(true);
    const [modRes, progressRes] = await Promise.all([
      apiFetch(`/modules/${id}`),
      apiFetch(`/modules/${id}/progress`),
    ]);

    if (modRes.success && modRes.data) {
      setModule(modRes.data);
    } else {
      setError(modRes.message || "Module not found or access denied");
    }

    if (progressRes.success && progressRes.data) {
      setProgress(progressRes.data);
    }

    setLoading(false);
  };

  const handleStart = async () => {
    setActionLoading(true);
    setError(null);
    const res = await apiFetch(`/modules/${id}/start`, { method: "POST" });
    if (res.success) {
      setProgress(res.data);
    } else {
      setError(res.message || "Failed to start module");
    }
    setActionLoading(false);
  };

  const handleCompleteContent = async () => {
    setActionLoading(true);
    setError(null);
    const res = await apiFetch(`/modules/${id}/content-complete`, { method: "POST" });
    if (res.success) {
      setProgress(res.data);
      setSuccessMessage("Content completed! MCQ assessment is now available.");
    } else {
      setError(res.message || "Failed to complete content");
    }
    setActionLoading(false);
  };

  const renderContent = (content: Content, index: number) => {
    // Helper to get the full URL if it's a local upload
    const getFullUrl = (url: string) => {
      if (url.startsWith("/uploads/")) {
        return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}`.replace('/api/v1', '') + url;
      }
      return url;
    };

    if (content.contentType === "VIDEO" && content.contentUrl) {
      const isLocal = content.contentUrl.startsWith("/uploads/");
      // Convert YouTube watch URL to embed URL if not local
      const embedUrl = isLocal ? getFullUrl(content.contentUrl) : content.contentUrl
        .replace("watch?v=", "embed/")
        .replace("youtu.be/", "www.youtube.com/embed/");

      return (
        <div key={content.id} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <span className="text-sm font-medium text-slate-300">Video · {content.estimatedMinutes} min</span>
          </div>
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-700">
            {isLocal ? (
              <video
                src={embedUrl}
                className="w-full h-full"
                controls
                controlsList="nodownload"
              />
            ) : (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title={`Video ${index + 1}`}
              />
            )}
          </div>
        </div>
      );
    }

    if ((content.contentType === "PDF" || content.contentType === "PPT") && content.contentUrl) {
      const fullUrl = getFullUrl(content.contentUrl);
      const isPdf = content.contentType === "PDF";
      return (
        <div key={content.id} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <svg className={`w-5 h-5 ${isPdf ? "text-red-400" : "text-orange-400"}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <span className="text-sm font-medium text-slate-300">{isPdf ? "PDF Document" : "Presentation"} · {content.estimatedMinutes} min</span>
          </div>
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-4 rounded-xl border p-4 transition-colors group ${isPdf ? "border-red-500/30 bg-red-950/20 hover:bg-red-950/30" : "border-orange-500/30 bg-orange-950/20 hover:bg-orange-950/30"}`}
          >
            <div className={`p-3 rounded-lg ${isPdf ? "bg-red-500/10" : "bg-orange-500/10"}`}>
              <svg className={`w-8 h-8 ${isPdf ? "text-red-400" : "text-orange-400"}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <div className="flex-1">
              <p className={`font-semibold transition-colors ${isPdf ? "text-red-100 group-hover:text-red-300" : "text-orange-100 group-hover:text-orange-300"}`}>
                Download {isPdf ? "PDF" : "Presentation"}
              </p>
              <p className="text-sm text-slate-400 truncate max-w-sm">View Document</p>
            </div>
          </a>
        </div>
      );
    }

    if (content.contentType === "TEXT" && content.textContent) {
      return (
        <div key={content.id} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            <span className="text-sm font-medium text-slate-300">Reading Material · {content.estimatedMinutes} min</span>
          </div>
          <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-6">
            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{content.textContent}</p>
          </div>
        </div>
      );
    }

    return null;
  };

  const totalMinutes = module?.contents?.reduce((sum, c) => sum + c.estimatedMinutes, 0) || 0;
  const isNotStarted = !progress || progress.status === "NOT_STARTED";
  const isInProgress = progress?.status === "IN_PROGRESS" || progress?.status === "CONTENT_COMPLETED";
  const isMCQAvailable = progress?.status === "MCQ_AVAILABLE";
  const isCompleted = progress?.status === "COMPLETED";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !module) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <button onClick={() => router.push("/learner/modules")}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors">
            Back to My Modules
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
          <button onClick={() => router.push("/learner/modules")}
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            My Modules
          </button>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-white font-medium truncate">{module?.title}</span>

          {/* Status Pill */}
          <div className="ml-auto">
            {isCompleted && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-medium text-emerald-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Completed
              </span>
            )}
            {isMCQAvailable && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-medium text-amber-400">
                MCQ Ready
              </span>
            )}
            {isInProgress && (
              <span className="inline-flex rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-xs font-medium text-blue-400">
                In Progress
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Module Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-slate-500">Module {module?.sequenceOrder}</span>
            {module?.isSequential && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                Sequential
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{module?.title}</h1>
          {module?.description && <p className="text-slate-400">{module.description}</p>}
          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
            <span>{module?.contents?.length || 0} content items</span>
            <span>·</span>
            <span>~{totalMinutes} minutes</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Completed Score Card */}
        {isCompleted && progress?.obtainedMarks !== null && (
          <div className="mb-8 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-emerald-400 mb-3">Module Completed ✓</h3>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{progress.obtainedMarks}/{progress.totalMarks}</p>
                <p className="text-xs text-slate-400 mt-1">Marks</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-400">{progress.percentage?.toFixed(1)}%</p>
                <p className="text-xs text-slate-400 mt-1">Percentage</p>
              </div>
            </div>
          </div>
        )}

        {/* Start Button */}
        {isNotStarted && (
          <div className="mb-8 flex justify-center">
            <button
              onClick={handleStart}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20"
            >
              {actionLoading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
              )}
              Start Module
            </button>
          </div>
        )}

        {/* Module Content */}
        {(isInProgress || isMCQAvailable || isCompleted) && module?.contents && (
          <div className="mb-8">
            {module.contents.map((content, index) => renderContent(content, index))}
          </div>
        )}

        {/* Action Buttons */}
        {isInProgress && (
          <div className="flex justify-center">
            <button
              onClick={handleCompleteContent}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-base font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20"
            >
              {actionLoading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
              Mark Content as Complete
            </button>
          </div>
        )}

        {isMCQAvailable && (
          <div className="flex justify-center">
            <button
              onClick={() => router.push(`/learner/modules/${id}/mcq`)}
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-8 py-4 text-base font-semibold text-white hover:bg-amber-500 transition-colors shadow-lg shadow-amber-500/20"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
              </svg>
              Take MCQ Assessment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
