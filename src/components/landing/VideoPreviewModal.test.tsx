import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { VideoPreviewModal } from "@/components/landing/VideoPreviewModal";
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
});
