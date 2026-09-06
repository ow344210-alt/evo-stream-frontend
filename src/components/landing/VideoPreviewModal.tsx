"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { X, AlertTriangle, Loader2, Radio } from "lucide-react";
import { HlsVideoPlayer } from "@/components/video/HlsVideoPlayer";
import { api, ApiError } from "@/lib/api";
import type { VideoPlayback, SocialSummary } from "@/lib/api";
import { SocialButtons } from "@/components/video/SocialButtons";
import { CommentsSection } from "@/components/video/CommentsSection";
import { useAuth } from "@/lib/auth-context";
import { useWatchProgress } from "@/lib/useWatchProgress";
import { shouldResume } from "@/lib/watchProgress";

interface VideoPreviewModalProps {
  /** Real video ID to load playback metadata for. */
  videoId: string | null;
  onClose: () => void;
  /** Open the existing sign-in flow (reused; never redesigned). */
  onRequireAuth: () => void;
}

type LoadState = "loading" | "loaded" | "error";

const ZERO_SUMMARY: SocialSummary = {
  videoId: "",
  likeCount: 0,
  commentCount: 0,
  shareCount: 0,
  channelFollowerCount: 0,
  isLiked: false,
  isSaved: false,
  isFollowing: false,
};

/**
 * Real viewer playback modal. Fetches the authoritative P2-5 playback metadata
 * and P2-7 social summary for the video, plays the actual HLS stream, and wires
 * real, back-end-persisted social controls: like, save, share, follow, comments,
 * and throttled watch-progress with resume. Anonymous viewers can watch and see
 * public counts; mutations are gated through the existing auth flow.
 */
