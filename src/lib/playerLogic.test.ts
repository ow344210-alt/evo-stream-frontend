import { describe, it, expect } from "vitest";
import { formatTime, buildQualityOptions } from "@/lib/playerLogic";

describe("formatTime", () => {
  it("formats seconds as m:ss", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(5)).toBe("0:05");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(600)).toBe("10:00");
    expect(formatTime(3625)).toBe("60:25");
  });

  it("handles invalid/negative input", () => {
    expect(formatTime(-1)).toBe("0:00");
    expect(formatTime(NaN)).toBe("0:00");
    expect(formatTime(Infinity)).toBe("0:00");
  });
});

describe("buildQualityOptions", () => {
  it("returns null when there are no rendered qualities", () => {
    expect(buildQualityOptions(null)).toBeNull();
    expect(buildQualityOptions([])).toBeNull();
    expect(buildQualityOptions(undefined)).toBeNull();
  });

  it("builds options from REAL metadata levels sorted highest first", () => {
    const options = buildQualityOptions([
      { label: "360p", width: 640, height: 360, bitrateKbps: 450 },
      { label: "1080p", width: 1920, height: 1080, bitrateKbps: 2800 },
      { label: "720p", width: 1280, height: 720, bitrateKbps: 1500 },
      { label: "480p", width: 854, height: 480, bitrateKbps: 800 },
    ]);
    expect(options?.map((o) => o.label)).toEqual(["1080p", "720p", "480p", "360p"]);
    expect(options?.[0].detail).toBe("1920×1080");
  });
});
