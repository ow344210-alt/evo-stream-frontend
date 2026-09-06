"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin, isCreator } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      // Route to the single central auth flow; it resolves the backend role and
      // sends administrators straight to /admin.
      router.replace("/?auth=signin");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
        <div className="text-sm text-gray-500">Loading EVO Control Hub…</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50/50 px-6 text-center">
        <h1 className="text-xl font-bold text-gray-900">
          Admin Dashboard access required
        </h1>

        <p className="max-w-md text-sm text-gray-500">
          Your account is registered as a{" "}
          {isCreator ? "creator" : "viewer"}. Only administrator accounts can
          access the EVO Control Hub.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}