import Sidebar from "@/app/components/layout/Sidebar";
import ContentProtection from "@/app/components/protection/ContentProtection";
import RequireAuth from "@/app/components/auth/RequireAuth";

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 gap-6">
      <Sidebar role="LEARNER" />
      <main className="flex-1 min-w-0 overflow-y-auto pr-6 py-6">
        <RequireAuth allowedRoles={["LEARNER"]}>
          <ContentProtection>
            {children}
          </ContentProtection>
        </RequireAuth>
      </main>
    </div>
  );
}
