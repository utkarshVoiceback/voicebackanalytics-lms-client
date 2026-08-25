"use client";

import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useContentProtection } from "./useContentProtection";
import { ScreenshotOverlay } from "./ScreenshotOverlay";
import { ProtectionWatermark } from "./ProtectionWatermark";
import { protectionConfig } from "./protectionConfig";

interface ContentProtectionProps {
  children: React.ReactNode;
}

export default function ContentProtection({ children }: ContentProtectionProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Only activate protection for learners
  const isLearner = user?.role === "LEARNER";
  
  const { showOverlay } = useContentProtection(isLearner);

  // Print protection styles
  useEffect(() => {
    if (isLearner && protectionConfig.printProtectionEnabled) {
      const style = document.createElement("style");
      style.id = "print-protection-style";
      style.innerHTML = `
        @media print {
          body * {
            visibility: hidden !important;
          }
          body::after {
            content: "Printing is disabled for protected learning content.";
            visibility: visible !important;
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            font-size: 24px;
            padding: 20px;
          }
        }
      `;
      document.head.appendChild(style);
      return () => {
        const el = document.getElementById("print-protection-style");
        if (el) document.head.removeChild(el);
      };
    }
  }, [isLearner]);

  if (!isLearner) {
    return <>{children}</>;
  }

  return (
    <>
      <ProtectionWatermark />
      <ScreenshotOverlay visible={showOverlay} />
      
      {/* 
        If the black overlay is active, we can also conditionally hide the children 
        to ensure they cannot be captured by fast screenshot tools.
      */}
      <div style={{ visibility: showOverlay ? "hidden" : "visible", width: "100%", height: "100%" }}>
        {children}
      </div>
    </>
  );
}
