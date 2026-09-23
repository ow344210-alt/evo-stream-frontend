"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Play, Flame, Clock, Search, Users } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

const links = [
  { name: "Latest", href: "/discover", icon: Clock },
  { name: "Trending", href: "/discover/trending", icon: Flame },
  { name: "Following", href: "/following", icon: Users },
];

function isActive(pathname: string, href: string) {
  return href === "/discover"
    ? pathname === "/discover" || pathname.startsWith("/discover/category")
    : pathname.startsWith(href);
}

/**
 * Viewer navigation for the Discover / Following surfaces. Desktop layout is a
 * true three-zone header: brand (left), functional search (visually centered in
 * a fixed middle column), and icon-only navigation (right). The standalone
 * "Search" nav pill is gone on desktop — the centered field provides search. On
 * small screens the search field collapses to a compact icon button and the
 * nav stays icon-only so the row never overflows.
 */
export function ViewerNav() {
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const data = new FormData(e.currentTarget as HTMLFormElement);
      const q = data.get("q");
      const trimmed = typeof q === "string" ? q.trim() : "";
      router.push(
        trimmed
          ? `/discover/search?q=${encodeURIComponent(trimmed)}`
          : "/discover/search",
      );
    },
    [router],
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4 md:grid-cols-[minmax(0,1fr)_minmax(320px,600px)_minmax(0,1fr)]">
          {/* LEFT: brand */}
          <Link
            href="/"
            className="flex items-center gap-1.5 shrink-0 justify-self-start"
            aria-label="EVO home"
          >
            <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-tr from-evo-red to-orange-500 text-white">
              <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight text-gray-900">
              Evo
            </span>
          </Link>

          {/* CENTER: functional search (desktop) */}
          <form
            role="search"
            onSubmit={handleSearch}
            className="hidden md:block w-full"
          >
            <div className="relative">
              <input
                name="q"
                type="text"
                placeholder="Search videos, hubs…"
                aria-label="Search videos"
                className="w-full h-10 rounded-full border border-gray-300 bg-white pl-4 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                aria-label="Submit search"
                className="absolute right-1 top-1 bottom-1 flex w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* RIGHT: icon-only navigation */}
          <div className="justify-self-end flex items-center gap-0.5 sm:gap-1">
            <Tooltip label="Search" side="bottom" align="end">
              <Link
                href="/discover/search"
                aria-label="Search"
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-950 transition-colors"
              >
                <Search className="w-5 h-5" />
              </Link>
            </Tooltip>

            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(pathname, link.href);
              return (
                <Tooltip key={link.name} label={link.name} side="bottom" align="end">
                  <Link
                    href={link.href}
                    aria-label={link.name}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                      active
                        ? "bg-evo-red/10 text-evo-red"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}