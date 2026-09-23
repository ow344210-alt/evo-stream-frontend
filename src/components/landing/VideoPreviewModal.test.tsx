import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { VideoPreviewModal } from "@/components/landing/VideoPreviewModal";
import { ApiError } from "@/lib/api";
import type { VideoPlayback, SocialSummary } from "@/lib/api";

vi.mock("@/components/video/HlsVideoPlayer", () => ({
  HlsVideoPlayer: () => <div data-testid="mock-player" />,
}));

vi.mock("@/lib/useWatchProgress", () => ({
  useWatchProgress: () => ({
    onTimeUpdate: vi.fn(),
    flush: vi.fn(),
    lastPositionRef: { current: 0 },
  }),
}));

const playback: VideoPlayback = {
  id: "v1",
  title: "Amazing Man",
  description: "A great video",
  durationSeconds: 120,
  posterUrl: null,
  hlsMasterUrl: "/api/media/v1/hls/master.m3u8",
  processingStatus: "READY",
  publicationStatus: "PUBLISHED",
  publishedAt: new Date().toISOString(),
  availableQualities: [],
  channel: { id: "c1", name: "DG Test Studio", slug: "dg-test" },
};

const summary: SocialSummary = {
  videoId: "v1",
  likeCount: 7,
  commentCount: 2,
  shareCount: 1,
  channelFollowerCount: 3,
  isLiked: false,
  isSaved: false,
  isFollowing: false,
};

const { mockApi, authState } = vi.hoisted(() => {
  const mockApi = {
    getVideoPlayback: vi.fn(),
    getSocialSummary: vi.fn(),
    likeVideo: vi.fn(),
    unlikeVideo: vi.fn(),
    saveVideo: vi.fn(),
    unsaveVideo: vi.fn(),
    followChannel: vi.fn(),
    unfollowChannel: vi.fn(),
    shareVideo: vi.fn(),
    getWatchHistory: vi.fn(),
  };
  return {
    mockApi,
    authState: { isAuthenticated: true, notify: (msg: string) => undefined },
  };
});

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  class ApiError extends Error {
    status = 0;
    details?: string[];
  }
  return { ...actual, api: mockApi, ApiError };
});

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => authState,
}));

function renderModal(authed: boolean) {
  authState.isAuthenticated = authed;
  authState.notify = vi.fn();
  const onRequireAuth = vi.fn();
  const onClose = vi.fn();
  mockApi.getVideoPlayback.mockResolvedValue(playback);
  mockApi.getSocialSummary.mockResolvedValue({ ...summary, videoId: "v1" });
  render(
    <VideoPreviewModal
      videoId="v1"
      onClose={onClose}
      onRequireAuth={onRequireAuth}
    />,
  );
  return { onRequireAuth, onClose };
}

