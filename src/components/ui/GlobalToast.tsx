"use client";

import React, { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "./ToastProvider";

/**
 * Bridges auth feedback (login/logout success, role cross-page redirects)
 * into the single top-center toast system. Mounted once in the root layout
 * inside the ToastProvider.
 */
export function GlobalToast() {
  const { feedback, clearFeedback } = useAuth();
  const { toast } = useToast();
  const lastRef = useRef<string | null>(null);

  useEffect(() => {
    if (!feedback) return;
    if (lastRef.current === feedback) return;
    lastRef.current = feedback;
    toast(feedback);
    clearFeedback();
  }, [feedback, toast, clearFeedback]);

  return null;
}