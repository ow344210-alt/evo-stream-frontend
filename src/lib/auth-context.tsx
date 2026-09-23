"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  api,
  ApiError,
  clearSession,
  getRefreshToken,
  getStoredUser,
  isDefinitiveAuthError,
  SafeUser,
  storeSession,
} from "./api";

/**
 * Auth lifecycle exposed to the UI:
 * - "resolving": persisted session is being validated (or a transient failure
 *   is blocking it). Never show logged-out UI in this state.
 * - "authenticated": the backend validated the session.
 * - "unauthenticated": the session definitively does not exist / was rejected.
 */
export type AuthStatus = "resolving" | "authenticated" | "unauthenticated";

const RESTORE_RETRY_DELAY_MS = 2000;

interface AuthContextValue {
  user: SafeUser | null;
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  isCreator: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<SafeUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  feedback: string | null;
  notify: (message: string) => void;
  clearFeedback: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type SessionOutcome =
  | { kind: "authenticated"; user: SafeUser }
  | { kind: "unauthenticated" }
  | { kind: "transient" };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("resolving");
  const [feedback, setFeedback] = useState<string | null>(null);
  const restoreTimer = useRef<number | null>(null);

  const isLoading = authStatus === "resolving";

  const clearFeedback = useCallback(() => setFeedback(null), []);

  /**
   * Shows a transient success/notification message via the global toast. The
   * timeout only auto-dismisses the toast UI; it does not delay or gate any
   * authentication or redirect work.
   */
  const notify = useCallback((message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 3000);
  }, []);

  /**
   * Validates the persisted session against the backend. Distinguishes:
   * - definitive authentication rejection -> clears the invalid session;
   * - transient network/server failure -> keeps persisted credentials, stays
   *   in the "resolving" state and schedules an automatic retry. A momentary
   *   outage must never destroy a valid session nor surface logged-out UI.
   * Protected content is never rendered solely from stale local user JSON: the
   * backend must validate the session first (fail-closed).
   */
  const validateStoredSession = useCallback(async () => {
    const outcome = await checkSession();
    if (outcome.kind === "authenticated") {
      setUser(outcome.user);
      setAuthStatus("authenticated");
      return;
    }
    if (outcome.kind === "unauthenticated") {
      clearSession();
      setUser(null);
      setAuthStatus("unauthenticated");
      return;
    }
    setUser(null);
    setAuthStatus("resolving");
    if (restoreTimer.current == null) {
      restoreTimer.current = window.setTimeout(() => {
        restoreTimer.current = null;
        void validateStoredSession();
      }, RESTORE_RETRY_DELAY_MS);
    }
  }, [checkSession]);

  // Restore on mount, and cancel any pending retry on unmount (also avoids
  // leaked timers across tests/hot reloads).
  useEffect(() => {
    void validateStoredSession();
    return () => {
      if (restoreTimer.current != null) {
        window.clearTimeout(restoreTimer.current);
        restoreTimer.current = null;
      }
    };
  }, [validateStoredSession]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    storeSession(result);
    setUser(result.user);
    setAuthStatus("authenticated");
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    if (restoreTimer.current != null) {
      window.clearTimeout(restoreTimer.current);
      restoreTimer.current = null;
    }
    const refresh = getRefreshToken();
    try {
      if (refresh) await api.logout(refresh);
    } catch {
      // Ignore network errors during logout; always clear local state.
    }
    clearSession();
    setUser(null);
    setAuthStatus("unauthenticated");
  }, []);

  // Same safe validation semantics, exposed for manual/explicit refreshes.
  const refreshSession = validateStoredSession;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authStatus,
      isAuthenticated: user !== null,
      isCreator: user?.role === "CREATOR",
      isAdmin: user?.role === "ADMIN",
      isLoading,
      login,
      logout,
      refreshSession,
      feedback,
      notify,
      clearFeedback,
    }),
    [
      user,
      authStatus,
      isLoading,
      login,
      logout,
      refreshSession,
      feedback,
      notify,
      clearFeedback,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Checks the persisted session against the backend and classifies the outcome.
 * `api.me()` itself performs a single-flight refresh when the access token is
 * expired, so this covers both "stale access token recoverable via refresh" and
 * "refresh token definitively invalid".
 */
async function checkSession(): Promise<SessionOutcome> {
  if (!getStoredUser()) {
    return { kind: "unauthenticated" };
  }
  try {
    const me = await api.me();
    if (!me) {
      return { kind: "unauthenticated" };
    }
    return { kind: "authenticated", user: me };
  } catch (error) {
    if (isDefinitiveAuthError(error)) {
      return { kind: "unauthenticated" };
    }
    return { kind: "transient" };
  }
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export { ApiError };