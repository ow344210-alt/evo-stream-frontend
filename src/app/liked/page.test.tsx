import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import LikedPage from "@/app/liked/page";

const { authState, mockApi, mockRouter } = vi.hoisted(() => ({
  authState: {
    isAuthenticated: false,
    isLoading: true,
    notify: vi.fn(),
  },
  mockRouter: { push: vi.fn(), replace: vi.fn() },
  mockApi: {
    getLikedVideos: vi.fn(),
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
  usePathname: () => "/liked",
}));

beforeEach(() => {
  authState.isAuthenticated = false;
  authState.isLoading = true;
  mockRouter.push.mockReset();
  mockApi.getLikedVideos.mockReset();
  mockApi.getLikedVideos.mockResolvedValue({
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

describe("Liked page auth gating", () => {
  it("does NOT show the sign-in gate while auth is still resolving", () => {
    render(<LikedPage />);

    expect(screen.queryByText(/Sign in to view/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Loading content")).toBeInTheDocument();
    expect(mockApi.getLikedVideos).not.toHaveBeenCalled();
  });

  it("shows the sign-in gate only after auth definitively resolves unauthenticated", () => {
    authState.isLoading = false;

    render(<LikedPage />);

    expect(screen.getByText(/Sign in to view/i)).toBeInTheDocument();
    expect(mockApi.getLikedVideos).not.toHaveBeenCalled();
  });

  it("loads liked videos when authenticated", async () => {
    authState.isLoading = false;
    authState.isAuthenticated = true;

    render(<LikedPage />);

    await waitFor(() => expect(mockApi.getLikedVideos).toHaveBeenCalled());
    expect(screen.queryByText(/Sign in to view/i)).not.toBeInTheDocument();
  });

  it("opens /watch/<id> when a liked video is played", async () => {
    authState.isLoading = false;
    authState.isAuthenticated = true;
    mockApi.getLikedVideos.mockResolvedValue({
      items: [
        { id: "v1", title: "Amazing Man", durationSeconds: 120 },
      ],
      total: 1,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    });

    render(<LikedPage />);

    const card = await screen.findByLabelText(/play amazing man/i);
    fireEvent.click(card);
    expect(mockRouter.push).toHaveBeenCalledWith("/watch/v1");
  });

  it("renders the shared ViewerNav like the other viewer pages", () => {
    render(<LikedPage />);

    expect(screen.getByLabelText("Search videos")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Latest" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Trending" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Following" })).toBeInTheDocument();
  });
});