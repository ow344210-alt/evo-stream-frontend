"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Search,
  CheckCircle,
  UserX,
  UserCheck,
  Tv,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { api, AdminCreator } from "@/lib/api";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function AdminCreatorsPage() {
  const [creators, setCreators] = useState<AdminCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadCreators = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminListCreators({ page: 1, pageSize: 100 });
      setCreators(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load creators");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCreators();
  }, [loadCreators]);

  const handleToggleSuspend = async (creator: AdminCreator) => {
    const newStatus = creator.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const updated = await api.adminUpdateCreatorStatus(creator.id, newStatus);
      setCreators((prev) => prev.map((c) => (c.id === creator.id ? updated : c)));
      showToast(`Creator ${creator.name} has been ${newStatus.toLowerCase()}.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to update creator");
    }
  };

  const handleToggleVerify = async (creator: AdminCreator) => {
    const next = !creator.creatorProfile?.isVerified;
    try {
      const updated = await api.adminUpdateCreatorVerification(creator.id, next);
      setCreators((prev) => prev.map((c) => (c.id === creator.id ? updated : c)));
      showToast(
        `Creator ${creator.name} verification set to ${next ? "Verified" : "Unverified"}.`,
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to update verification");
    }
  };

  const filteredCreators = creators.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.creatorProfile?.channel?.name ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Creator Studio Management"
        subtitle="Audit verified studio partners, inspect Hubs, suspend/reactivate creator accounts."
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
              placeholder="Search creator by studio name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-evo-red focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500">
              Total Creators:{" "}
              <span className="text-gray-950 font-extrabold">{creators.length}</span>
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
              onClick={loadCreators}
              className="ml-auto px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-200/90 evo-card-shadow p-16 text-center text-sm text-gray-500">
            Loading creators…
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200/90 evo-card-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="py-4 px-6">Creator / Studio</th>
                    <th className="py-4 px-6">Hub</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredCreators.map((creator) => (
                    <tr key={creator.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-700 border border-gray-200 flex items-center justify-center font-bold text-sm">
                            {initials(creator.name)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-1.5">
                              {creator.name}
                              {creator.creatorProfile?.isVerified && (
                                <CheckCircle className="w-3.5 h-3.5 text-evo-red shrink-0" />
                              )}
                            </div>
                            <div className="text-gray-400 text-[11px]">
                              {creator.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-semibold text-gray-800">
                        {creator.creatorProfile?.channel ? (
                          <span className="flex items-center gap-1.5">
                            <Tv className="w-3.5 h-3.5 text-gray-400" />
                            {creator.creatorProfile.channel.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">No Hub yet</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-gray-500">{creator.email}</td>

                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            creator.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {creator.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleVerify(creator)}
                            className={`p-2 rounded-xl border text-xs font-semibold transition-colors ${
                              creator.creatorProfile?.isVerified
                                ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
                            }`}
                            title={
                              creator.creatorProfile?.isVerified
                                ? "Remove Verification"
                                : "Grant EVO Partner Badge"
                            }
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleSuspend(creator)}
                            className={`p-2 rounded-xl border text-xs font-semibold transition-colors ${
                              creator.status === "ACTIVE"
                                ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                            title={
                              creator.status === "ACTIVE"
                                ? "Suspend Creator"
                                : "Reinstate Creator"
                            }
                          >
                            {creator.status === "ACTIVE" ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
