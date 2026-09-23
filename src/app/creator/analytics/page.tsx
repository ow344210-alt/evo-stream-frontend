"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Clock,
  Sparkles,
  Video,
  Eye,
  FileText,
  Radio,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { CreatorHeader } from "@/components/creator/CreatorHeader";
import { api, type CreatorDashboardData } from "@/lib/api";

type LoadState = "loading" | "error" | "ready";

export default function CreatorAnalyticsPage() {
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
          title="Analytics & Telemetry"
          subtitle="Loading real Hub analytics from backend…"
        />
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl">
          <div className="bg-white rounded-3xl p-8 border border-gray-200/90 evo-card-shadow flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-evo-red" />
              <span className="text-sm font-semibold">Loading analytics…</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === "error" || !data) {
    return (
      <div className="flex flex-col flex-1">
        <CreatorHeader
          title="Analytics & Telemetry"
          subtitle="There was a problem loading your analytics"
        />
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
          <div className="bg-white rounded-3xl p-10 border border-gray-200/90 evo-card-shadow flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-950">
                Unable to load analytics
              </h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                We couldn&apos;t reach the backend. Check your connection and try again.
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

  if (!channel) {
    return (
      <div className="flex flex-col flex-1">
        <CreatorHeader
          title="Analytics & Telemetry"
          subtitle="Set up your Hub to start tracking viewership"
        />
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
          <div className="bg-white rounded-3xl p-10 border border-gray-200/90 evo-card-shadow flex flex-col items-center justify-center text-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-evo-red/10 text-evo-red flex items-center justify-center">
              <Radio className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-950">Welcome, {user.name}</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md">
                You haven&apos;t created a hub yet. Set up your hub to start publishing videos and tracking viewership metrics.
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

  return (
    <div className="flex flex-col flex-1">
      <CreatorHeader
        title="Analytics & Telemetry"
        subtitle="Real Hub engagement, follower counts, catalog metrics, and telemetry readiness."
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl">
        {/* Viewership Overview Card */}
        <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white rounded-3xl p-6 sm:p-8 border border-gray-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-evo-red/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-evo-red/20 text-evo-red text-xs font-bold uppercase tracking-wider border border-evo-red/30 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Hub Overview</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {stats.followersCount.toLocaleString()}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Total Hub followers on {channel.name} — live backend audience count.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-evo-red/20 text-white text-xs font-bold border border-evo-red/30">
                Ad-Powered Monetization · Coming with Phase 3
              </span>
            </div>
          </div>
        </div>

        {/* 4 Real Catalog & Audience Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Hub Followers
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-950">
              {stats.followersCount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Active registered followers
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Total Uploads
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-950">
              {stats.totalVideos}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              All titles in your Hub studio
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Published Videos
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-950">
              {stats.publishedCount}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Publicly streamable titles
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Drafts & Ingestion
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-950">
              {stats.draftCount}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {stats.processingCount > 0
                ? `${stats.processingCount} video(s) processing`
                : "No active processing jobs"}
            </div>
          </div>
        </div>

        {/* Telemetry Roadmap & Unavailable Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Audience Retention
              </span>
              <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-bold text-gray-600">Telemetry in Development</div>
            <div className="text-xs text-gray-400 mt-1">
              Video completion curves will appear here as playback sessions are recorded.
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Streaming Hours
              </span>
              <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-bold text-gray-600">Telemetry in Development</div>
            <div className="text-xs text-gray-400 mt-1">
              Aggregated watch-time metrics will activate in upcoming telemetry releases.
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Ad-Revenue Analytics
              </span>
              <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-bold text-gray-600">Phase 3 Ad-Engine</div>
            <div className="text-xs text-gray-400 mt-1">
              Monetization and advertiser impression metrics launch in Phase 3.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
