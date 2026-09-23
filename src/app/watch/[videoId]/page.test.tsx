import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import WatchPage from "@/app/watch/[videoId]/page";
import { ApiError } from "@/lib/api";
import type { VideoPlayback, SocialSummary } from "@/lib/api";

vi.mock("@/components/video/HlsVideoPlayer", () => ({
  HlsVideoPlayer: ({ playback, resumePosition }: Record<string, unknown>) => (
    <div data-testid="mock-player" data-resume={resumePosition ?? 0}>
      {(playback as { title?: string } | null)?.title ?? ""}
    </div>
  ),
}));

vi.mock("@/components/video/CommentsSection", () => ({
  CommentsSection: ({
    videoId,
    isAuthenticated,
    onCountChange,
  }: Record<string, unknown>) => (
    <div data-testid="comments-section">
      <span>{String(videoId)}</span>
      <span>{String(isAuthenticated)}</span>
      <button
        type="button"
        onClick={() => (onCountChange as (d: number) => void)(1)}
      >
        bump-comment
      </button>
    </div>
  ),
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

const { mockApi, authState, mockRouter } = vi.hoisted(() => {
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
    authState: {
      isAuthenticated: true,
      notify: vi.fn(),
    },
    mockRouter: { push: vi.fn(), replace: vi.fn() },
  };
});

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  class ApiErrorMock extends Error {
    status = 0;
    details?: string[];
  }
  return { ...actual, api: mockApi, ApiError: ApiErrorMock };
});

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => authState,
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ videoId: "v1" }),
  useRouter: () => mockRouter,
  usePathname: () => "/watch/v1",
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function renderWatch(authed: boolean) {
  authState.isAuthenticated = authed;
  authState.notify = vi.fn();
  mockRouter.push.mockReset();
  mockApi.getVideoPlayback.mockResolvedValue(playback);
  mockApi.getSocialSummary.mockResolvedValue({ ...summary, videoId: "v1" });
  mockApi.getWatchHistory.mockResolvedValue({ items: [], total: 0 });
  render(<WatchPage />);
}

