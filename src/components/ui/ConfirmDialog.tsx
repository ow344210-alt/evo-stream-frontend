"use client";

import React from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Lightweight EVO-styled confirmation dialog for destructive/confirm actions.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-extrabold text-gray-950 tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>

        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-bold text-white bg-evo-red hover:bg-evo-red-hover rounded-xl shadow-evo-button transition-all disabled:opacity-60"
          >
            {loading ? "Logging out…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}