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
import { Tooltip } from "@/components/ui/Tooltip";
import Hls from "hls.js";

const PLAYBACK_RATES = [0.5, 1, 1.25, 1.5, 2];

/** Inactivity (while playing) before the control bar auto-hides, in ms. */
const AUTO_HIDE_DELAY_MS = 2800;

type FullscreenDocument = {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
};

type FullscreenElementWithWebkit = HTMLElement & {
  webkitRequestFullscreen?: () => void | Promise<void>;
};

type FullscreenVideoWithWebkit = HTMLVideoElement & {
  webkitRequestFullscreen?: () => void | Promise<void>;
  webkitEnterFullscreen?: () => void;
};

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

  // Auto-hiding controls: visible on load, fade out only after inactivity while
  // playing, and return on mouse movement / hover / touch / focus / interaction.
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(false);
  const seekingRef = useRef(false);
  const menusOpenRef = useRef(false);

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

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    if (!isPlayingRef.current) return;
    if (seekingRef.current || menusOpenRef.current) return;
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, AUTO_HIDE_DELAY_MS);
  }, [clearHideTimer]);

  const showControls = useCallback(
    (schedule = true) => {
      setControlsVisible(true);
      clearHideTimer();
      if (schedule) scheduleHide();
    },
    [clearHideTimer, scheduleHide],
  );

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
    const onWaiting = () => {
      setStatus((s) => (s === "ready" ? "loading" : s));
      // Buffering: keep controls on screen (no inactivity hide while waiting).
      showControls(false);
    };
    const handlePlaying = () => {
      setStatus("ready");
      setIsPlaying(true);
      isPlayingRef.current = true;
      onPlay?.();
      showControls();
    };
    const handlePause = () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
      onPause?.();
      // Paused → controls stay visible (no auto-hide timer runs while paused).
      showControls(false);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
      onEnded?.();
      // Ended → controls remain so the viewer can replay/manage.
      showControls(false);
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
  }, [hlsUrl, playback?.durationSeconds, resumePosition, onProgressTime, onEnded, showControls]);

  // Fullscreen change tracking (standard + Safari/iOS webkit prefixed).
  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(
        Boolean(
          document.fullscreenElement ||
            (document as FullscreenDocument).webkitFullscreenElement,
        ),
      );
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  // Keep controls safely visible while a quality/speed menu is open and resume
  // the inactivity timer once the menu closes.
  useEffect(() => {
    menusOpenRef.current = qualityMenuOpen || speedMenuOpen;
    if (qualityMenuOpen || speedMenuOpen) {
      clearHideTimer();
    } else {
      scheduleHide();
    }
  }, [qualityMenuOpen, speedMenuOpen, clearHideTimer, scheduleHide]);

  // Clear the inactivity timer on unmount.
  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    // Interacting always surfaces the controls (and only auto-hides later when
    // actually playing).
    showControls();
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
  }, [onError, showControls]);

  const onSeekPointerDown = useCallback(() => {
    seekingRef.current = true;
    clearHideTimer();
  }, [clearHideTimer]);

  const onSeekPointerUp = useCallback(() => {
    seekingRef.current = false;
    showControls();
  }, [showControls]);

  const seekTo = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video) return;
      const next = Number(e.target.value);
      video.currentTime = next;
      setCurrentTime(next);
      // Seeking counts as interaction: keep controls on screen.
      showControls();
    },
    [showControls],
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    showControls();
  }, [showControls]);

  const setVolumeValue = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video) return;
      const next = Number(e.target.value);
      video.volume = next;
      video.muted = next === 0;
      showControls();
    },
    [showControls],
  );

  const setPlaybackRate = useCallback(
    (next: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.playbackRate = next;
      setRate(next);
      setSpeedMenuOpen(false);
      showControls();
    },
    [showControls],
  );

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el) return;

    const doc = document as Document & FullscreenDocument;
    const isFullscreen = Boolean(
      doc.fullscreenElement || doc.webkitFullscreenElement,
    );

    if (isFullscreen) {
      if (typeof doc.exitFullscreen === "function") {
        doc.exitFullscreen().catch(() => undefined);
      } else if (typeof doc.webkitExitFullscreen === "function") {
        doc.webkitExitFullscreen();
      }
      return;
    }

    const elWithWebkit = el as FullscreenElementWithWebkit;
    const videoWithWebkit = video as FullscreenVideoWithWebkit | null;

    // Entering/leaving fullscreen is an interaction: keep controls on screen.
    showControls();

    // Preferred order: container -> video -> webkit prefixed -> webkitEnterFullscreen.
    if (typeof el.requestFullscreen === "function") {
      el.requestFullscreen().catch(() => {
        if (typeof video?.requestFullscreen === "function") {
          video.requestFullscreen().catch(() => undefined);
        } else if (typeof elWithWebkit.webkitRequestFullscreen === "function") {
          elWithWebkit.webkitRequestFullscreen();
        } else if (
          typeof videoWithWebkit?.webkitEnterFullscreen === "function"
        ) {
          videoWithWebkit.webkitEnterFullscreen();
        }
      });
    } else if (typeof elWithWebkit.webkitRequestFullscreen === "function") {
      elWithWebkit.webkitRequestFullscreen();
    } else if (
      typeof videoWithWebkit?.webkitEnterFullscreen === "function"
    ) {
      videoWithWebkit.webkitEnterFullscreen();
    }
  }, [showControls]);

  // Manual quality selection via hls.js currentLevel.
  const selectQuality = useCallback(
    (label: string) => {
      setSelectedQuality(label);
      setQualityMenuOpen(false);
      // Picking a quality is an interaction: keep the controls on screen.
      showControls();
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
    [playback?.availableQualities, showControls],
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
  const qualityLabel =
    selectedQuality === "auto" ? "Auto" : selectedQuality;

  return (
    <div
      ref={containerRef}
      className={`relative w-full group bg-black overflow-hidden ${
        controlsVisible ? "" : "cursor-none"
      } ${className ?? ""}`}
      style={{ aspectRatio: "16/9" }}
      role="region"
      aria-label="Video player"
      aria-busy={status === "loading"}
      onMouseMove={() => showControls()}
      onMouseLeave={() => scheduleHide()}
      onTouchStart={() => showControls()}
      onFocusCapture={() => showControls(false)}
      onBlurCapture={() => scheduleHide()}
    >
      {/* Video element (native HLS for Safari, hls.js elsewhere). */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain"
        poster={videoPoster}
        playsInline
        preload="metadata"
        controls={false}
        onClick={togglePlay}
        aria-label="Video player"
      />

      {/* Poster overlay shown while idle/loading if we have one. */}
      {(status === "loading") && videoPoster && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/40"
          role="status"
        >
          <Loader2 className="w-12 h-12 text-white/80 animate-spin" aria-hidden />
        </div>
      )}

      {/* Loading overlay (no poster path). */}
      {status === "loading" && !videoPoster && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white"
          role="status"
        >
          <Loader2 className="w-12 h-12 text-evo-red animate-spin" aria-hidden />
          <p className="mt-4 text-sm text-white/80">Loading stream…</p>
        </div>
      )}

      {/* Error overlay. */}
      {status === "error" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black text-white px-6 text-center"
          role="alert"
        >
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
      <div
        data-testid="evoplayer-controls"
        aria-hidden={!controlsVisible}
        onMouseEnter={() => showControls(false)}
        onMouseLeave={() => scheduleHide()}
        className={`absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2.5 sm:px-4 pt-6 sm:pt-8 pb-2 sm:pb-3 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Seek bar. */}
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-white/80 mb-1.5 sm:mb-2">
          <span className="font-mono tabular-nums">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={seekTo}
            onPointerDown={onSeekPointerDown}
            onPointerUp={onSeekPointerUp}
            onPointerCancel={onSeekPointerUp}
            aria-label="Seek"
            className="flex-1 h-1.5 accent-evo-red cursor-pointer"
          />
          <span className="font-mono tabular-nums">
            {formatTime(duration || playback?.durationSeconds || 0)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1.5 sm:gap-3 text-white">
          {/* Left: play/pause + volume (icon-only with tooltips). */}
          <div className="flex items-center gap-0.5 sm:gap-2">
            <Tooltip label={togglePlayPauseLabel} side="top">
              <button
                onClick={togglePlay}
                aria-label={togglePlayPauseLabel}
                className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                )}
              </button>
            </Tooltip>
            <Tooltip label={isMuted || volume === 0 ? "Unmute" : "Mute"} side="top">
              <button
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
                className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </Tooltip>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={setVolumeValue}
              onPointerDown={onSeekPointerDown}
              onPointerUp={onSeekPointerUp}
              onPointerCancel={onSeekPointerUp}
              aria-label="Volume"
              className="w-12 sm:w-16 md:w-20 h-1.5 accent-evo-red cursor-pointer"
            />
          </div>

          {/* Right: speed + quality + fullscreen. */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Playback speed — compact value + tooltip. */}
            <div className="relative">
              <Tooltip
                label="Playback speed"
                side="top"
                align="center"
                id="speed-tooltip"
              >
                <button
                  onClick={() => {
                    setSpeedMenuOpen((v) => !v);
                    setQualityMenuOpen(false);
                  }}
                  aria-label="Playback speed"
                  aria-describedby="speed-tooltip"
                  className="h-9 px-2.5 sm:px-3 rounded-full hover:bg-white/10 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center"
                >
                  {rate}x
                </button>
              </Tooltip>
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

            {/* Quality — icon-only gear; current quality lives in the tooltip. */}
            {qualityOptions && (
              <div className="relative">
                <Tooltip
                  label={`Quality (${qualityLabel})`}
                  side="top"
                  align="end"
                  id="quality-tooltip"
                >
                  <button
                    onClick={() => {
                      setQualityMenuOpen((v) => !v);
                      setSpeedMenuOpen(false);
                    }}
                    aria-label="Quality"
                    aria-describedby="quality-tooltip"
                    className="h-9 w-10 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </Tooltip>
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

            <Tooltip
              label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              side="top"
              align="end"
            >
              <button
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                className="p-2 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
