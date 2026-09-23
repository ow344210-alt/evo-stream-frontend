import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { HlsVideoPlayer } from "@/components/video/HlsVideoPlayer";
import type { VideoPlayback } from "@/lib/api";

const hlsMock = vi.hoisted(() => {
  const instance = {
    on: vi.fn(),
    loadSource: vi.fn(),
    attachMedia: vi.fn(),
    destroy: vi.fn(),
    levels: [] as { height: number }[],
    currentLevel: -1,
  };
  const HlsMockClass = function () {
    return instance;
  } as unknown as {
    new (): typeof instance;
    isSupported: ReturnType<typeof vi.fn>;
    Events: { ERROR: string };
  };
  HlsMockClass.isSupported = vi.fn(() => true);
  HlsMockClass.Events = { ERROR: "hlsError" };
  return { instance, HlsMockClass };
});

vi.mock("hls.js", () => ({
  default: hlsMock.HlsMockClass,
}));

const MASTER_URL = "https://cdn.example.com/v1/master.m3u8";
const MASTER_URL_2 = "https://cdn.example.com/v2/master.m3u8";

function buildPlayback(overrides: Partial<VideoPlayback> = {}): VideoPlayback {
  return {
    id: "v1",
    title: "Test Video",
    description: null,
    durationSeconds: 600,
    posterUrl: null,
    hlsMasterUrl: MASTER_URL,
    processingStatus: "READY",
    publicationStatus: "PUBLISHED",
    publishedAt: null,
    availableQualities: [
      { label: "1080p", width: 1920, height: 1080, bitrateKbps: 6000 },
      { label: "720p", width: 1280, height: 720, bitrateKbps: 3500 },
      { label: "480p", width: 854, height: 480, bitrateKbps: 1500 },
      { label: "360p", width: 640, height: 360, bitrateKbps: 800 },
    ],
    channel: null,
    ...overrides,
  };
}

function setupVideoMocks(video: HTMLVideoElement): void {
  let currentTime = 0;
  let duration = 600;
  let muted = false;
  let volume = 1;
  let paused = true;
  Object.defineProperty(video, "currentTime", {
    configurable: true,
    get: () => currentTime,
    set: (n: number) => {
      currentTime = Number.isFinite(n) ? n : 0;
    },
  });
  Object.defineProperty(video, "duration", {
    configurable: true,
    get: () => duration,
    set: (n: number) => {
      duration = Number.isFinite(n) ? n : 0;
    },
  });
  Object.defineProperty(video, "muted", {
    configurable: true,
    get: () => muted,
    set: (n: boolean) => {
      muted = n;
    },
  });
  Object.defineProperty(video, "volume", {
    configurable: true,
    get: () => volume,
    set: (n: number) => {
      volume = n;
    },
  });
  Object.defineProperty(video, "paused", {
    configurable: true,
    get: () => paused,
  });
  Object.defineProperty(video, "play", {
    configurable: true,
    value: vi.fn().mockImplementation(() => {
      paused = false;
      return Promise.resolve();
    }),
  });
  Object.defineProperty(video, "pause", {
    configurable: true,
    value: vi.fn().mockImplementation(() => {
      paused = true;
    }),
  });
  Object.defineProperty(video, "load", { configurable: true, value: vi.fn() });
  Object.defineProperty(video, "canPlayType", {
    configurable: true,
    value: vi.fn().mockReturnValue(""),
  });
}

function makeReady(video: HTMLVideoElement): void {
  act(() => {
    video.dispatchEvent(new Event("loadedmetadata"));
  });
}

function renderPlayer(
  playback = buildPlayback(),
  props: Partial<ComponentProps<typeof HlsVideoPlayer>> = {},
) {
  const utils = render(<HlsVideoPlayer playback={playback} {...props} />);
  const video = utils.container.querySelector("video") as HTMLVideoElement;
  return { ...utils, video };
}

