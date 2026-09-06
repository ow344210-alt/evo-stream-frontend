import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import AdminDashboardPage from "@/app/admin/page";

const { mockApi } = vi.hoisted(() => {
  return {
    mockApi: {
      adminGetDashboard: vi.fn(),
    },
  };
});

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, api: mockApi };
});

vi.mock("@/components/admin/AdminHeader", () => ({
  AdminHeader: ({ title }: { title: string }) => (
    <div data-testid="admin-header">{title}</div>
  ),
}));

const mockStats = {
  totalUsers: 120,
  totalCreators: 14,
  totalChannels: 12,
  totalVideos: 200,
  totalCategories: 6,
  recentVideos: [
    {
      id: "vid-1",
      title: "Sample Video",
      status: "PUBLISHED",
      createdAt: "2026-09-01T00:00:00Z",
      channel: { id: "c-1", name: "Channel A" },
      category: { id: "cat-1", name: "Drama" },
      _count: { likes: 3, comments: 5 },
    },
  ],
  recentCreators: [
    {
      id: "u-1",
      name: "Creator One",
      email: "c@example.com",
      createdAt: "2026-08-01T00:00:00Z",
      creatorProfile: {
        id: "cp-1",
        isVerified: true,
        channel: { id: "c-1", name: "Channel A", slug: "channel-a" },
      },
    },
  ],
};

describe("Admin Dashboard - Real Backend Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("shows loading state while fetching dashboard data", async () => {
    let resolvePromise: (v: unknown) => void;
    mockApi.adminGetDashboard.mockImplementation(
      () => new Promise((r) => (resolvePromise = r)),
    );

    render(<AdminDashboardPage />);

    expect(screen.getByText("Loading dashboard data…")).toBeInTheDocument();

    await act(async () => {
      resolvePromise!(mockStats);
    });
  });

  it("renders real backend counts on the dashboard", async () => {
    mockApi.adminGetDashboard.mockResolvedValue(mockStats);

    render(<AdminDashboardPage />);

    await waitFor(() =>
      expect(mockApi.adminGetDashboard).toHaveBeenCalled(),
    );

    await waitFor(() => {
      expect(screen.getByText("120")).toBeInTheDocument();
      expect(screen.getByText("14")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByText("200")).toBeInTheDocument();
      expect(screen.getByText("6")).toBeInTheDocument();
    });

    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("Total Creators")).toBeInTheDocument();
    expect(screen.getByText("Total Hubs")).toBeInTheDocument();
    expect(screen.getByText("Total Videos")).toBeInTheDocument();
    expect(screen.getByText("Total Categories")).toBeInTheDocument();
  });

  it("renders recent videos from real API data", async () => {
    mockApi.adminGetDashboard.mockResolvedValue(mockStats);

    render(<AdminDashboardPage />);

    await waitFor(() =>
      expect(screen.getByText("Sample Video")).toBeInTheDocument(),
    );
    expect(screen.getByText("Channel A")).toBeInTheDocument();
    expect(screen.getByText("PUBLISHED")).toBeInTheDocument();
  });

  it("renders recent creators from real API data", async () => {
    mockApi.adminGetDashboard.mockResolvedValue(mockStats);

    render(<AdminDashboardPage />);

    await waitFor(() =>
      expect(screen.getByText("Creator One")).toBeInTheDocument(),
    );
  });

  it("shows error state and no mock fallback when API fails", async () => {
    mockApi.adminGetDashboard.mockRejectedValue(new Error("Forbidden resource"));

    render(<AdminDashboardPage />);

    await waitFor(() =>
      expect(
        screen.getByText("Unable to load dashboard data"),
      ).toBeInTheDocument(),
    );

    expect(screen.getByText("Forbidden resource")).toBeInTheDocument();

    const mockCounts = ["120", "14", "12", "200", "6"];
    for (const c of mockCounts) {
      expect(screen.queryByText(c)).toBeNull();
    }
  });

  it("allows retry and loads real data after an error", async () => {
    mockApi.adminGetDashboard
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(mockStats);

    render(<AdminDashboardPage />);

    await waitFor(() =>
      expect(
        screen.getByText("Unable to load dashboard data"),
      ).toBeInTheDocument(),
    );

    const retryButton = screen.getByRole("button", { name: "Retry" });
    await act(async () => {
      retryButton.click();
    });

    await waitFor(() => expect(screen.getByText("120")).toBeInTheDocument());
  });
});
