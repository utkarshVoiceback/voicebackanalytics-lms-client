"use client";
import { useEffect } from "react";
import { useAppSelector } from "@/store";

// Replaces the default tab icon with the uploaded custom logo.
export default function DynamicFavicon() {
  const { useCustomLogo, customLogoUrl } = useAppSelector((state) => state.appConfig);

  useEffect(() => {
    if (!useCustomLogo || !customLogoUrl) return;

    document
      .querySelectorAll("link[rel~='icon'], link[rel='shortcut icon']")
      .forEach((el) => el.remove());

    const link = document.createElement("link");
    link.rel = "icon";
    link.href = customLogoUrl;
    document.head.appendChild(link);
  }, [useCustomLogo, customLogoUrl]);

  return null;
}
