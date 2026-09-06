import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AdminUsersPage from "@/app/admin/users/page";

const { mockApi, mockAuth } = vi.hoisted(() => {
  return {
    mockApi: {
      adminListUsers: vi.fn(),
      adminUpdateUserStatus: vi.fn(),
      adminUpdateUserRole: vi.fn(),
    },
    mockAuth: {
      user: { id: "admin-1", name: "Admin User", role: "ADMIN" },
      isAuthenticated: true,
      isAdmin: true,
    },
  };
});

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, api: mockApi };
});

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => mockAuth,
}));

vi.mock("@/components/admin/AdminHeader", () => ({
  AdminHeader: ({ title }: { title: string }) => (
    <div data-testid="admin-header">{title}</div>
  ),
}));

vi.mock("@/components/ui/ConfirmDialog", () => ({
  ConfirmDialog: ({
    open,
    title,
    message,
    confirmLabel,
    cancelLabel,
    loading,
    onConfirm,
    onCancel,
  }: any) =>
    open ? (
      <div data-testid="confirm-dialog">
        <span data-testid="confirm-title">{title}</span>
        <span data-testid="confirm-message">{message}</span>
        <button onClick={onCancel} data-testid="confirm-cancel">
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          data-testid="confirm-ok"
        >
          {loading ? "Loading..." : confirmLabel}
        </button>
      </div>
    ) : null,
}));

const mockUsers = {
  items: [
    {
      id: "viewer-1",
      name: "Ali Khan",
      email: "ali@test.com",
      role: "USER" as const,
      status: "ACTIVE" as const,
      emailVerified: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      creatorProfile: null,
    },
    {
      id: "creator-1",
      name: "Ahmed Ali",
      email: "ahmed@test.com",
      role: "CREATOR" as const,
      status: "ACTIVE" as const,
      emailVerified: true,
      createdAt: "2026-02-01T00:00:00Z",
      updatedAt: "2026-02-01T00:00:00Z",
      creatorProfile: { id: "cp-1", isVerified: false, channel: null },
    },
    {
      id: "admin-1",
      name: "Admin User",
      email: "admin@test.com",
      role: "ADMIN" as const,
      status: "ACTIVE" as const,
      emailVerified: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      creatorProfile: null,
    },
  ],
  total: 3,
  page: 1,
  pageSize: 100,
  totalPages: 1,
};

