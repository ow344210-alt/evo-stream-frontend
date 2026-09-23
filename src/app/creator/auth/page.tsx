"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect shim. The Creator Studio no longer has its own login/signup UI — it
 * delegates to the single central authentication flow on the landing page, and
 * the backend role (from the JWT/session) decides the destination afterwards.
 *
 * The route is kept so backend emails (e.g. password-reset links pointing to
 * /creator/auth?mode=reset&token=...) continue to work and resolve into the
 * same central flow.
 */
export default function CreatorAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const mode = params.get("mode");
    const next = new URLSearchParams();
    next.set("auth", token ? "reset" : mode === "reset" ? "forgot" : "signin");
    if (token) next.set("token", token);
    router.replace(`/?${next.toString()}`);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
      <div className="text-sm text-gray-500">Redirecting to EVO sign in…</div>
    </div>
  );
}