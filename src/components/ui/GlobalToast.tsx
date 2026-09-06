"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { Toast } from "./Toast";

/**
 * Mounted once in the root layout. Renders the auth feedback toast so success
 * messages ("Successfully logged in." / "Successfully logged out.") persist
 * across client-side role redirects (Viewer -> /, Creator -> /creator, Admin ->
 * /admin).
 */
export function GlobalToast() {
  const { feedback, clearFeedback } = useAuth();

  return <Toast message={feedback} onClose={clearFeedback} />;
}