"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store";

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export default function RequireAuth({ children, allowedRoles, redirectTo = "/" }: RequireAuthProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const isWrongRole = isAuthenticated && !!user && !allowedRoles.includes(user.role);
  const isVerified = isAuthenticated && !!user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    } else if (isWrongRole) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isWrongRole, redirectTo, router]);

  if (!isVerified) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}