describe("VideoPreviewModal social integration", () => {
  beforeEach(() => {
    localStorage.setItem("evo_access_token", "tok");
    localStorage.setItem("evo_refresh_token", "rt");
    localStorage.setItem("evo_user", JSON.stringify({ id: "u1", name: "A" }));
    mockApi.getWatchHistory.mockResolvedValue({ items: [], total: 0 });
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders real social counts", async () => {
    renderModal(true);
    await screen.findByText("Amazing Man");
    expect(await screen.findByLabelText("Like")).toHaveTextContent("7");
    expect(screen.getByLabelText("Share")).toHaveTextContent("1");
  });

  it("routes an anonymous like to the existing auth flow (no API mutation)", async () => {
    const { onRequireAuth } = renderModal(false);
    await screen.findByText("Amazing Man");
    const like = await screen.findByLabelText("Like");
    fireEvent.click(like);
    expect(onRequireAuth).toHaveBeenCalled();
    expect(mockApi.likeVideo).not.toHaveBeenCalled();
  });

  it("persists a like for authenticated viewers via the backend", async () => {
    mockApi.likeVideo.mockResolvedValue({ liked: true, likeCount: 8 });
    renderModal(true);
    await screen.findByText("Amazing Man");
    const like = await screen.findByLabelText("Like");
    fireEvent.click(like);
    await waitFor(() => expect(mockApi.likeVideo).toHaveBeenCalledWith("v1"));
    // Server-confirmed state reflected.
    const again = await screen.findByLabelText("Unlike");
    expect(again).toHaveAttribute("aria-pressed", "true");
    expect(again).toHaveTextContent("8");
  });

  it("loads real saved progress to resume (uses /me/history)", async () => {
    mockApi.getWatchHistory.mockResolvedValue({
      items: [
        {
          positionSeconds: 60,
          progressPercent: 50,
          watchedAt: new Date().toISOString(),
          video: { id: "v1", title: "Amazing Man" },
        },
      ],
      total: 1,
    });
    renderModal(true);
    await screen.findByText("Amazing Man");
    await waitFor(() =>
      expect(mockApi.getWatchHistory).toHaveBeenCalledWith({
        page: 1,
        pageSize: 50,
      }),
    );
  });

  it("closes the modal when Escape is pressed (flush + close)", async () => {
    const { onClose } = renderModal(true);
    await screen.findByText("Amazing Man");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when clicking inside the dialog content", async () => {
    const { onClose } = renderModal(true);
    await screen.findByText("Amazing Man");
    fireEvent.click(screen.getByText("Amazing Man"));
    fireEvent.click(screen.getByTestId("mock-player"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on backdrop click but not on the panel itself", async () => {
    const { onClose } = renderModal(true);
    await screen.findByText("Amazing Man");
    const dialog = screen.getByRole("dialog");
    const panel = dialog.firstElementChild as HTMLElement;
    fireEvent.click(panel);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("announces a loading state while playback metadata is in flight", async () => {
    authState.isAuthenticated = true;
    authState.notify = vi.fn();
    mockApi.getVideoPlayback.mockReturnValue(
      new Promise<VideoPlayback>(() => {}),
    );
    mockApi.getSocialSummary.mockResolvedValue({ ...summary, videoId: "v1" });
    render(
      <VideoPreviewModal videoId="v1" onClose={vi.fn()} onRequireAuth={vi.fn()} />,
    );
    await act(async () => {
      /* flush the social-summary microtask inside act */
    });
    expect(screen.getByText("Loading video…")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("announces an error state with the API message when metadata fails", async () => {
    authState.isAuthenticated = true;
    authState.notify = vi.fn();
    mockApi.getVideoPlayback.mockRejectedValue(new ApiError("Not found", 404));
    render(
      <VideoPreviewModal videoId="v1" onClose={vi.fn()} onRequireAuth={vi.fn()} />,
    );
    expect(
      await screen.findByText("This video is unavailable"),
    ).toBeInTheDocument();
    expect(screen.getByText("Not found")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders real playback details and the player once loaded", async () => {
    renderModal(true);
    expect(await screen.findByText("HLS Ready")).toBeInTheDocument();
    expect(screen.getByText("DG Test Studio")).toBeInTheDocument();
    expect(screen.getByText("0 quality levels")).toBeInTheDocument();
    expect(screen.getByText("A great video")).toBeInTheDocument();
    expect(screen.getByTestId("mock-player")).toBeInTheDocument();
  });

  it("moves focus to the close button on open and restores it on close", async () => {
    authState.isAuthenticated = true;
    authState.notify = vi.fn();
    mockApi.getVideoPlayback.mockResolvedValue(playback);
    mockApi.getSocialSummary.mockResolvedValue({ ...summary, videoId: "v1" });
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    const onClose = vi.fn();
    const { rerender } = render(
      <VideoPreviewModal
        videoId="v1"
        onClose={onClose}
        onRequireAuth={vi.fn()}
      />,
    );
    await screen.findByText("Amazing Man");
    expect(document.activeElement).toBe(
      screen.getByLabelText("Close player"),
    );
    rerender(
      <VideoPreviewModal
        videoId={null}
        onClose={onClose}
        onRequireAuth={vi.fn()}
      />,
    );
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
