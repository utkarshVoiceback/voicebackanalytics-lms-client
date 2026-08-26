"use client";

import React from "react";
import { protectionConfig } from "./protectionConfig";

export function ProtectionWatermark() {
  if (!protectionConfig.watermarkEnabled) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden select-none flex items-center justify-center"
      aria-hidden="true"
    >
      <div
        style={{
          opacity: protectionConfig.watermarkOpacity,
          transform: `rotate(${protectionConfig.watermarkRotation}deg)`,
          userSelect: "none",
          textTransform: "uppercase",
          letterSpacing: "0.25em",
          fontWeight: 900,
          fontFamily: "Arial, sans-serif",
          color: "#94a3b8",
          textShadow: "1px 1px 3px rgba(255,255,255,0.08)",
          fontSize: "clamp(3rem, 10vw, 8rem)",
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}
      >
        {protectionConfig.watermarkText}
      </div>
    </div>
  );
}
