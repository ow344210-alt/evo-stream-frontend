import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import DiscoverPage from "@/app/discover/page";
import type { PublicVideoCard, Category } from "@/lib/api";

const { mockRouter, mockApi } = vi.hoisted(() => {
  const push = vi.fn();
  return {
    mockRouter: { push },
    mockApi: {
      listCategories: vi.fn(),
      getFeedLatest: vi.fn(),
      getFeedTrending: vi.fn(),
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/discover",
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
  title: "Amazing Documentary",
  description: null,
  durationSeconds: 125,
  posterUrl: "/api/media/v1/thumbnails/poster.jpg",
  publishedAt: new Date().toISOString(),
  channel: { id: "c1", name: "DG Studio", slug: "dg-studio" },
  category: { id: "cat1", name: "Documentary", slug: "documentary" },
};

const categories: Category[] = [
  {
    id: "cat1",
    name: "Documentary",
    slug: "documentary",
    description: null,
    icon: null,
    featured: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function pageResponse(items: PublicVideoCard[]) {
  return { items, total: items.length, page: 1, pageSize: 12, totalPages: 1 };
}

beforeEach(() => {
  mockRouter.push.mockReset();
  mockApi.listCategories.mockReset();
  mockApi.getFeedLatest.mockReset();
  mockApi.getFeedTrending.mockReset();
  mockApi.listCategories.mockResolvedValue(categories);
  mockApi.getFeedLatest.mockResolvedValue(pageResponse([]));
  mockApi.getFeedTrending.mockResolvedValue(pageResponse([]));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("Discover page", () => {
  it("loads and renders a real backend feed item by default (latest)", async () => {
    mockApi.getFeedLatest.mockResolvedValue(pageResponse([feedItem]));
    render(<DiscoverPage />);
    expect(await screen.findByText("Amazing Documentary")).toBeInTheDocument();
    expect(mockApi.getFeedLatest).toHaveBeenCalledWith({
      page: 1,
      pageSize: 12,
      category: undefined,
    });
  });

  it("switches to the trending feed when the Trending tab is selected", async () => {
    mockApi.getFeedTrending.mockResolvedValue(pageResponse([feedItem]));
    render(<DiscoverPage />);
    fireEvent.click(screen.getByRole("button", { name: "trending" }));
    await screen.findByText("Amazing Documentary");
    await waitFor(() =>
      expect(mockApi.getFeedTrending).toHaveBeenCalledWith({
        page: 1,
        pageSize: 12,
        category: undefined,
      }),
    );
  });

  it("deep-links to the real player via /?watch= when a card is played", async () => {
    mockApi.getFeedLatest.mockResolvedValue(pageResponse([feedItem]));
    render(<DiscoverPage />);
    const card = await screen.findByLabelText(/play amazing documentary/i);
    fireEvent.click(card);
    expect(mockRouter.push).toHaveBeenCalledWith("/?watch=v1");
  });

  it("shows an empty state when the feed has no content", async () => {
    render(<DiscoverPage />);
    expect(await screen.findByText("No videos published yet")).toBeInTheDocument();
  });
});