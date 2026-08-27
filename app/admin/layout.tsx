"use client";

import Sidebar from "@/app/components/layout/Sidebar";
import { useAppSelector } from "@/store";
import type { SidebarRole } from "@/app/components/layout/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAppSelector((state) => state.auth);
  const role: SidebarRole = (user?.role === "INSTRUCTOR" ? "INSTRUCTOR" : "ADMIN");

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 gap-6">
      <Sidebar role={role} />
      <main className="flex-1 min-w-0 overflow-y-auto pr-6 py-6">
        {children}
      </main>
    </div>
  );
}
