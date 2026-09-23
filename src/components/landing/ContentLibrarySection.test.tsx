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

describe("ContentLibrarySection real backend data", () => {
  const select = vi.fn();
  const browseAll = vi.fn();
  const mockedFeed = vi.mocked(api.getFeedLatest);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("empty feed -> renders clean empty state without fake demo cards", async () => {
    mockedFeed.mockResolvedValueOnce(emptyFeed());
    render(<ContentLibrarySection onSelectVideo={select} onBrowseAll={browseAll} />);

    expect(await screen.findByText("No videos uploaded yet")).toBeInTheDocument();
    expect(screen.queryByText("Beyond the Horizon")).not.toBeInTheDocument();
    expect(screen.queryByText("Into the Wild")).not.toBeInTheDocument();
  });

  it("feed error -> renders clean empty state", async () => {
    mockedFeed.mockRejectedValueOnce(new Error("network down"));
    render(<ContentLibrarySection onSelectVideo={select} onBrowseAll={browseAll} />);

    expect(await screen.findByText("No videos uploaded yet")).toBeInTheDocument();
  });

  it("1 real video -> renders real card only; clicking it selects the video", async () => {
    mockedFeed.mockResolvedValueOnce(feedOf([realVideo("r1")]));
    render(<ContentLibrarySection onSelectVideo={select} onBrowseAll={browseAll} />);

    const realCard = await screen.findByText("Real Video r1");
    expect(realCard).toBeInTheDocument();
    expect(screen.queryByText("Beyond the Horizon")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Real Video r1"));
    expect(select).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith("r1");
  });

  it("multiple real videos -> renders all real cards", async () => {
    mockedFeed.mockResolvedValueOnce(
      feedOf([realVideo("r1"), realVideo("r2"), realVideo("r3"), realVideo("r4")]),
    );
    render(<ContentLibrarySection onSelectVideo={select} onBrowseAll={browseAll} />);

    for (const id of ["r1", "r2", "r3", "r4"]) {
      expect(await screen.findByText(`Real Video ${id}`)).toBeInTheDocument();
    }
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