import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import HistoryPage from "@/app/history/page";

const { authState, mockApi, mockRouter } = vi.hoisted(() => ({
  authState: {
    isAuthenticated: false,
    isLoading: true,
    notify: vi.fn(),
  },
  mockRouter: { push: vi.fn(), replace: vi.fn() },
  mockApi: {
    getWatchHistory: vi.fn(),
    removeHistoryItem: vi.fn(),
  },
}));

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

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/history",
}));

beforeEach(() => {
  authState.isAuthenticated = false;
  authState.isLoading = true;
  mockRouter.push.mockReset();
  mockApi.getWatchHistory.mockReset();
  mockApi.removeHistoryItem.mockReset();
  mockApi.getWatchHistory.mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    pageSize: 12,
    totalPages: 0,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("History page auth gating", () => {
  it("does NOT show the sign-in gate while auth is still resolving", () => {
    render(<HistoryPage />);

    expect(screen.queryByText(/Sign in to view/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Loading content")).toBeInTheDocument();
    expect(mockApi.getWatchHistory).not.toHaveBeenCalled();
  });

  it("shows the sign-in gate only after auth definitively resolves unauthenticated", () => {
    authState.isLoading = false;

    render(<HistoryPage />);

    expect(screen.getByText(/Sign in to view/i)).toBeInTheDocument();
    expect(mockApi.getWatchHistory).not.toHaveBeenCalled();
  });

  it("loads watch history when authenticated", async () => {
    authState.isLoading = false;
    authState.isAuthenticated = true;

    render(<HistoryPage />);

    await waitFor(() => expect(mockApi.getWatchHistory).toHaveBeenCalled());
    expect(screen.queryByText(/Sign in to view/i)).not.toBeInTheDocument();
  });

  it("opens /watch/<id> when a history item is played", async () => {
    authState.isLoading = false;
    authState.isAuthenticated = true;
    mockApi.getWatchHistory.mockResolvedValue({
      items: [
        {
          video: { id: "v1", title: "Amazing Man", durationSeconds: 120 },
          positionSeconds: 0,
          progressPercent: 0,
          watchedAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    });

    render(<HistoryPage />);

    const card = await screen.findByLabelText(/play amazing man/i);
    fireEvent.click(card);
    expect(mockRouter.push).toHaveBeenCalledWith("/watch/v1");
  });

  it("renders the shared ViewerNav like the other viewer pages", () => {
    render(<HistoryPage />);

    expect(screen.getByLabelText("Search videos")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Latest" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Trending" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Following" })).toBeInTheDocument();
  });
});