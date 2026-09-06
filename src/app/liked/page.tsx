"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { LibraryVideo } from "@/lib/api";
import { VideoGridPage } from "@/components/library/VideoGridPage";
import { ViewerVideoCard } from "@/components/video/ViewerVideoCard";

export default function LikedVideosPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const fetchItems = useCallback(
    async (page: number, pageSize: number) => {
      const res = await api.getLikedVideos({ page, pageSize });
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
    <VideoGridPage<LibraryVideo>
      title="Liked Videos"
      subtitle="Videos you&apos;ve liked."
      emptyTitle="No liked videos yet"
      emptyMessage="Tap the heart on any video to add it here."
      isAuthenticated={isAuthenticated}
      fetchItems={fetchItems}
      renderItem={(video) => (
        <ViewerVideoCard key={video.id} video={video} onPlay={handlePlay} />
      )}
    />
  );
}
