import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ViewerNav } from "@/components/library/ViewerNav";

let pathname = "/discover";

const { mockRouter } = vi.hoisted(() => ({
  mockRouter: { push: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => pathname,
}));

describe("ViewerNav", () => {
  beforeEach(() => {
    pathname = "/discover";
    mockRouter.push.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders a functional centered search field that submits to /discover/search", () => {
    render(<ViewerNav />);
    expect(screen.getByRole("search")).toBeInTheDocument();
    const input = screen.getByLabelText("Search videos");
    fireEvent.change(input, { target: { value: "  drones  " } });
    fireEvent.submit(screen.getByRole("search"));
    expect(mockRouter.push).toHaveBeenCalledWith("/discover/search?q=drones");
  });

  it("routes an empty query to the search page without a query param", () => {
    render(<ViewerNav />);
    fireEvent.change(screen.getByLabelText("Search videos"), {
      target: { value: "   " },
    });
    fireEvent.submit(screen.getByRole("search"));
    expect(mockRouter.push).toHaveBeenCalledWith("/discover/search");
  });

  it("keeps icon-only navigation — no standalone text search pill on desktop", () => {
    render(<ViewerNav />);
    // Exactly one compact search link (the mobile-only affordance).
    const searchLinks = screen.getAllByRole("link", { name: "Search" });
    expect(searchLinks).toHaveLength(1);
    // Nav links are icon-only (no visible action text beside them).
    const latest = screen.getByRole("link", { name: "Latest" });
    expect(latest.textContent).toBe("");
    expect(screen.getByRole("link", { name: "Trending" }).textContent).toBe("");
    expect(screen.getByRole("link", { name: "Following" }).textContent).toBe("");
  });

  it("marks only the current route icon as active", () => {
    pathname = "/discover/trending";
    render(<ViewerNav />);
    expect(
      screen.getByRole("link", { name: "Trending" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: "Latest" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("shows a hover tooltip naming the action", () => {
    render(<ViewerNav />);
    fireEvent.mouseEnter(screen.getByRole("link", { name: "Following" }));
    expect(
      screen.getByRole("tooltip", { name: "Following" }),
    ).toBeInTheDocument();
  });
});