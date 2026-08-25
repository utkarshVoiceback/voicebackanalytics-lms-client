"use client";

import React from "react";

interface ScreenshotOverlayProps {
  visible: boolean;
}

export function ScreenshotOverlay({ visible }: ScreenshotOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black text-white"
      style={{
        pointerEvents: "auto",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <svg
        className="h-24 w-24 text-red-500 mb-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
      <h1 className="text-4xl font-bold mb-4 text-center">Screenshot Not Allowed</h1>
      <p className="text-xl text-slate-300 text-center max-w-lg px-4">
        Capturing protected learning content is not allowed on this platform.
      </p>
    </div>
  );
}
