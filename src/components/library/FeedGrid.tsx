"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Loader2, Film } from "lucide-react";

export interface FeedPageResult<T> {
  items: T[];
  total: number;
  loadedAll: boolean;
}

interface FeedGridProps<T> {
  /** Fetch a page of real backend data. Must handle LOADING/EMPTY/ERROR downstream. */
  fetchPage: (page: number, pageSize: number) => Promise<FeedPageResult<T>>;
  renderItem: (item: T) => React.ReactNode;
  /** Keys to reset + refetch every time (e.g. the active category id or search term). */
  deps?: unknown[];
  emptyTitle?: string;
  emptyMessage?: string;
  className?: string;
}

const PAGE_SIZE = 12;

/**
 * Reusable, responsive discovery grid backed by a real paginated feed.
 * Handles LOADING / EMPTY / ERROR / SUCCESS states and paginated "Load more".
 * Errors are user-readable; no mock data is ever rendered.
 */
export function FeedGrid<T>({
  fetchPage,
  renderItem,
  deps = [],
  emptyTitle = "Nothing here yet",
  emptyMessage = "Videos that match this view will appear here.",
  className = "",
}: FeedGridProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loadedAll, setLoadedAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPage(1, PAGE_SIZE);
      setItems(res.items);
      setTotal(res.total);
      setLoadedAll(res.loadedAll);
    } catch {
      setError("Could not load this content. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  // Load fresh whenever a dependency (category / search term) changes.
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, ...deps]);

  const handleLoadMore = async () => {
    const nextPage = Math.floor(items.length / PAGE_SIZE) + 1;
    setLoadingMore(true);
    try {
      const res = await fetchPage(nextPage, PAGE_SIZE);
      setItems((prev) => [...prev, ...res.items]);
      setTotal(res.total);
      setLoadedAll(res.loadedAll);
    } catch {
      setError("Could not load more. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-gray-500">
        <Loader2 className="w-8 h-8 text-evo-red animate-spin" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
          <Film className="w-6 h-6 text-gray-500" />
        </div>
        <p className="text-lg font-bold text-gray-900">{emptyTitle}</p>
        <p className="text-sm text-gray-500 max-w-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 ${className}`}
      >
        {items.map((item) => renderItem(item))}
      </div>
      {!loadedAll && (
        <div className="mt-10 text-center">
          <button
            type="button"
            disabled={loadingMore}
            onClick={handleLoadMore}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gray-300 text-sm font-semibold text-gray-800 hover:border-gray-900 hover:bg-gray-50 transition-all disabled:opacity-40"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </>
            ) : (
              "Load more"
            )}
          </button>
        </div>
      )}
      {error && (
        <p className="mt-4 text-center text-xs text-red-600">{error}</p>
      )}
    </>
  );
}