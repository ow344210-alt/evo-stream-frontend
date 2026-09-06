import { describe, it, expect, beforeEach } from "vitest";
import { resolveMediaUrl, getApiOrigin } from "@/lib/api";

describe("getApiOrigin", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it("defaults to http://localhost:4000 when no API URL is configured", () => {
    expect(getApiOrigin()).toBe("http://localhost:4000");
  });

  it("derives the origin from a configured API URL", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.evo.example.com/api";
    expect(getApiOrigin()).toBe("https://api.evo.example.com");
  });
});

describe("resolveMediaUrl", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it("resolves a backend-relative media URL against the API origin", () => {
    expect(resolveMediaUrl("/api/media/v1/hls/master.m3u8")).toBe(
      "http://localhost:4000/api/media/v1/hls/master.m3u8",
    );
  });

  it("preserves an already-absolute URL", () => {
    expect(resolveMediaUrl("https://cdn.example.com/file.ts")).toBe(
      "https://cdn.example.com/file.ts",
    );
  });

  it("returns an empty string for null/undefined/empty", () => {
    expect(resolveMediaUrl(null)).toBe("");
    expect(resolveMediaUrl(undefined)).toBe("");
    expect(resolveMediaUrl("")).toBe("");
  });
});
