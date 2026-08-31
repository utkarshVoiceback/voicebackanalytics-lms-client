"use client";

import { useEffect, useState } from "react";
import { apiFetch, getSecureFileUrl } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import SecurePdfViewer from "@/app/learner/components/SecurePdfViewer";

export default function InstructorModuleDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [moduleData, setModuleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModuleData = async () => {
      try {
        const res = await apiFetch(`/instructor-panel/modules/${id}`);
        if (!res.success) { setError(res.message || "Access denied"); return; }
        setModuleData(res.data);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchModuleData();
  }, [id]);

  const renderContentItem = (content: any, index: number) => {
    const isExternalUrl = (url: string) => url.startsWith("http://") || url.startsWith("https://");

    if (content.contentType === "VIDEO") {
      if (content.contentUrl && isExternalUrl(content.contentUrl)) {
        const embedUrl = content.contentUrl.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/");
        return (
          <div key={content.id} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Video · {content.estimatedMinutes} min</span>
            </div>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-300 dark:border-slate-700">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title={content.title || `Video ${index + 1}`}
              />
            </div>
          </div>
        );
      }
      return (
        <div key={content.id} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Video · {content.estimatedMinutes} min</span>
          </div>
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-300 dark:border-slate-700">
            <video
              src={getSecureFileUrl(content.id)}
              className="w-full h-full"
              controls
              controlsList="nodownload"
              title={content.title || `Video ${index + 1}`}
            />
          </div>
        </div>
      );
    }

    if (content.contentType === "PDF") {
      return (
        <div key={content.id} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9ZM9.75 18.33l-1.396-1.396A.75.75 0 0 1 8.25 17.5v-7.5a.75.75 0 0 1 1.5 0v6.44l1.396-1.396a.75.75 0 0 1 1.06 1.06l-2.651 2.652Z" />
            </svg>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">PDF Document · {content.estimatedMinutes} min</span>
          </div>
          <SecurePdfViewer contentId={content.id} title={content.title || "PDF Document"} />
        </div>
      );
    }

    if (content.contentType === "PRESENTATION" || content.mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
      return (
        <div key={content.id} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
            </svg>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Presentation · {content.estimatedMinutes} min</span>
          </div>
          <a
            href={getSecureFileUrl(content.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-xl border p-4 transition-colors group border-orange-200 bg-orange-50 hover:bg-orange-100 dark:border-orange-500/30 dark:bg-orange-950/20 dark:hover:bg-orange-950/30"
          >
            <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/50">
              <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold transition-colors text-orange-700 group-hover:text-orange-900 dark:text-orange-100 dark:group-hover:text-orange-300">View / Download Presentation</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-sm">{content.title || "Open Document"}</p>
            </div>
          </a>
        </div>
      );
    }

    if (content.contentType === "IMAGE") {
      return (
        <div key={content.id} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Image · {content.estimatedMinutes} min</span>
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getSecureFileUrl(content.id)} alt={content.title || "Image content"} className="w-full h-auto max-h-[70vh] object-contain" />
          </div>
        </div>
      );
    }

    if (content.contentType === "TEXT" && content.textContent) {
      return (
        <div key={content.id} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Reading Material · {content.estimatedMinutes} min</span>
          </div>
          <div className="rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/50 p-6">
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{content.textContent}</p>
          </div>
        </div>
      );
    }

    // Fallback for any future file type
    return (
      <div key={content.id} className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Content · {content.estimatedMinutes} min</span>
        </div>
        <a
          href={getSecureFileUrl(content.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-xl border p-4 transition-colors group border-slate-300 bg-slate-100/50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800"
        >
          <div className="p-3 rounded-lg bg-slate-200 dark:bg-slate-700">
            <svg className="w-8 h-8 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold transition-colors text-slate-700 group-hover:text-slate-900 dark:text-slate-200 dark:group-hover:text-white">Open / Download File</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-sm">{content.title || "Open Document"}</p>
          </div>
        </a>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-8 text-center">
          <p className="text-red-600 dark:text-red-400 font-medium mb-4">{error}</p>
          <button onClick={() => router.push("/instructor/modules")} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
            &larr; Back to My Modules
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/instructor/modules" className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-2 inline-block">
          &larr; Back to My Modules
        </Link>
        <div className="mt-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{moduleData.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Course: {moduleData.course?.title || "—"}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden p-6 md:p-8">
        {moduleData.description && (
          <div className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Module Description</h2>
            <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
              <p>{moduleData.description}</p>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Content Items <span className="text-slate-400 dark:text-slate-500 font-normal text-sm">({moduleData.contents?.length || 0})</span>
          </h2>
          {!moduleData.contents || moduleData.contents.length === 0 ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              No content items added to this module yet.
            </div>
          ) : (
            <div className="space-y-4">
              {moduleData.contents.map((content: any, index: number) => renderContentItem(content, index))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
