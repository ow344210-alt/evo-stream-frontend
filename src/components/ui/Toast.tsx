"use client";

import React from "react";
import { CheckCircle2, X, XCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
} as const;

const ACCENT = {
  success: "text-emerald-500",
  error: "text-evo-red",
  info: "text-sky-500",
  warning: "text-amber-500",
} as const;

const BORDER = {
  success: "border-emerald-200",
  error: "border-red-200",
  info: "border-sky-200",
  warning: "border-amber-200",
} as const;

/**
 * The single EVO non-blocking alert. Always rendered TOP-CENTER (itemized
 * normal notifications never appear bottom-corner, in-page, or center-screen).
 * Compact white card, dark readable text, status icon, safe spacing below the
 * browser edge, responsive max-width, and a dismiss button. Blocking important
 * dialogs are handled separately and remain CENTERED (see ConfirmDialog).
 */
export function Toast({ message, type = "success", onClose }: ToastProps) {
  const Icon = ICONS[type];
  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full items-start gap-2.5 rounded-xl border bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-lg ring-1 ring-black/5 ${BORDER[type]} animate-in fade-in pointer-events-auto`}
    >
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${ACCENT[type]}`} />
      <span className="min-w-0 flex-1 break-words">{message}</span>
      <button
        onClick={onClose}
        className="p-0.5 text-gray-400 hover:text-gray-700 transition-colors shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}