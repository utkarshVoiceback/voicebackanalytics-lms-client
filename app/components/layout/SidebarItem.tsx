"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  collapsed?: boolean;
  exact?: boolean;
}

export default function SidebarItem({
  href,
  label,
  icon,
  collapsed = false,
  exact = false,
}: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
        isActive
          ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
      }`}
    >
      <span
        className={`flex-shrink-0 w-5 h-5 ${
          isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
        }`}
      >
        {icon}
      </span>
      {!collapsed && (
        <span className="truncate">{label}</span>
      )}
      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-500 rounded-r-full" />
      )}
      {/* Tooltip when collapsed */}
      {collapsed && (
        <span className="absolute left-full ml-3 z-50 hidden group-hover:flex items-center whitespace-nowrap rounded-md bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-slate-100 shadow-xl pointer-events-none">
          {label}
        </span>
      )}
    </Link>
  );
}
