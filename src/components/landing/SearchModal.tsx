"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Search, X, Play, Loader2, Flame, Clapperboard } from "lucide-react";
import { api } from "@/lib/api";
import type { PublicVideoCard } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/api";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the real video id when a result is selected (opens watch path). */
  onSelectResult: (videoId: string) => void;
}

// Small debounce so we hit /feed/search only after the viewer pauses typing.
function debounce<T extends unknown[]>(fn: (...args: T) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const wrapped = (...args: T) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  wrapped.cancel = () => {
    if (timer) clearTimeout(timer);
  };
  return wrapped;
}

const timeAgo = (iso?: string | null): string => {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return new Date(iso).toLocaleDateString();
};

const hubInitial = (name?: string | null): string => {
  return (name?.trim()?.[0] ?? "E").toUpperCase();
};

/**
 * Real search modal — queries the public /feed/search endpoint over video titles
 * and Hub names. No mock CONTENT_LIBRARY / MovieItem filtering. Selecting a
 * result opens the real player for that video.
 */
export function SearchModal({ isOpen, onClose, onSelectResult }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicVideoCard[]>([]);
  const [trending, setTrending] = useState<PublicVideoCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // All hooks must run unconditionally on every render (React Rules of Hooks):
  // never early-return a hook order underneath a conditional gap. Guard behavior
  // inside the effect instead.
  useEffect(() => {
    if (!isOpen) return;

    // Populate the "Trending on EVO" backdrop from the real trending feed once open.
    let cancelled = false;
    setResults([]);
    setSearched(false);
    api
      .getFeedTrending({ page: 1, pageSize: 8 })
      .then((res) => {
        if (!cancelled) setTrending(res.items);
      })
      .catch(() => {
        if (!cancelled) setTrending([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const runSearch = debounce((q: string) => {
    const trimmed = q.trim();
    setLoading(false);
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    api
      .searchVideos({ page: 1, pageSize: 20, q: trimmed })
      .then((res) => {
        setResults(res.items);
        setSearched(true);
      })
      .catch(() => {
        setResults([]);
        setSearched(true);
      })
      .finally(() => setLoading(false));
  }, 250);

  const handleChange = (value: string) => {
    setQuery(value);
    runSearch(value);
  };

  const display = query.trim() ? results : trending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/55 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Search videos"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-3xl sm:rounded-[28px] overflow-hidden flex flex-col ring-1 ring-black/5 shadow-[0_24px_70px_-12px_rgba(0,0,0,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Prominent pill search field */}
            <div className="relative flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search videos or Hubs..."
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                autoFocus
                aria-label="Search videos or Hubs"
                className="w-full min-w-0 h-[52px] pl-11 pr-4 rounded-full bg-gray-100/80 border border-gray-200 text-gray-900 placeholder-gray-400 text-base sm:text-lg font-medium focus:outline-hidden focus:border-evo-red focus:ring-2 focus:ring-evo-red/25 focus:bg-white transition-colors"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => handleChange("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-evo-red px-2.5 py-1 rounded-full hover:bg-gray-200/70 shrink-0"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Separate circular close button to the right of the search bar */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gray-100/80 border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 hover:border-gray-300 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Header + Results */}
        <div className="flex flex-col max-h-[60vh] overflow-y-auto">
          {/* TRENDING ON EVO header */}
          <div className="px-5 sm:px-6 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {query.trim() ? null : (
                <Flame className="w-4 h-4 text-evo-red fill-evo-red/20 shrink-0" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                {query.trim()
                  ? loading
                    ? "Searching"
                    : `Results (${results.length})`
                  : "Trending on EVO"}
              </span>
            </div>
            {query.trim() && !loading && (
              <span className="text-xs text-gray-400 lowercase">
                {results.length} result{results.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <div className="px-4 sm:px-5 pb-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-gray-500">
                <Loader2 className="w-6 h-6 text-evo-red animate-spin" />
                <span>Searching EVO...</span>
              </div>
            ) : display.length === 0 ? (
              query.trim() ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
                  <div className="w-14 h-14 rounded-full bg-evo-red/10 flex items-center justify-center mb-1">
                    <Search className="w-6 h-6 text-evo-red" />
                  </div>
                  <p className="text-base font-bold text-gray-900">
                    No videos match "{query.trim()}"
                  </p>
                  <p className="text-sm text-gray-500">
                    Try a different search or Hub name.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
                  <div className="w-14 h-14 rounded-full bg-evo-red/10 flex items-center justify-center mb-1">
                    <Clapperboard className="w-6 h-6 text-evo-red" />
                  </div>
                  <p className="text-base font-bold text-gray-900">
                    No trending content yet.
                  </p>
                  <p className="text-sm text-gray-500 max-w-xs">
                    Check back later to see what&apos;s trending on EVO.
                  </p>
                </div>
              )
            ) : (
              <ul className="divide-y divide-gray-100">
                {display.map((video) => {
                  const hubName = video.channel?.name || "EVO";
                  const published = video.publishedAt ? timeAgo(video.publishedAt) : "";
                  return (
                    <li key={video.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectResult(video.id);
                          onClose();
                        }}
                        className="w-full text-left flex items-center gap-3 sm:gap-4 px-2 sm:px-3 py-3 sm:py-3.5 rounded-2xl group hover:bg-gray-50 transition-colors"
                      >
                        {/* Landscape thumbnail */}
                        <div className="relative w-24 h-14 sm:w-32 sm:h-[72px] rounded-xl overflow-hidden bg-gray-900 shrink-0">
                          {resolveMediaUrl(video.posterUrl) ? (
                            <Image
                              src={resolveMediaUrl(video.posterUrl)}
                              alt={video.title}
                              fill
                              sizes="(min-width: 768px) 128px, 96px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                              <span className="text-lg sm:text-xl font-extrabold text-gray-500">
                                {(video.title?.[0] ?? "E").toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-evo-red transition-colors truncate">
                            {video.title}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 truncate">
                            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-evo-red to-orange-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                              {hubInitial(hubName)}
                            </span>
                            <span className="truncate">{hubName}</span>
                            {published && (
                              <>
                                <span className="shrink-0">·</span>
                                <span className="shrink-0">{published}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Subtle play affordance */}
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-evo-red/10 text-evo-red flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Play className="w-4 h-4 fill-evo-red ml-0.5" />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}