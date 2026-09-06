"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Film,
  Tv,
  Video,
  LayoutGrid,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle,
  Plus,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { api, type AdminDashboardStats } from "@/lib/api";

function formatNumber(value: number): string {
  return value.toLocaleString();
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .adminGetDashboard()
      .then((data) => {
        if (active) {
          setStats(data);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (active) {
          const msg =
            e instanceof Error ? e.message : "Failed to load dashboard data";
          setError(msg);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col flex-1">
        <AdminHeader
          title="Platform Operations Overview"
          subtitle="Loading real platform statistics from the backend…"
        />
        <div className="flex flex-col items-center justify-center py-32 gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-semibold">
            Loading dashboard data…
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col flex-1">
        <AdminHeader
          title="Platform Operations Overview"
          subtitle="Global telemetry, user activity, content ingestion rates, and platform moderation."
        />
        <div className="flex flex-col items-center justify-center py-32 gap-3 text-center px-6">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-6 h-6" />
            <span className="text-base font-bold">
              Unable to load dashboard data
            </span>
          </div>
          <p className="text-sm text-gray-500 max-w-md">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              api
                .adminGetDashboard()
                .then((data) => {
                  setStats(data);
                })
                .catch((err: unknown) => {
                  setError(
                    err instanceof Error ? err.message : "Failed to load dashboard data",
                  );
                })
                .finally(() => setLoading(false));
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-evo-red hover:bg-evo-red-hover text-white text-xs font-bold shadow-evo-button transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Users",
      value: stats ? formatNumber(stats.totalUsers) : "—",
      icon: Users,
      href: "/admin/users",
      bgClass: "bg-blue-50 text-blue-600",
    },
    {
      title: "Total Creators",
      value: stats ? formatNumber(stats.totalCreators) : "—",
      icon: Film,
      href: "/admin/creators",
      bgClass: "bg-purple-50 text-purple-600",
    },
    {
      title: "Total Hubs",
      value: stats ? formatNumber(stats.totalChannels) : "—",
      icon: Tv,
      href: "/admin/channels",
      bgClass: "bg-amber-50 text-amber-600",
    },
    {
      title: "Total Videos",
      value: stats ? formatNumber(stats.totalVideos) : "—",
      icon: Video,
      href: "/admin/videos",
      bgClass: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Total Categories",
      value: stats ? formatNumber(stats.totalCategories) : "—",
      icon: LayoutGrid,
      href: "/admin/categories",
      bgClass: "bg-evo-red-light text-evo-red",
    },
  ];

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Platform Operations Overview"
        subtitle="Global telemetry, user activity, content ingestion rates, and platform moderation."
      />

      <div className="p-8 space-y-8 max-w-7xl">
        {/* Top Filter & Quick Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/categories"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Category</span>
            </Link>

            <Link
              href="/admin/videos"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-evo-red hover:bg-evo-red-hover text-white text-xs font-bold shadow-evo-button transition-colors"
            >
              <span>Moderate Videos</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Link
                key={metric.title}
                href={metric.href}
                className="bg-white rounded-2xl p-5 border border-gray-200/90 evo-card-shadow hover:border-gray-300 transition-all hover:scale-[1.02] group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500">
                    {metric.title}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${metric.bgClass}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="text-2xl font-extrabold text-gray-950 tracking-tight mb-1">
                  {metric.value}
                </div>

                <div className="text-xs text-gray-400">Live database totals</div>
              </Link>
            );
          })}
        </div>

        {/* 2-Column Dashboard Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Videos (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-950">
                  Recent Content & Status
                </h3>
                <p className="text-xs text-gray-500">
                  Latest videos uploaded across creator Hubs
                </p>
              </div>

              <Link
                href="/admin/videos"
                className="text-xs font-bold text-evo-red hover:underline flex items-center gap-1"
              >
                <span>
                  View all {stats ? formatNumber(stats.totalVideos) : "0"} videos
                </span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {stats && stats.recentVideos.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {stats.recentVideos.map((vid) => (
                  <div
                    key={vid.id}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50 -mx-3 px-3 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative w-16 h-10 rounded-lg bg-gray-900 overflow-hidden shrink-0">
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate">
                          {vid.title}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          {vid.channel.name}
                          {vid.category ? ` • ${vid.category.name}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-bold text-gray-900">
                          {new Date(vid.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {vid._count.likes} likes • {vid._count.comments}{" "}
                          comments
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          vid.status === "PUBLISHED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : vid.status === "HIDDEN"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {vid.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-8 text-center">
                No videos have been uploaded yet.
              </p>
            )}
          </div>

          {/* Right Column: Recent Creators & Moderation (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Recent Creators Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-950">
                  Recent Creators
                </h3>
                <Link
                  href="/admin/creators"
                  className="text-xs font-bold text-evo-red hover:underline"
                >
                  Manage
                </Link>
              </div>

              {stats && stats.recentCreators.length > 0 ? (
                <div className="space-y-3.5">
                  {stats.recentCreators.map((creator) => (
                    <div
                      key={creator.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0 border border-gray-200">
                          {creator.name
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-gray-900 truncate flex items-center gap-1">
                            {creator.name}
                            {creator.creatorProfile?.isVerified && (
                              <CheckCircle className="w-3 h-3 text-evo-red shrink-0" />
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500 truncate">
                            {creator.creatorProfile?.channel?.name ??
                              "No Hub yet"}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(creator.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-6 text-center">
                  No creators have registered yet.
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-950 text-white rounded-3xl p-6 border border-gray-800 shadow-xl">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldAlert className="w-4 h-4" />
                <span>Administration</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/admin/users"
                  className="text-center py-2 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 transition-colors"
                >
                  Manage Users
                </Link>
                <Link
                  href="/admin/channels"
                  className="text-center py-2 px-3 rounded-xl bg-evo-red hover:bg-evo-red-hover text-xs font-semibold text-white shadow-evo-button transition-colors"
                >
                  Hubs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
