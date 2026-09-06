import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SearchModal } from "@/components/landing/SearchModal";
import type { PublicVideoCard as PublicVideoCardData } from "@/lib/api";

// Real trending feed items returned by the mocked getFeedTrending.
const trendingItems: PublicVideoCardData[] = [
  {
    id: "t1",
    title: "Trending Hub Clips",
    description: "Trending",
    durationSeconds: 90,
    posterUrl: null,
    publishedAt: new Date().toISOString(),
    channel: { id: "c1", name: "DG Studio", slug: "dg-studio" },
    category: { id: "cat1", name: "Tech", slug: "tech" },
  },
];

const searchItems: PublicVideoCardData[] = [
  {
    id: "s1",
    title: "Search Result Video",
    description: "Found",
    durationSeconds: 60,
    posterUrl: null,
    publishedAt: new Date().toISOString(),
    channel: { id: "c2", name: "Echo Hub", slug: "echo-hub" },
    category: { id: "cat2", name: "Music", slug: "music" },
  },
];

const { mockApi } = vi.hoisted(() => {
  const mockApi = {
    getFeedTrending: vi.fn(),
    searchVideos: vi.fn(),
  };
  return { mockApi };
});

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, api: mockApi };
});

interface HookCrash extends Error {
  message: string;
}

// React throws this when hook order changes between renders (the exact bug under test).
function assertNoHookCrash(fn: () => unknown) {
  try {
    fn();
  } catch (err) {
    const e = err as HookCrash;
    if (/more hooks/.test(e.message)) {
      throw new Error(
        `Hook-order crash detected: ${e.message}`,
      );
    }
    throw err;
  }
}

function setup(initialOpen: boolean) {
  const onClose = vi.fn();
  const onSelectResult = vi.fn();
  mockApi.getFeedTrending.mockResolvedValue({ items: trendingItems, total: 1, page: 1, pageSize: 8, totalPages: 1 });
  const view = render(
    <SearchModal isOpen={initialOpen} onClose={onClose} onSelectResult={onSelectResult} />,
  );
  const rerender = (open: boolean) => {
    view.rerender(
      <SearchModal isOpen={open} onClose={onClose} onSelectResult={onSelectResult} />,
    );
  };
  return { rerender, onClose, onSelectResult };
}

describe("SearchModal - Rules of Hooks lifecycle (closed -> open -> closed -> open)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not crash across closed -> open -> closed -> open and keeps trending + search functional", async () => {
    const { rerender } = setup(false);

    // 1. Closed render: modal not visible, runs fewer React hooks than open.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockApi.getFeedTrending).not.toHaveBeenCalled();

    // 2. Open render: must NOT throw "Rendered more hooks than during the previous render".
    assertNoHookCrash(() => rerender(true));
    expect(screen.getByRole("dialog", { name: /search/i })).toBeInTheDocument();
    // Wait for the real trending feed to load and render (feed loading executes).
    await waitFor(() => expect(mockApi.getFeedTrending).toHaveBeenCalled());
    expect(await screen.findByText("Trending Hub Clips")).toBeInTheDocument();

    // 3. Close render again (hooks back to the closed set) - no crash.
    assertNoHookCrash(() => rerender(false));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // 4. Reopen: the exact scenario that crashed (closed -> open -> closed -> open).
    assertNoHookCrash(() => rerender(true));
    expect(screen.getByRole("dialog", { name: /search/i })).toBeInTheDocument();
    expect(await screen.findByText("Trending Hub Clips")).toBeInTheDocument();

    // 5. Search remains functional after all the open/close cycling.
    mockApi.searchVideos.mockResolvedValue({ items: searchItems, total: 1, page: 1, pageSize: 20, totalPages: 1 });
    const input = screen.getByPlaceholderText(/search videos or hubs/i);
    fireEvent.change(input, { target: { value: "space" } });
    await waitFor(() => expect(mockApi.searchVideos).toHaveBeenCalled());
    expect(await screen.findByText("Search Result Video")).toBeInTheDocument();
  });

  it("selecting a result opens the real player via onSelectResult and closes the modal", async () => {
    const { rerender, onClose, onSelectResult } = setup(false);
    mockApi.searchVideos.mockResolvedValue({ items: searchItems, total: 1, page: 1, pageSize: 20, totalPages: 1 });

    rerender(true);
    const input = screen.getByPlaceholderText(/search videos or hubs/i);
    fireEvent.change(input, { target: { value: "space" } });
    fireEvent.click(await screen.findByText("Search Result Video"));

    expect(onSelectResult).toHaveBeenCalledWith("s1");
    expect(onClose).toHaveBeenCalled();
  });

  it("shows the empty state when the real feed returns no trending content", async () => {
    const { rerender } = setup(false);
    // Override setup's default (non-empty) trending mock AFTER setup so the effect
    // resolves to an empty feed and the real empty state renders.
    mockApi.getFeedTrending.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 8, totalPages: 0 });
    rerender(true);
    expect(await screen.findByText("No trending content yet.")).toBeInTheDocument();
    expect(mockApi.searchVideos).not.toHaveBeenCalled();
  });
});