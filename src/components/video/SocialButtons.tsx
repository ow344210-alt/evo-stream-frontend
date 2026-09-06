"use client";

import React from "react";
import {
  Heart,
  Bookmark,
  Share2,
  UserPlus,
  UserCheck,
  Loader2,
} from "lucide-react";

type ActionKey = "like" | "save" | "follow" | "share" | null;

interface SocialButtonsProps {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  followerCount: number | null;
  isLiked: boolean;
  isSaved: boolean;
  isFollowing: boolean;
  /** The action currently pending a network request (locks against rapid dupes). */
  pendingAction: ActionKey;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onFollow: () => void;
  onComments: () => void;
  commentsOpen: boolean;
}

const countLabel = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${n}`;

const baseButton =
  "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

/**
 * Viewer social controls shown around the real player: Like, Save, Share, and
 * Follow — each a real, backend-persisted mutation. `pendingAction` disables all
 * buttons while a request is in flight so rapid duplicate clicks cannot fire.
 * Anonymous users are routed through the caller's auth gate (onLike/onSave/
 * onFollow call onRequireAuth instead of a mutation). Uses server-confirmed
 * state: the UI reflects what the backend returned, never guessed.
 */
export function SocialButtons({
  likeCount,
  commentCount,
  shareCount,
  followerCount,
  isLiked,
  isSaved,
  isFollowing,
  pendingAction,
  onLike,
  onSave,
  onShare,
  onFollow,
  onComments,
  commentsOpen,
}: SocialButtonsProps) {
  const anyPending = pendingAction !== null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={anyPending}
        aria-pressed={isLiked}
        aria-label={isLiked ? "Unlike" : "Like"}
        onClick={onLike}
        className={`${baseButton} ${
          isLiked
            ? "bg-evo-red/15 text-evo-red border border-evo-red/40"
            : "bg-gray-900/60 text-gray-200 border border-gray-700 hover:bg-gray-800"
        }`}
      >
        {pendingAction === "like" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Heart className={`w-4 h-4 ${isLiked ? "fill-evo-red" : ""}`} />
        )}
        {countLabel(likeCount)}
      </button>

      <button
        type="button"
        disabled={anyPending}
        aria-pressed={isSaved}
        aria-label={isSaved ? "Remove from My List" : "Save to My List"}
        onClick={onSave}
        className={`${baseButton} ${
          isSaved
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40"
            : "bg-gray-900/60 text-gray-200 border border-gray-700 hover:bg-gray-800"
        }`}
      >
        {pendingAction === "save" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-emerald-400" : ""}`} />
        )}
        {isSaved ? "Saved" : "Save"}
      </button>

      <button
        type="button"
        disabled={anyPending || followerCount == null}
        aria-pressed={isFollowing}
        aria-label={isFollowing ? "Unfollow hub" : "Follow hub"}
        onClick={onFollow}
        className={`${baseButton} ${
          isFollowing
            ? "bg-white/10 text-white border border-white/30"
            : "bg-evo-red hover:bg-evo-red-hover text-white border border-transparent"
        }`}
      >
        {pendingAction === "follow" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFollowing ? (
          <UserCheck className="w-4 h-4" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
        {isFollowing ? "Following" : "Follow"}
        {followerCount != null && (
          <span className="opacity-70">· {countLabel(followerCount)}</span>
        )}
      </button>

      <button
        type="button"
        disabled={anyPending}
        aria-label="Share"
        onClick={onShare}
        className={`${baseButton} bg-gray-900/60 text-gray-200 border border-gray-700 hover:bg-gray-800`}
      >
        {pendingAction === "share" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Share2 className="w-4 h-4" />
        )}
        {countLabel(shareCount)}
      </button>

      <button
        type="button"
        aria-expanded={commentsOpen}
        aria-label="Comments"
        onClick={onComments}
        className={`${baseButton} ${
          commentsOpen
            ? "bg-white/10 text-white border border-white/30"
            : "bg-gray-900/60 text-gray-200 border border-gray-700 hover:bg-gray-800"
        }`}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400" />
        Comments · {countLabel(commentCount)}
      </button>
    </div>
  );
}
