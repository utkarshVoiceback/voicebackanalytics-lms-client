"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store";
import Sidebar from "@/app/components/layout/Sidebar";
import type { SidebarRole } from "@/app/components/layout/Sidebar";

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user?.role !== "INSTRUCTOR") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== "INSTRUCTOR") {
    return null;
  }

  const role: SidebarRole = "INSTRUCTOR";

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 gap-6">
      <Sidebar role={role} />
      <main className="flex-1 min-w-0 overflow-y-auto pr-6 py-6">
        {children}
      </main>
    </div>
  );
}
