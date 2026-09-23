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
  /** Optional playback rate (default 1.0) to scale consumed media duration. */
  playbackRate?: number;
}

const ANON_DEVICE_STORAGE_KEY = "evo_anon_vid_id";

function getOrCreateAnonDeviceId(): string {
  if (typeof window === "undefined" || !window.localStorage) {
    return "web_fallback_session";
  }
  try {
    let id = localStorage.getItem(ANON_DEVICE_STORAGE_KEY);
    if (!id || id.length < 10) {
      id = "web_" + crypto.randomUUID();
      localStorage.setItem(ANON_DEVICE_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "web_fallback_session";
  }
}

/**
 * Persists watch progress to the real backend in a throttled, checkpoint-based
 * manner, and records genuine qualified playback view events once active consumed
 * media duration reaches the threshold (>= 5s, or 50% for clips < 10s).
 */
export function useWatchProgress({
  videoId,
  durationSeconds,
  enabled,
  playbackRate = 1.0,
}: UseWatchProgressOptions) {
  const trackerRef = useRef<WatchProgressTracker | null>(null);
  const lastPositionRef = useRef(0);
  const videoIdRef = useRef(videoId);
  const sendingRef = useRef(false);

  // Qualified view tracking state
  const viewTriggeredRef = useRef(false);
  const activeWatchAccumulatorRef = useRef(0);
  const lastTickTimeRef = useRef<number | null>(null);

  videoIdRef.current = videoId;

  useEffect(() => {
    trackerRef.current = new WatchProgressTracker(durationSeconds);
    lastPositionRef.current = 0;
    sendingRef.current = false;
    viewTriggeredRef.current = false;
    activeWatchAccumulatorRef.current = 0;
    lastTickTimeRef.current = null;
  }, [videoId, durationSeconds]);

  const sendProgress = useCallback(
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

  const checkAndTriggerQualifiedView = useCallback(
    async (seconds: number) => {
      const id = videoIdRef.current;
      if (!id || viewTriggeredRef.current) return;

      const now = Date.now();
      if (lastTickTimeRef.current !== null) {
        const wallClockDeltaS = (now - lastTickTimeRef.current) / 1000;
        // Ignore huge jumps from tab switching or seeking
        if (wallClockDeltaS > 0 && wallClockDeltaS < 2.0) {
          activeWatchAccumulatorRef.current += wallClockDeltaS * playbackRate;
        }
      }
      lastTickTimeRef.current = now;

      const duration = durationSeconds ?? 0;
      const minRequired = duration > 0 && duration < 10 ? Math.min(5.0, duration * 0.5) : 5.0;

      if (activeWatchAccumulatorRef.current >= minRequired) {
        viewTriggeredRef.current = true;
        try {
          const deviceId = getOrCreateAnonDeviceId();
          await api.recordView(id, deviceId, Math.round(activeWatchAccumulatorRef.current * 10) / 10);
        } catch {
          // Best effort view tracking beacon
        }
      }
    },
    [durationSeconds, playbackRate],
  );

  const onTimeUpdate = useCallback(
    (seconds: number) => {
      lastPositionRef.current = seconds;
      void checkAndTriggerQualifiedView(seconds);

      const cp = trackerRef.current?.tick(seconds, Date.now());
      if (cp) void sendProgress(cp.positionSeconds, cp.progressPercent);
    },
    [checkAndTriggerQualifiedView, sendProgress],
  );

  const flush = useCallback(() => {
    const id = videoIdRef.current;
    lastTickTimeRef.current = null;
    if (!id || !enabled) return;
    const cp = trackerRef.current?.flush(lastPositionRef.current, Date.now());
    if (cp) void sendProgress(cp.positionSeconds, cp.progressPercent);
  }, [enabled, sendProgress]);

  return { onTimeUpdate, flush, lastPositionRef };
}
