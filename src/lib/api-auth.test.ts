import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { SafeUser } from "@/lib/api";

const USER: SafeUser = {
  id: "u1",
  email: "a@example.com",
  name: "A",
  role: "USER",
  status: "ACTIVE",
  emailVerified: true,
  createdAt: "c",
  updatedAt: "u",
};

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? "OK" : "Error",
    json: async () => body,
  } as Response;
}

async function loadApi() {
  vi.resetModules();
  return import("@/lib/api");
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem("evo_access_token", "access-1");
  window.localStorage.setItem("evo_refresh_token", "refresh-1");
  window.localStorage.setItem("evo_user", JSON.stringify(USER));
});

afterEach(() => {
  window.localStorage.clear();
});

describe("single-flight refresh (authenticatedRequest)", () => {
  it("performs exactly ONE refresh for simultaneous 401s", async () => {
    const api = await loadApi();
    const refreshCalls = vi.fn();
    let authRequests = 0;

    global.fetch = vi.fn(async (input: unknown, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/refresh")) {
        refreshCalls();
        return jsonResponse(200, { accessToken: "access-2", refreshToken: "refresh-2" });
      }
      authRequests += 1;
      if (authRequests <= 2) return jsonResponse(401, { message: "Unauthorized" });
      return jsonResponse(200, { ok: true });
    }) as unknown as typeof fetch;

    const [a, b] = await Promise.all([
      api.authenticatedRequest("/a"),
      api.authenticatedRequest("/b"),
    ]);

    expect(a).toEqual({ ok: true });
    expect(b).toEqual({ ok: true });
    expect(refreshCalls).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem("evo_access_token")).toBe("access-2");
    expect(window.localStorage.getItem("evo_refresh_token")).toBe("refresh-2");
  });

  it("lets concurrent waiters retry with the newly issued access token", async () => {
    const api = await loadApi();
    const authHeaders: (string | undefined)[] = [];

    global.fetch = vi.fn(async (input: unknown, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/refresh")) {
        return jsonResponse(200, { accessToken: "access-2", refreshToken: "refresh-2" });
      }
      const auth = (init?.headers as Record<string, string> | undefined)?.Authorization;
      authHeaders.push(auth);
      if (auth === "Bearer access-1") return jsonResponse(401, { message: "Unauthorized" });
      return jsonResponse(200, { ok: true });
    }) as unknown as typeof fetch;

    await Promise.all([
      api.authenticatedRequest("/a"),
      api.authenticatedRequest("/b"),
    ]);

    expect(authHeaders.filter((h) => h === "Bearer access-1")).toHaveLength(2);
    expect(authHeaders.filter((h) => h === "Bearer access-2")).toHaveLength(2);
  });

  it("propagates a failed refresh consistently without retry loops and clears an invalid session", async () => {
    const api = await loadApi();
    const refreshCalls = vi.fn();

    global.fetch = vi.fn(async (input: unknown) => {
      if (String(input).endsWith("/auth/refresh")) {
        refreshCalls();
        return jsonResponse(401, { message: "Invalid or expired refresh token" });
      }
      return jsonResponse(401, { message: "Unauthorized" });
    }) as unknown as typeof fetch;

    await expect(
      Promise.all([api.authenticatedRequest("/a"), api.authenticatedRequest("/b")]),
    ).rejects.toMatchObject({ status: 401 });

    expect(refreshCalls).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem("evo_access_token")).toBeNull();
    expect(window.localStorage.getItem("evo_refresh_token")).toBeNull();
  });

  it("keeps persisted tokens when the refresh fails transiently (5xx)", async () => {
    const api = await loadApi();

    global.fetch = vi.fn(async (input: unknown) => {
      if (String(input).endsWith("/auth/refresh")) {
        return jsonResponse(503, { message: "Service Unavailable" });
      }
      return jsonResponse(401, { message: "Unauthorized" });
    }) as unknown as typeof fetch;

    await expect(api.authenticatedRequest("/a")).rejects.toMatchObject({
      status: 503,
    });
    expect(window.localStorage.getItem("evo_access_token")).toBe("access-1");
    expect(window.localStorage.getItem("evo_refresh_token")).toBe("refresh-1");
  });

  it("clears the session when a 401 arrives with no refresh token available", async () => {
    window.localStorage.removeItem("evo_refresh_token");
    const api = await loadApi();
    const refreshCalls = vi.fn();

    global.fetch = vi.fn(async (input: unknown) => {
      if (String(input).endsWith("/auth/refresh")) {
        refreshCalls();
        return jsonResponse(200, { accessToken: "access-2", refreshToken: "refresh-2" });
      }
      return jsonResponse(401, { message: "Unauthorized" });
    }) as unknown as typeof fetch;

    await expect(api.authenticatedRequest("/a")).rejects.toMatchObject({
      status: 401,
    });
    expect(refreshCalls).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("evo_access_token")).toBeNull();
  });
});