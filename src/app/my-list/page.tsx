"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import type { LibraryVideo } from "@/lib/api";
import { VideoGridPage } from "@/components/library/VideoGridPage";
import { ViewerVideoCard } from "@/components/video/ViewerVideoCard";

export default function MyListPage() {
  const router = useRouter();
  const { isAuthenticated, notify } = useAuth();
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchItems = useCallback(
    async (page: number, pageSize: number) => {
      const res = await api.getSavedVideos({ page, pageSize });
      return { items: res.items, total: res.total, loadedAll: res.total === 0 || res.items.length >= res.total };
    },
    [],
  );

  const handlePlay = useCallback(
    (videoId: string) => router.push(`/?watch=${videoId}`),
    [router],
  );

  const handleRemove = useCallback(
    async (videoId: string) => {
      setRemoving(videoId);
      try {
        await api.unsaveVideo(videoId);
        notify("Removed from My List.");
      } catch (err) {
        notify(
          err instanceof ApiError ? err.message : "Could not remove this video.",
        );
      } finally {
        setRemoving(null);
      }
    },
    [notify],
  );

  return (
    <VideoGridPage<LibraryVideo>
      title="My List"
      subtitle="Videos you saved to watch later."
      emptyTitle="Your list is empty"
      emptyMessage="Tap Save on any video to add it to My List."
      isAuthenticated={isAuthenticated}
      fetchItems={fetchItems}
      renderItem={(video, removeLocal) => (
        <ViewerVideoCard
          key={video.id}
          video={video}
          onPlay={handlePlay}
          onRemove={async () => {
            await handleRemove(video.id);
            removeLocal(video);
          }}
          removeLabel="Remove"
          busy={removing === video.id}
        />
      )}
    />
  );
}
