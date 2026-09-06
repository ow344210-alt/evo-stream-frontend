"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function CreatorGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isCreator, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // /creator/auth is a legacy redirect shim into the central auth flow. It must
  // stay reachable while logged out so password-reset email links
  // (/creator/auth?mode=reset&token=...) can forward the token unchanged.
  const isLegacyAuthPath = pathname === "/creator/auth";

  // Logged-out users are sent to the single central auth flow on the landing
  // page; it resolves their backend role and routes them to the right area.
  // Logged-in non-creators get an explicit denial screen below.
  useEffect(() => {
    if (isLoading || isLegacyAuthPath) return;

    if (!user) {
      router.replace("/?auth=signin");
    }
  }, [user, isLoading, router, isLegacyAuthPath]);

  if (isLegacyAuthPath) {
    return <>{children}</>;
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
        <div className="text-sm text-gray-500">Loading Creator Studio...</div>
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50/50 px-6 text-center">
        <h1 className="text-xl font-bold text-gray-900">
          Creator Studio access required
        </h1>

        <p className="max-w-md text-sm text-gray-500">
          Your account is registered as a{" "}
          {isAdmin ? "platform administrator" : "viewer"}. Only Creator accounts
          can use the Creator Studio.
        </p>

        {isAdmin ? (
          <button
            onClick={() => router.push("/admin")}
            className="mt-2 rounded-xl bg-evo-red px-5 py-2.5 text-sm font-bold text-white hover:bg-evo-red-hover"
          >
            Go to Admin Dashboard
          </button>
        ) : (
          <button
            onClick={() => router.replace("/?auth=signup")}
            className="mt-2 rounded-xl bg-evo-red px-5 py-2.5 text-sm font-bold text-white hover:bg-evo-red-hover"
          >
            Create a Creator account
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}