interface SidebarSectionProps {
  label: string;
  collapsed?: boolean;
  children: React.ReactNode;
}

export default function SidebarSection({ label, collapsed = false, children }: SidebarSectionProps) {
  return (
    <div className="mb-1">
      {!collapsed && (
        <p className="px-3 mb-1.5 mt-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 select-none">
          {label}
        </p>
      )}
      {collapsed && (
        <div className="my-3 mx-3 h-px bg-slate-800" />
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
