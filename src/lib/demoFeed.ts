import type { PublicVideoCard } from "@/lib/api";

/**
 * Demo-safe presentation fallback for the "Latest Uploads" homepage section.
 *
 * When the real feed yields fewer than TARGET usable videos (API down, empty
 * store, partial results), the section pads its grid with these presentation-
 * only demo cards so Vercel-hosted demos never render an empty/broken block.
 * Demo cards are purely presentational: real id = null, they never navigate,
 * never call the API, and never display fake backend records on-screen.
 */
export interface DemoVideo {
  title: string;
  hubName: string;
  durationSeconds: number;
  /** Local static thumbnail shipped with the frontend (served by Vercel). */
  thumbnail: string;
}

/** Four curated demo picks backed by the platform's own realistic cover artwork. */
export const DEMO_VIDEOS: readonly DemoVideo[] = [
  {
    title: "Beyond the Horizon",
    hubName: "Horizon Studios",
    durationSeconds: 768, // 12:48
    thumbnail: "/images/beyond_horizon_poster.jpg",
  },
  {
    title: "City Stories",
    hubName: "Urban Frame",
    durationSeconds: 1104, // 18:24
    thumbnail: "/images/city_faces_poster.jpg",
  },
  {
    title: "The Last Light",
    hubName: "Northstar Media",
    durationSeconds: 856, // 14:16
    thumbnail: "/images/rana_poster.jpg",
  },
  {
    title: "Into the Wild",
    hubName: "Explore Network",
    durationSeconds: 1265, // 21:05
    thumbnail: "/images/maa_poster.jpg",
  },
];

/** A single card in the Latest Uploads grid: a real video or a demo card. */
export interface DisplayVideo {
  /** Stable React key (real video id or demo slug). */
  key: string;
  /** Real video id, or null for presentation-only demo cards. */
  id: string | null;
  title: string;
  durationSeconds: number;
  posterUrl: string | null;
  hubName: string;
  categoryName: string | null;
  /** Distinguishes the static demo fill from real backend videos. @internal */
  isFallback: boolean;
}

function isUsable(video: PublicVideoCard | undefined | null): boolean {
  return Boolean(
    video &&
      typeof video.id === "string" &&
      video.id.trim() !== "" &&
      typeof video.title === "string" &&
      video.title.trim() !== "",
  );
}

function toDisplay(video: PublicVideoCard): DisplayVideo {
  return {
    key: video.id,
    id: video.id,
    title: video.title,
    durationSeconds: video.durationSeconds ?? 0,
    posterUrl: video.posterUrl,
    hubName: video.channel?.name ?? "EVO",
    categoryName: video.category?.name ?? null,
    isFallback: false,
  };
}

function toDemo(video: DemoVideo): DisplayVideo {
  return {
    key: `demo-${video.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    id: null,
    title: video.title,
    durationSeconds: video.durationSeconds,
    posterUrl: video.thumbnail,
    hubName: video.hubName,
    categoryName: null,
    isFallback: true,
  };
}

/**
 * Build the finale Latest Uploads grid:
 * - >= TARGET usable real videos: return the real videos only (no fallback).
 * - fewer than TARGET usable real videos: return the real videos padded with
 *   demo cards until exactly TARGET cards are shown.
 */
export function getDisplayVideos(
  realVideos: readonly PublicVideoCard[],
  target = 4,
): DisplayVideo[] {
  const usable = realVideos.filter(isUsable);
  if (usable.length >= target) {
    return usable.map(toDisplay);
  }
  const fillCount = target - usable.length;
  return [...usable.map(toDisplay), ...DEMO_VIDEOS.slice(0, fillCount).map(toDemo)];
}