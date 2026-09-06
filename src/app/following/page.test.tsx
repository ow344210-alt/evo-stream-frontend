import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import FollowingPage from "@/app/following/page";
import type { ViewerChannel } from "@/lib/api";

const { mockApi, authState } = vi.hoisted(() => {
  const notify = vi.fn();
  return {
    mockApi: {
      getFollowingChannels: vi.fn(),
      unfollowChannel: vi.fn(),
    },
    authState: {
      isAuthenticated: true,
      isLoading: false,
      notify,
    },
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

vi.mock("@/components/library/ViewerNav", () => ({
  ViewerNav: () => <nav data-testid="viewer-nav" />,
}));

const channels: ViewerChannel[] = [
  { id: "c1", name: "DG Studio", slug: "dg-studio", description: "Documentaries", logoUrl: null },
  { id: "c2", name: "Neon Films", slug: "neon-films", description: null, logoUrl: null },
];

function pageResponse(items: ViewerChannel[], total = items.length) {
  return { items, total, page: 1, pageSize: 12, totalPages: Math.ceil(total / 12) };
}

beforeEach(() => {
  authState.notify.mockReset();
  mockApi.unfollowChannel.mockReset();
  mockApi.getFollowingChannels.mockReset();
  mockApi.getFollowingChannels.mockResolvedValue(pageResponse(channels));
  mockApi.unfollowChannel.mockResolvedValue({ following: false, followerCount: 8 });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("Following page", () => {
  it("gates anonymous viewers behind the sign-in flow (no API charts)", async () => {
    authState.isAuthenticated = false;
    render(<FollowingPage />);
    expect(await screen.findByText("Sign in to see who you follow")).toBeInTheDocument();
    expect(mockApi.getFollowingChannels).not.toHaveBeenCalled();
  });

  it("renders the real followed channels", async () => {
    authState.isAuthenticated = true;
    render(<FollowingPage />);
    expect(await screen.findByText("DG Studio")).toBeInTheDocument();
    expect(screen.getByText("Neon Films")).toBeInTheDocument();
  });

  it("unfollows a channel via the backend and removes it from the list", async () => {
    authState.isAuthenticated = true;
    render(<FollowingPage />);
    fireEvent.click(await screen.findByLabelText("Unfollow DG Studio"));
    await waitFor(() => expect(mockApi.unfollowChannel).toHaveBeenCalledWith("c1"));
    await waitFor(() =>
      expect(screen.queryByText("DG Studio")).not.toBeInTheDocument(),
    );
    expect(authState.notify).toHaveBeenCalledWith("Unfollowed DG Studio.");
  });

  it("offers a Discover link in the empty state", async () => {
    authState.isAuthenticated = true;
    mockApi.getFollowingChannels.mockResolvedValue(pageResponse([]));
    render(<FollowingPage />);
    const link = await screen.findByRole("link", { name: "Discover hubs" });
    expect(link).toHaveAttribute("href", "/discover");
  });
});