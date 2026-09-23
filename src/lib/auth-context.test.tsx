import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

const apiMock = vi.hoisted(() => ({
  me: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
}));

const sessionMock = vi.hoisted(() => ({
  clearSession: vi.fn(),
  storeSession: vi.fn(),
}));

vi.mock("@/lib/api", () => {
  class MockApiError extends Error {
    status: number;
    details?: string[];
    constructor(message: string, status: number, details?: string[]) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.details = details;
    }
  }
  return {
    ApiError: MockApiError,
    isDefinitiveAuthError: (error: unknown) =>
      error instanceof MockApiError &&
      (error.status === 401 || error.status === 403),
    api: apiMock,
    clearSession: sessionMock.clearSession,
    storeSession: sessionMock.storeSession,
    getRefreshToken: () => window.localStorage.getItem("evo_refresh_token"),
    getStoredUser: () => {
      const raw = window.localStorage.getItem("evo_user");
      return raw ? JSON.parse(raw) : null;
    },
  };
});

const USER = {
  id: "u1",
  email: "a@example.com",
  name: "A",
  role: "CREATOR",
  status: "ACTIVE",
  emailVerified: true,
  createdAt: "c",
  updatedAt: "u",
};

function seedStoredSession() {
  window.localStorage.setItem("evo_user", JSON.stringify(USER));
  window.localStorage.setItem("evo_access_token", "access-1");
  window.localStorage.setItem("evo_refresh_token", "refresh-1");
}

function Harness() {
  const { authStatus, user, isLoading } = useAuth();
  return (
    <div>
      <span data-testid="status">{authStatus}</span>
      <span data-testid="user">{user?.email ?? "none"}</span>
      <span data-testid="loading">{String(isLoading)}</span>
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  apiMock.me.mockReset();
  apiMock.login.mockReset();
  apiMock.logout.mockReset();
  apiMock.refresh.mockReset();
  sessionMock.clearSession.mockClear();
  sessionMock.storeSession.mockClear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe("AuthProvider session restoration", () => {
  it("restores a persisted session after reload", async () => {
    seedStoredSession();
    apiMock.me.mockResolvedValue(USER);

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    expect(screen.getByTestId("status").textContent).toBe("resolving");

    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("authenticated"),
    );
    expect(screen.getByTestId("user").textContent).toBe("a@example.com");
    expect(screen.getByTestId("loading").textContent).toBe("false");
    expect(sessionMock.clearSession).not.toHaveBeenCalled();
  });

  it("does NOT destroy the session when me() fails transiently (5xx)", async () => {
    seedStoredSession();
    apiMock.me.mockRejectedValue(new ApiError("Internal", 500));

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("none"));
    expect(screen.getByTestId("status").textContent).toBe("resolving");
    expect(screen.getByTestId("loading").textContent).toBe("true");
    expect(sessionMock.clearSession).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("evo_refresh_token")).toBe("refresh-1");
    expect(window.localStorage.getItem("evo_access_token")).toBe("access-1");
  });

  it("does NOT destroy the session on a network-level (non-ApiError) failure", async () => {
    seedStoredSession();
    apiMock.me.mockRejectedValue(new TypeError("Failed to fetch"));

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("none"));
    expect(screen.getByTestId("status").textContent).toBe("resolving");
    expect(sessionMock.clearSession).not.toHaveBeenCalled();
  });

  it("clears the invalid session when me() definitively rejects (401)", async () => {
    seedStoredSession();
    apiMock.me.mockRejectedValue(new ApiError("Invalid or expired refresh token", 401));

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("unauthenticated"),
    );
    expect(screen.getByTestId("user").textContent).toBe("none");
    expect(sessionMock.clearSession).toHaveBeenCalledTimes(1);
  });

  it("treats a suspended account (403) as a definitive rejection and clears the session", async () => {
    seedStoredSession();
    apiMock.me.mockRejectedValue(new ApiError("This account has been suspended", 403));

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("unauthenticated"),
    );
    expect(sessionMock.clearSession).toHaveBeenCalledTimes(1);
  });

  it("resolves unauthenticated when no session is stored", async () => {
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("unauthenticated"),
    );
    expect(apiMock.me).not.toHaveBeenCalled();
  });

  it("never grants stale local user JSON without backend validation on transient failure", async () => {
    seedStoredSession();
    apiMock.me.mockRejectedValue(new Error("down"));

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("none"));
    expect(screen.getByTestId("status").textContent).toBe("resolving");
    expect(sessionMock.storeSession).not.toHaveBeenCalled();
  });
});