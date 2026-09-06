"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { PublicVideoCard, Category } from "@/lib/api";
import { FeedGrid, FeedPageResult } from "@/components/library/FeedGrid";
import { PublicVideoCard as PublicVideoCardView } from "@/components/video/PublicVideoCard";

const PAGE_SIZE = 12;

/**
 * Discover / Browse: the primary viewer entry to real, backend-driven content.
 * Renders the latest and trending feeds and category filter pills. Category
 * never rides on the frozen marketing CONTENT_LIBRARY mock — everything here is
 * READY + PUBLISHED from the public feed endpoints.
 */
export default function DiscoverPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"latest" | "trending">("latest");
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    api
      .listCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        // Categories are best-effort; the feed itself still works without them.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchPage = useCallback(
    async (page: number, pageSize: number): Promise<FeedPageResult<PublicVideoCard>> => {
      const query = { page, pageSize, category: activeCategory || undefined };
      const res =
        activeTab === "trending"
          ? await api.getFeedTrending(query)
          : await api.getFeedLatest(query);
      return {
        items: res.items,
        total: res.total,
        loadedAll: res.total === 0 || res.items.length >= res.total,
      };
    },
    [activeTab, activeCategory],
  );

  const handlePlay = useCallback(
    (videoId: string) => router.push(`/?watch=${videoId}`),
    [router],
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950">
          Discover
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Real, published videos from EVO creators.
        </p>
      </div>

      {/* Tabs: Latest / Trending */}
      <div className="flex items-center gap-3 mb-6">
        {(["latest", "trending"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            aria-pressed={activeTab === tab}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all capitalize ${
              activeTab === tab
                ? "bg-evo-red text-white shadow-evo-button"
                : "bg-gray-100/90 text-gray-700 hover:bg-gray-200/90"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Category filter pills (real categories from the backend) */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveCategory("")}
            aria-pressed={activeCategory === ""}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeCategory === ""
                ? "bg-evo-red/10 text-evo-red border border-evo-red/40"
                : "bg-gray-100/90 text-gray-600 hover:bg-gray-200/90 border border-transparent"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategory(c.slug)}
              aria-pressed={activeCategory === c.slug}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === c.slug
                  ? "bg-evo-red/10 text-evo-red border border-evo-red/40"
                  : "bg-gray-100/90 text-gray-600 hover:bg-gray-200/90 border border-transparent"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <FeedGrid<PublicVideoCard>
        fetchPage={fetchPage}
        deps={[activeTab, activeCategory]}
        emptyTitle={
          activeCategory
            ? "No videos in this category yet"
            : activeTab === "trending"
              ? "No trending videos"
              : "No videos published yet"
        }
        emptyMessage="Check back soon for new content."
        renderItem={(video) => (
          <PublicVideoCardView
            key={video.id}
            video={video}
            onPlay={handlePlay}
          />
        )}
      />
    </div>
  );
}