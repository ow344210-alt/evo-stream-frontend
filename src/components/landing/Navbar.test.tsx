import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Navbar } from "@/components/landing/Navbar";

const { authState, mockRouter } = vi.hoisted(() => ({
  authState: {
    user: { name: "QA Viewer" },
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn().mockResolvedValue(undefined),
    notify: vi.fn(),
  },
  mockRouter: { push: vi.fn(), replace: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => authState,
}));

vi.mock("@/components/ui/ConfirmDialog", () => ({
  ConfirmDialog: () => null,
}));

function renderNavbar() {
  return render(
    <Navbar onOpenAuth={vi.fn()} onOpenSearch={vi.fn()} />,
  );
}

describe("Navbar account menu", () => {
  beforeEach(() => {
    authState.isAuthenticated = true;
    authState.isLoading = false;
    mockRouter.push.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("offers exactly one 'My Library' entry routing to /my-list", () => {
    renderNavbar();
    fireEvent.click(screen.getByRole("button", { name: /QA Viewer/i }));

    const menu = screen.getByRole("menu");
    const myLibraryItems = screen.getAllByRole("menuitem", {
      name: "My Library",
    });
    expect(myLibraryItems).toHaveLength(1);
    expect(myLibraryItems[0]).toHaveAttribute("href", "/my-list");
    expect(
      menu.querySelectorAll('[href="/my-list"]'),
    ).toHaveLength(1);
  });

  it("keeps the canonical saved-video destination on /my-list (no /library alias)", () => {
    renderNavbar();
    fireEvent.click(screen.getByRole("button", { name: /QA Viewer/i }));

    const menu = screen.getByRole("menu");
    const links = Array.from(menu.querySelectorAll("a[href]")).map((a) =>
      a.getAttribute("href"),
    );
    expect(links).toContain("/my-list");
    expect(links).not.toContain("/library");
    expect(links).not.toContain("/my-library");
  });
});