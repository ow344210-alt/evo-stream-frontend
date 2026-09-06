"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Save,
  CheckCircle2,
  Globe,
  Youtube,
  Twitter,
  Instagram,
  AlertTriangle,
} from "lucide-react";
import { CreatorHeader } from "@/components/creator/CreatorHeader";
import { api, AdminChannel, Category } from "@/lib/api";

const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80";
const FALLBACK_LOGO =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80";

export default function CreatorChannelPage() {
  const [channel, setChannel] = useState<AdminChannel | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [logoUrl, setLogoUrl] = useState(FALLBACK_LOGO);
  const [bannerUrl, setBannerUrl] = useState(FALLBACK_BANNER);
  const [website, setWebsite] = useState("");
  const [youtube, setYoutube] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [channelRes, categoriesRes] = await Promise.all([
        api.getChannel(),
        api.listCategories(),
      ]);
      const ch = channelRes.channel;
      setChannel(ch);
      setCategories(categoriesRes);
      if (ch) {
        setName(ch.name);
        setBio(ch.description ?? "");
        setCategoryId(ch.categoryId ?? "");
        setLogoUrl(ch.logoUrl ?? FALLBACK_LOGO);
        setBannerUrl(ch.bannerUrl ?? FALLBACK_BANNER);
        setWebsite(ch.websiteUrl ?? "");
        setYoutube(ch.youtubeUrl ?? "");
        setTwitter(ch.twitterUrl ?? "");
        setInstagram(ch.instagramUrl ?? "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Hub");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name,
      description: bio,
      categoryId: categoryId || undefined,
      logoUrl,
      bannerUrl,
      websiteUrl: website || undefined,
      youtubeUrl: youtube || undefined,
      twitterUrl: twitter || undefined,
      instagramUrl: instagram || undefined,
    };
    try {
      if (channel) {
        const updated = await api.updateChannel(payload);
        setChannel(updated);
        showToast("Hub profile & branding updated successfully.");
      } else {
        const created = await api.createChannel(payload);
        setChannel(created);
        showToast("Hub created successfully.");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save Hub");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <CreatorHeader
        title="Hub Branding & Customization"
        subtitle="Manage your Hub page header, studio avatar, public biography, and social connectivity."
      />

      <div className="p-8 space-y-8 max-w-5xl">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-center gap-3 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {error} — Please make sure the API and database are reachable.
            </span>
            <button
              onClick={load}
              className="ml-auto px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-200/90 evo-card-shadow p-16 text-center text-sm text-gray-500">
            Loading Hub…
          </div>
        ) : (
          <form onSubmit={handleSaveChannel} className="space-y-8">
            <div className="bg-white rounded-3xl p-7 border border-gray-200/90 evo-card-shadow space-y-6">
              <h3 className="text-base font-bold text-gray-950">
                Hub Visual Assets
              </h3>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Header Banner Image (16:9 or 21:9 ratio URL)
                </label>
                <div className="relative h-44 w-full rounded-2xl bg-gray-900 overflow-hidden group border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bannerUrl}
                    alt={name || "Hub banner"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <input
                  type="url"
                  placeholder="https://…/banner.jpg"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  className="mt-2 w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-evo-red focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Hub Studio Avatar (1:1 Square URL)
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-900 border-2 border-white shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl}
                      alt={name || "Hub avatar"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input
                    type="url"
                    placeholder="https://…/logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-evo-red focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-7 border border-gray-200/90 evo-card-shadow space-y-6">
              <h3 className="text-base font-bold text-gray-950">
                Hub Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Hub Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-evo-red focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Primary Content Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-evo-red focus:outline-hidden"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Hub Biography & Story
                </label>
                <textarea
                  rows={4}
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium leading-relaxed focus:bg-white focus:border-evo-red focus:outline-hidden"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-7 border border-gray-200/90 evo-card-shadow space-y-6">
              <h3 className="text-base font-bold text-gray-950">
                Social Links & External Profiles
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                    Official Website
                  </label>
                  <input
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-evo-red focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Youtube className="w-3.5 h-3.5 text-red-500" />
                    YouTube Channel
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/@channel"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-evo-red focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Twitter className="w-3.5 h-3.5 text-blue-400" />
                    Twitter / X Profile
                  </label>
                  <input
                    type="url"
                    placeholder="https://twitter.com/handle"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-evo-red focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-pink-500" />
                    Instagram Profile
                  </label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/handle"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-evo-red focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-evo-red hover:bg-evo-red-hover text-white text-xs font-bold shadow-evo-button transition-all hover:scale-[1.02] disabled:opacity-60"
                id="creator-save-channel-btn"
              >
                <Save className="w-4 h-4" />
                <span>
                  {saving ? "Saving…" : channel ? "Save Hub Profile" : "Create Hub"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
