import type { PlaybackQuality } from "@/lib/api";

/**
 * Format a duration in seconds as "m:ss". Pure + testable.
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const mm = Math.floor(whole / 60);
  const ss = whole % 60;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}

export interface QualityOption {
  label: string;
  detail: string;
}

/**
 * Build the quality selector options from the REAL playback metadata levels
 * (never hard-coded), sorted highest resolution first. Returns null when there
 * are no rendered qualities.
 */
export function buildQualityOptions(
  qualities: PlaybackQuality[] | null | undefined,
): QualityOption[] | null {
  if (!qualities || qualities.length === 0) return null;
  const sorted = [...qualities].sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
  return sorted.map((q) => ({
    label: q.label,
    detail: q.height ? `${q.width ?? ""}×${q.height}` : "",
  }));
}
