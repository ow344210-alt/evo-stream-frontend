"use client";

import React from "react";
import {
  TrendingUp,
  Users,
  Clock,
  Sparkles,
} from "lucide-react";
import { CreatorHeader } from "@/components/creator/CreatorHeader";
import { INITIAL_CREATOR_CHANNEL, INITIAL_CREATOR_VIDEOS } from "@/lib/creatorStore";

export default function CreatorAnalyticsPage() {
  return (
    <div className="flex flex-col flex-1">
      <CreatorHeader
        title="Analytics"
        subtitle="Audience retention, watch hours, and viewership insights. Monetization analytics are part of Phase 3."
      />

      <div className="p-8 space-y-8 max-w-7xl">
        {/* Viewership Overview Card */}
        <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white rounded-3xl p-8 border border-gray-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-evo-red/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-evo-red/20 text-evo-red text-xs font-bold uppercase tracking-wider border border-evo-red/30 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Viewership Overview</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {INITIAL_CREATOR_CHANNEL.followersCount.toLocaleString()}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Total Hub followers — build consistent viewership to attract ad-space opportunities
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-evo-red/20 text-white text-xs font-bold border border-evo-red/30">
                Ad-Powered Monetization · Coming with Phase 3
              </span>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Audience Retention
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-950">84.2%</div>
            <div className="text-xs text-gray-400 mt-1">
              Average video completion rate
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Hub Followers
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-950">
              {INITIAL_CREATOR_CHANNEL.followersCount.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-600 font-bold mt-1">
              +14.8% this quarter
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Total Streaming Hours
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-950">
              {INITIAL_CREATOR_CHANNEL.watchTimeHours.toLocaleString()} hrs
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Across 40+ countries
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
