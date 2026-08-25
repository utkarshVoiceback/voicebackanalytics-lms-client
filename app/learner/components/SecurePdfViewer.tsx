"use client";

import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { apiFetchBlob } from "@/lib/api";
import * as pdfjsLib from "pdfjs-dist";
import styles from "./SecurePdfViewer.module.css";

interface SecurePdfViewerProps {
  contentId: string;
  title?: string;
}

export default function SecurePdfViewer({ contentId, title }: SecurePdfViewerProps) {
  const user = useSelector((state: RootState) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [isBlurred, setIsBlurred] = useState(false);
  const [isDevtoolsOpen, setIsDevtoolsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<any>(null);
  const pdfUrlRef = useRef<string>("");

  // Initialize PDF.js worker
  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }, []);

  // Fetch and load PDF
  useEffect(() => {
    const loadPdf = async () => {
      setLoading(true);
      setError(null);

      const { blob, error: fetchError } = await apiFetchBlob(
        `/modules/content/${contentId}/file?proxy=true`
      );

      if (fetchError || !blob) {
        setError(fetchError || "Failed to load PDF");
        setLoading(false);
        return;
      }

      const url = URL.createObjectURL(blob);
      pdfUrlRef.current = url;

      try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to load PDF");
        setLoading(false);
        URL.revokeObjectURL(url);
      }
    };

    loadPdf();

    return () => {
      if (pdfRef.current) {
        pdfRef.current.destroy();
        pdfRef.current = null;
      }
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = "";
      }
    };
  }, [contentId]);

  // Render current page to canvas
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfRef.current || !canvasRef.current) return;

      try {
        const page = await pdfRef.current.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext("2d");
        if (!context) return;

        await page.render({ canvasContext: context, viewport }).promise;
      } catch (err) {
        console.error("Error rendering page:", err);
      }
    };

    renderPage();
  }, [currentPage, scale, pdfRef]);

  // Deterrents: prevent right-click, copying, printing, devtools
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+P (print), Ctrl+S (save), F12 (devtools), Ctrl+Shift+I (inspect), Ctrl+Shift+J (console), Ctrl+U (view source)
      if (
        (e.ctrlKey && (e.key === "p" || e.key === "s")) ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault();
      }
    };

    container.addEventListener("contextmenu", handleContextMenu);
    container.addEventListener("copy", handleCopy);
    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("contextmenu", handleContextMenu);
      container.removeEventListener("copy", handleCopy);
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Blur on visibility change / focus loss
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsBlurred(document.hidden);
    };

    const handleBlur = () => {
      setIsBlurred(true);
    };

    const handleFocus = () => {
      setIsBlurred(false);
      setIsDevtoolsOpen(false);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Devtools detection heuristic (soft warning, not hard block)
  useEffect(() => {
    let checkCount = 0;

    const checkDevtools = () => {
      const threshold = 150;
      if (window.outerWidth - window.innerWidth > threshold) {
        setIsDevtoolsOpen(true);
      } else {
        setIsDevtoolsOpen(false);
      }
    };

    const interval = setInterval(() => {
      checkCount++;
      checkDevtools();
      // Stop checking after 10 seconds (60 checks * 166ms)
      if (checkCount > 60) clearInterval(interval);
    }, 166);

    return () => clearInterval(interval);
  }, []);

  // Format timestamp for watermark
  const now = new Date();
  const timestamp = now.toLocaleString("en-IN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const watermarkText = `${user?.fullName || "User"} · ${user?.email || "email@example.com"} · ${timestamp}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-slate-900 rounded-lg border border-slate-700">
        <div className="text-slate-300">Loading PDF...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-lg">
        <p className="text-red-300 font-semibold">Error loading PDF</p>
        <p className="text-red-200 text-sm mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.securePdfContainer}`}
      style={{
        userSelect: "none",
      }}
      onKeyDown={(e) => {
        // Prevent keyboard interaction outside of keydown listeners
      }}
    >
      {/* Blur overlay for visibility/focus loss */}
      {isBlurred && (
        <div className={styles.blurOverlay}>
          <div className={styles.blurMessage}>
            {document.hidden
              ? "📄 Content hidden — click to resume"
              : "👁️ Window not in focus — click to resume"}
          </div>
        </div>
      )}

      {/* Devtools warning overlay */}
      {isDevtoolsOpen && !isBlurred && (
        <div className={styles.devtoolsWarning}>
          <div className={styles.warningMessage}>
            🔒 Developer tools detected — please close them to continue viewing
          </div>
        </div>
      )}

      {/* Title */}
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
          <p className="text-xs text-slate-400 mt-1">
            ⚠️ This document is confidential. Screenshots and unauthorized sharing are prohibited.
          </p>
        </div>
      )}

      {/* Controls */}
      <div className={`${styles.controls}`}>
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className={styles.controlButton}
          title="Previous page"
        >
          ← Prev
        </button>

        <div className={styles.pageInfo}>
          Page{" "}
          <input
            type="number"
            min="1"
            max={numPages}
            value={currentPage}
            onChange={(e) => {
              const page = Math.min(Math.max(1, parseInt(e.target.value) || 1), numPages);
              setCurrentPage(page);
            }}
            className={styles.pageInput}
          />{" "}
          of {numPages}
        </div>

        <button
          onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
          disabled={currentPage >= numPages}
          className={styles.controlButton}
          title="Next page"
        >
          Next →
        </button>

        <div className={styles.zoomControls}>
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.2))}
            className={styles.controlButton}
            title="Zoom out"
          >
            −
          </button>
          <span className={styles.zoomLevel}>{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(Math.min(3, scale + 0.2))}
            className={styles.controlButton}
            title="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      {/* Canvas with watermark */}
      <div className={`${styles.canvasContainer} ${isBlurred ? styles.blurred : ""}`}>
        <canvas
          ref={canvasRef}
          className={styles.pdfCanvas}
          style={{
            filter: isBlurred || isDevtoolsOpen ? "blur(20px)" : "none",
          }}
        />

        {/* Watermark overlay */}
        <div className={styles.watermark} style={{ opacity: isBlurred ? 0.5 : 0.15 }}>
          {/* Generate repeating watermark text diagonally */}
          <svg
            className={styles.watermarkSvg}
            width="400"
            height="400"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="watermark" x="0" y="0" width="400" height="200" patternUnits="userSpaceOnUse">
                <text
                  x="0"
                  y="100"
                  fontSize="14"
                  fontFamily="Arial, sans-serif"
                  fill="currentColor"
                  transform="rotate(-30)"
                  textAnchor="start"
                >
                  {watermarkText}
                </text>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#watermark)" />
          </svg>
        </div>
      </div>
    </div>
  );
}
