"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect shim. Admin authentication is handled by the single central login
 * flow (it asks for credentials only and, after the backend resolves the role,
 * sends administrators straight to /admin). This route is kept only so existing
 * bookmarks/links resolve cleanly into that same central flow.
 */
export default function AdminAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?auth=signin");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
      <div className="text-sm text-gray-500">Redirecting to EVO sign in…</div>
    </div>
  );
}