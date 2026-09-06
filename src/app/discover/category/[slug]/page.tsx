"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { PublicVideoCard, Category } from "@/lib/api";
import { FeedGrid, FeedPageResult } from "@/components/library/FeedGrid";
import { PublicVideoCard as PublicVideoCardView } from "@/components/video/PublicVideoCard";

const PAGE_SIZE = 12;

/**
 * Category page — a single-category feed filtered by category slug against the
 * real public feed endpoint (/feed/latest?category=<slug>).
 */
export default function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listCategories()
      .then((data) => {
        if (!cancelled) {
          const found =
            data.find((c) => c.slug === slug) ?? data.find((c) => c.id === slug);
          setCategory(found ?? null);
        }
      })
      .catch(() => {
        // Name resolution is best-effort; the filtered feed still works.
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const fetchPage = useCallback(
    async (page: number, pageSize: number): Promise<FeedPageResult<PublicVideoCard>> => {
      const res = await api.getFeedLatest({ page, pageSize, category: slug });
      return {
        items: res.items,
        total: res.total,
        loadedAll: res.total === 0 || res.items.length >= res.total,
      };
    },
    [slug],
  );

  const handlePlay = useCallback(
    (videoId: string) => router.push(`/?watch=${videoId}`),
    [router],
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950">
          {category?.name ?? "Category"}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {category?.description ||
            "Published videos in this category."}
        </p>
      </div>

      <FeedGrid<PublicVideoCard>
        fetchPage={fetchPage}
        deps={[slug]}
        emptyTitle="No videos in this category yet"
        emptyMessage="New videos in this category will appear here."
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