"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import type { WatchHistoryItem } from "@/lib/api";
import { VideoGridPage } from "@/components/library/VideoGridPage";
import { ViewerVideoCard } from "@/components/video/ViewerVideoCard";

function lastWatched(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const d = Date.now() - then;
  const hours = Math.floor(d / 3_600_000);
  if (hours < 1) return "watched just now";
  if (hours < 24) return `watched ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `watched ${days}d ago`;
}

export default function WatchHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, notify } = useAuth();
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchItems = useCallback(async (page: number, pageSize: number) => {
    const res = await api.getWatchHistory({ page, pageSize });
    return {
      items: res.items,
      total: res.total,
      loadedAll: res.total === 0 || res.items.length >= res.total,
    };
  }, []);

  const handlePlay = useCallback(
    (videoId: string) => router.push(`/?watch=${videoId}`),
    [router],
  );

  const handleRemove = useCallback(
    async (videoId: string) => {
      setRemoving(videoId);
      try {
        await api.removeHistoryItem(videoId);
        notify("Removed from history.");
      } catch (err) {
        notify(
          err instanceof ApiError
            ? err.message
            : "Could not remove this item.",
        );
      } finally {
        setRemoving(null);
      }
    },
    [notify],
  );

  return (
    <VideoGridPage<WatchHistoryItem>
      title="Watch History"
      subtitle="Videos you&apos;ve been watching — pick up where you left off."
      emptyTitle="No watch history"
      emptyMessage="Videos you watch will show up here."
      isAuthenticated={isAuthenticated}
      fetchItems={fetchItems}
      renderItem={(row, removeLocal) => (
        <ViewerVideoCard
          key={row.video.id}
          video={row.video}
          meta={lastWatched(row.watchedAt)}
          progressPercent={row.progressPercent}
          onPlay={handlePlay}
          onRemove={async () => {
            await handleRemove(row.video.id);
            removeLocal(row);
          }}
          removeLabel="Remove"
          busy={removing === row.video.id}
        />
      )}
    />
  );
}
