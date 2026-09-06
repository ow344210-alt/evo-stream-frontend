import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import CreatorDashboardPage from "@/app/creator/page";

const { mockApi } = vi.hoisted(() => {
  return {
    mockApi: {
      getCreatorDashboard: vi.fn(),
    },
  };
});

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, api: mockApi };
});

vi.mock("@/components/creator/CreatorHeader", () => ({
  CreatorHeader: ({ title }: { title: string }) => (
    <div data-testid="creator-header">{title}</div>
  ),
}));

const mockDashboard = {
  user: { id: "u-1", name: "Ada Lovelace", email: "ada@test.com" },
  profile: { id: "cp-1", bio: "Independent filmmaker", isVerified: true },
  channel: {
    id: "chan-1",
    name: "Ada Studio",
    slug: "ada-studio",
    description: "Real channel from the DB",
    logoUrl: null,
    bannerUrl: null,
    websiteUrl: null,
    instagramUrl: null,
    youtubeUrl: null,
    twitterUrl: null,
    isSuspended: false,
    category: { id: "cat-1", name: "Documentary", slug: "documentary" },
  },
  stats: {
    totalVideos: 4,
    draftCount: 2,
    publishedCount: 1,
    hiddenCount: 1,
    processingCount: 1,
    followersCount: 1200,
  },
  recentVideos: [
    {
      id: "v-1",
      title: "My Real Film",
      status: "PUBLISHED",
      processingStatus: "READY",
      thumbnailUrl: null,
      durationSeconds: 7340,
      createdAt: "2026-09-01T00:00:00Z",
      publishedAt: "2026-09-01T00:00:00Z",
      category: { id: "cat-1", name: "Documentary", slug: "documentary" },
    },
    {
      id: "v-2",
      title: "Draft Teaser",
      status: "DRAFT",
      processingStatus: "PROCESSING",
      thumbnailUrl: null,
      durationSeconds: 105,
      createdAt: "2026-09-02T00:00:00Z",
      publishedAt: null,
      category: null,
    },
  ],
};

const emptyDashboard = {
  user: { id: "u-1", name: "Ada Lovelace", email: "ada@test.com" },
  profile: { id: "cp-1", bio: null, isVerified: false },
  channel: null,
  stats: {
    totalVideos: 0,
    draftCount: 0,
    publishedCount: 0,
    hiddenCount: 0,
    processingCount: 0,
    followersCount: 0,
  },
  recentVideos: [],
};

describe("Creator Dashboard - Real Backend Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("shows loading state while fetching dashboard data", async () => {
    let resolvePromise: (v: unknown) => void;
    mockApi.getCreatorDashboard.mockImplementation(
      () => new Promise((r) => (resolvePromise = r)),
    );

    render(<CreatorDashboardPage />);

    expect(mockApi.getCreatorDashboard).toHaveBeenCalled();

    await act(async () => {
      resolvePromise!(mockDashboard);
    });
  });

  it("renders real channel identity and backend counts", async () => {
    mockApi.getCreatorDashboard.mockResolvedValue(mockDashboard);

    render(<CreatorDashboardPage />);

    await waitFor(() =>
      expect(mockApi.getCreatorDashboard).toHaveBeenCalled(),
    );

    await waitFor(() => {
      // Real channel name from backend (no "Apex Cine Labs" fake).
      expect(screen.getByText("Ada Studio")).toBeInTheDocument();
      expect(screen.getByText("Documentary")).toBeInTheDocument();
      expect(screen.getByText("Real channel from the DB")).toBeInTheDocument();
    });

    // Real KPI counts ("Total Videos" and follower count appear in both the
    // KPI grid and the content summary card).
    expect(screen.getAllByText("Total Videos").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hub Followers").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1,200").length).toBeGreaterThan(0);
  });

  it("renders recent videos from real API data with status badges", async () => {
    mockApi.getCreatorDashboard.mockResolvedValue(mockDashboard);

    render(<CreatorDashboardPage />);

    await waitFor(() =>
      expect(screen.getByText("My Real Film")).toBeInTheDocument(),
    );
    expect(screen.getByText("Draft Teaser")).toBeInTheDocument();
    expect(screen.getByText("PUBLISHED")).toBeInTheDocument();
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
  });

  it("shows error state with no mock fallback when API fails", async () => {
    mockApi.getCreatorDashboard.mockRejectedValue(new Error("Backend down"));

    render(<CreatorDashboardPage />);

    await waitFor(() =>
      expect(
        screen.getByText(/Unable to load your dashboard/),
      ).toBeInTheDocument(),
    );

    // No mock channel identity or fake counts should appear.
    expect(screen.queryByText("Apex Cine Labs")).toBeNull();
    expect(screen.queryByText("194,200")).toBeNull();
    expect(screen.queryByText("1200")).toBeNull();
  });

  it("shows empty state prompting hub creation when creator has no channel", async () => {
    mockApi.getCreatorDashboard.mockResolvedValue(emptyDashboard);

    render(<CreatorDashboardPage />);

    await waitFor(() =>
      expect(
        screen.getByText(/You haven't created a hub yet/i),
      ).toBeInTheDocument(),
    );

    const createLink = screen.getByRole("link", {
      name: /Create Your Hub/i,
    });
    expect(createLink.getAttribute("href")).toBe("/creator/channel");
  });

  it("allows retry and renders real data after an error", async () => {
    mockApi.getCreatorDashboard
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(mockDashboard);

    render(<CreatorDashboardPage />);

    await waitFor(() =>
      expect(
        screen.getByText(/Unable to load your dashboard/),
      ).toBeInTheDocument(),
    );

    const retryButton = screen.getByRole("button", { name: "Retry" });
    await act(async () => {
      retryButton.click();
    });

    await waitFor(() => expect(screen.getByText("Ada Studio")).toBeInTheDocument());
  });
});
