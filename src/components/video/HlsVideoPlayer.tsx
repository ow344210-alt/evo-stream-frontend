"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Loader2,
  AlertTriangle,
  Settings,
} from "lucide-react";
import type { VideoPlayback } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/api";
import { formatTime, buildQualityOptions } from "@/lib/playerLogic";
import {
  setupHlsEngine,
} from "@/components/video/hls-engine";
import Hls from "hls.js";

const PLAYBACK_RATES = [0.5, 1, 1.25, 1.5, 2];

interface HlsVideoPlayerProps {
  /** Real playback metadata returned by the P2-5 API (authoritative). */
  playback: VideoPlayback | null;
  /** Native video poster / loading image shown before playback. */
  autoPlay?: boolean;
  /** Fired when the user requests playback that the browser blocks (autoplay). */
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (message: string) => void;
  /**
   * Fired with the current playhead (seconds) on every `timeupdate`. The
   * consumer throttles/persists; used for watch-progress checkpoints.
   */
  onProgressTime?: (seconds: number) => void;
  /**
   * If set, seek the video to this position once metadata is ready. Non-zero
   * only when the authenticated viewer has real saved progress.
   */
  resumePosition?: number;
  className?: string;
}

type PlayerStatus = "idle" | "loading" | "ready" | "error";

