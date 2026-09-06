"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  UserX,
  UserCheck,
  Calendar,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { api, AdminChannel } from "@/lib/api";

const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80";
const FALLBACK_LOGO =
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80";

export default function AdminChannelsPage() {
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadChannels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminListChannels({ page: 1, pageSize: 100 });
      setChannels(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Hubs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const handleToggleSuspend = async (channel: AdminChannel) => {
    const next = !channel.isSuspended;
    try {
      const updated = await api.adminUpdateChannelStatus(channel.id, next);
      setChannels((prev) => prev.map((c) => (c.id === channel.id ? updated : c)));
      showToast(`Hub "${channel.name}" has been ${next ? "suspended" : "activated"}.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to update Hub");
    }
  };

  const filteredChannels = channels.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.creator?.user.name ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (c.category?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Hub Moderation"
        subtitle="Manage public Hub pages, broadcast permissions, and suspension state."
      />

      <div className="p-8 space-y-6 max-w-7xl">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Hub by name, creator, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-evo-red focus:outline-hidden"
            />
          </div>

          <span className="text-xs font-bold text-gray-500">
            Total Hubs:{" "}
            <span className="text-gray-950 font-extrabold">{channels.length}</span>
          </span>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-center gap-3 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {error} — Please make sure the API and database are reachable.
            </span>
            <button
              onClick={loadChannels}
              className="ml-auto px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-200/90 evo-card-shadow p-16 text-center text-sm text-gray-500">
            Loading Hubs…
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredChannels.map((channel) => (
              <div
                key={channel.id}
                className="bg-white rounded-3xl overflow-hidden border border-gray-200/90 evo-card-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-28 w-full bg-gray-900 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={channel.bannerUrl ?? FALLBACK_BANNER}
                      alt={channel.name}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          !channel.isSuspended
                            ? "bg-emerald-500/90 text-white"
                            : "bg-red-500/90 text-white"
                        }`}
                      >
                        {channel.isSuspended ? "SUSPENDED" : "ACTIVE"}
                      </span>
                    </div>
                  </div>

                  <div className="px-6 pt-3 pb-4">
                    <div className="flex items-start gap-4">
                      <div className="relative -mt-10 w-16 h-16 rounded-2xl overflow-hidden border-3 border-white bg-gray-900 shadow-md shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={channel.logoUrl ?? FALLBACK_LOGO}
                          alt={channel.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-gray-950 truncate">
                          {channel.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          Created by{" "}
                          <span className="font-semibold text-gray-800">
                            {channel.creator?.user.name ?? "—"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-5 p-3 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                      <div>
                        <div className="text-xs font-bold text-gray-900">
                          {channel.category?.name ?? "Uncategorized"}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium">
                          Category
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">
                          {channel._count?.videos ?? 0}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium">
                          Videos
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Since {new Date(channel.createdAt).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => handleToggleSuspend(channel)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      !channel.isSuspended
                        ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {!channel.isSuspended ? (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        <span>Suspend</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Reinstate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
