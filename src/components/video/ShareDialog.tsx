"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Twitter,
  Facebook,
  Linkedin,
  MessageSquare,
  MessageCircle,
  Mail,
} from "lucide-react";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  /** Video title used in share payloads. */
  title: string;
  /** Canonical /watch/<id> URL (without query parameters). */
  url: string;
  /** Current playhead seconds; enables the optional "Start at current time". */
  currentTime?: number;
  /** Called ONLY on an actual share action (copy success or destination click). */
  onShared?: () => void;
}

const enc = (s: string) => encodeURIComponent(s);

interface Destination {
  name: string;
  Icon: typeof Twitter;
  href: (u: string, t: string) => string;
}

const destinations: Destination[] = [
  {
    name: "X (Twitter)",
    Icon: Twitter,
    href: (u, t) => `https://twitter.com/intent/tweet?url=${enc(u)}&text=${enc(t)}`,
  },
  {
    name: "Facebook",
    Icon: Facebook,
    href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${enc(u)}`,
  },
  {
    name: "LinkedIn",
    Icon: Linkedin,
    href: (u, t) =>
      `https://www.linkedin.com/shareArticle?mini=true&url=${enc(u)}&title=${enc(t)}`,
  },
  {
    name: "Reddit",
    Icon: MessageSquare,
    href: (u, t) => `https://www.reddit.com/submit?url=${enc(u)}&title=${enc(t)}`,
  },
  {
    name: "WhatsApp",
    Icon: MessageCircle,
    href: (u, t) => `https://api.whatsapp.com/send?text=${enc(`${t} ${u}`)}`,
  },
  {
    name: "Email",
    Icon: Mail,
    href: (u, t) => `mailto:?subject=${enc(t)}&body=${enc(u)}`,
  },
];

/**
 * EVO in-app share dialog. Never blocks on the network: it opens immediately
 * from local state. The share count is recorded only when the viewer actually
 * shares (copy succeeds or a destination is opened) — opening the dialog alone
 * never counts. Includes a horizontally scrollable destination carousel with
 * boundary-aware prev/next controls, a raw-link copy affordance with "Copied"
 * feedback, and an optional "Start at current time" toggle that appends `?t=`.
 */
export function ShareDialog({
  open,
  onClose,
  title,
  url,
  currentTime,
  onShared,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [includeTime, setIncludeTime] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const effectiveUrl =
    includeTime && currentTime != null && Number.isFinite(currentTime)
      ? `${url}?t=${Math.floor(currentTime)}`
      : url;

  // Reset transient state each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setCopied(false);
    setCopyError(null);
    setIncludeTime(false);
  }, [open]);

  // Modal behaviors: focus management, Escape, backdrop, body scroll lock.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  const updateCarousel = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    // jsdom reports no layout; treat an unmeasured strip as non-scrollable so
    // the boundary state stays deterministic under test.
    if (!el.clientWidth) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    setCanPrev(el.scrollLeft > 2);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = stripRef.current;
    if (!el) return;
    updateCarousel();
    el.addEventListener("scroll", updateCarousel, { passive: true });
    window.addEventListener("resize", updateCarousel);
    return () => {
      el.removeEventListener("scroll", updateCarousel);
      window.removeEventListener("resize", updateCarousel);
    };
  }, [open, updateCarousel]);

  const scrollStrip = useCallback((dir: number) => {
    const el = stripRef.current;
    if (!el || typeof el.scrollBy !== "function") return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }, []);

  const handleCopy = useCallback(async () => {
    const urlToCopy = effectiveUrl;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(urlToCopy);
      } else {
        const ta = document.createElement("textarea");
        ta.value = urlToCopy;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setCopyError(null);
      onShared?.();
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError("Copy failed. Please select the link and copy it manually.");
    }
  }, [effectiveUrl, onShared]);

  const handleDestination = useCallback(() => {
    onShared?.();
  }, [onShared]);

  if (!open) return null;

  return (
    <div
      data-testid="share-backdrop"
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-5 shadow-2xl outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="share-dialog-title"
              className="text-lg font-extrabold tracking-tight text-gray-950"
            >
              Share this video
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Send a link to anyone, anywhere.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div
            ref={stripRef}
            data-testid="share-strip"
            className="flex gap-2 overflow-x-auto no-scrollbar flex-1"
          >
            {destinations.map((d) => {
              const Icon = d.Icon;
              return (
                <a
                  key={d.name}
                  href={d.href(effectiveUrl, title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleDestination}
                  className="flex flex-col items-center gap-1.5 shrink-0 w-16"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-900 hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-[11px] font-medium text-gray-500">
                    {d.name}
                  </span>
                </a>
              );
            })}
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              aria-label="Previous share options"
              disabled={!canPrev}
              onClick={() => scrollStrip(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Next share options"
              disabled={!canNext}
              onClick={() => scrollStrip(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={effectiveUrl}
              aria-label="Share URL"
              onFocus={(e) => e.target.select()}
              className="flex-1 min-w-0 bg-transparent text-xs text-gray-700 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          {copyError && <p className="mt-2 text-xs text-red-600">{copyError}</p>}
          <label className="mt-2.5 flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={includeTime}
              onChange={(e) => setIncludeTime(e.target.checked)}
              className="accent-evo-red"
            />
            Start at current time
          </label>
        </div>
      </div>
    </div>
  );
}