describe("HlsVideoPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hlsMock.instance.levels = [
      { height: 2160 },
      { height: 1080 },
      { height: 720 },
      { height: 480 },
      { height: 360 },
    ];
    hlsMock.instance.currentLevel = -1;
    hlsMock.HlsMockClass.isSupported.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes the HLS engine with the master URL", () => {
    renderPlayer();
    expect(hlsMock.instance.loadSource).toHaveBeenCalledWith(MASTER_URL);
    expect(hlsMock.instance.attachMedia).toHaveBeenCalledTimes(1);
    expect(hlsMock.instance.on).toHaveBeenCalledWith(
      "hlsError",
      expect.any(Function),
    );
  });

  it("plays and pauses", () => {
    const { video } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    expect(screen.getAllByLabelText("Play").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByLabelText("Play")[0]);
    expect(video.play).toHaveBeenCalledTimes(1);
    act(() => {
      video.dispatchEvent(new Event("playing"));
    });
    expect(screen.getAllByLabelText("Pause").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByLabelText("Pause")[0]);
    expect(video.pause).toHaveBeenCalledTimes(1);
    act(() => {
      video.dispatchEvent(new Event("pause"));
    });
    expect(screen.getAllByLabelText("Play").length).toBeGreaterThan(0);
  });

  it("seeks via the timeline", () => {
    const { video } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    fireEvent.change(screen.getByLabelText("Seek"), {
      target: { value: "300" },
    });
    expect(video.currentTime).toBe(300);
    expect(screen.getByText("5:00")).toBeInTheDocument();
  });

  it("mutes/unmutes and sets volume", () => {
    const { video } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    fireEvent.click(screen.getByLabelText("Mute"));
    expect(video.muted).toBe(true);
    act(() => {
      video.dispatchEvent(new Event("volumechange"));
    });
    expect(screen.getByLabelText("Unmute")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Volume"), {
      target: { value: "0.5" },
    });
    act(() => {
      video.dispatchEvent(new Event("volumechange"));
    });
    expect((screen.getByLabelText("Volume") as HTMLInputElement).value).toBe(
      "0.5",
    );
  });

  it("changes playback speed", () => {
    const { video } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    fireEvent.click(screen.getByLabelText("Playback speed"));
    fireEvent.click(screen.getByText("2x"));
    expect(video.playbackRate).toBe(2);
    expect(screen.getByLabelText("Playback speed")).toHaveTextContent("2x");
  });

  it("resets playback speed on source change", () => {
    const { video, rerender } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    fireEvent.click(screen.getByLabelText("Playback speed"));
    fireEvent.click(screen.getByText("1.5x"));
    expect(screen.getByLabelText("Playback speed")).toHaveTextContent("1.5x");
    rerender(
      <HlsVideoPlayer
        playback={buildPlayback({ id: "v2", hlsMasterUrl: MASTER_URL_2 })}
      />,
    );
    expect(screen.getByLabelText("Playback speed")).toHaveTextContent("1x");
  });

  it("selects Auto quality (adaptive)", () => {
    const { video } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    fireEvent.click(screen.getByLabelText("Quality"));
    fireEvent.click(screen.getByText("Auto (adaptive)"));
    expect(hlsMock.instance.currentLevel).toBe(-1);
    fireEvent.click(screen.getByLabelText("Quality"));
    fireEvent.click(screen.getByText("720p"));
    hlsMock.instance.currentLevel = 2;
    fireEvent.click(screen.getByLabelText("Quality"));
    fireEvent.click(screen.getByText("Auto (adaptive)"));
    expect(hlsMock.instance.currentLevel).toBe(-1);
    // Icon-only control: no permanent text — the current quality lives in the tooltip.
    const gear = screen.getByLabelText("Quality");
    expect(gear.textContent).toBe("");
    fireEvent.mouseEnter(gear);
    expect(screen.getByRole("tooltip", { name: "Quality (Auto)" })).toBeInTheDocument();
  });

  it("manually selects a quality level on hls.js", () => {
    const { video } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    fireEvent.click(screen.getByLabelText("Quality"));
    fireEvent.click(screen.getByRole("button", { name: /^720p/ }));
    expect(hlsMock.instance.currentLevel).toBe(2);
    const gear = screen.getByLabelText("Quality");
    expect(gear.textContent).toBe("");
    fireEvent.mouseEnter(gear);
    expect(screen.getByRole("tooltip", { name: "Quality (720p)" })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Quality"));
    fireEvent.click(screen.getByRole("button", { name: /^1080p/ }));
    expect(hlsMock.instance.currentLevel).toBe(1);
  });

  it("shows a loading state until metadata is ready", () => {
    renderPlayer();
    expect(screen.getByText("Loading stream…")).toBeInTheDocument();
  });

  it("reaches the ready state and shows playback controls", () => {
    const { video } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    expect(screen.queryByText("Loading stream…")).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("Play").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Seek")).toBeInTheDocument();
  });

  it("surfaces a fatal HLS error", () => {
    const { video } = renderPlayer();
    setupVideoMocks(video);
    const errorCall = hlsMock.instance.on.mock.calls.find(
      (args) => args[0] === "hlsError",
    );
    expect(errorCall).toBeDefined();
    const handler = errorCall![1] as (
      evt: unknown,
      data: { fatal?: boolean },
    ) => void;
    act(() => handler({}, { fatal: true }));
    expect(screen.getByText(/Playback failed/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Retry$/ })).toBeInTheDocument();
  });

  it("re-attaches the engine on Retry", () => {
    const { video } = renderPlayer();
    setupVideoMocks(video);
    const errorCall = hlsMock.instance.on.mock.calls.find(
      (args) => args[0] === "hlsError",
    );
    const handler = errorCall![1] as (
      evt: unknown,
      data: { fatal?: boolean },
    ) => void;
    act(() => handler({}, { fatal: true }));
    expect(hlsMock.instance.loadSource).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /^Retry$/ }));
    expect(hlsMock.instance.loadSource).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(/Playback failed/)).not.toBeInTheDocument();
    expect(screen.getByText("Loading stream…")).toBeInTheDocument();
  });

  it("shows an unsupported-browser error when hls.js is unsupported", () => {
    hlsMock.HlsMockClass.isSupported.mockReturnValue(false);
    renderPlayer();
    expect(
      screen.getByText(
        "This browser cannot play HLS video. Try a recent version of Chrome, Edge, Firefox, or Safari.",
      ),
    ).toBeInTheDocument();
  });

  it("shows an error when no playback URL exists", () => {
    renderPlayer(buildPlayback({ hlsMasterUrl: null }));
    expect(
      screen.getByText("This video is not available for playback."),
    ).toBeInTheDocument();
  });

  it("enters and exits standard fullscreen", () => {
    const { container } = renderPlayer();
    const root = container.querySelector("[role='region']") as HTMLElement;
    const requestFs = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(root, "requestFullscreen", {
      configurable: true,
      value: requestFs,
    });
    const exitFs = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(document, "exitFullscreen", {
      configurable: true,
      value: exitFs,
    });
    let fullscreenElement: Element | null = null;
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => fullscreenElement,
    });

    fireEvent.click(screen.getByLabelText("Enter fullscreen"));
    expect(requestFs).toHaveBeenCalledTimes(1);

    fullscreenElement = root;
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    expect(screen.getByLabelText("Exit fullscreen")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Exit fullscreen"));
    expect(exitFs).toHaveBeenCalledTimes(1);
  });

  it("falls back to webkitEnterFullscreen on Safari/iOS", async () => {
    const { container, video } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    const root = container.querySelector("[role='region']") as HTMLElement;
    Object.defineProperty(root, "requestFullscreen", {
      configurable: true,
      value: vi.fn().mockRejectedValue(new Error("denied")),
    });
    const enterWebkit = vi.fn();
    Object.defineProperty(video, "webkitEnterFullscreen", {
      configurable: true,
      value: enterWebkit,
    });
    let fullscreenElement: Element | null = null;
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => fullscreenElement,
    });

    fireEvent.click(screen.getByLabelText("Enter fullscreen"));
    await waitFor(() => expect(enterWebkit).toHaveBeenCalled());
  });

  it("uses webkitRequestFullscreen when the standard API is absent", () => {
    const { container } = renderPlayer();
    const root = container.querySelector("[role='region']") as HTMLElement;
    Object.defineProperty(root, "requestFullscreen", {
      configurable: true,
      value: undefined,
    });
    const webkitReq = vi.fn();
    Object.defineProperty(root, "webkitRequestFullscreen", {
      configurable: true,
      value: webkitReq,
    });
    let fullscreenElement: Element | null = null;
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => fullscreenElement,
    });

    fireEvent.click(screen.getByLabelText("Enter fullscreen"));
    expect(webkitReq).toHaveBeenCalledTimes(1);
  });

  it("seeks to resumePosition once metadata is ready", () => {
    const { video } = renderPlayer(buildPlayback(), { resumePosition: 120 });
    setupVideoMocks(video);
    makeReady(video);
    expect(video.currentTime).toBe(120);
  });

  it("destroys the HLS engine on unmount", () => {
    const { video, unmount } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    expect(hlsMock.instance.destroy).not.toHaveBeenCalled();
    unmount();
    expect(hlsMock.instance.destroy).toHaveBeenCalledTimes(1);
  });

  it("cleans up and re-initializes on source change", () => {
    const { video, rerender } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    expect(hlsMock.instance.loadSource).toHaveBeenCalledTimes(1);
    rerender(
      <HlsVideoPlayer
        playback={buildPlayback({ id: "v2", hlsMasterUrl: MASTER_URL_2 })}
      />,
    );
    expect(hlsMock.instance.destroy).toHaveBeenCalledTimes(1);
    expect(hlsMock.instance.loadSource).toHaveBeenCalledTimes(2);
    expect(hlsMock.instance.loadSource).toHaveBeenLastCalledWith(MASTER_URL_2);
  });
});

