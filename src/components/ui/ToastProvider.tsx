"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Toast, ToastType } from "./Toast";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  /** Show a top-center normal notification. Low-level confirmations and
   *  important blocking dialogs use ConfirmDialog (centered), never this. */
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

const AUTO_DISMISS_MS = 3200;

let nextId = 0;

/**
 * The single EVO toast system (mounted once in the root layout). Renders a
 * stacked, top-center list of compact non-blocking notifications. Messages
 * auto-dismiss, never overlap, and stay within viewport width on mobile.
 * All normal page feedback (success/error/info/warning) flows through here so
 * the website never mixes bottom-corner/inline/random alert styles.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, number>>(new Map());

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer != null) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = ++nextId;
      setItems((prev) => [...prev, { id, message, type }]);
      const timer = window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed top-4 left-1/2 z-[80] flex w-full max-w-[calc(100vw-24px)] sm:max-w-md -translate-x-1/2 flex-col items-center gap-2 px-3 sm:px-0"
      >
        {items.map((item) => (
          <Toast
            key={item.id}
            message={item.message}
            type={item.type}
            onClose={() => dismiss(item.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}