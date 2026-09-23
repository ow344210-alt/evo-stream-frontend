"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Tv,
  Video,
  Upload,
  BarChart3,
  Sparkles,
  Play,
  ArrowLeft,
  DollarSign,
  ExternalLink,
  ShieldCheck,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface CreatorSidebarNavContextValue {
  open: boolean;
  openNav: () => void;
  closeNav: () => void;
}

const CreatorSidebarNavContext = React.createContext<CreatorSidebarNavContextValue>({
  open: false,
  openNav: () => {},
  closeNav: () => {},
});

export function CreatorSidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const value = React.useMemo<CreatorSidebarNavContextValue>(
    () => ({
      open,
      openNav: () => setOpen(true),
      closeNav: () => setOpen(false),
    }),
    [open],
  );

  return (
    <CreatorSidebarNavContext.Provider value={value}>
      {children}
    </CreatorSidebarNavContext.Provider>
  );
}

export function useCreatorSidebar() {
  return React.useContext(CreatorSidebarNavContext);
}

export function CreatorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { open, closeNav } = useCreatorSidebar();
  const [channel, setChannel] = useState<{ name: string; logoUrl: string | null } | null>(null);

  // Real creator channel identity from the backend.
  useEffect(() => {
    let active = true;
    api
      .getChannel()
      .then((res) => {
        if (!active) return;
        if (res.channel) setChannel({ name: res.channel.name, logoUrl: res.channel.logoUrl });
      })
      .catch(() => {
        /* fall back to session identity */
      });
    return () => {
      active = false;
    };
  }, []);

  const channelName = channel?.name?.trim() || user?.name?.trim() || "Creator Studio";
  const channelLogo = channel?.logoUrl || "";
  const identityInitial = (channelName.charAt(0) || "C").toUpperCase();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const navItems = [
    {
      name: "Studio Dashboard",
      href: "/creator",
      icon: LayoutDashboard,
    },
    {
      name: "Hub Branding",
      href: "/creator/channel",
      icon: Tv,
    },
    {
      name: "Video Content",
      href: "/creator/videos",
      icon: Video,
    },
    {
      name: "Analytics & Payouts",
      href: "/creator/analytics",
      icon: BarChart3,
    },
  ];

  return (
    <>
      {/* Mobile overlay scrim (hidden on desktop; drawer is inline there) */}
      <div
        onClick={closeNav}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-gray-950/50 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`w-64 bg-gray-950 text-white flex flex-col justify-between shrink-0 border-r border-gray-800/80 min-h-screen overflow-y-auto lg:overflow-visible fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Creator Brand Header */}
          <div className="p-6 border-b border-gray-800/60">
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/creator"
                onClick={closeNav}
                className="flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-evo-red to-orange-500 flex items-center justify-center text-white shadow-sm shadow-evo-red/30">
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-extrabold text-xl tracking-tight text-white">
                      EVO
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-extrabold tracking-wider uppercase border border-amber-500/30">
                      STUDIO
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-gray-400 tracking-wider uppercase block -mt-0.5">
                    Creator Portal
                  </span>
                </div>
              </Link>

              {/* Mobile close button */}
              <button
                onClick={closeNav}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors lg:hidden shrink-0"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

        {/* Channel Quick Summary Card */}
        <div className="p-4 mx-4 my-4 rounded-2xl bg-gray-900/80 border border-gray-800/80 flex items-center gap-3">
          {channelLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={channelLogo}
              alt={channelName}
              className="w-10 h-10 rounded-xl object-cover border border-gray-700 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-evo-red to-orange-500 flex items-center justify-center text-white text-sm font-extrabold shrink-0">
              {identityInitial}
            </div>
          )}
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white truncate flex items-center gap-1">
              {channelName}
              <ShieldCheck className="w-3.5 h-3.5 text-evo-red shrink-0" />
            </div>
            <div className="text-[10px] text-gray-400">Creator Studio</div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Studio Tools
          </div>

          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeNav}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? "bg-evo-red text-white shadow-evo-button"
                    : "text-gray-400 hover:text-white hover:bg-gray-900"
                }`}
                id={`creator-nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Navigation */}
      <div className="p-4 border-t border-gray-800/60 space-y-2">
        <Link
          href="/"
          onClick={closeNav}
          id="creator-nav-view-public-site"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>View Public Site</span>
          </div>
          <ExternalLink className="w-3 h-3 text-gray-500" />
        </Link>

        <button
          onClick={() => {
            closeNav();
            handleLogout();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-900 transition-colors text-left"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
