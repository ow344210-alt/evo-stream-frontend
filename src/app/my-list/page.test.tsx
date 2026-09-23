import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import MyListPage from "@/app/my-list/page";

const { authState, mockApi, mockRouter } = vi.hoisted(() => ({
  authState: {
    isAuthenticated: false,
    isLoading: true,
    notify: vi.fn(),
  },
  mockRouter: { push: vi.fn(), replace: vi.fn() },
  mockApi: {
    getSavedVideos: vi.fn(),
    unsaveVideo: vi.fn(),
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
  usePathname: () => "/my-list",
}));

beforeEach(() => {
  authState.isAuthenticated = false;
  authState.isLoading = true;
  mockRouter.push.mockReset();
  mockApi.getSavedVideos.mockReset();
  mockApi.unsaveVideo.mockReset();
  mockApi.getSavedVideos.mockResolvedValue({
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

describe("My List page auth gating", () => {
  it("does NOT show the sign-in gate while auth is still resolving", () => {
    render(<MyListPage />);

    expect(screen.queryByText(/Sign in to view/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Loading content")).toBeInTheDocument();
    expect(mockApi.getSavedVideos).not.toHaveBeenCalled();
  });

  it("shows the sign-in gate only after auth definitively resolves unauthenticated", () => {
    authState.isLoading = false;

    render(<MyListPage />);

    expect(screen.getByText(/Sign in to view/i)).toBeInTheDocument();
    expect(mockApi.getSavedVideos).not.toHaveBeenCalled();
  });

  it("loads saved videos when authenticated", async () => {
    authState.isLoading = false;
    authState.isAuthenticated = true;

    render(<MyListPage />);

    await waitFor(() => expect(mockApi.getSavedVideos).toHaveBeenCalled());
    expect(screen.queryByText(/Sign in to view/i)).not.toBeInTheDocument();
  });

  it("opens /watch/<id> when a saved video is played", async () => {
    authState.isLoading = false;
    authState.isAuthenticated = true;
    mockApi.getSavedVideos.mockResolvedValue({
      items: [
        { id: "v1", title: "Amazing Man", durationSeconds: 120 },
      ],
      total: 1,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    });

    render(<MyListPage />);

    const card = await screen.findByLabelText(/play amazing man/i);
    fireEvent.click(card);
    expect(mockRouter.push).toHaveBeenCalledWith("/watch/v1");
  });

  it("renders the shared ViewerNav (logo, search, Latest/Trending/Following)", () => {
    render(<MyListPage />);

    expect(screen.getByLabelText("EVO home")).toBeInTheDocument();
    expect(screen.getByLabelText("Search videos")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Latest" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Trending" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Following" })).toBeInTheDocument();
  });

  it("keeps ViewerNav mounted while auth resolves and never flashes the gate", () => {
    render(<MyListPage />);

    expect(
      screen.getByRole("link", { name: "Latest" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Sign in to view/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Loading content")).toBeInTheDocument();
  });

  it("keeps ViewerNav mounted behind the sign-in gate too", () => {
    authState.isLoading = false;

    render(<MyListPage />);

    expect(screen.getByText(/Sign in to view/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Following" }),
    ).toBeInTheDocument();
  });

  it("renders the heading, subtitle, and empty state for an empty authenticated list", async () => {
    authState.isLoading = false;
    authState.isAuthenticated = true;

    render(<MyListPage />);

    expect(
      await screen.findByRole("heading", { name: "My List" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Videos you saved to watch later."),
    ).toBeInTheDocument();
    expect(screen.getByText("Your list is empty")).toBeInTheDocument();
    expect(
      screen.getByText("Tap Save on any video to add it to My List."),
    ).toBeInTheDocument();
  });

  it("runs the shared ViewerNav search from My List", () => {
    render(<MyListPage />);

    fireEvent.change(screen.getByLabelText("Search videos"), {
      target: { value: "test video" },
    });
    fireEvent.submit(screen.getByRole("search"));
    expect(mockRouter.push).toHaveBeenCalledWith(
      "/discover/search?q=test%20video",
    );
  });
});