beforeEach(() => {
  localStorage.setItem("evo_access_token", "tok");
  localStorage.setItem("evo_refresh_token", "rt");
  localStorage.setItem("evo_user", JSON.stringify({ id: "u1", name: "A" }));
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("EVO Web Watch Page", () => {
  it("renders a loading block while playback metadata is in flight", async () => {
    authState.isAuthenticated = true;
    mockApi.getVideoPlayback.mockReturnValue(
      new Promise<VideoPlayback>(() => {}),
    );
    mockApi.getSocialSummary.mockResolvedValue({ ...summary, videoId: "v1" });
    render(<WatchPage />);
    await act(async () => {
      /* flush the social-summary microtask inside act */
    });
    expect(screen.getByText("Loading video…")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-player")).not.toBeInTheDocument();
  });

  it("announces an error state with the API message when metadata fails", async () => {
    authState.isAuthenticated = true;
    authState.notify = vi.fn();
    mockApi.getSocialSummary.mockResolvedValue({ ...summary, videoId: "v1" });
    mockApi.getVideoPlayback.mockRejectedValue(new ApiError("Not found", 404));
    mockApi.getWatchHistory.mockResolvedValue({ items: [], total: 0 });
    render(<WatchPage />);
    expect(
      await screen.findByText("This video is unavailable"),
    ).toBeInTheDocument();
    expect(screen.getByText("Not found")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("retries loading after a failure", async () => {
    mockApi.getVideoPlayback.mockRejectedValueOnce(new ApiError("Not found", 404));
    renderWatch(true);
    await screen.findByText("This video is unavailable");
    fireEvent.click(screen.getByRole("button", { name: /^Retry$/ }));
    expect(await screen.findByTestId("mock-player")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders real playback details and the player once loaded", async () => {
    renderWatch(true);
    expect(
      await screen.findByRole("heading", { name: "Amazing Man" }),
    ).toBeInTheDocument();
    expect(screen.getByText("HLS Ready")).toBeInTheDocument();
    expect(screen.getAllByText("DG Test Studio").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getByText("0 quality levels")).toBeInTheDocument();
    expect(screen.getByText("A great video")).toBeInTheDocument();
    expect(screen.getByTestId("mock-player")).toBeInTheDocument();
  });

  it("renders real social counts and a scroll target for comments", async () => {
    renderWatch(true);
    const like = await screen.findByLabelText("Like");
    expect(like).toHaveTextContent("7");
    expect(await screen.findByLabelText("Comments")).toHaveTextContent("2");
    expect(screen.getByLabelText("Share")).toHaveTextContent("1");
    expect(screen.getByLabelText("Follow hub")).toHaveTextContent("3");
    expect(document.querySelector("#comments")).not.toBeNull();
  });

  it("scrolls to the comments section when the Comments button is clicked", async () => {
    renderWatch(true);
    await screen.findByLabelText("Like");
    fireEvent.click(screen.getByLabelText("Comments"));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("bumps the comments count when a comment is created below", async () => {
    renderWatch(true);
    const comments = await screen.findByLabelText("Comments");
    expect(comments).toHaveTextContent("2");
    const section = await screen.findByTestId("comments-section");
    fireEvent.click(section.querySelector("button")!);
    await waitFor(() =>
      expect(screen.getByLabelText("Comments")).toHaveTextContent("3"),
    );
  });

  it("applies an optimistic like immediately and reconciles with the server", async () => {
    const d = deferred<{ liked: boolean; likeCount: number }>();
    mockApi.likeVideo.mockReturnValue(d.promise);
    renderWatch(true);
    const like = await screen.findByLabelText("Like");
    fireEvent.click(like);
    // Optimistic flip happens before the network resolves.
    expect(await screen.findByLabelText("Unlike")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("Unlike")).toBeDisabled();
    act(() => {
      d.resolve({ liked: true, likeCount: 8 });
    });
    await waitFor(() =>
      expect(screen.getByLabelText("Unlike")).toHaveTextContent("8"),
    );
  });

  it("rolls back a failed like and notifies", async () => {
    const d = deferred<{ liked: boolean; likeCount: number }>();
    mockApi.likeVideo.mockReturnValue(d.promise);
    renderWatch(true);
    fireEvent.click(await screen.findByLabelText("Like"));
    expect(await screen.findByLabelText("Unlike")).toBeInTheDocument();
    act(() => {
      d.reject(new ApiError("Nope", 400));
    });
    await waitFor(() => expect(authState.notify).toHaveBeenCalledWith("Nope"));
    expect(screen.getByLabelText("Like")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByLabelText("Like")).toHaveTextContent("7");
  });

  it("applies an optimistic save and reconciles with the server", async () => {
    const d = deferred<{ saved: boolean }>();
    mockApi.saveVideo.mockReturnValue(d.promise);
    renderWatch(true);
    fireEvent.click(await screen.findByLabelText("Save to My List"));
    // Optimistic: label flips before the network resolves.
    expect(screen.getByLabelText("Remove from My List")).toBeInTheDocument();
    act(() => {
      d.resolve({ saved: true });
    });
    await waitFor(() =>
      expect(authState.notify).toHaveBeenCalledWith("Saved to My List."),
    );
  });

  it("applies an optimistic follow and reconciles the follower count", async () => {
    const d = deferred<{ following: boolean; followerCount: number }>();
    mockApi.followChannel.mockReturnValue(d.promise);
    renderWatch(true);
    fireEvent.click(await screen.findByLabelText("Follow hub"));
    // Optimistic: follows (count 3 -> 4) before the network resolves.
    expect(
      await screen.findByLabelText("Unfollow hub"),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Unfollow hub")).toHaveTextContent("4");
    act(() => {
      d.resolve({ following: true, followerCount: 5 });
    });
    await waitFor(() =>
      expect(screen.getByLabelText("Unfollow hub")).toHaveTextContent("5"),
    );
  });

  it("routes anonymous social clicks through the existing auth flow", async () => {
    renderWatch(false);
    await screen.findByLabelText("Like");
    fireEvent.click(screen.getByLabelText("Like"));
    fireEvent.click(screen.getByLabelText("Follow hub"));
    expect(mockRouter.push).toHaveBeenCalledWith("/?auth=signin");
    expect(mockApi.likeVideo).not.toHaveBeenCalled();
    expect(mockApi.followChannel).not.toHaveBeenCalled();
  });

  it("opens the in-app share dialog and records a share only on a real share action", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    mockApi.shareVideo.mockResolvedValue({ shareCount: 2 });
    renderWatch(true);
    fireEvent.click(await screen.findByLabelText("Share"));
    // Dialog opens instantly with the canonical URL and share destinations.
    const dialog = await screen.findByRole("dialog", {
      name: /share this video/i,
    });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByLabelText("Share URL")).toHaveValue(
      "http://localhost:3000/watch/v1",
    );
    expect(
      screen.getByRole("link", { name: /whatsapp/i }),
    ).toHaveAttribute("href", expect.stringContaining("api.whatsapp.com/send"));
    // Opening the dialog alone never records a share.
    expect(mockApi.shareVideo).not.toHaveBeenCalled();
    // Copying the link is a real share action.
    fireEvent.click(screen.getByRole("button", { name: /^Copy$/ }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("http://localhost:3000/watch/v1"),
    );
    expect(await screen.findByText("Copied")).toBeInTheDocument();
    expect(mockApi.shareVideo).toHaveBeenCalledWith("v1");
    await waitFor(() =>
      expect(screen.getByLabelText("Share")).toHaveTextContent("2"),
    );
  });

  it("copies a shared link with a ?t= timestamp when requested", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    mockApi.shareVideo.mockResolvedValue({ shareCount: 1 });
    renderWatch(true);
    fireEvent.click(await screen.findByLabelText("Share"));
    const dialog = await screen.findByRole("dialog");
    const urlInput = screen.getByLabelText("Share URL");
    expect(urlInput).toHaveValue("http://localhost:3000/watch/v1");
    fireEvent.click(screen.getByLabelText("Start at current time"));
    expect(urlInput).toHaveValue("http://localhost:3000/watch/v1?t=0");
    fireEvent.click(screen.getByRole("button", { name: /^Copy$/ }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        "http://localhost:3000/watch/v1?t=0",
      ),
    );
  });

  it("resumes from the viewer's real saved position once history resolves", async () => {
    authState.isAuthenticated = true;
    mockApi.getVideoPlayback.mockResolvedValue(playback);
    mockApi.getSocialSummary.mockResolvedValue({ ...summary, videoId: "v1" });
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
    render(<WatchPage />);
    await screen.findByTestId("mock-player");
    expect(
      screen.getByTestId("mock-player").getAttribute("data-resume"),
    ).toBe("60");
  });

  it("never resumes playback for anonymous viewers", async () => {
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
    renderWatch(false);
    await screen.findByTestId("mock-player");
    expect(mockApi.getWatchHistory).not.toHaveBeenCalled();
    expect(
      screen.getByTestId("mock-player").getAttribute("data-resume"),
    ).toBe("0");
  });

  it("resumes to the shared timestamp when the URL carries ?t=", async () => {
    window.history.replaceState(null, "", "/watch/v1?t=45");
    renderWatch(false);
    await waitFor(() =>
      expect(
        screen.getByTestId("mock-player").getAttribute("data-resume"),
      ).toBe("45"),
    );
    window.history.replaceState(null, "", "/watch/v1");
  });
});