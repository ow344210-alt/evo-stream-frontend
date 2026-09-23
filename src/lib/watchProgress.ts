"use client";

/**
 * Watch-progress policy helpers.
 *
 * The DB must not be written every second. `WatchProgressTracker` throttles
 * checkpoints to roughly every `CHECKPOINT_INTERVAL_MS` of wall-clock time while
 * the video is advancing, and always allows an explicit `flush()` (used on
 * pause / ended / modal-close / page-lifecycle) so a final checkpoint is
 * recorded. `reset()` clears the tracker when the video changes.
 */

export const CHECKPOINT_INTERVAL_MS = 20000;

/** Any position at/below this is "effectively at the beginning" → do not resume. */
export const RESUME_MIN_POSITION_S = 5;

/** A progressPercent at/above this means "effectively completed" → do not resume. */
export const RESUME_COMPLETED_PERCENT = 95;

export interface Checkpoint {
  positionSeconds: number;
  progressPercent: number;
}

/** Clamp a progress percent to the [0, 100] range. */
export function clampPercent(percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  return Math.min(Math.max(percent, 0), 100);
}

/** Percent complete given the current position and the known duration (0 if unknown). */
export function computeProgressPercent(
  positionSeconds: number,
  durationSeconds: number | null | undefined,
): number {
  if (!durationSeconds || durationSeconds <= 0 || !Number.isFinite(durationSeconds)) {
    return 0;
  }
  return clampPercent((positionSeconds / durationSeconds) * 100);
}

/**
 * Whether an authenticated viewer should resume from `positionSeconds`.
 *
 * - Do not resume when the position is effectively at the beginning.
 * - Do not resume when the video was effectively completed (replay is then more
 *   appropriate).
 * - Do not resume when the saved position is invalid/unknown.
 */
export function shouldResume(
  positionSeconds: number | null | undefined,
  durationSeconds: number | null | undefined,
): boolean {
  if (
    positionSeconds == null ||
    !Number.isFinite(positionSeconds) ||
    positionSeconds <= 0
  ) {
    return false;
  }
  if (positionSeconds < RESUME_MIN_POSITION_S) return false;
  if (durationSeconds && durationSeconds > 0 && Number.isFinite(durationSeconds)) {
    const percent = computeProgressPercent(positionSeconds, durationSeconds);
    if (percent >= RESUME_COMPLETED_PERCENT) return false;
    // Never seek past the end.
    if (positionSeconds >= durationSeconds - 1) return false;
  }
  return true;
}

/**
 * A small stateful throttle for watch-progress checkpoints. Feed it the current
 * playhead position (via `tick`) as it advances; it returns a `Checkpoint` only
 * when a checkpoint is due. Call `flush` for a guaranteed final checkpoint.
 */
export class WatchProgressTracker {
  private lastReportAt = 0;
  private lastReportedSeconds = 0;

  constructor(private readonly durationSeconds?: number | null) {}

  private makeCheckpoint(positionSeconds: number): Checkpoint {
    return {
      positionSeconds: Math.max(0, Math.floor(positionSeconds)),
      progressPercent: Math.round(
        computeProgressPercent(positionSeconds, this.durationSeconds),
      ),
    };
  }

  /**
   * Called on each playhead advance. Returns a checkpoint when enough wall-clock
   * time has elapsed since the last send (and the position has advanced enough
   * to be worth persisting).
   */
  tick(positionSeconds: number, now: number): Checkpoint | null {
    const seconds = positionSeconds >= 0 ? positionSeconds : 0;
    if (seconds <= 0) return null;
    const advanced =
      seconds - this.lastReportedSeconds >= 1 || this.lastReportedSeconds === 0;
    if (!this.lastReportAt || (now - this.lastReportAt >= CHECKPOINT_INTERVAL_MS && advanced)) {
      this.lastReportAt = now;
      this.lastReportedSeconds = seconds;
      return this.makeCheckpoint(seconds);
    }
    return null;
  }

  /**
   * Always returns a final checkpoint for a meaningful position (> 0), used on
   * pause / ended / close. These are discrete lifecycle events (never per-second),
   * so persisting is safe. Skips only when the position is identical to the last
   * reported one (avoids redundant upserts for the same playhead).
   */
  flush(positionSeconds: number, now: number): Checkpoint | null {
    const seconds = positionSeconds >= 0 ? positionSeconds : 0;
    if (seconds <= 0) return null;
    if (seconds === this.lastReportedSeconds && this.lastReportAt) {
      // Already persisted this exact position; nothing new to write.
      return null;
    }
    this.lastReportAt = now;
    this.lastReportedSeconds = seconds;
    return this.makeCheckpoint(seconds);
  }

  /** Clear throttling state when a new video loads. */
  reset(): void {
    this.lastReportAt = 0;
    this.lastReportedSeconds = 0;
  }
}
