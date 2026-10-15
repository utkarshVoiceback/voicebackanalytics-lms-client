"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store";

// Points the tab icon at the uploaded custom logo.
// Existing <link rel="icon"> nodes are only updated in place, never removed:
// Next.js owns them and removing them breaks its own DOM cleanup on navigation
// ("Cannot read properties of null (reading 'removeChild')").
export default function DynamicFavicon() {
  const { useCustomLogo, customLogoUrl } = useAppSelector((state) => state.appConfig);
  const pathname = usePathname();

  useEffect(() => {
    if (!useCustomLogo || !customLogoUrl) return;

    const links = document.head.querySelectorAll<HTMLLinkElement>("link[rel~='icon']");
    if (links.length > 0) {
      links.forEach((el) => {
        if (el.href !== customLogoUrl) el.href = customLogoUrl;
      });
      return;
    }

    const link = document.createElement("link");
    link.rel = "icon";
    link.href = customLogoUrl;
    document.head.appendChild(link);
  }, [useCustomLogo, customLogoUrl, pathname]);

  return null;
}
