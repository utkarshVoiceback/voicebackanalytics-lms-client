"use client";

import { useEffect, useState, useCallback } from "react";
import { protectionConfig } from "./protectionConfig";

export function useContentProtection(isActive: boolean) {
  const [showOverlay, setShowOverlay] = useState(false);

  const triggerOverlay = useCallback(() => {
    setShowOverlay(true);
    setTimeout(() => {
      setShowOverlay(false);
    }, protectionConfig.blackOverlayDurationMs);
  }, []);

  useEffect(() => {
    if (!isActive || !protectionConfig.enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Print Screen
      if (e.key === "PrintScreen") {
        if (protectionConfig.screenshotProtectionEnabled) {
          triggerOverlay();
        }
      }

      // Ctrl + P (Print)
      if (e.ctrlKey && e.key.toLowerCase() === "p") {
        if (protectionConfig.printProtectionEnabled) {
          e.preventDefault();
          triggerOverlay();
        }
      }

      // Ctrl + S (Save)
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
      }

      // Ctrl + Shift + S (Save As)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        triggerOverlay();
      }

      // Ctrl + C, Ctrl + X (Copy/Cut)
      if (e.ctrlKey && (e.key.toLowerCase() === "c" || e.key.toLowerCase() === "x")) {
        if (protectionConfig.copyProtectionEnabled) {
          // Allow copy if focused inside an input/textarea
          const target = e.target as HTMLElement;
          if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
            e.preventDefault();
          }
        }
      }

      // DevTools Shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C)
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === "i" || e.key.toLowerCase() === "j" || e.key.toLowerCase() === "c"))
      ) {
        // Just deter, don't crash
      }
    };

    // On Windows, Chrome/Edge often don't fire "keydown" for PrintScreen at all —
    // only "keyup" reliably fires. Listen on both so the overlay actually triggers.
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" && protectionConfig.screenshotProtectionEnabled) {
        triggerOverlay();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (protectionConfig.copyProtectionEnabled) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
        }
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (protectionConfig.copyProtectionEnabled) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
        }
      }
    };
    
    const handleDragStart = (e: DragEvent) => {
      if (protectionConfig.copyProtectionEnabled) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("copy", handleCopy);
    window.addEventListener("cut", handleCopy);
    window.addEventListener("dragstart", handleDragStart);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("cut", handleCopy);
      window.removeEventListener("dragstart", handleDragStart);
    };
  }, [isActive, triggerOverlay]);

  return { showOverlay };
}
