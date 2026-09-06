"use client";

import React from "react";
import Link from "next/link";
import { Play, Flame, Clock, Search, Users } from "lucide-react";
import { usePathname } from "next/navigation";

const links = [
  { name: "Latest", href: "/discover", icon: Clock },
  { name: "Trending", href: "/discover/trending", icon: Flame },
  { name: "Search", href: "/discover/search", icon: Search },
  { name: "Following", href: "/following", icon: Users },
];

/**
 * Viewer navigation for the Discover / Following surfaces. Preserves the EVO
 * visual language (red accent, white bg) and is responsive: brand + horizontal
 * links on desktop, an always-visible horizontal scroll row on mobile.
 */
export function ViewerNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-1.5 shrink-0"
            aria-label="EVO home"
          >
            <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-tr from-evo-red to-orange-500 text-white">
              <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight text-gray-900">
              Evo
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const active =
                link.href === "/discover"
                  ? pathname === "/discover" ||
                    pathname.startsWith("/discover/category")
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    active
                      ? "bg-evo-red text-white shadow-evo-button"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex md:hidden items-center gap-1 overflow-x-auto no-scrollbar">
            {links.map((link) => {
              const Icon = link.icon;
              const active =
                link.href === "/discover"
                  ? pathname === "/discover" ||
                    pathname.startsWith("/discover/category")
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? "bg-evo-red text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}