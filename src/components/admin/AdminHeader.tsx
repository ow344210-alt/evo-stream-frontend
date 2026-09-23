"use client";

import React from "react";
import { Menu, Search, Bell, Shield, Sparkles, Activity, CheckCircle2 } from "lucide-react";
import { useAdminSidebar } from "@/components/admin/AdminSidebar";

interface AdminHeaderProps {
  title: string;
  subtitle: string;
}

export function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const { openNav } = useAdminSidebar();

  return (
    <header className="bg-white border-b border-gray-200/80 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-30 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu trigger (drawer is inline on desktop) */}
        <button
          onClick={openNav}
          className="lg:hidden p-2 -ml-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-extrabold text-gray-950 tracking-tight truncate">
            {title}
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
        {/* System Health Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Cluster Active</span>
        </div>

        {/* Notifications Icon */}
        <button
          className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-evo-red" />
        </button>

        {/* SuperAdmin Pill */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs">
            AD
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-gray-900">Admin Control</div>
            <div className="text-[10px] text-gray-500">Root Authority</div>
          </div>
        </div>
      </div>
    </header>
  );
}
