"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import type { PublicVideoCard } from "@/lib/api";
import { FeedGrid, FeedPageResult } from "@/components/library/FeedGrid";
import { PublicVideoCard as PublicVideoCardView } from "@/components/video/PublicVideoCard";

const PAGE_SIZE = 12;

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [draft, setDraft] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);

  // Sync to URL so searches are deep-linkable and refresh-safe.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (current !== query) setQuery(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    setQuery(trimmed);
    router.push(trimmed ? `/discover/search?q=${encodeURIComponent(trimmed)}` : "/discover/search");
  };

  const fetchPage = useCallback(
    async (page: number, pageSize: number): Promise<FeedPageResult<PublicVideoCard>> => {
      const q = query.trim();
      const res = await api.searchVideos({ page, pageSize, q });
      return {
        items: res.items,
        total: res.total,
        loadedAll: res.total === 0 || res.items.length >= res.total,
      };
    },
    [query],
  );

  const handlePlay = useCallback(
    (videoId: string) => router.push(`/?watch=${videoId}`),
    [router],
  );

  const searching = query.trim() !== "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950">
          Search
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Find videos by title or Hub.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search videos and creators…"
            aria-label="Search videos"
            className="w-full bg-white border border-gray-300 rounded-full pl-12 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-evo-red focus:ring-2 focus:ring-evo-red/20 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="bg-evo-red hover:bg-evo-red-hover text-white text-sm font-semibold px-6 py-3 rounded-full shadow-evo-button transition-all"
        >
          Search
        </button>
      </form>

      {searching ? (
        <FeedGrid<PublicVideoCard>
          fetchPage={fetchPage}
          deps={[query]}
          emptyTitle="No results found"
          emptyMessage={`No videos match "${query}". Try a different search.`}
          renderItem={(video) => (
            <PublicVideoCardView
              key={video.id}
              video={video}
              onPlay={handlePlay}
            />
          )}
        />
      ) : (
        <div className="py-16 text-center text-sm text-gray-500">
          Type a title or creator name to search EVO.
        </div>
      )}
    </div>
  );
}

/**
 * Real search — queries the public feed search endpoint (/feed/search) over
 * video titles and channel names. Reads/updates the `q` URL param so results
 * are shareable and survive refresh. No mock search data.
 */
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-gray-500">Loading…</div>}>
      <SearchPageContent />
    </Suspense>
  );
}