"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Film,
  Tv,
  Video,
  Tags,
  Settings,
  Play,
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: "User Management",
      href: "/admin/users",
      icon: Users,
      badge: "524K",
    },
    {
      name: "Creator Management",
      href: "/admin/creators",
      icon: Film,
      badge: "14.2K",
    },
    {
      name: "Hub Moderation",
      href: "/admin/channels",
      icon: Tv,
      badge: "12.8K",
    },
    {
      name: "Video Management",
      href: "/admin/videos",
      icon: Video,
      badge: "108K",
    },
    {
      name: "Categories",
      href: "/admin/categories",
      icon: Tags,
      badge: null,
    },
    {
      name: "Platform Settings",
      href: "/admin/settings",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-gray-950 text-white flex flex-col justify-between shrink-0 border-r border-gray-800/80 min-h-screen">
      <div>
        {/* Admin Brand Logo Header */}
        <div className="p-6 border-b border-gray-800/60">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-evo-red to-orange-500 flex items-center justify-center text-white shadow-sm shadow-evo-red/30">
              <Play className="w-4 h-4 fill-white ml-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-xl tracking-tight text-white">
                  EVO
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-evo-red/20 text-evo-red text-[10px] font-extrabold tracking-wider uppercase border border-evo-red/30">
                  ADMIN
                </span>
              </div>
              <span className="text-[9px] font-bold text-gray-400 tracking-wider uppercase block -mt-0.5">
                Control Hub
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Platform Operations
          </div>

          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? "bg-evo-red text-white shadow-evo-button"
                    : "text-gray-400 hover:text-white hover:bg-gray-900"
                }`}
                id={`admin-nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-800 text-gray-400 group-hover:bg-gray-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Navigation Switcher */}
      <div className="p-4 border-t border-gray-800/60 space-y-2">
        <Link
          href="/"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Landing Page</span>
          </div>
          <ExternalLink className="w-3 h-3 text-gray-500" />
        </Link>

        {/* SuperAdmin Profile Info */}
        <div className="pt-2 flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-900/60 border border-gray-800/80">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-evo-red to-orange-500 text-white flex items-center justify-center font-bold text-xs">
            {user ? user.name.charAt(0).toUpperCase() : "AD"}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white truncate">
              {user ? user.name : "Administrator"}
            </div>
            <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Full System Access
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-900 transition-colors text-left"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
