"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Video,
  Eye,
  Users,
  Sparkles,
  Upload,
  ArrowUpRight,
  Radio,
  FileText,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertTriangle,
  PlayCircle,
  Layers,
} from "lucide-react";
import { CreatorHeader } from "@/components/creator/CreatorHeader";
import { api, CreatorDashboardData } from "@/lib/api";

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "00:00";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type LoadState = "loading" | "error" | "ready";

export default function CreatorDashboardPage() {
  const [data, setData] = useState<CreatorDashboardData | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await api.getCreatorDashboard();
      setData(res);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (state === "loading") {
    return (
      <div className="flex flex-col flex-1">
        <CreatorHeader
          title="Creator Studio Dashboard"
          subtitle="Loading your real Hub data..."
        />
        <div className="p-8 space-y-8 max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow"
              >
                <div className="h-3 w-24 bg-gray-100 rounded mb-4 animate-pulse" />
                <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-20 bg-gray-100 rounded mt-3 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="h-48 bg-white rounded-3xl border border-gray-200/90 animate-pulse" />
        </div>
      </div>
    );
  }

  if (state === "error" || !data) {
    return (
      <div className="flex flex-col flex-1">
        <CreatorHeader
          title="Creator Studio Dashboard"
          subtitle="There was a problem loading your dashboard"
        />
        <div className="p-8 max-w-7xl">
          <div className="bg-white rounded-3xl p-10 border border-gray-200/90 evo-card-shadow flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-950">
                Unable to load your dashboard
              </h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                We couldn&apos;t reach the backend. Check your connection and try
                again.
              </p>
            </div>
            <button
              onClick={() => void load()}
              className="inline-flex items-center gap-2 bg-evo-red hover:bg-evo-red-hover text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-evo-button transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { stats, channel, user } = data;

  // No channel yet -> guide creator to set one up.
  if (!channel) {
    return (
      <div className="flex flex-col flex-1">
        <CreatorHeader
          title="Creator Studio Dashboard"
          subtitle="Get started by creating your hub"
        />
        <div className="p-8 max-w-7xl">
          <div className="bg-white rounded-3xl p-10 border border-gray-200/90 evo-card-shadow flex flex-col items-center justify-center text-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-evo-red/10 text-evo-red flex items-center justify-center">
              <Radio className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-950">Welcome, {user.name}</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md">
                You haven&apos;t created a hub yet. Set up your hub name,
                branding, and category to start publishing videos.
              </p>
            </div>
            <Link
              href="/creator/channel"
              className="inline-flex items-center gap-2 bg-evo-red hover:bg-evo-red-hover text-white text-xs font-bold px-5 py-3 rounded-xl shadow-evo-button transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Your Hub</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Videos",
      value: stats.totalVideos.toString(),
      icon: Video,
      bg: "bg-blue-50 text-blue-600",
    },
    {
      title: "Published",
      value: stats.publishedCount.toString(),
      icon: Eye,
      bg: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Drafts",
      value: stats.draftCount.toString(),
      icon: FileText,
      bg: "bg-amber-50 text-amber-600",
    },
    {
      title: "Hub Followers",
      value: stats.followersCount.toLocaleString(),
      icon: Users,
      bg: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="flex flex-col flex-1">
      <CreatorHeader
        title="Creator Studio Dashboard"
        subtitle="Monitor your Hub and video upload statuses."
      />

      <div className="p-8 space-y-8 max-w-7xl">
        {/* Hub Identity Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow flex flex-col sm:flex-row sm:items-center gap-5">
          {channel.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={channel.logoUrl}
              alt={channel.name}
              className="w-16 h-16 rounded-2xl object-cover border border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-evo-red to-orange-500 flex items-center justify-center text-white text-2xl font-extrabold">
              {(channel.name.charAt(0) || "C").toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-extrabold text-gray-950 tracking-tight truncate">
                {channel.name}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider">
                Creator
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {channel.category?.name ?? "No category selected"}
              {channel.isSuspended ? " • Suspended" : ""}
            </p>
            {channel.description && (
              <p className="text-xs text-gray-500 mt-1 max-w-xl line-clamp-2">
                {channel.description}
              </p>
            )}
          </div>
          <Link
            href="/creator/channel"
            className="text-xs font-bold text-evo-red hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Manage Hub</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 Core Creator Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {kpis.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-gray-500">
                    {stat.title}
                  </span>
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center ${stat.bg}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div>
                  <div className="text-3xl font-extrabold text-gray-950 tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    {stat.title === "Processing"
                      ? `${stats.processingCount} in progress`
                      : "live from backend"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2-Column Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Videos (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-950">
                  Recent Studio Uploads
                </h3>
                <p className="text-xs text-gray-500">
                  Your latest videos and their real status
                </p>
              </div>

              <Link
                href="/creator/videos"
                className="text-xs font-bold text-evo-red hover:underline flex items-center gap-1"
              >
                <span>Video Studio</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data.recentVideos.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">No videos yet</p>
                  <p className="text-xs text-gray-500">
                    Upload your first master file to see it here.
                  </p>
                </div>
                <Link
                  href="/creator/videos"
                  className="mt-1 inline-flex items-center gap-2 text-xs font-bold text-white bg-evo-red hover:bg-evo-red-hover px-4 py-2 rounded-xl shadow-evo-button transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Go to Video Studio</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {data.recentVideos.map((vid) => (
                  <div
                    key={vid.id}
                    className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative w-20 h-12 rounded-xl bg-gray-900 overflow-hidden shrink-0 flex items-center justify-center">
                        {vid.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={vid.thumbnailUrl}
                            alt={vid.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Video className="w-5 h-5 text-gray-500" />
                        )}
                        <span className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[8px] text-white font-mono">
                          {formatDuration(vid.durationSeconds)}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 truncate">
                          {vid.title}
                        </h4>
                        <p className="text-[11px] text-gray-400 truncate">
                          {vid.category?.name ?? "Uncategorized"} • Added{" "}
                          {formatDate(vid.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200/60">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          vid.status === "PUBLISHED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : vid.status === "DRAFT"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {vid.status}
                      </span>
                      {vid.processingStatus &&
                      vid.processingStatus !== "READY" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          <span>{vid.processingStatus}</span>
                        </span>
                      ) : (
                        vid.processingStatus === "READY" && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ready</span>
                          </span>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Quick Upload & Channel Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Upload Callout */}
            <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-3xl p-6 border border-gray-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-evo-red/20 text-evo-red text-[10px] font-bold uppercase tracking-wider border border-evo-red/30 mb-4">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>Cloud Ingestion</span>
                </div>

                <h4 className="text-lg font-bold text-white mb-2">
                  Upload New Master File
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed mb-6">
                  Draft, publish, and manage your video metadata before and after
                  ingestion.
                </p>
              </div>

              <Link
                href="/creator/videos"
                className="w-full text-center py-3 bg-evo-red hover:bg-evo-red-hover text-white text-xs font-bold rounded-xl shadow-evo-button transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Open Video Studio</span>
              </Link>
            </div>

            {/* Hub Content Summary (real counts) */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-gray-950">
                    {stats.totalVideos}
                  </div>
                  <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                    Total Videos
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Published</span>
                  <span className="text-xs font-bold text-gray-900">
                    {stats.publishedCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Drafts</span>
                  <span className="text-xs font-bold text-gray-900">
                    {stats.draftCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Hidden</span>
                  <span className="text-xs font-bold text-gray-900">
                    {stats.hiddenCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Processing</span>
                  <span className="text-xs font-bold text-gray-900">
                    {stats.processingCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Hub Followers</span>
                  <span className="text-xs font-bold text-gray-900">
                    {stats.followersCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
