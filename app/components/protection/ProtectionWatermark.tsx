"use client";

import React from "react";
import { protectionConfig } from "./protectionConfig";

export function ProtectionWatermark() {
  if (!protectionConfig.watermarkEnabled) return null;

  // Generate a pattern of watermarks across the screen
  const watermarks = Array.from({ length: 40 });

  return (
    <div
      className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden select-none"
      style={{ opacity: protectionConfig.watermarkOpacity }}
    >
      <div 
        className="w-[200vw] h-[200vw] absolute -top-[50vw] -left-[50vw] flex flex-wrap items-center justify-center"
        style={{ transform: `rotate(${protectionConfig.watermarkRotation}deg)` }}
      >
        {watermarks.map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-center w-1/5 h-[15%] text-slate-400 font-bold tracking-widest"
            style={{
              fontSize: protectionConfig.watermarkFontSize,
              textShadow: "1px 1px 2px rgba(255,255,255,0.1)",
            }}
          >
            {protectionConfig.watermarkText}
          </div>
        ))}
      </div>
    </div>
  );
}
