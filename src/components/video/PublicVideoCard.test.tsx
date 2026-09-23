import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PublicVideoCard } from "@/components/video/PublicVideoCard";
import type { PublicVideoCard as PublicVideoCardData } from "@/lib/api";

const video: PublicVideoCardData = {
  id: "v1",
  title: "Amazing Documentary",
  description: "A great video",
  durationSeconds: 125,
  posterUrl: "/api/media/v1/thumbnails/poster.jpg",
  publishedAt: new Date().toISOString(),
  channel: { id: "c1", name: "DG Studio", slug: "dg-studio" },
  category: { id: "cat1", name: "Documentary", slug: "documentary" },
};

describe("PublicVideoCard", () => {
  it("renders real title, channel and category (never fake data)", () => {
    const onPlay = vi.fn();
    render(<PublicVideoCard video={video} onPlay={onPlay} />);
    expect(screen.getByText("Amazing Documentary")).toBeInTheDocument();
    expect(screen.getByText("DG Studio")).toBeInTheDocument();
    expect(screen.getByText("Documentary")).toBeInTheDocument();
  });

  it("opens the real player via onPlay with the video id", () => {
    const onPlay = vi.fn();
    render(<PublicVideoCard video={video} onPlay={onPlay} />);
    fireEvent.click(screen.getByRole("button", { name: /play amazing documentary/i }));
    expect(onPlay).toHaveBeenCalledWith("v1");
  });

  it("renders a fallback initial when there is no poster", () => {
    const onPlay = vi.fn();
    render(<PublicVideoCard video={{ ...video, posterUrl: null }} onPlay={onPlay} />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});