describe("HlsVideoPlayer auto-hide controls", () => {
  const HIDE_MS = 2800;
  const LONG_IDLE_MS = 6000;

  function controls() {
    return document.querySelector(
      "[data-testid='evoplayer-controls']",
    ) as HTMLElement;
  }

  function controlsHidden() {
    return controls().getAttribute("aria-hidden") === "true";
  }

  function startPlaying(container: HTMLElement, video: HTMLVideoElement) {
    act(() => {
      video.dispatchEvent(new Event("playing"));
    });
    expect(
      (container.querySelector("[role='region']") as HTMLElement).contains(
        controls(),
      ),
    ).toBe(true);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    hlsMock.instance.levels = [
      { height: 2160 },
      { height: 1080 },
      { height: 720 },
      { height: 480 },
      { height: 360 },
    ];
    hlsMock.HlsMockClass.isSupported.mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows the control bar initially before playback", () => {
    const { container } = renderPlayer();
    expect(controlsHidden()).toBe(false);
    expect(container.querySelector("[data-testid='evoplayer-controls']")).not.toBeNull();
  });

  it("fades the controls after inactivity while playing", () => {
    const { container, video } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    startPlaying(container, video);
    expect(controlsHidden()).toBe(false);
    act(() => {
      vi.advanceTimersByTime(HIDE_MS + 1);
    });
    expect(controlsHidden()).toBe(true);
  });

  it("keeps the controls visible while paused, even after long idle", () => {
    const { container, video } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    startPlaying(container, video);
    act(() => {
      video.dispatchEvent(new Event("pause"));
    });
    act(() => {
      vi.advanceTimersByTime(LONG_IDLE_MS);
    });
    expect(controlsHidden()).toBe(false);
  });

  it("restores the controls on mouse movement, then schedules fade again", () => {
    const { container, video } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    startPlaying(container, video);
    act(() => {
      vi.advanceTimersByTime(HIDE_MS + 1);
    });
    expect(controlsHidden()).toBe(true);
    const region = container.querySelector("[role='region']") as HTMLElement;
    fireEvent.mouseMove(region);
    expect(controlsHidden()).toBe(false);
    act(() => {
      vi.advanceTimersByTime(HIDE_MS + 1);
    });
    expect(controlsHidden()).toBe(true);
  });

  it("keeps the controls visible while the pointer hovers the control bar", () => {
    const { container, video } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    startPlaying(container, video);
    fireEvent.mouseEnter(controls());
    act(() => {
      vi.advanceTimersByTime(LONG_IDLE_MS);
    });
    expect(controlsHidden()).toBe(false);
  });

  it("re-arms the fade timer when the pointer leaves the control bar", () => {
    const { container, video } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    startPlaying(container, video);
    fireEvent.mouseEnter(controls());
    fireEvent.mouseLeave(controls());
    act(() => {
      vi.advanceTimersByTime(HIDE_MS + 1);
    });
    expect(controlsHidden()).toBe(true);
  });

  it("restores the controls on touch interaction", () => {
    const { container, video } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    startPlaying(container, video);
    act(() => {
      vi.advanceTimersByTime(HIDE_MS + 1);
    });
    expect(controlsHidden()).toBe(true);
    const region = container.querySelector("[role='region']") as HTMLElement;
    fireEvent.touchStart(region);
    expect(controlsHidden()).toBe(false);
  });

  it("suspends auto-hide while dragging the seek bar", () => {
    const { container, video } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    startPlaying(container, video);
    const seek = screen.getByLabelText("Seek");
    fireEvent.pointerDown(seek);
    act(() => {
      vi.advanceTimersByTime(LONG_IDLE_MS);
    });
    expect(controlsHidden()).toBe(false);
    fireEvent.pointerUp(seek);
    act(() => {
      vi.advanceTimersByTime(HIDE_MS + 1);
    });
    expect(controlsHidden()).toBe(true);
  });

  it("suspends auto-hide while a menu is open, fading after it closes", () => {
    const { container, video } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    startPlaying(container, video);
    fireEvent.click(screen.getByLabelText("Playback speed"));
    act(() => {
      vi.advanceTimersByTime(LONG_IDLE_MS);
    });
    expect(controlsHidden()).toBe(false);
    // "2x" only exists inside the open menu (the toggle still reads "1x").
    fireEvent.click(screen.getByText("2x"));
    act(() => {
      vi.advanceTimersByTime(HIDE_MS + 1);
    });
    expect(controlsHidden()).toBe(true);
  });

  it("reveals the controls while buffering and suspends the fade timer", () => {
    const { container, video } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    startPlaying(container, video);
    act(() => {
      vi.advanceTimersByTime(HIDE_MS + 1);
    });
    expect(controlsHidden()).toBe(true);
    act(() => {
      video.dispatchEvent(new Event("waiting"));
    });
    expect(controlsHidden()).toBe(false);
    act(() => {
      vi.advanceTimersByTime(LONG_IDLE_MS);
    });
    expect(controlsHidden()).toBe(false);
  });

  it("keeps the controls visible after the video ends", () => {
    const { container, video } = renderPlayer();
    setupVideoMocks(video);
    makeReady(video);
    startPlaying(container, video);
    act(() => {
      video.dispatchEvent(new Event("ended"));
    });
    act(() => {
      vi.advanceTimersByTime(LONG_IDLE_MS);
    });
    expect(controlsHidden()).toBe(false);
  });
});