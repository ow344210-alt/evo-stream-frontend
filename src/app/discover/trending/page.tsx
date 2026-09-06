"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { PublicVideoCard } from "@/lib/api";
import { FeedGrid, FeedPageResult } from "@/components/library/FeedGrid";
import { PublicVideoCard as PublicVideoCardView } from "@/components/video/PublicVideoCard";

const PAGE_SIZE = 12;

/**
 * Trending — real backend MVP trending (deterministic engagement + recency
 * score) from /feed/trending. No mock data.
 */
export default function TrendingPage() {
  const router = useRouter();

  const fetchPage = useCallback(
    async (page: number, pageSize: number): Promise<FeedPageResult<PublicVideoCard>> => {
      const res = await api.getFeedTrending({ page, pageSize });
      return {
        items: res.items,
        total: res.total,
        loadedAll: res.total === 0 || res.items.length >= res.total,
      };
    },
    [],
  );

  const handlePlay = useCallback(
    (videoId: string) => router.push(`/?watch=${videoId}`),
    [router],
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950">
          Trending
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          What EVO viewers are engaging with right now.
        </p>
      </div>

      <FeedGrid<PublicVideoCard>
        fetchPage={fetchPage}
        emptyTitle="No trending videos"
        emptyMessage="Trending content will appear here as engagement grows."
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