"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Upload, Bell, Radio } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface CreatorHeaderProps {
  title: string;
  subtitle: string;
}

export function CreatorHeader({ title, subtitle }: CreatorHeaderProps) {
  const { user } = useAuth();
  const [channel, setChannel] = useState<{ name: string; logoUrl: string | null } | null>(null);

  useEffect(() => {
    let active = true;
    api
      .getChannel()
      .then((res) => {
        if (active && res.channel) setChannel({ name: res.channel.name, logoUrl: res.channel.logoUrl });
      })
      .catch(() => {
        /* fall back to session identity */
      });
    return () => {
      active = false;
    };
  }, []);

  const avatarName = channel?.name?.trim() || user?.name?.trim() || "Creator";
  const avatarLogo = channel?.logoUrl || "";
  const initial = avatarName.charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b border-gray-200/80 px-8 py-4 sticky top-0 z-30 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-extrabold text-gray-950 tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center space-x-4">
        {/* Viewership-focused badge (ad-powered direction; no invented revenue %) */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-evo-red text-xs font-bold">
          <Radio className="w-3.5 h-3.5" />
          <span>Build Viewership</span>
        </div>

        {/* Upload Video CTA Button */}
        <Link
          href="/creator/videos"
          className="inline-flex items-center gap-2 bg-evo-red hover:bg-evo-red-hover text-white text-xs font-bold px-4 py-2 rounded-full shadow-evo-button transition-all hover:scale-[1.02]"
          id="creator-header-upload-btn"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Video</span>
        </Link>

        {/* Creator Channel Avatar */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
          {avatarLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarLogo}
              alt={avatarName}
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-evo-red to-orange-500 flex items-center justify-center text-white text-xs font-extrabold">
              {initial}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
