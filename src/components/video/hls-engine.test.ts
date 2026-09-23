import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock hls.js so the engine can be tested without a real MSE implementation.
const mockHlsInstance = vi.hoisted(() => ({
  on: vi.fn(),
  loadSource: vi.fn(),
  attachMedia: vi.fn(),
  destroy: vi.fn(),
  isSupported: vi.fn(() => true),
}));

vi.mock("hls.js", () => {
  // `new Hls()` must return the shared mock instance.
  const HlsMock = function () {
    return mockHlsInstance;
  } as unknown as { new (): typeof mockHlsInstance } & {
    isSupported: typeof mockHlsInstance.isSupported;
    Events: { ERROR: string };
  };
  HlsMock.isSupported = mockHlsInstance.isSupported;
  HlsMock.Events = { ERROR: "hlsError" };
  return { default: HlsMock };
});

import {
  setupHlsEngine,
  canPlayNativeHls,
  isHlsJsSupported,
} from "@/components/video/hls-engine";

function makeVideo(canPlay: string = ""): HTMLVideoElement {
  const video = {
    canPlayType: () => canPlay,
    src: "",
    addEventListener: vi.fn(),
  } as unknown as HTMLVideoElement;
  return video;
}

describe("hls-engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHlsInstance.isSupported.mockReturnValue(true);
  });

  it("detects native HLS via canPlayType", () => {
    expect(canPlayNativeHls(makeVideo("maybe"))).toBe(true);
    expect(canPlayNativeHls(makeVideo(""))).toBe(false);
  });

  it("exposes isHlsJsSupported when hls.js reports support", () => {
    mockHlsInstance.isSupported.mockReturnValue(false);
    expect(isHlsJsSupported()).toBe(false);
    mockHlsInstance.isSupported.mockReturnValue(true);
    expect(isHlsJsSupported()).toBe(true);
  });

  it("uses native HLS and sets video.src when the browser supports it", () => {
    const video = makeVideo("maybe");
    const result = setupHlsEngine(video, "http://x/master.m3u8", vi.fn());
    expect(result.kind).toBe("native");
    expect(video.src).toBe("http://x/master.m3u8");
    expect(mockHlsInstance.attachMedia).not.toHaveBeenCalled();
  });

  it("uses hls.js and attaches it to the video otherwise", () => {
    const video = makeVideo(""); // native not supported -> hls.js path
    const result = setupHlsEngine(video, "http://x/master.m3u8", vi.fn());
    expect(result.kind).toBe("hls");
    expect(mockHlsInstance.loadSource).toHaveBeenCalledWith("http://x/master.m3u8");
    expect(mockHlsInstance.attachMedia).toHaveBeenCalledWith(video);
  });

  it("returns unsupported when there is no URL", () => {
    expect(setupHlsEngine(makeVideo(), "", vi.fn()).kind).toBe("unsupported");
  });

  it("returns unsupported when video is null", () => {
    expect(setupHlsEngine(null, "http://x/master.m3u8", vi.fn()).kind).toBe(
      "unsupported",
    );
  });

  it("invokes onFatal only on fatal HLS errors", () => {
    const onFatal = vi.fn();
    setupHlsEngine(makeVideo(), "http://x/master.m3u8", onFatal);

    const onCall = mockHlsInstance.on.mock.calls.find(
      ([name]) => name === "hlsError",
    );
    expect(onCall).toBeDefined();
    const handler = onCall![1] as (evt: unknown, data: { fatal?: boolean }) => void;

    handler({}, { fatal: true });
    expect(onFatal).toHaveBeenCalledTimes(1);

    handler({}, { fatal: false });
    expect(onFatal).toHaveBeenCalledTimes(1);
  });
});
