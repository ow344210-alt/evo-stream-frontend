"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Shield,
  FileText,
  Lock,
  Save,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { api, PlatformPolicy } from "@/lib/api";

const POLICY_SLUGS = {
  guidelines: "community-guidelines",
  terms: "terms-and-conditions",
  privacy: "privacy-policy",
} as const;

type TabId = "guidelines" | "terms" | "privacy";

export default function AdminSettingsPage() {
  const [policies, setPolicies] = useState<PlatformPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("guidelines");
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminListPolicies({ page: 1, pageSize: 100 });
      setPolicies(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load policies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  const policyFor = (slug: string): PlatformPolicy | undefined =>
    policies.find((p) => p.slug === slug);

  const current = policyFor(POLICY_SLUGS[activeTab]);
  const [draft, setDraft] = useState("");

  // Sync the draft when switching tabs or when data loads.
  useEffect(() => {
    setDraft(current?.content ?? "");
  }, [activeTab, current?.id, current?.content]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const slug = POLICY_SLUGS[activeTab];
    const titleMap: Record<TabId, string> = {
      guidelines: "Community Guidelines",
      terms: "Terms & Conditions",
      privacy: "Privacy Policy",
    };
    try {
      if (current) {
        await api.adminUpdatePolicy(current.id, { content: draft });
      } else {
        const created = await api.adminCreatePolicy({
          slug,
          title: titleMap[activeTab],
          content: draft,
        });
        setPolicies((prev) => [...prev, created]);
      }
      await loadPolicies();
      showToast("Platform policy saved successfully.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Platform & Compliance Settings"
        subtitle="Manage legal policies, terms of service, and community safety guidelines."
      />

      <div className="p-8 space-y-6 max-w-7xl">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          {[
            { id: "guidelines" as TabId, label: "Community Guidelines", icon: Shield },
            { id: "terms" as TabId, label: "Terms & Conditions", icon: FileText },
            { id: "privacy" as TabId, label: "Privacy Policy", icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive ? "bg-gray-900 text-white shadow-xs" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-center gap-3 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {error} — Please make sure the API and database are reachable.
            </span>
            <button
              onClick={loadPolicies}
              className="ml-auto px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-200/90 evo-card-shadow p-16 text-center text-sm text-gray-500">
            Loading policies…
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-white rounded-3xl p-7 border border-gray-200/90 evo-card-shadow space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-950">
                  {activeTab === "guidelines"
                    ? "Community Guidelines Document"
                    : activeTab === "terms"
                      ? "Terms & Conditions"
                      : "Privacy Policy (GDPR / CCPA)"}
                </h3>
                <p className="text-xs text-gray-500">
                  {current
                    ? `Editing policy “/${current.slug}”.`
                    : "This policy has not been published yet. Saving will create it."}
                </p>
              </div>

              <textarea
                rows={16}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-mono leading-relaxed focus:bg-white focus:border-evo-red focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-evo-red hover:bg-evo-red-hover text-white text-xs font-bold shadow-evo-button transition-all hover:scale-[1.02] disabled:opacity-60"
                id="admin-save-settings-btn"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving…" : "Save & Publish Policy"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
