"use client";

import React from "react";
import { CheckCircle2, X } from "lucide-react";

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

/**
 * Global transient feedback toast. Reuses the established EVO toast styling used
 * across admin/creator pages (dark rounded pill, bottom-right). Rendered once in
 * the root layout so it works across client-side redirects (Viewer -> / , Creator
 * -> /creator, Admin -> /admin).
 */
export function Toast({ message, onClose }: ToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-1 p-0.5 text-gray-400 hover:text-white transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}