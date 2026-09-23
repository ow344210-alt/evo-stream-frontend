import { describe, it, expect } from "vitest";
import {
  DEMO_VIDEOS,
  getDisplayVideos,
  type DisplayVideo,
} from "@/lib/demoFeed";
import type { PublicVideoCard } from "@/lib/api";

const realVideo = (id: string, partial: Partial<PublicVideoCard> = {}): PublicVideoCard => ({
  id,
  title: `Real Video ${id}`,
  description: null,
  durationSeconds: 60,
  posterUrl: "/api/media/x.jpg",
  publishedAt: new Date().toISOString(),
  channel: { id: "c", name: "Some Hub", slug: "some-hub" },
  category: { id: "cat", name: "Docs", slug: "docs" },
  ...partial,
});

describe("DEMO_VIDEOS", () => {
  it("has exactly 4 curated demo picks with the planned titles and hubs", () => {
    expect(DEMO_VIDEOS).toHaveLength(4);
    expect(DEMO_VIDEOS.map((v) => v.title)).toEqual([
      "Beyond the Horizon",
      "City Stories",
      "The Last Light",
      "Into the Wild",
    ]);
    expect(DEMO_VIDEOS.map((v) => v.hubName)).toEqual([
      "Horizon Studios",
      "Urban Frame",
      "Northstar Media",
      "Explore Network",
    ]);
  });

  it("uses the spec durations (12:48 / 18:24 / 14:16 / 21:05)", () => {
    expect(DEMO_VIDEOS.map((v) => v.durationSeconds)).toEqual([768, 1104, 856, 1265]);
  });

  it("uses distinct local realistic poster thumbnails shipped with the frontend", () => {
    const expected: ReadonlyArray<[string, string]> = [
      ["Beyond the Horizon", "/images/beyond_horizon_poster.jpg"],
      ["City Stories", "/images/city_faces_poster.jpg"],
      ["The Last Light", "/images/rana_poster.jpg"],
      ["Into the Wild", "/images/maa_poster.jpg"],
    ];
    for (const [title, thumbnail] of expected) {
      const demo = DEMO_VIDEOS.find((v) => v.title === title);
      expect(demo?.thumbnail).toBe(thumbnail);
    }
    const thumbnails = DEMO_VIDEOS.map((v) => v.thumbnail);
    expect(new Set(thumbnails).size).toBe(thumbnails.length);
  });
});

describe("getDisplayVideos", () => {
  const demo = (list: DisplayVideo[]) => list.filter((v) => v.isFallback);
  const real = (list: DisplayVideo[]) => list.filter((v) => !v.isFallback);

  it("API failure / empty feed -> exactly 4 demo cards (Scenarios 0-A, 0-B)", () => {
    const out = getDisplayVideos([]);
    expect(out).toHaveLength(4);
    expect(real(out)).toHaveLength(0);
    expect(demo(out)).toHaveLength(4);
    expect(out.map((v) => v.title)).toEqual(DEMO_VIDEOS.map((v) => v.title));
  });

  it("1 usable real video -> real card first, then 3 demo cards (Scenario 1)", () => {
    const out = getDisplayVideos([realVideo("r1")]);
    expect(out).toHaveLength(4);
    expect(real(out).map((v) => v.id)).toEqual(["r1"]);
    expect(demo(out)).toHaveLength(3);
    expect(out[0].isFallback).toBe(false);
  });

  it("2 real -> 2 real + 2 demo (Scenario 2)", () => {
    const out = getDisplayVideos([realVideo("r1"), realVideo("r2")]);
    expect(out).toHaveLength(4);
    expect(real(out)).toHaveLength(2);
    expect(demo(out)).toHaveLength(2);
  });

  it("3 real -> 3 real + 1 demo (Scenario 3)", () => {
    const out = getDisplayVideos([realVideo("r1"), realVideo("r2"), realVideo("r3")]);
    expect(out).toHaveLength(4);
    expect(real(out)).toHaveLength(3);
    expect(demo(out)).toHaveLength(1);
    expect(demo(out)[0].title).toBe("Beyond the Horizon");
  });

  it("exactly 4 real -> all 4 real, no demo fill (Scenario 4)", () => {
    const out = getDisplayVideos([realVideo("r1"), realVideo("r2"), realVideo("r3"), realVideo("r4")]);
    expect(out).toHaveLength(4);
    expect(real(out)).toHaveLength(4);
    expect(demo(out)).toHaveLength(0);
  });

  it("5+ real -> all real shown, no demo fill (Scenario 5+)", () => {
    const out = getDisplayVideos(Array.from({ length: 12 }, (_, i) => realVideo(`r${i + 1}`)));
    expect(out).toHaveLength(12);
    expect(real(out)).toHaveLength(12);
    expect(demo(out)).toHaveLength(0);
  });

  it("skips unusable real records (blank ids / blank titles) and fills with demo cards", () => {
    const out = getDisplayVideos([
      realVideo("", { title: "" }),
      realVideo("  ", { title: "   " }),
      { ...realVideo("r1") },
    ]);
    expect(real(out)).toHaveLength(1);
    expect(demo(out)).toHaveLength(3);
  });

  it("never fabricates backend ids for demo cards and marks them as fallback-only", () => {
    const out = getDisplayVideos([]);
    for (const v of out) {
      expect(v.isFallback).toBe(true);
      expect(v.id).toBeNull();
    }
  });

  it("preserves real-video data on real cards (id, hub, duration)", () => {
    const src = realVideo("r1", { durationSeconds: 731, channel: { id: "c", name: "Night Owl", slug: "night-owl" } });
    const out = getDisplayVideos([src]);
    const card = out[0];
    expect(card.id).toBe("r1");
    expect(card.hubName).toBe("Night Owl");
    expect(card.durationSeconds).toBe(731);
    expect(card.categoryName).toBe("Docs");
    expect(card.isFallback).toBe(false);
  });
});