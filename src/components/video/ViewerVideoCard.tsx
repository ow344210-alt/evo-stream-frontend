"use client";

import React from "react";
import Image from "next/image";
import { Play, X } from "lucide-react";
import { resolveMediaUrl } from "@/lib/api";
import type { LibraryVideo } from "@/lib/api";

interface ViewerVideoCardProps {
  video: LibraryVideo;
  /** Optional secondary meta line (e.g. "Last watched 2h ago"). */
  meta?: string;
  /** Optional progress percent to render a progress bar (watch history). */
  progressPercent?: number;
  onPlay: (videoId: string) => void;
  /** Optional destructive action (remove from list / history). */
  onRemove?: () => void;
  removeLabel?: string;
  busy?: boolean;
}

const durationLabel = (s?: number | null) => {
  if (!s || s <= 0) return "";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const hubInitial = (name?: string | null): string => {
  return (name?.trim()?.[0] ?? "E").toUpperCase();
};

/**
 * Shared viewer card used by My List / Liked / History. Always opens the real
 * player via the `?watch=` deep link. Never shows fake social data.
 * Uses Hub terminology.
 */
export function ViewerVideoCard({
  video,
  meta,
  progressPercent,
  onPlay,
  onRemove,
  removeLabel,
  busy,
}: ViewerVideoCardProps) {
  const thumb = resolveMediaUrl(video.thumbnailUrl || video.posterThumbnailKey);
  const dur = durationLabel(video.durationSeconds);
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

          {progressPercent != null && progressPercent > 0 && (
            <div
              className="absolute bottom-0 inset-x-0 h-1 bg-white/10"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-evo-red"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
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
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              {meta && (
                <>
                  <span className="text-gray-700">•</span>
                  <span className="truncate">{meta}</span>
                </>
              )}
            </div>
          </div>
        </div>
        {onRemove && (
          <button
            type="button"
            disabled={busy}
            onClick={onRemove}
            aria-label={removeLabel ?? "Remove"}
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-evo-red disabled:opacity-40"
          >
            <X className="w-3 h-3" /> {removeLabel ?? "Remove"}
          </button>
        )}
      </div>
    </div>
  );
}
