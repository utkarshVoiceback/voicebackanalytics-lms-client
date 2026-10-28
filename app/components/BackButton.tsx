"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  /** Route used when there is no browser history to go back to (e.g. page opened directly). */
  fallback: string;
  variant?: "link" | "primary" | "icon";
  className?: string;
}

const VARIANT_CLASSES: Record<NonNullable<BackButtonProps["variant"]>, string> = {
  link: "text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors inline-block",
  primary:
    "inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors",
  icon: "w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
};

export default function BackButton({ fallback, variant = "link", className }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back"
      className={className ?? VARIANT_CLASSES[variant]}
    >
      {variant === "icon" ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      ) : (
        <>&larr; Back</>
      )}
    </button>
  );
}
