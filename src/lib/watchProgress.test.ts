import { describe, it, expect } from "vitest";
import {
  CHECKPOINT_INTERVAL_MS,
  clampPercent,
  computeProgressPercent,
  shouldResume,
  WatchProgressTracker,
  RESUME_MIN_POSITION_S,
} from "@/lib/watchProgress";

describe("clampPercent", () => {
  it("clamps to [0, 100]", () => {
    expect(clampPercent(-5)).toBe(0);
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(42)).toBe(42);
    expect(clampPercent(Number.NaN)).toBe(0);
  });
});

describe("computeProgressPercent", () => {
  it("computes percent from position/duration", () => {
    expect(computeProgressPercent(50, 100)).toBe(50);
    expect(computeProgressPercent(120, 100)).toBe(100);
  });

  it("returns 0 when duration is unknown/invalid", () => {
    expect(computeProgressPercent(50, null)).toBe(0);
    expect(computeProgressPercent(50, 0)).toBe(0);
    expect(computeProgressPercent(50, undefined)).toBe(0);
  });
});

describe("shouldResume", () => {
  it("does not resume for null/invalid/zero positions", () => {
    expect(shouldResume(null, 100)).toBe(false);
    expect(shouldResume(undefined, 100)).toBe(false);
    expect(shouldResume(0, 100)).toBe(false);
    expect(shouldResume(Number.NaN, 100)).toBe(false);
  });

  it("does not resume when effectively at the beginning", () => {
    expect(shouldResume(RESUME_MIN_POSITION_S - 1, 100)).toBe(false);
  });

  it("does not resume when the video was completed", () => {
    expect(shouldResume(96, 100)).toBe(false); // ~96% complete
  });

  it("resumes for a sensible mid-stream position", () => {
    expect(shouldResume(30, 100)).toBe(true);
  });

  it("resumes even without a known duration if position is meaningful", () => {
    expect(shouldResume(30, null)).toBe(true);
  });
});

describe("WatchProgressTracker", () => {
  it("does not emit more than one checkpoint per throttle interval", () => {
    const tracker = new WatchProgressTracker(100);
    const t0 = 1_000;

    const first = tracker.tick(10, t0);
    expect(first).toEqual({ positionSeconds: 10, progressPercent: 10 });

    // Many advances within the same interval → no new checkpoint.
    expect(tracker.tick(15, t0 + 5_000)).toBeNull();
    expect(tracker.tick(20, t0 + 10_000)).toBeNull();
    expect(tracker.tick(25, t0 + 19_999)).toBeNull();

    // After the interval → a checkpoint is due.
    const next = tracker.tick(30, t0 + CHECKPOINT_INTERVAL_MS);
    expect(next).toEqual({ positionSeconds: 30, progressPercent: 30 });
  });

  it("flush always yields a final positive checkpoint", () => {
    const tracker = new WatchProgressTracker(200);
    const cp = tracker.flush(150, 1_000);
    expect(cp).toEqual({ positionSeconds: 150, progressPercent: 75 });
  });

  it("flush is deduped: same position is not persisted twice", () => {
    const tracker = new WatchProgressTracker(200);
    expect(tracker.flush(150, 1_000)).toEqual({
      positionSeconds: 150,
      progressPercent: 75,
    });
    expect(tracker.flush(150, 1_100)).toBeNull();
    // A different (advanced) position flushes again.
    expect(tracker.flush(160, 1_200)).toEqual({
      positionSeconds: 160,
      progressPercent: 80,
    });
  });

  it("flush returns null for a zero position (so we never persist spurious 0)", () => {
    const tracker = new WatchProgressTracker(200);
    expect(tracker.flush(0, 1_000)).toBeNull();
  });

  it("reset clears throttling state", () => {
    const tracker = new WatchProgressTracker(100);
    tracker.tick(10, 1_000);
    tracker.reset();
    // Fresh start allows an immediate checkpoint.
    expect(tracker.tick(11, 2_000)).toEqual({
      positionSeconds: 11,
      progressPercent: 11,
    });
  });

  it("ignores negative positions (treats as 0)", () => {
    const tracker = new WatchProgressTracker(100);
    expect(tracker.flush(-3, 1_000)).toBeNull();
    expect(tracker.tick(-1, 1_000)).toBeNull();
  });
});
