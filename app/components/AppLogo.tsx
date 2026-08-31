"use client";
import { useAppSelector } from "@/store";

interface AppLogoProps {
  className?: string;
}

export default function AppLogo({ className = "h-8" }: AppLogoProps) {
  const { useCustomLogo, customLogoUrl } = useAppSelector((state) => state.appConfig);

  if (useCustomLogo && customLogoUrl) {
    return <img src={customLogoUrl} alt="Logo" className={className + " object-contain"} />;
  }

  return <div className="text-2xl font-bold text-slate-900 dark:text-white">Skilvo</div>;
}