export function HlsVideoPlayer({
  playback,
  autoPlay = false,
  onPlay,
  onPause,
  onEnded,
  onError,
  onProgressTime,
  resumePosition,
  className,
}: HlsVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const destroyedRef = useRef(false);
  const resumeAppliedRef = useRef(false);

  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [errorTitle, setErrorTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [retryNonce, setRetryNonce] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<string>("auto");
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);

  const hlsUrl = useMemo(() => {
    if (!playback?.hlsMasterUrl) return null;
    return resolveMediaUrl(playback.hlsMasterUrl);
  }, [playback?.hlsMasterUrl]);

  const posterUrl = useMemo(() => {
    if (!playback?.posterUrl) return undefined;
    return resolveMediaUrl(playback.posterUrl) || undefined;
  }, [playback?.posterUrl]);
  const [videoPoster, setVideoPoster] = useState<string | undefined>(undefined);

  // Reflect playback metadata post back into state when the video changes.
  useEffect(() => {
    hlsRef.current = null;
    destroyedRef.current = false;
    resumeAppliedRef.current = false;
    setStatus("loading");
    setErrorMessage("");
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(playback?.durationSeconds ?? 0);
    setRate(1);
    setSelectedQuality("auto");
    setVideoPoster(posterUrl);

    const video = videoRef.current;
    if (!video) return;
    // Remove any previously attached source so switching videos never mixes state.
    try {
      video.removeAttribute("src");
      video.load();
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playback?.id, retryNonce]);

  // Core HLS attach lifecycle.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!hlsUrl) {
      setStatus("error");
      setErrorMessage("This video is not available for playback.");
      onError?.("This video is not available for playback.");
      return;
    }

    const engine = setupHlsEngine(
      video,
      hlsUrl,
      () => {
        setStatus("error");
        setErrorMessage("Playback failed. Please try again.");
        onError?.("Playback failed.");
      },
    );

    if (engine.kind === "unsupported") {
      setStatus("error");
      setErrorMessage(
        "This browser cannot play HLS video. Try a recent version of Chrome, Edge, Firefox, or Safari.",
      );
      onError?.("HLS unsupported in this browser.");
      return;
    }

    hlsRef.current = engine.hls;

    const cleanup = () => {
      if (destroyedRef.current) return;
      try {
        video.pause();
      } catch {
        // ignore
      }
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch {
          // ignore
        }
        hlsRef.current = null;
      }
      try {
        video.removeAttribute("src");
        video.load();
      } catch {
        // ignore
      }
    };

    return cleanup;
  }, [hlsUrl, retryNonce, onError]);

  // Wire video element events.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onProgressTime?.(video.currentTime);
    };
    const onLoadedMetadata = () => {
      const dur = video.duration || playback?.durationSeconds || 0;
      setDuration(dur);
      setStatus("ready");
      // Resume once: only after metadata/duration is known and the saved
      // position is still valid (earlier logic rejects start/completed).
      if (
        resumePosition &&
        resumePosition > 0 &&
        !resumeAppliedRef.current &&
        (!dur || resumePosition < dur)
      ) {
        try {
          video.currentTime = resumePosition;
        } catch {
          // ignore seek failures (invalid/environmental)
        }
        resumeAppliedRef.current = true;
      }
    };
    const onCanPlay = () => setStatus("ready");
    const onWaiting = () => setStatus((s) => (s === "ready" ? "loading" : s));
    const handlePlaying = () => {
      setStatus("ready");
      setIsPlaying(true);
      onPlay?.();
    };
    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    const onRateChange = () => setRate(video.playbackRate);
    const onVolume = () => {
      setIsMuted(video.muted);
      setVolume(video.volume);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("ratechange", onRateChange);
    video.addEventListener("volumechange", onVolume);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("ratechange", onRateChange);
      video.removeEventListener("volumechange", onVolume);
    };
  }, [hlsUrl, playback?.durationSeconds, resumePosition, onProgressTime, onEnded]);

  // Fullscreen change tracking.
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      try {
        await video.play();
      } catch {
        setStatus("error");
        setErrorMessage("Playback blocked. Click again to start.");
        onError?.("Autoplay blocked");
      }
    } else {
      video.pause();
    }
  }, [onError]);

  const seekTo = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video) return;
      const next = Number(e.target.value);
      video.currentTime = next;
      setCurrentTime(next);
    },
    [],
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  const setVolumeValue = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video) return;
      const next = Number(e.target.value);
      video.volume = next;
      video.muted = next === 0;
    },
    [],
  );

  const setPlaybackRate = useCallback(
    (next: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.playbackRate = next;
      setRate(next);
      setSpeedMenuOpen(false);
    },
    [],
  );

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {
        // Some browsers disallow fullscreen on nested elements; surface via video.
        videoRef.current?.requestFullscreen?.().catch(() => undefined);
      });
    } else {
      document.exitFullscreen?.().catch(() => undefined);
    }
  }, []);

  // Manual quality selection via hls.js currentLevel.
  const selectQuality = useCallback(
    (label: string) => {
      setSelectedQuality(label);
      setQualityMenuOpen(false);
      const hls = hlsRef.current;
      if (!hls) return;
      if (label === "auto") {
        hls.currentLevel = -1;
        return;
      }
      const wantedHeight = playback?.availableQualities.find(
        (q) => q.label === label,
      )?.height;
      if (wantedHeight == null) {
        hls.currentLevel = -1;
        return;
      }
      const idx = hls.levels.findIndex((l) => l.height === wantedHeight);
      hls.currentLevel = idx >= 0 ? idx : -1;
    },
    [playback?.availableQualities],
  );

  // Build the quality selector options from real metadata levels.
  const qualityOptions = useMemo(
    () => buildQualityOptions(playback?.availableQualities),
    [playback?.availableQualities],
  );

  const retry = useCallback(() => {
    setErrorTitle("");
    setErrorMessage("");
    setRetryNonce((n) => n + 1);
  }, []);

  const togglePlayPauseLabel = isPlaying ? "Pause" : "Play";

  return (
    <div
      ref={containerRef}
      className={`relative w-full group bg-black overflow-hidden ${className ?? ""}`}
      style={{ aspectRatio: "16/9" }}
      role="region"
      aria-label="Video player"
    >
      {/* Video element (native HLS for Safari, hls.js elsewhere). */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain"
        poster={status !== "ready" ? videoPoster : undefined}
        playsInline
        preload="metadata"
        controls={false}
        onClick={togglePlay}
        aria-label="Video player"
      />

      {/* Poster overlay shown while idle/loading if we have one. */}
      {(status === "loading") && videoPoster && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
          <Loader2 className="w-12 h-12 text-white/80 animate-spin" aria-hidden />
        </div>
      )}

      {/* Loading overlay (no poster path). */}
      {status === "loading" && !videoPoster && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white">
          <Loader2 className="w-12 h-12 text-evo-red animate-spin" aria-hidden />
          <p className="mt-4 text-sm text-white/80">Loading stream…</p>
        </div>
      )}

      {/* Error overlay. */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black text-white px-6 text-center">
          <AlertTriangle className="w-12 h-12 text-evo-red" aria-hidden />
          <p className="text-base font-semibold">{errorTitle || "Playback unavailable"}</p>
          <p className="text-sm text-white/70 max-w-md">{errorMessage}</p>
          <button
            onClick={retry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-evo-red hover:bg-evo-red-hover text-white text-sm font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Center play button when idle/ready but paused/never played. */}
      {status === "ready" && !isPlaying && (
        <button
          onClick={togglePlay}
          aria-label={togglePlayPauseLabel}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-evo-red/90 text-white flex items-center justify-center shadow-evo-button hover:scale-110 active:scale-95 transition-all"
        >
          <Play className="w-7 h-7 fill-white ml-1" />
        </button>
      )}

      {/* Control bar. */}
      <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pt-8 pb-3 opacity-100 transition-opacity">
        {/* Seek bar. */}
        <div className="flex items-center gap-3 text-[11px] text-white/80 mb-2">
          <span className="font-mono tabular-nums">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={seekTo}
            aria-label="Seek"
            className="flex-1 h-1.5 accent-evo-red cursor-pointer"
          />
          <span className="font-mono tabular-nums">
            {formatTime(duration || playback?.durationSeconds || 0)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 sm:gap-3 text-white">
          {/* Left: play/pause + volume. */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={togglePlay}
              aria-label={togglePlayPauseLabel}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            <button
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={setVolumeValue}
              aria-label="Volume"
              className="w-16 sm:w-20 h-1.5 accent-evo-red cursor-pointer"
            />
          </div>

          {/* Right: speed + quality + fullscreen. */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Playback speed. */}
            <div className="relative">
              <button
                onClick={() => {
                  setSpeedMenuOpen((v) => !v);
                  setQualityMenuOpen(false);
                }}
                aria-label="Playback speed"
                className="px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-full hover:bg-white/10 text-[10px] sm:text-xs font-semibold transition-colors"
              >
                {rate}x
              </button>
              {speedMenuOpen && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-gray-700 rounded-xl shadow-xl py-1 min-w-[120px] z-30">
                  {PLAYBACK_RATES.map((r) => (
                    <button
                      key={r}
                      onClick={() => setPlaybackRate(r)}
                      className={`block w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-colors ${
                        r === rate ? "text-evo-red font-bold" : "text-white"
                      }`}
                    >
                      {r}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality selector — driven by REAL metadata levels. */}
            {qualityOptions && (
              <div className="relative">
                <button
                  onClick={() => {
                    setQualityMenuOpen((v) => !v);
                    setSpeedMenuOpen(false);
                  }}
                  aria-label="Quality"
                  className="px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-full hover:bg-white/10 text-[10px] sm:text-xs font-semibold transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                {qualityMenuOpen && (
                  <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-gray-700 rounded-xl shadow-xl py-1 min-w-[140px] sm:min-w-[160px] z-30">
                    <button
                      onClick={() => selectQuality("auto")}
                      className={`block w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-colors ${
                        selectedQuality === "auto"
                          ? "text-evo-red font-bold"
                          : "text-white"
                      }`}
                    >
                      Auto (adaptive)
                    </button>
                    {qualityOptions.map((q) => (
                      <button
                        key={q.label}
                        onClick={() => selectQuality(q.label)}
                        className={`block w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-colors ${
                          selectedQuality === q.label
                            ? "text-evo-red font-bold"
                            : "text-white"
                        }`}
                      >
                        {q.label}
                        {q.detail ? (
                          <span className="ml-2 text-white/50">{q.detail}</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
