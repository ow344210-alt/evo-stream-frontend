"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  api,
  ApiError,
  clearSession,
  getRefreshToken,
  getStoredUser,
  SafeUser,
  storeSession,
} from "./api";

interface AuthContextValue {
  user: SafeUser | null;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

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

  const restore = useCallback(async () => {
    const stored = getStoredUser();
    if (!stored) {
      setIsLoading(false);
      return;
    }
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      clearSession();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restore();
  }, [restore]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    storeSession(result);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    const refresh = getRefreshToken();
    try {
      if (refresh) await api.logout(refresh);
    } catch {
      // Ignore network errors during logout; always clear local state.
    }
    clearSession();
    setUser(null);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      clearSession();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
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
    [user, isLoading, login, logout, refreshSession, feedback, notify, clearFeedback],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export { ApiError };
