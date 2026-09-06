"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Play, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import type { PublicVideoCard, Category } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/api";
import { CONTENT_LIBRARY } from "@/data/landingData";
import { getDisplayVideos } from "@/lib/demoFeed";

interface ContentLibrarySectionProps {
  /** Called with the real video id when a card is selected (opens the watch path). */
  onSelectVideo: (videoId: string) => void;
  onBrowseAll: () => void;
}

const PAGE_SIZE = 12;

const durationLabel = (s?: number | null): string => {
  if (!s || s <= 0) return "";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

/**
 * Content Library — real, backend-driven discovery grid (no mock CONTENT_LIBRARY
 * / MovieItem data). Fetches READY + PUBLISHED videos from the public feed and
 * lets viewers open the real player for the selected video.
 *
 * Demo-safe: when the real feed yields fewer than 4 usable videos (API down,
 * empty store, partial results), the grid is padded with static, non-navigating
 * demo cards so the section never renders empty/broken on a Vercel-hosted demo.
 */
export function ContentLibrarySection({
  onSelectVideo,
  onBrowseAll,
}: ContentLibrarySectionProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [titles, setTitles] = useState<PublicVideoCard[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .listCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        // Categories optional; feed still works.
      });

    const refresh = (resolve: () => Promise<{ items: PublicVideoCard[] }>) => {
      setLoading(true);
      resolve()
        .then((res) => {
          if (!cancelled) {
            setTitles(res.items);
            setLoaded(true);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setLoaded(true);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    refresh(() => api.getFeedLatest({ page: 1, pageSize: PAGE_SIZE }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-filter the already-fetched latest page by the selected real category.
  useEffect(() => {
    if (!loaded) return;
    if (!selectedCategory) return;
    let cancelled = false;
    api
      .getFeedLatest({ page: 1, pageSize: PAGE_SIZE, category: selectedCategory })
      .then((res) => {
        if (!cancelled) setTitles(res.items);
      })
      .catch(() => {
        if (!cancelled) setTitles([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, loaded]);

  const pills = selectedCategory
    ? categories.filter((c) => c.slug === selectedCategory)
    : categories;

  // Real usable videos, padded with static demo cards when fewer than 4 show.
  const displayVideos = getDisplayVideos(titles);

  return (
    <section id="content-library" className="py-6 md:py-8 lg:py-12 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="w-6 h-0.5 bg-evo-red" />
              <span className="text-xs font-bold uppercase tracking-widest text-evo-red">
                {CONTENT_LIBRARY.tag}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-950 tracking-tight leading-[1.15]">
              {CONTENT_LIBRARY.titleLine1} <br />
              <span className="text-evo-red">{CONTENT_LIBRARY.titleHighlight}</span>
            </h2>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-400 font-medium">
              {CONTENT_LIBRARY.footerNote}
            </p>
          </div>

          <button
            onClick={onBrowseAll}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-gray-300 text-sm font-semibold text-gray-800 hover:border-gray-900 hover:bg-gray-50 transition-all self-start sm:self-end"
          >
            <span>{CONTENT_LIBRARY.cta}</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Category Pills Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar -mx-4 sm:mx-6 lg:mx-8 px-4 sm:px-6 lg:px-8">
          {pills.map((category) => {
            const isActive = selectedCategory === category.slug;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(isActive ? "" : category.slug)}
                aria-pressed={isActive}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-evo-red text-white shadow-evo-button"
                    : "bg-gray-100/90 text-gray-700 hover:bg-gray-200/90"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        {/* Content: loading skeleton, then the always-visible card grid */}
        {loading && titles.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden bg-gray-100 animate-pulse"
                style={{ aspectRatio: "16/9" }}
              />
            ))}
          </div>
        ) : (
          <div
            className={
              displayVideos.length <= 4
                ? "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
                : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4"
            }
          >
            {displayVideos.map((video) => (
              <div
                key={video.key}
                onClick={
                  video.isFallback ? undefined : () => onSelectVideo(video.id!)
                }
                aria-hidden={video.isFallback}
                className="group relative rounded-2xl overflow-hidden cursor-pointer bg-gray-900 border border-gray-800/60 shadow-lg transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-evo-red/50"
              >
                {/* Aspect 16:9 thumbnail frame */}
                <div className="relative aspect-video w-full overflow-hidden">
                  {video.isFallback ? (
                    <img
                      src={video.posterUrl ?? ""}
                      alt=""
                      draggable={false}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : resolveMediaUrl(video.posterUrl) ? (
                    <Image
                      src={resolveMediaUrl(video.posterUrl)}
                      alt={video.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <span className="text-2xl sm:text-3xl font-extrabold text-gray-700">
                        {(video.title?.[0] ?? "E").toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Category badge (real videos only) */}
                  {!video.isFallback && video.categoryName && (
                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider text-white border border-white/10">
                      {video.categoryName}
                    </div>
                  )}

                  {/* Hover Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-evo-red/90 text-white flex items-center justify-center shadow-lg shadow-evo-red/50 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom Gradient overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

                  {/* Card Title, hub & duration */}
                  <div className="absolute bottom-2 left-2 right-2 z-10">
                    <h4 className="text-xs sm:text-sm font-bold text-white leading-tight truncate drop-shadow-sm group-hover:text-evo-red transition-colors">
                      {video.title}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-gray-300 mt-1">
                      <span className="truncate min-w-0 flex-1">
                        {video.hubName}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium shrink-0">
                        {durationLabel(video.durationSeconds)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}