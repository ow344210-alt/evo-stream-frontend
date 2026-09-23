import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AdminSidebar, AdminSidebarProvider, formatCompactNumber } from "@/components/admin/AdminSidebar";
import { api } from "@/lib/api";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "u-admin", name: "Admin Test", email: "admin@evo.com", role: "ADMIN" },
    logout: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    adminGetDashboard: vi.fn(),
  },
}));

describe("formatCompactNumber", () => {
  it("formats zero as 0", () => {
    expect(formatCompactNumber(0)).toBe("0");
  });

  it("formats numbers under 1000 with locale commas", () => {
    expect(formatCompactNumber(524)).toBe("524");
    expect(formatCompactNumber(137)).toBe("137");
  });

  it("formats thousands with K suffix", () => {
    expect(formatCompactNumber(1200)).toBe("1.2K");
    expect(formatCompactNumber(1245)).toBe("1.2K");
    expect(formatCompactNumber(89430)).toBe("89.4K");
    expect(formatCompactNumber(108000)).toBe("108K");
  });

  it("formats millions with M suffix", () => {
    expect(formatCompactNumber(1250000)).toBe("1.25M");
    expect(formatCompactNumber(10000000)).toBe("10M");
  });

  it("handles null/undefined gracefully", () => {
    expect(formatCompactNumber(null)).toBe("");
    expect(formatCompactNumber(undefined)).toBe("");
  });
});

describe("AdminSidebar Real Backend Data Integration", () => {
  const mockGetDashboard = vi.mocked(api.adminGetDashboard);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders real counts from backend dashboard totals", async () => {
    mockGetDashboard.mockResolvedValueOnce({
      totalUsers: 137,
      totalCreators: 42,
      totalChannels: 18,
      totalVideos: 950,
      totalCategories: 12,
      recentVideos: [],
      recentCreators: [],
    });

    render(
      <AdminSidebarProvider>
        <AdminSidebar />
      </AdminSidebarProvider>,
    );

    // Verify real counts appear in the sidebar
    expect(await screen.findByText("137")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("950")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();

    // Verify old hardcoded dummy counts are NOT present
    expect(screen.queryByText("524K")).not.toBeInTheDocument();
    expect(screen.queryByText("14.2K")).not.toBeInTheDocument();
    expect(screen.queryByText("12.8K")).not.toBeInTheDocument();
    expect(screen.queryByText("108K")).not.toBeInTheDocument();
  });

  it("renders 0 when backend count is 0", async () => {
    mockGetDashboard.mockResolvedValueOnce({
      totalUsers: 0,
      totalCreators: 0,
      totalChannels: 0,
      totalVideos: 0,
      totalCategories: 0,
      recentVideos: [],
      recentCreators: [],
    });

    render(
      <AdminSidebarProvider>
        <AdminSidebar />
      </AdminSidebarProvider>,
    );

    await waitFor(() => {
      const zeros = screen.getAllByText("0");
      expect(zeros.length).toBeGreaterThanOrEqual(4);
    });

    expect(screen.queryByText("524K")).not.toBeInTheDocument();
  });

  it("does not show fake fallback badges on API failure", async () => {
    mockGetDashboard.mockRejectedValueOnce(new Error("Network Error"));

    render(
      <AdminSidebarProvider>
        <AdminSidebar />
      </AdminSidebarProvider>,
    );

    // Verify no fake fallback badges are shown
    expect(screen.queryByText("524K")).not.toBeInTheDocument();
    expect(screen.queryByText("14.2K")).not.toBeInTheDocument();
    expect(screen.queryByText("12.8K")).not.toBeInTheDocument();
    expect(screen.queryByText("108K")).not.toBeInTheDocument();
  });

  it("provides View Public Site action pointing to /", async () => {
    mockGetDashboard.mockResolvedValueOnce({
      totalUsers: 1,
      totalCreators: 1,
      totalChannels: 1,
      totalVideos: 1,
      totalCategories: 1,
      recentVideos: [],
      recentCreators: [],
    });

    render(
      <AdminSidebarProvider>
        <AdminSidebar />
      </AdminSidebarProvider>,
    );

    const publicLink = screen.getByRole("link", { name: /view public site/i });
    expect(publicLink).toBeInTheDocument();
    expect(publicLink).toHaveAttribute("href", "/");
  });
});
