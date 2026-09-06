"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Search,
  Eye,
  EyeOff,
  Play,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { api, Video } from "@/lib/api";

const THUMB_FALLBACK = "/images/rana_poster.jpg";

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminListVideos({ page: 1, pageSize: 100 });
      setVideos(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleToggleHide = async (video: Video) => {
    const next: "PUBLISHED" | "HIDDEN" =
      video.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED";
    try {
      const updated = await api.adminUpdateVideoStatus(video.id, next);
      setVideos((prev) => prev.map((v) => (v.id === video.id ? updated : v)));
      showToast(`Video "${video.title}" status changed to ${next}.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to update video");
    }
  };

  const filteredVideos = videos.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.channel?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.category?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Video Management & Moderation"
        subtitle="Review published content, moderate sensitive titles, and manage catalog status."
      />

      <div className="p-8 space-y-6 max-w-7xl">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos by title, hub, or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-evo-red focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-xl p-1 text-xs font-bold text-gray-700">
              {["ALL", "PUBLISHED", "DRAFT", "HIDDEN"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-lg transition-all ${
                    statusFilter === st
                      ? "bg-white text-gray-950 shadow-xs"
                      : "hover:bg-gray-200/60 text-gray-500"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <span className="text-xs font-bold text-gray-500">
              {filteredVideos.length} Titles
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-center gap-3 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {error} — Please make sure the API and database are reachable.
            </span>
            <button
              onClick={loadVideos}
              className="ml-auto px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-200/90 evo-card-shadow p-16 text-center text-sm text-gray-500">
            Loading videos…
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200/90 evo-card-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="py-4 px-6">Video Media</th>
                    <th className="py-4 px-6">Hub / Category</th>
                    <th className="py-4 px-6">Published</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredVideos.map((video) => (
                    <tr key={video.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5 min-w-[240px]">
                          <div
                            onClick={() => setPreviewVideo(video)}
                            className="relative w-20 h-12 rounded-xl bg-gray-900 overflow-hidden shrink-0 cursor-pointer group shadow-sm"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={video.thumbnailUrl ?? THUMB_FALLBACK}
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                          </div>

                          <div>
                            <div
                              onClick={() => setPreviewVideo(video)}
                              className="font-bold text-gray-900 hover:text-evo-red cursor-pointer transition-colors"
                            >
                              {video.title}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono">
                              Added {new Date(video.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-800">
                          {video.channel?.name ?? "—"}
                        </div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-gray-100 text-[10px] font-bold text-gray-600">
                          {video.category?.name ?? "Uncategorized"}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-gray-500 font-mono">
                        {video.publishedAt
                          ? new Date(video.publishedAt).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            video.status === "PUBLISHED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : video.status === "HIDDEN"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {video.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewVideo(video)}
                            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                            title="Preview Stream"
                          >
                            <Play className="w-4 h-4" />
                          </button>

                          {video.status !== "DRAFT" && (
                            <button
                              onClick={() => handleToggleHide(video)}
                              className={`p-2 rounded-xl border text-xs font-semibold transition-colors ${
                                video.status === "PUBLISHED"
                                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                              title={
                                video.status === "PUBLISHED"
                                  ? "Hide Video from public feeds"
                                  : "Unhide Video"
                              }
                            >
                              {video.status === "PUBLISHED" ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {previewVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-3xl bg-gray-950 text-white rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
              <button
                onClick={() => setPreviewVideo(null)}
                className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 hover:bg-black text-gray-300 hover:text-white border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative aspect-video w-full bg-black overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewVideo.thumbnailUrl ?? THUMB_FALLBACK}
                  alt={previewVideo.title}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-evo-red text-white flex items-center justify-center shadow-evo-button">
                    <Play className="w-7 h-7 fill-white ml-1" />
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-extrabold">{previewVideo.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {previewVideo.channel?.name ?? "—"} •{" "}
                      {previewVideo.category?.name ?? "Uncategorized"}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                    {previewVideo.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