describe("Admin User Management - Role Dropdown", () => {
  beforeEach(() => {
    localStorage.setItem(
      "evo_user",
      JSON.stringify({ id: "admin-1", name: "Admin User", role: "ADMIN" }),
    );
    mockApi.adminListUsers.mockResolvedValue(mockUsers);
    mockApi.adminUpdateUserRole.mockResolvedValue({
      ...mockUsers.items[0],
      role: "ADMIN",
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders role dropdowns for non-self users", async () => {
    render(<AdminUsersPage />);
    await waitFor(() =>
      expect(mockApi.adminListUsers).toHaveBeenCalled(),
    );

    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBe(2);
  });

  it("shows disabled role badge for current admin (self)", async () => {
    render(<AdminUsersPage />);
    await waitFor(() =>
      expect(mockApi.adminListUsers).toHaveBeenCalled(),
    );

    expect(screen.getByText("Admin User")).toBeInTheDocument();
    const selfSelect = screen.queryByLabelText("Change role for Admin User");
    expect(selfSelect).toBeNull();
  });

  it("displays Viewer/Creator/Admin labels in dropdown", async () => {
    render(<AdminUsersPage />);
    await waitFor(() =>
      expect(mockApi.adminListUsers).toHaveBeenCalled(),
    );

    const selects = screen.getAllByRole("combobox");
    const viewerSelect = selects[0];
    expect(viewerSelect).toHaveValue("USER");
    expect(viewerSelect.querySelector('option[value="USER"]')).toHaveTextContent("Viewer");
    expect(viewerSelect.querySelector('option[value="CREATOR"]')).toHaveTextContent("Creator");
    expect(viewerSelect.querySelector('option[value="ADMIN"]')).toHaveTextContent("Admin");
  });

  it("opens confirmation dialog when selecting a different role", async () => {
    render(<AdminUsersPage />);
    await waitFor(() =>
      expect(mockApi.adminListUsers).toHaveBeenCalled(),
    );

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "ADMIN" } });

    await waitFor(() =>
      expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("confirm-title")).toHaveTextContent("Change user role?");
    expect(screen.getByTestId("confirm-message")).toHaveTextContent(
      "Ali Khan\u2019s role from Viewer to Admin?",
    );
  });

  it("closes dialog on cancel without making API call", async () => {
    render(<AdminUsersPage />);
    await waitFor(() =>
      expect(mockApi.adminListUsers).toHaveBeenCalled(),
    );

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "ADMIN" } });

    await waitFor(() =>
      expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("confirm-cancel"));
    await waitFor(() =>
      expect(screen.queryByTestId("confirm-dialog")).toBeNull(),
    );
    expect(mockApi.adminUpdateUserRole).not.toHaveBeenCalled();
  });

  it("calls API and shows success toast on confirm", async () => {
    render(<AdminUsersPage />);
    await waitFor(() =>
      expect(mockApi.adminListUsers).toHaveBeenCalled(),
    );

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "ADMIN" } });

    await waitFor(() =>
      expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument(),
    );

    mockApi.adminUpdateUserRole.mockResolvedValue({
      ...mockUsers.items[0],
      role: "ADMIN",
    });

    fireEvent.click(screen.getByTestId("confirm-ok"));

    await waitFor(() => {
      expect(mockApi.adminUpdateUserRole).toHaveBeenCalledWith(
        "viewer-1",
        "ADMIN",
      );
    });

    await waitFor(() =>
      expect(screen.getByText("Ali Khan is now an Admin.")).toBeInTheDocument(),
    );
  });

  it("shows error toast and preserves role on API failure", async () => {
    mockApi.adminUpdateUserRole.mockRejectedValue(
      new Error("At least one administrator must remain"),
    );

    render(<AdminUsersPage />);
    await waitFor(() =>
      expect(mockApi.adminListUsers).toHaveBeenCalled(),
    );

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "ADMIN" } });

    await waitFor(() =>
      expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("confirm-ok"));

    await waitFor(() =>
      expect(
        screen.getByText("At least one administrator must remain"),
      ).toBeInTheDocument(),
    );

    expect(mockApi.adminUpdateUserRole).toHaveBeenCalledWith(
      "viewer-1",
      "ADMIN",
    );

    const stillThere = screen.getAllByRole("combobox")[0];
    expect(stillThere).toHaveValue("USER");
  });

  it("disables the Creator option for a USER (viewer) user", async () => {
    render(<AdminUsersPage />);
    await waitFor(() =>
      expect(mockApi.adminListUsers).toHaveBeenCalled(),
    );

    const selects = screen.getAllByRole("combobox");
    const viewerSelect = selects[0];
    const creatorOption = viewerSelect.querySelector(
      'option[value="CREATOR"]',
    ) as HTMLOptionElement | null;
    expect(creatorOption).not.toBeNull();
    expect((creatorOption as HTMLOptionElement).disabled).toBe(true);
  });

  it("enables Creator option for a CREATOR user", async () => {
    render(<AdminUsersPage />);
    await waitFor(() =>
      expect(mockApi.adminListUsers).toHaveBeenCalled(),
    );

    const selects = screen.getAllByRole("combobox");
    const creatorSelect = selects[1];
    const creatorOption = creatorSelect.querySelector(
      'option[value="CREATOR"]',
    ) as HTMLOptionElement | null;
    expect((creatorOption as HTMLOptionElement).disabled).toBe(false);
  });

  it("disables confirm button while request is pending", async () => {
    let resolveUpdate: (v: unknown) => void;
    mockApi.adminUpdateUserRole.mockImplementation(
      () => new Promise((r) => (resolveUpdate = r)),
    );

    render(<AdminUsersPage />);
    await waitFor(() =>
      expect(mockApi.adminListUsers).toHaveBeenCalled(),
    );

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "ADMIN" } });

    await waitFor(() =>
      expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("confirm-ok"));

    await waitFor(() =>
      expect(screen.getByTestId("confirm-ok")).toHaveAttribute("disabled"),
    );

    resolveUpdate!({
      ...mockUsers.items[0],
      role: "ADMIN",
    });

    await waitFor(() =>
      expect(screen.queryByTestId("confirm-dialog")).toBeNull(),
    );
  });
});
