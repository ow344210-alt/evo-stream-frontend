"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Lock } from "lucide-react";

interface LoadResult<T> {
  items: T[];
  total: number;
  loadedAll: boolean;
}

interface VideoGridPageProps<T> {
  title: string;
  subtitle?: string;
  emptyTitle: string;
  emptyMessage: string;
  isAuthenticated: boolean;
  fetchItems: (page: number, pageSize: number) => Promise<LoadResult<T>>;
  renderItem: (item: T, removeLocal: (item: T) => void) => React.ReactNode;
}

const PAGE_SIZE = 12;

/**
 * Shared viewer library page chrome used by My List / Liked / History. Guards
 * on authentication (routes anonymous users to the existing sign-in deep link),
 * loads real backend data, and shows loading / empty / error states with
 * paginated load-more. No mock data.
 */
export function VideoGridPage<T>({
  title,
  subtitle,
  emptyTitle,
  emptyMessage,
  isAuthenticated,
  fetchItems,
  renderItem,
}: VideoGridPageProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loadedAll, setLoadedAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchItems(1, PAGE_SIZE);
      setItems(res.items);
      setTotal(res.total);
      setLoadedAll(res.loadedAll);
    } catch {
      setError("Something went wrong loading this list. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [fetchItems]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setItems([]);
      return;
    }
    load();
  }, [isAuthenticated, load]);

  const handleLoadMore = async () => {
    const nextPage = Math.floor(items.length / PAGE_SIZE) + 1;
    setLoading(true);
    try {
      const res = await fetchItems(nextPage, PAGE_SIZE);
      setItems((prev) => [...prev, ...res.items]);
      setTotal(res.total);
      setLoadedAll(res.loadedAll);
    } catch {
      setError("Could not load more. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const removeLocal = useCallback((item: T) => {
    setItems((prev) => prev.filter((x) => x !== item));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  return (
    <main className="min-h-[70vh] bg-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
        </div>

        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <Lock className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">Sign in to view {title.toLowerCase()}</p>
              <p className="text-sm text-gray-500 mt-1">
                Your {title.toLowerCase()} lives in your EVO account.
              </p>
            </div>
            <Link
              href="/?auth=signin"
              className="bg-evo-red hover:bg-evo-red-hover text-white text-sm font-semibold px-6 py-3 rounded-full shadow-evo-button transition-all"
            >
              Sign In
            </Link>
          </div>
        ) : loading && items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-gray-500">
            <Loader2 className="w-8 h-8 text-evo-red animate-spin" />
            <p className="text-sm">Loading…</p>
          </div>
        ) : error && items.length === 0 ? (
          <p className="py-20 text-center text-sm text-gray-500">{error}</p>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg font-bold text-gray-900">{emptyTitle}</p>
            <p className="text-sm text-gray-500 mt-1">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {items.map((item) => renderItem(item, removeLocal))}
            </div>
            {!loadedAll && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleLoadMore}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gray-300 text-sm font-semibold text-gray-800 hover:border-gray-900 hover:bg-gray-50 transition-all disabled:opacity-40"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                    </>
                  ) : (
                    "Load more"
                  )}
                </button>
              </div>
            )}
            {error && items.length > 0 && (
              <p className="mt-4 text-center text-xs text-red-600">{error}</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
