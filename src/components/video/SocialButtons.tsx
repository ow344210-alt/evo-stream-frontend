"use client";

import React from "react";
import {
  Heart,
  Bookmark,
  Share2,
  UserPlus,
  UserCheck,
  MessageCircle,
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

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
  /**
   * When true, the Follow button is omitted. Watch pages render Follow beside
   * the channel identity instead; the modal keeps Follow inside the action row.
   */
  hideFollow?: boolean;
}

const countLabel = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${n}`;

const iconButton =
  "inline-flex flex-col items-center justify-center gap-0.5 h-11 w-11 rounded-2xl bg-gray-100 text-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

const countStyle = "text-[10px] font-semibold leading-none";

/**
 * Viewer social controls shown around the real player: Like, Save, Share, and
 * Follow. Icon-only buttons with hover tooltips; the action name is never
 * permanently rendered. Permanently-visible text is limited to a compact count
 * under each actionable icon and the always-textual Follow toggle (Follow is a
 * real text button per the icon-only spec). `pendingAction` disables all
 * buttons while a request is in flight so rapid duplicate clicks cannot fire;
 * no button swaps to a spinner — state updates immediately and the background
 * request reconciles.
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
  hideFollow = false,
}: SocialButtonsProps) {
  const anyPending = pendingAction !== null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tooltip label={isLiked ? "Unlike" : "Like"} side="top">
        <button
          type="button"
          disabled={anyPending}
          aria-pressed={isLiked}
          aria-label={isLiked ? "Unlike" : "Like"}
          onClick={onLike}
          className={`${iconButton} ${
            isLiked ? "bg-evo-red/10 text-evo-red" : ""
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? "fill-evo-red" : ""}`} />
          <span className={countStyle}>{countLabel(likeCount)}</span>
        </button>
      </Tooltip>

      <Tooltip
        label={isSaved ? "Remove from My List" : "Save to My List"}
        side="top"
      >
        <button
          type="button"
          disabled={anyPending}
          aria-pressed={isSaved}
          aria-label={isSaved ? "Remove from My List" : "Save to My List"}
          onClick={onSave}
          className={`${iconButton} ${
            isSaved ? "bg-emerald-500/10 text-emerald-600" : ""
          }`}
        >
          <Bookmark
            className={`w-5 h-5 ${isSaved ? "fill-emerald-500" : ""}`}
          />
        </button>
      </Tooltip>

      {!hideFollow && (
        <button
          type="button"
          disabled={anyPending || followerCount == null}
          aria-pressed={isFollowing}
          aria-label={isFollowing ? "Unfollow hub" : "Follow hub"}
          onClick={onFollow}
          className={`inline-flex items-center gap-1.5 h-11 px-4 rounded-2xl text-[13px] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
            isFollowing
              ? "bg-gray-100 text-gray-800 border border-gray-200"
              : "bg-evo-red text-white hover:bg-evo-red-hover"
          }`}
        >
          {isFollowing ? (
            <UserCheck className="w-4 h-4" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {isFollowing ? "Following" : "Follow"}
          {followerCount != null && (
            <span className="opacity-70">· {countLabel(followerCount)}</span>
          )}
        </button>
      )}

      <Tooltip label="Share" side="top">
        <button
          type="button"
          disabled={anyPending}
          aria-label="Share"
          onClick={onShare}
          className={iconButton}
        >
          <Share2 className="w-5 h-5" />
          <span className={countStyle}>{countLabel(shareCount)}</span>
        </button>
      </Tooltip>

      <Tooltip label="Comments" side="top">
        <button
          type="button"
          aria-expanded={commentsOpen}
          aria-label="Comments"
          onClick={onComments}
          className={`${iconButton} ${commentsOpen ? "text-evo-red" : ""}`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className={countStyle}>{countLabel(commentCount)}</span>
        </button>
      </Tooltip>
    </div>
  );
}