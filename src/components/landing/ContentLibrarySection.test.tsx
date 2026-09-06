import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContentLibrarySection } from "@/components/landing/ContentLibrarySection";
import { api } from "@/lib/api";
import type { PublicVideoCard } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    listCategories: vi.fn().mockResolvedValue([]),
    getFeedLatest: vi.fn(),
  },
  resolveMediaUrl: (url: string | null) => url ?? "",
}));

const realVideo = (id: string): PublicVideoCard => ({
  id,
  title: `Real Video ${id}`,
  description: null,
  durationSeconds: 60,
  posterUrl: "/api/media/x.jpg",
  publishedAt: new Date().toISOString(),
  channel: { id: "c", name: "Some Hub", slug: "some-hub" },
  category: { id: "cat", name: "Docs", slug: "docs" },
});

const DEMO_TITLES = [
  "Beyond the Horizon",
  "City Stories",
  "The Last Light",
  "Into the Wild",
] as const;

describe("ContentLibrarySection demo-safe fallback", () => {
  const select = vi.fn();
  const browseAll = vi.fn();
  const mockedFeed = vi.mocked(api.getFeedLatest);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("feed error -> renders 4 static demo cards, never an error/retry block", async () => {
    mockedFeed.mockRejectedValueOnce(new Error("network down"));
    render(<ContentLibrarySection onSelectVideo={select} onBrowseAll={browseAll} />);

    for (const title of DEMO_TITLES) {
      expect(await screen.findByText(title)).toBeInTheDocument();
    }
    expect(screen.queryByText("Could not load videos right now.")).not.toBeInTheDocument();
    expect(screen.queryByText("No published videos yet. Check back soon.")).not.toBeInTheDocument();
  });

  it("empty successful feed -> 4 static demo cards", async () => {
    mockedFeed.mockResolvedValueOnce(emptyFeed());
    render(<ContentLibrarySection onSelectVideo={select} onBrowseAll={browseAll} />);

    for (const title of DEMO_TITLES) {
      expect(await screen.findByText(title)).toBeInTheDocument();
    }
  });

  it("1 real video -> real card first plus 3 demo cards; clicking the real card selects it", async () => {
    mockedFeed.mockResolvedValueOnce(feedOf([realVideo("r1")]));
    render(<ContentLibrarySection onSelectVideo={select} onBrowseAll={browseAll} />);

    const realCard = await screen.findByText("Real Video r1");
    expect(realCard).toBeInTheDocument();
    expect(screen.getByText("Beyond the Horizon")).toBeInTheDocument();
    expect(screen.getByText("City Stories")).toBeInTheDocument();
    expect(screen.getByText("The Last Light")).toBeInTheDocument();
    expect(screen.queryByText("Into the Wild")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Real Video r1"));
    expect(select).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith("r1");
  });

  it("clicking a demo card never opens the real player", async () => {
    mockedFeed.mockRejectedValueOnce(new Error("network down"));
    render(<ContentLibrarySection onSelectVideo={select} onBrowseAll={browseAll} />);

    fireEvent.click(await screen.findByText("Into the Wild"));
    fireEvent.click(screen.getByText("Beyond the Horizon"));
    expect(select).not.toHaveBeenCalled();
  });

  it("4 real videos -> all real, no demo fill", async () => {
    mockedFeed.mockResolvedValueOnce(
      feedOf([realVideo("r1"), realVideo("r2"), realVideo("r3"), realVideo("r4")]),
    );
    render(<ContentLibrarySection onSelectVideo={select} onBrowseAll={browseAll} />);

    for (const id of ["r1", "r2", "r3", "r4"]) {
      expect(await screen.findByText(`Real Video ${id}`)).toBeInTheDocument();
    }
    expect(screen.queryByText("Beyond the Horizon")).not.toBeInTheDocument();
  });

  it("5 real videos -> keeps the real grid, zero demo cards", async () => {
    mockedFeed.mockResolvedValueOnce(
      feedOf(Array.from({ length: 5 }, (_, i) => realVideo(`r${i + 1}`))),
    );
    render(<ContentLibrarySection onSelectVideo={select} onBrowseAll={browseAll} />);

    for (const id of ["r1", "r2", "r3", "r4", "r5"]) {
      expect(await screen.findByText(`Real Video ${id}`)).toBeInTheDocument();
    }
    expect(screen.queryByText("Beyond the Horizon")).not.toBeInTheDocument();
    expect(screen.queryByText("Into the Wild")).not.toBeInTheDocument();
  });
});

const feedOf = (items: PublicVideoCard[]) => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 12,
  totalPages: Math.ceil(items.length / 12),
});

const emptyFeed = () => feedOf([]);