export function VideoPreviewModal({ videoId, onClose, onRequireAuth }: VideoPreviewModalProps) {
  const { isAuthenticated, notify } = useAuth();

  const [state, setState] = useState<LoadState>("loading");
  const [playback, setPlayback] = useState<VideoPlayback | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [summary, setSummary] = useState<SocialSummary>(ZERO_SUMMARY);
  const [summaryLoaded, setSummaryLoaded] = useState(false);
  const [resumePosition, setResumePosition] = useState<number>(0);
  const [resumeLoaded, setResumeLoaded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "like" | "save" | "follow" | "share" | null
  >(null);

  // ---- Playback metadata ----
  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    setState("loading");
    setPlayback(null);
    setErrorMessage("");
    setSummaryLoaded(false);
    setResumePosition(0);
    setResumeLoaded(false);
    setCommentsOpen(false);

    api
      .getVideoPlayback(videoId)
      .then((data) => {
        if (cancelled) return;
        setPlayback(data);
        setState("loaded");
      })
      .catch((err) => {
        if (cancelled) return;
        setState("error");
        const msg =
          err instanceof ApiError
            ? err.message
            : "This video is not available right now.";
        if (cancelled) return;
        setErrorMessage(msg === "Not Found" ? "Not found" : msg);
      });

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  // ---- Social summary (public + optional auth; anonymous sees public counts) ----
  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    api
      .getSocialSummary(videoId)
      .then((data) => {
        if (cancelled) return;
        setSummary(data);
      })
      .catch(() => {
        // Keep zeros; public counts are best-effort, never fake.
        if (!cancelled) setSummary((s) => ({ ...s, videoId: videoId ?? "" }));
      })
      .finally(() => {
        if (!cancelled) setSummaryLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [videoId, isAuthenticated]);

  // ---- Resume (authenticated, real saved progress) ----
  useEffect(() => {
    if (!videoId || !isAuthenticated || !playback) return;
    let cancelled = false;
    setResumePosition(0);
    setResumeLoaded(false);
    api
      .getWatchHistory({ page: 1, pageSize: 50 })
      .then((data) => {
        if (cancelled) return;
        const entry = data.items.find((h) => h.video.id === videoId);
        if (entry && shouldResume(entry.positionSeconds, playback.durationSeconds)) {
          setResumePosition(entry.positionSeconds);
        }
      })
      .catch(() => {
        // No resume on failure; never block normal playback.
      })
      .finally(() => {
        if (!cancelled) setResumeLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [videoId, isAuthenticated, playback?.id, playback?.durationSeconds]);

  // ---- Watch progress (throttled, real persistence for authenticated viewers) ----
  const { onTimeUpdate, flush } = useWatchProgress({
    videoId,
    durationSeconds: playback?.durationSeconds ?? null,
    enabled: isAuthenticated,
  });

  // Final checkpoint when the modal closes.
  const closeRef = useRef<() => void>(() => {});
  closeRef.current = () => {
    flush();
    onClose();
  };

  // Lock body scroll while open.
  useEffect(() => {
    if (!videoId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [videoId]);

  const handleAnimPause = useCallback(() => {
    flush();
  }, [flush]);

  const handleAnimEnded = useCallback(() => {
    flush();
  }, [flush]);

  const requireAuthOrPrompt = useCallback((): boolean => {
    if (!isAuthenticated) {
      onRequireAuth();
      return true;
    }
    return false;
  }, [isAuthenticated, onRequireAuth]);

  // ---- Mutations (server-confirmed; pending lock prevents duplicate clicks) ----
  const handleLike = useCallback(async () => {
    if (requireAuthOrPrompt()) return;
    if (pendingAction) return;
    setPendingAction("like");
    try {
      const res = summary.isLiked
        ? await api.unlikeVideo(videoId!)
        : await api.likeVideo(videoId!);
      setSummary((s) => ({
        ...s,
        isLiked: res.liked,
        likeCount: res.likeCount,
      }));
    } catch (err) {
      notify(
        err instanceof ApiError ? err.message : "Could not update your like.",
      );
    } finally {
      setPendingAction(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, isAuthenticated, summary.isLiked, notify, requireAuthOrPrompt]);

  const handleSave = useCallback(async () => {
    if (requireAuthOrPrompt()) return;
    if (pendingAction) return;
    setPendingAction("save");
    try {
      const res = summary.isSaved
        ? await api.unsaveVideo(videoId!)
        : await api.saveVideo(videoId!);
      setSummary((s) => ({ ...s, isSaved: res.saved }));
      notify(res.saved ? "Saved to My List." : "Removed from My List.");
    } catch (err) {
      notify(
        err instanceof ApiError ? err.message : "Could not update your library.",
      );
    } finally {
      setPendingAction(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, isAuthenticated, summary.isSaved, notify, requireAuthOrPrompt]);

  const handleFollow = useCallback(async () => {
    const channelId = playback?.channel?.id;
    if (!channelId) return;
    if (requireAuthOrPrompt()) return;
    if (pendingAction) return;
    setPendingAction("follow");
    try {
      const res = summary.isFollowing
        ? await api.unfollowChannel(channelId)
        : await api.followChannel(channelId);
      setSummary((s) => ({
        ...s,
        isFollowing: res.following,
        channelFollowerCount: res.followerCount,
      }));
      notify(
        res.following
          ? `Following ${playback?.channel?.name ?? "hub"}.`
          : "Unfollowed hub.",
      );
    } catch (err) {
      notify(
        err instanceof ApiError ? err.message : "Could not update follow.",
      );
    } finally {
      setPendingAction(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, playback?.channel?.id, playback?.channel?.name, isAuthenticated, summary.isFollowing, notify, requireAuthOrPrompt]);

  const handleShare = useCallback(async () => {
    if (!videoId) return;
    const url = `${window.location.origin}/?watch=${videoId}`;
    let shared = false;
    try {
      if (navigator.share) {
        await navigator.share({ title: playback?.title ?? "EVO video", url });
        shared = true;
      } else {
        await navigator.clipboard.writeText(url);
        shared = true;
      }
    } catch {
      // User dismissed native share or clipboard denied; fall back to copying.
      try {
        await navigator.clipboard.writeText(url);
        shared = true;
      } catch {
        notify("Could not copy the link. Please copy it manually.");
        return;
      }
    }
    if (shared) {
      notify("Link copied.");
      // Record a real share for authenticated viewers (JWT required).
      if (isAuthenticated && !pendingAction) {
        setPendingAction("share");
        try {
          const res = await api.shareVideo(videoId);
          setSummary((s) => ({ ...s, shareCount: res.shareCount }));
        } catch {
          // Share already happened; count recording is best-effort.
        } finally {
          setPendingAction(null);
        }
      }
    }
  }, [videoId, playback?.title, isAuthenticated, pendingAction, notify]);

  const handleCountChange = useCallback((delta: number) => {
    setSummary((s) => ({ ...s, commentCount: Math.max(0, s.commentCount + delta) }));
  }, []);

  if (!videoId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 lg:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Video player"
      onClick={() => closeRef.current()}
    >
      <div
        className="relative w-full max-w-4xl sm:max-w-5xl lg:max-w-6xl bg-gray-950 text-white rounded-3xl overflow-hidden border border-gray-800 shadow-2xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => closeRef.current()}
          className="absolute top-2 right-2 z-40 p-2 rounded-full bg-black/60 hover:bg-black text-gray-300 hover:text-white border border-white/10 transition-colors"
          aria-label="Close player"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Player area */}
        <div className="relative aspect-video w-full bg-black overflow-hidden shrink-0">
          {state === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
              <Loader2 className="w-10 h-10 text-evo-red animate-spin" aria-hidden />
              <p className="text-sm text-white/70">Loading video…</p>
            </div>
          )}

          {state === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black px-4 sm:px-6 text-center">
              <AlertTriangle className="w-10 h-10 text-evo-red" aria-hidden />
              <p className="text-base font-semibold text-white">
                This video is unavailable
              </p>
              <p className="text-sm text-white/70 max-w-md">
                {errorMessage || "It may still be processing or not published yet."}
              </p>
            </div>
          )}

          {state === "loaded" && playback && (
            <HlsVideoPlayer
              playback={playback}
              onProgressTime={onTimeUpdate}
              onPause={handleAnimPause}
              onEnded={handleAnimEnded}
              resumePosition={resumeLoaded ? resumePosition : 0}
            />
          )}
        </div>

        {/* Video Info + Social */}
        {state === "loaded" && playback && (
          <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1 min-h-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2 shrink-0">
              {playback.publicationStatus === "PUBLISHED" &&
                playback.processingStatus === "READY" && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                    <Radio className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    HLS Ready
                  </span>
                )}
              {playback.channel && (
                <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400 font-medium truncate max-w-[200px] sm:max-w-[250px]">
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-evo-red to-orange-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                    {playback.channel.name?.trim()?.[0]?.toUpperCase() ?? "E"}
                  </span>
                  <span className="truncate">{playback.channel.name}</span>
                </span>
              )}
              <span className="text-[10px] sm:text-xs text-gray-500">
                {playback.availableQualities?.length ?? 0} quality level
                {(playback.availableQualities?.length ?? 0) === 1 ? "" : "s"}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight text-white truncate">
              {playback.title}
            </h3>
            {playback.description && (
              <p className="text-sm text-gray-300 leading-relaxed font-normal line-clamp-3">
                {playback.description}
              </p>
            )}

            {/* Real social controls — server-confirmed state, no fake counts */}
            <SocialButtons
              likeCount={summaryLoaded ? summary.likeCount : 0}
              commentCount={summaryLoaded ? summary.commentCount : 0}
              shareCount={summaryLoaded ? summary.shareCount : 0}
              followerCount={summaryLoaded ? summary.channelFollowerCount : null}
              isLiked={summary.isLiked}
              isSaved={summary.isSaved}
              isFollowing={summary.isFollowing}
              pendingAction={pendingAction}
              onLike={handleLike}
              onSave={handleSave}
              onFollow={handleFollow}
              onShare={handleShare}
              onComments={() => setCommentsOpen((v) => !v)}
              commentsOpen={commentsOpen}
            />

            {commentsOpen && (
              <div className="border-t border-gray-800 pt-3 sm:pt-4 shrink-0">
                <CommentsSection
                  videoId={videoId}
                  isAuthenticated={isAuthenticated}
                  onRequireAuth={onRequireAuth}
                  notify={notify}
                  onCountChange={handleCountChange}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
