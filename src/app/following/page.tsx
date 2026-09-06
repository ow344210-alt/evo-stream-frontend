"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Loader2, UserCheck, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import type { ViewerChannel } from "@/lib/api";
import { ViewerNav } from "@/components/library/ViewerNav";

const PAGE_SIZE = 12;

/**
 * Following (D8) — real list of hubs the viewer follows, from /me/following,
 * with real unfollow persisted through the backend. Auth-gated on sign-in. No
 * mock hubs.
 */
export default function FollowingPage() {
  const { isAuthenticated, isLoading, notify } = useAuth();
  const [channels, setChannels] = useState<ViewerChannel[]>([]);
  const [total, setTotal] = useState(0);
  const [loadedAll, setLoadedAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unfollowing, setUnfollowing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getFollowingChannels({ page: 1, pageSize: PAGE_SIZE });
      setChannels(res.items);
      setTotal(res.total);
      setLoadedAll(res.total === 0 || res.items.length >= res.total);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load your followed hubs.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setChannels([]);
      return;
    }
    void load();
  }, [isAuthenticated, load]);

  const handleLoadMore = async () => {
    const nextPage = Math.floor(channels.length / PAGE_SIZE) + 1;
    setLoadingMore(true);
    try {
      const res = await api.getFollowingChannels({ page: nextPage, pageSize: PAGE_SIZE });
      setChannels((prev) => [...prev, ...res.items]);
      setTotal(res.total);
      setLoadedAll(res.total === 0 || channels.length + res.items.length >= res.total);
    } catch {
      setError("Could not load more. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleUnfollow = async (channel: ViewerChannel) => {
    setUnfollowing(channel.id);
    try {
      await api.unfollowChannel(channel.id);
      setChannels((prev) => prev.filter((c) => c.id !== channel.id));
      setTotal((t) => Math.max(0, t - 1));
      notify(`Unfollowed ${channel.name}.`);
    } catch (err) {
      notify(
        err instanceof ApiError ? err.message : "Could not unfollow this hub.",
      );
    } finally {
      setUnfollowing(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ViewerNav />
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950">
            Following Hubs
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Hubs you follow, straight from your EVO account.
          </p>
        </div>

        {!isAuthenticated && !isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <Lock className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                Sign in to see who you follow
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Your followed hubs live in your EVO account.
              </p>
            </div>
            <Link
              href="/?auth=signin"
              className="bg-evo-red hover:bg-evo-red-hover text-white text-sm font-semibold px-6 py-3 rounded-full shadow-evo-button transition-all"
            >
              Sign In
            </Link>
          </div>
        ) : loading && channels.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-gray-500">
            <Loader2 className="w-8 h-8 text-evo-red animate-spin" />
            <p className="text-sm">Loading…</p>
          </div>
        ) : error && channels.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">{error}</p>
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-lg font-bold text-gray-900">You aren&apos;t following any hubs yet</p>
            <p className="text-sm text-gray-500 max-w-sm">
              Follow a hub from any video to build your Following list.
            </p>
            <Link
              href="/discover"
              className="bg-evo-red hover:bg-evo-red-hover text-white text-sm font-semibold px-6 py-3 rounded-full shadow-evo-button transition-all mt-2"
            >
              Discover hubs
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="rounded-2xl border border-gray-800/70 bg-gray-900 p-5 shadow-lg hover:shadow-2xl hover:border-evo-red/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-evo-red to-orange-500 flex items-center justify-center text-white font-bold shrink-0">
                      {(channel.name?.[0] ?? "E").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white truncate">
                        {channel.name}
                      </h3>
                      <p className="text-xs text-gray-400 truncate">
                        {channel.description || "EVO creator hub"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={unfollowing === channel.id}
                      onClick={() => handleUnfollow(channel)}
                      aria-label={`Unfollow ${channel.name}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-40 transition-colors"
                    >
                      {unfollowing === channel.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5" />
                      )}
                      Following
                    </button>
                  </div>
                </div>
              ))}
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
        )}
      </main>
    </div>
  );
}