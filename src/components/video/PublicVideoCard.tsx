"use client";

import React from "react";
import Image from "next/image";
import { Play, Clock } from "lucide-react";
import { resolveMediaUrl } from "@/lib/api";
import type { PublicVideoCard as PublicVideoCardData } from "@/lib/api";

interface PublicVideoCardProps {
  video: PublicVideoCardData;
  /** Called with the real video id so the caller opens `/?watch=<id>`. */
  onPlay: (videoId: string) => void;
  /** Optional label to surface alongside the card (e.g. search score/term). */
  meta?: string;
}

const durationLabel = (s?: number | null): string => {
  if (!s || s <= 0) return "";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

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
 * Real discovery-feed video card rendered from the public feed contract
 * (PublicVideoCard). Thumbnail comes from the backend-provided poster URL,
 * never a mock. Always opens the real player via the `?watch=` deep link.
 * Responsive: fills its grid slot (2-col mobile / 3-col tablet / 4-col desktop).
 * Uses Hub terminology and YouTube-style layout with Hub avatar, title, Hub name, and publish time.
 */
export function PublicVideoCard({
  video,
  onPlay,
  meta,
}: PublicVideoCardProps) {
  const thumb = resolveMediaUrl(video.posterUrl);
  const dur = durationLabel(video.durationSeconds);
  const published = timeAgo(video.publishedAt);
  const hubName = video.channel?.name || "EVO";
  const hubInitialLetter = hubInitial(hubName);

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-800/70 shadow-lg hover:shadow-2xl hover:border-evo-red/50 transition-all">
      <button
        type="button"
        onClick={() => onPlay(video.id)}
        aria-label={`Play ${video.title}`}
        className="block w-full text-left"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          {thumb ? (
            <Image
              src={thumb}
              alt={video.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <span className="text-4xl font-extrabold text-gray-700">
                {(video.title?.[0] ?? "E").toUpperCase()}
              </span>
            </div>
          )}

          {dur && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-bold text-white">
              {dur}
            </div>
          )}

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-evo-red/90 text-white flex items-center justify-center shadow-lg shadow-evo-red/50">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>
        </div>
      </button>

      <div className="p-3">
        <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
          {video.title}
        </h4>
        <div className="mt-2 flex items-start gap-2">
          {/* Hub Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-evo-red to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {hubInitialLetter}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-sm text-white">
              <span className="font-medium truncate">{hubName}</span>
              {published && (
                <>
                  <span className="text-gray-400">·</span>
                  <span className="text-xs text-gray-400 truncate shrink-0">{published}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              {video.category?.name && (
                <>
                  <span className="truncate shrink-0">{video.category.name}</span>
                </>
              )}
              {meta && (
                <>
                  <span className="text-gray-700">•</span>
                  <span className="truncate">{meta}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}