"use client";

import { useEffect, useRef } from "react";
import { renderAsync } from "docx-preview";

interface ResumeViewModalProps {
  isOpen: boolean;
  fileUrl: string | null;
  fileType: string;
  fileName: string;
  onClose: () => void;
  onDownload: () => void;
  blob?: Blob | null;
}

export default function ResumeViewModal({
  isOpen,
  fileUrl,
  fileType,
  fileName,
  onClose,
  onDownload,
  blob,
}: ResumeViewModalProps) {
  const docContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      if (isOpen) {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      }
    };
  }, [isOpen, onClose]);

  // Render Word documents using docx-preview
  useEffect(() => {
    if (!isOpen || !blob || !docContainerRef.current) return;

    const isWord =
      fileType === "application/msword" ||
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!isWord) return;

    const renderDoc = async () => {
      try {
        docContainerRef.current!.innerHTML = "";
        await renderAsync(blob, docContainerRef.current!);
      } catch (err) {
        console.error("Error rendering Word document:", err);
        if (docContainerRef.current) {
          docContainerRef.current.innerHTML =
            "<p style='color: red; padding: 20px;'>Error rendering document. Please download to view.</p>";
        }
      }
    };

    renderDoc();
  }, [isOpen, blob, fileType]);

  if (!isOpen || !fileUrl) return null;

  const isPdf = fileType === "application/pdf";
  const isWord =
    fileType === "application/msword" ||
    fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
              {fileName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            title="Close (Esc)"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-800">
          {isPdf ? (
            <iframe
              src={fileUrl}
              className="w-full h-full border-none"
              title={fileName}
            />
          ) : isWord ? (
            <div
              ref={docContainerRef}
              className="w-full h-full p-6 overflow-auto"
              style={{
                background: "white",
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <svg
                className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .984.718 1.755 1.5 1.755h2.25c.75 0 1.5-.771 1.5-1.755a.75.75 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 0 0 2.25 2.25h.75m0-3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
                />
              </svg>
              <p className="text-slate-600 dark:text-slate-300 font-medium mb-2">
                Preview not available
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                This file type cannot be previewed in the browser. Download the file to view it.
              </p>
              <button
                onClick={onDownload}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                Download Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
