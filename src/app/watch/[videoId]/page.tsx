"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Radio, UserPlus, UserCheck } from "lucide-react";
import { ViewerNav } from "@/components/library/ViewerNav";
import { HlsVideoPlayer } from "@/components/video/HlsVideoPlayer";
import { SocialButtons } from "@/components/video/SocialButtons";
import { CommentsSection } from "@/components/video/CommentsSection";
import { ShareDialog } from "@/components/video/ShareDialog";
import { api, ApiError } from "@/lib/api";
import type { VideoPlayback, SocialSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWatchProgress } from "@/lib/useWatchProgress";
import { shouldResume } from "@/lib/watchProgress";

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

const publishedLabel = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const countLabel = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${n}`;

/**
 * EVO dedicated Web Watch Page (/watch/[videoId]).
 *
 * Clean, single-column video-platform layout: navbar → player → title →
 * creator row (identity + Follow) + social actions → description panel →
 * comments. Normal page scroll (no modal, no body-scroll lock) with a large
 * responsive 16:9 player, real playback metadata, viewer social controls with
 * optimistic Like/Save/Follow (immediate feedback + server confirmation +
 * rollback), an in-app share dialog (no native share on desktop; the count
 * records only on a real share action), a proper comments section below the
 * details, and the existing throttled watch-progress + resume history. The
 * player honors shared `?t=` deep links on load.
 * Anonymous viewers can watch and see public counts; mutations route through
 * the existing auth flow.
 */
export default function WatchPage() {
  const params = useParams<{ videoId: string }>();
  const videoId = params.videoId;
  const router = useRouter();
  const { isAuthenticated, notify } = useAuth();

  const [state, setState] = useState<LoadState>("loading");
  const [playback, setPlayback] = useState<VideoPlayback | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [summary, setSummary] = useState<SocialSummary>(ZERO_SUMMARY);
  const [summaryLoaded, setSummaryLoaded] = useState(false);
  const [resumePosition, setResumePosition] = useState<number>(0);
  const [resumeLoaded, setResumeLoaded] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "like" | "save" | "follow" | "share" | null
  >(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const playheadRef = useRef(0);

  // Canonical share URL is derived in the browser only (window is unavailable
  // during SSR for this client component).
  useEffect(() => {
    if (videoId) setShareUrl(`${window.location.origin}/watch/${videoId}`);
  }, [videoId]);

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
    setDescExpanded(false);

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
  }, [videoId]);

  // ---- Resume: ?t= deep links take priority, else real saved progress ----
  useEffect(() => {
    if (!videoId || !playback) return;
    const duration = playback.durationSeconds;
    if (duration == null) {
      setResumeLoaded(true);
      return;
    }
    let cancelled = false;
    setResumePosition(0);
    setResumeLoaded(false);

    // A shared "start at current time" link (?t=N) is the strongest intent.
    const raw = new URLSearchParams(window.location.search).get("t");
    const t = raw == null ? NaN : Number(raw);
    if (Number.isFinite(t) && t > 0 && t < duration) {
      setResumePosition(t);
      setResumeLoaded(true);
      return;
    }
    if (!isAuthenticated) {
      setResumeLoaded(true);
      return;
    }
    api
      .getWatchHistory({ page: 1, pageSize: 50 })
      .then((data) => {
        if (cancelled) return;
        const entry = data.items.find((h) => h.video.id === videoId);
        if (entry && shouldResume(entry.positionSeconds, duration)) {
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

  // Keep the latest playhead so "Start at current time" knows where we are.
  const handleProgress = useCallback(
    (seconds: number) => {
      playheadRef.current = seconds;
      onTimeUpdate(seconds);
    },
    [onTimeUpdate],
  );

  // Flush a final checkpoint when the viewer leaves the page (nav away / close).
  const flushRef = useRef(flush);
  flushRef.current = flush;
  useEffect(() => {
    const onHide = () => flushRef.current();
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      flushRef.current();
    };
  }, []);

  const handleAnimPause = useCallback(() => {
    flush();
  }, [flush]);

  const handleAnimEnded = useCallback(() => {
    flush();
  }, [flush]);

  const requireAuthOrPrompt = useCallback((): boolean => {
    if (!isAuthenticated) {
      router.push("/?auth=signin");
      return true;
    }
    return false;
  }, [isAuthenticated, router]);

  // ---- Mutations (optimistic: immediate UI + background API + rollback) ----
  const handleLike = useCallback(async () => {
    if (!videoId) return;
    if (requireAuthOrPrompt()) return;
    if (pendingAction) return;
    setPendingAction("like");
    const next = !summary.isLiked;
    // Optimistic flip (clamped; never negative counts).
    setSummary((s) => ({
      ...s,
      isLiked: next,
      likeCount: Math.max(0, s.likeCount + (next ? 1 : -1)),
    }));
    try {
      const res = next
        ? await api.likeVideo(videoId)
        : await api.unlikeVideo(videoId);
      // Server-confirmed reconciliation.
      setSummary((s) => ({
        ...s,
        isLiked: res.liked,
        likeCount: Math.max(0, res.likeCount),
      }));
    } catch (err) {
      // Roll back the optimistic change.
      setSummary((s) => ({
        ...s,
        isLiked: !next,
        likeCount: Math.max(0, s.likeCount + (next ? -1 : 1)),
      }));
      notify(
        err instanceof ApiError ? err.message : "Could not update your like.",
      );
    } finally {
      setPendingAction(null);
    }
  }, [videoId, isAuthenticated, summary.isLiked, pendingAction, notify, requireAuthOrPrompt]);

  const handleSave = useCallback(async () => {
    if (!videoId) return;
    if (requireAuthOrPrompt()) return;
    if (pendingAction) return;
    setPendingAction("save");
    const next = !summary.isSaved;
    setSummary((s) => ({ ...s, isSaved: next }));
    try {
      const res = next
        ? await api.saveVideo(videoId)
        : await api.unsaveVideo(videoId);
      setSummary((s) => ({ ...s, isSaved: res.saved }));
      notify(res.saved ? "Saved to My List." : "Removed from My List.");
    } catch (err) {
      setSummary((s) => ({ ...s, isSaved: !next }));
      notify(
        err instanceof ApiError ? err.message : "Could not update your library.",
      );
    } finally {
      setPendingAction(null);
    }
  }, [videoId, isAuthenticated, summary.isSaved, pendingAction, notify, requireAuthOrPrompt]);

  const handleFollow = useCallback(async () => {
    const channelId = playback?.channel?.id;
    if (!channelId) return;
    if (requireAuthOrPrompt()) return;
    if (pendingAction) return;
    setPendingAction("follow");
    const next = !summary.isFollowing;
    setSummary((s) => ({
      ...s,
      isFollowing: next,
      channelFollowerCount: Math.max(0, s.channelFollowerCount + (next ? 1 : -1)),
    }));
    try {
      const res = next
        ? await api.followChannel(channelId)
        : await api.unfollowChannel(channelId);
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
      setSummary((s) => ({
        ...s,
        isFollowing: !next,
        channelFollowerCount: Math.max(0, s.channelFollowerCount + (next ? -1 : 1)),
      }));
      notify(
        err instanceof ApiError ? err.message : "Could not update follow.",
      );
    } finally {
      setPendingAction(null);
    }
  }, [videoId, playback?.channel?.id, playback?.channel?.name, isAuthenticated, summary.isFollowing, pendingAction, notify, requireAuthOrPrompt]);

  // Opening the dialog is free — no network and never counts as a share.
  const handleShare = useCallback(() => {
    if (!videoId) return;
    setShareOpen(true);
  }, [videoId]);

  // Record a real share only when the viewer actually shares (copy or
  // destination click). Best-effort, in the background, never blocking.
  const handleShared = useCallback(() => {
    if (!isAuthenticated || pendingAction) return;
    setPendingAction("share");
    api
      .shareVideo(videoId)
      .then((res) =>
        setSummary((s) => ({ ...s, shareCount: res.shareCount })),
      )
      .catch(() => {
        // The share already happened; count recording is best-effort.
      })
      .finally(() => setPendingAction(null));
  }, [videoId, isAuthenticated, pendingAction]);

  const handleCountChange = useCallback((delta: number) => {
    setSummary((s) => ({
      ...s,
      commentCount: Math.max(0, s.commentCount + delta),
    }));
  }, []);

  const handleCommentsJump = useCallback(() => {
    document
      .getElementById("comments")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const retry = useCallback(() => {
    const id = videoId;
    setState("loading");
    setErrorMessage("");
    setPlayback(null);
    if (!id) return;
    api
      .getVideoPlayback(id)
      .then((data) => {
        setPlayback(data);
        setState("loaded");
      })
      .catch((err) => {
        setState("error");
        const msg =
          err instanceof ApiError
            ? err.message
            : "This video is not available right now.";
        setErrorMessage(msg === "Not Found" ? "Not found" : msg);
      });
  }, [videoId]);

  const channel = playback?.channel;
  const followerCount = summaryLoaded ? summary.channelFollowerCount : null;
  const canFollow = Boolean(channel?.id);
  const anyPending = pendingAction !== null;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ViewerNav />

      <main className="flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Player block */}
        <div className="w-full overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-black/10">
          {state === "loading" && (
            <div
              className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-black"
              role="status"
            >
              <Loader2
                className="h-10 w-10 animate-spin text-evo-red"
                aria-hidden
              />
              <p className="text-sm text-white/70">Loading video…</p>
            </div>
          )}

          {state === "error" && (
            <div
              className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-black px-4 text-center sm:px-6"
              role="alert"
            >
              <AlertTriangle
                className="h-10 w-10 text-evo-red"
                aria-hidden
              />
              <p className="text-base font-semibold text-white">
                This video is unavailable
              </p>
              <p className="max-w-md text-sm text-white/70">
                {errorMessage ||
                  "It may still be processing or not published yet."}
              </p>
              <button
                type="button"
                onClick={retry}
                className="mt-1 inline-flex items-center gap-2 rounded-full bg-evo-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-evo-red-hover"
              >
                Retry
              </button>
            </div>
          )}

          {state === "loaded" && playback && (
            <HlsVideoPlayer
              playback={playback}
              onProgressTime={handleProgress}
              onPause={handleAnimPause}
              onEnded={handleAnimEnded}
              resumePosition={resumeLoaded ? resumePosition : 0}
            />
          )}
        </div>

        {/* Video info + social */}
        {state === "loaded" && playback && (
          <article className="mt-4">
            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight text-gray-950">
              {playback.title}
            </h1>

            {/* Creator row: identity + Follow (left), social actions (right) */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-evo-red to-orange-500 text-sm font-bold text-white sm:h-11 sm:w-11">
                  {channel?.name?.trim()?.[0]?.toUpperCase() ?? "E"}
                </div>
                <div className="min-w-0">
                  {channel && (
                    <p className="truncate text-[15px] font-semibold leading-tight text-gray-900">
                      {channel.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {followerCount != null
                      ? `${followerCount.toLocaleString()} follower${
                          followerCount === 1 ? "" : "s"
                        }`
                      : "EVO creator hub"}
                  </p>
                </div>
                {canFollow && (
                  <button
                    type="button"
                    disabled={anyPending}
                    aria-pressed={summary.isFollowing}
                    aria-label={summary.isFollowing ? "Unfollow hub" : "Follow hub"}
                    onClick={handleFollow}
                    className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      summary.isFollowing
                        ? "border border-gray-200 bg-gray-100 text-gray-800 hover:bg-gray-200"
                        : "bg-evo-red text-white hover:bg-evo-red-hover"
                    }`}
                  >
                    {summary.isFollowing ? (
                      <UserCheck className="h-4 w-4" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    {summary.isFollowing ? "Following" : "Follow"}
                    {followerCount != null && (
                      <span className="opacity-70">
                        · {countLabel(followerCount)}
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Real social actions — optimistic state, no fake counts */}
              <SocialButtons
                likeCount={followerCount != null ? summary.likeCount : 0}
                commentCount={followerCount != null ? summary.commentCount : 0}
                shareCount={followerCount != null ? summary.shareCount : 0}
                followerCount={null}
                isLiked={summary.isLiked}
                isSaved={summary.isSaved}
                isFollowing={summary.isFollowing}
                pendingAction={pendingAction}
                onLike={handleLike}
                onSave={handleSave}
                onFollow={handleFollow}
                onShare={handleShare}
                onComments={handleCommentsJump}
                commentsOpen
                hideFollow
              />
            </div>

            {/* Description panel + subtle technical metadata */}
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500">
                {publishedLabel(playback.publishedAt) && (
                  <span>Published {publishedLabel(playback.publishedAt)}</span>
                )}
                {playback.publicationStatus === "PUBLISHED" &&
                  playback.processingStatus === "READY" && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-600"
                      title="Playback stream is ready"
                    >
                      <Radio className="h-3 w-3" aria-hidden />
                      HLS Ready
                    </span>
                  )}
                {playback.availableQualities?.length != null && (
                  <span>
                    {playback.availableQualities.length} quality level
                    {playback.availableQualities.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              {playback.description ? (
                <div className="mt-2.5">
                  <p
                    className={`text-sm leading-relaxed break-words text-gray-700 ${
                      descExpanded ? "" : "line-clamp-3"
                    }`}
                  >
                    {playback.description}
                  </p>
                  {playback.description.length > 200 && (
                    <button
                      type="button"
                      onClick={() => setDescExpanded((v) => !v)}
                      className="mt-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
                    >
                      {descExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  No description provided.
                </p>
              )}
            </div>
          </article>
        )}

        {/* Comments — proper section below the details */}
        {state === "loaded" && playback && (
          <section id="comments" className="mt-7 sm:mt-8">
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-gray-950 sm:leading-tight">
              Comments · {summaryLoaded ? summary.commentCount : 0}
            </h2>
            <div className="mt-4">
              <CommentsSection
                videoId={videoId}
                isAuthenticated={isAuthenticated}
                onRequireAuth={() => router.push("/?auth=signin")}
                notify={notify}
                onCountChange={handleCountChange}
              />
            </div>
          </section>
        )}
      </main>

      {/* In-app share dialog — opens instantly, records only on real shares. */}
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={playback?.title ?? "EVO video"}
        url={shareUrl}
        currentTime={playheadRef.current}
        onShared={handleShared}
      />
    </div>
  );
}