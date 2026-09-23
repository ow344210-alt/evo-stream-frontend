import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import SearchPage from "@/app/discover/search/page";
import type { PublicVideoCard } from "@/lib/api";

const { mockRouter, mockApi } = vi.hoisted(() => {
  const push = vi.fn();
  return {
    mockRouter: { push },
    mockApi: {
      searchVideos: vi.fn(),
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => ({ get: (k: string) => (k === "q" ? "test" : null) }),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  class ApiError extends Error {
    status = 0;
    details?: string[];
  }
  return { ...actual, api: mockApi, ApiError };
});

const feedItem: PublicVideoCard = {
  id: "v1",
  title: "Searchable Documentary",
  description: null,
  durationSeconds: 125,
  posterUrl: null,
  publishedAt: new Date().toISOString(),
  channel: { id: "c1", name: "DG Studio", slug: "dg-studio" },
  category: null,
};

function pageResponse(items: PublicVideoCard[]) {
  return { items, total: items.length, page: 1, pageSize: 12, totalPages: 1 };
}

beforeEach(() => {
  mockRouter.push.mockReset();
  mockApi.searchVideos.mockReset();
  mockApi.searchVideos.mockResolvedValue(pageResponse([feedItem]));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("Discover search page", () => {
  it("renders real search results for the query", async () => {
    render(<SearchPage />);
    expect(
      await screen.findByText("Searchable Documentary"),
    ).toBeInTheDocument();
    expect(mockApi.searchVideos).toHaveBeenCalledWith({
      page: 1,
      pageSize: 12,
      q: "test",
    });
  });

  it("opens /watch/<id> when a search result is selected", async () => {
    render(<SearchPage />);
    const card = await screen.findByLabelText(/play searchable documentary/i);
    fireEvent.click(card);
    expect(mockRouter.push).toHaveBeenCalledWith("/watch/v1");
  });

  it("keeps current results visible while a newer query resolves (stable UI)", async () => {
    let resolveSearch!: (value: ReturnType<typeof pageResponse>) => void;
    render(<SearchPage />);
    await screen.findByText("Searchable Documentary");
    const next: PublicVideoCard = {
      id: "v2",
      title: "Fresh Drone Reel",
      description: null,
      durationSeconds: 95,
      posterUrl: null,
      publishedAt: new Date().toISOString(),
      channel: { id: "c2", name: "Drone Co", slug: "drone-co" },
      category: null,
    };
    mockApi.searchVideos.mockReturnValue(
      new Promise<ReturnType<typeof pageResponse>>((res) => {
        resolveSearch = res;
      }),
    );
    const form = screen.getByLabelText("Search videos").closest("form")!;
    fireEvent.change(screen.getByLabelText("Search videos"), {
      target: { value: "drones" },
    });
    fireEvent.submit(form);
    // The older results stay on screen with no page-wide spinner.
    expect(screen.getByText("Searchable Documentary")).toBeInTheDocument();
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
    expect(mockApi.searchVideos).toHaveBeenCalledWith({
      page: 1,
      pageSize: 12,
      q: "drones",
    });
    await act(async () => {
      resolveSearch(pageResponse([next]));
    });
    expect(await screen.findByText("Fresh Drone Reel")).toBeInTheDocument();
    expect(screen.queryByText("Searchable Documentary")).not.toBeInTheDocument();
  });
});