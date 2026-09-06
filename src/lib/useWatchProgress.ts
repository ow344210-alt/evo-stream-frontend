"use client";

import { useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { WatchProgressTracker } from "@/lib/watchProgress";

interface UseWatchProgressOptions {
  videoId: string | null;
  /** Duration in seconds (from playback metadata) used to compute percent. */
  durationSeconds: number | null;
  /** Skip sending progress when the viewer is anonymous. */
  enabled: boolean;
}

/**
 * Persists watch progress to the real backend in a throttled, checkpoint-based
 * manner. `onTimeUpdate` is called from the player on every playhead advance;
 * the tracker decides when a checkpoint is actually sent (roughly every 20s of
 * wall-clock time). `flush` is called on pause / ended / modal-close to record
 * a final, meaningful checkpoint. No DB write happens every second.
 */
export function useWatchProgress({
  videoId,
  durationSeconds,
  enabled,
}: UseWatchProgressOptions) {
  const trackerRef = useRef<WatchProgressTracker | null>(null);
  const lastPositionRef = useRef(0);
  const videoIdRef = useRef(videoId);
  const sendingRef = useRef(false);

  videoIdRef.current = videoId;

  useEffect(() => {
    trackerRef.current = new WatchProgressTracker(durationSeconds);
    lastPositionRef.current = 0;
    sendingRef.current = false;
  }, [videoId, durationSeconds]);

  const send = useCallback(
    async (positionSeconds: number, progressPercent: number) => {
      const id = videoIdRef.current;
      if (!id || !enabled) return;
      if (sendingRef.current) return;
      sendingRef.current = true;
      try {
        await api.recordProgress(id, positionSeconds, progressPercent);
      } catch {
        // Best-effort persistence; never surface raw errors to the viewer.
      } finally {
        sendingRef.current = false;
      }
    },
    [enabled],
  );

  const onTimeUpdate = useCallback(
    (seconds: number) => {
      lastPositionRef.current = seconds;
      const cp = trackerRef.current?.tick(seconds, Date.now());
      if (cp) void send(cp.positionSeconds, cp.progressPercent);
    },
    [send],
  );

  const flush = useCallback(() => {
    const id = videoIdRef.current;
    if (!id || !enabled) return;
    const cp = trackerRef.current?.flush(lastPositionRef.current, Date.now());
    if (cp) void send(cp.positionSeconds, cp.progressPercent);
  }, [enabled, send]);

  return { onTimeUpdate, flush, lastPositionRef };
}
