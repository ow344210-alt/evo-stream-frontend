"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Menu,
  X,
  Play,
  Tv,
  User,
  LogOut,
  Bookmark,
  Heart,
  History,
  ChevronDown,
  Compass,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface NavbarProps {
  onOpenAuth: (mode: "signin" | "signup") => void;
  onOpenSearch: () => void;
}

export function Navbar({ onOpenAuth, onOpenSearch }: NavbarProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, notify } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogoutConfirm = async () => {
    setLogoutLoading(true);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    await logout();
    setLogoutConfirmOpen(false);
    setLogoutLoading(false);
    notify("Successfully logged out.");
    router.push("/");
  };

  const viewerLinks = [
    { name: "Following Hubs", href: "/following", icon: Users },
    { name: "My Library", href: "/my-list", icon: Bookmark },
    { name: "Liked", href: "/liked", icon: Heart },
    { name: "History", href: "/history", icon: History },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Following", href: "/following" },
    { name: "Library", href: "/my-list" },
  ];

  return (
    <>
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "glass-nav py-3.5 shadow-sm border-b border-gray-100/80"
          : "bg-white/95 backdrop-blur-sm py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[56px]">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex flex-col items-start group transition-transform duration-200 hover:scale-[1.02] shrink-0"
            id="nav-brand-logo"
          >
            <div className="flex items-center gap-1.5">
              <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-tr from-evo-red to-orange-500 text-white shadow-sm shadow-evo-red/30 shrink-0">
                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
              </div>
              <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-gray-900 truncate max-w-[180px]">
                Evo
              </span>
            </div>
            <span className="hidden sm:inline-block text-[9px] font-bold tracking-[0.25em] text-gray-400 uppercase -mt-0.5 pl-0.5">
              — Stream Beyond —
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 md:space-x-8" aria-label="Main navigation">
            <a
              href="#home"
              onClick={() => setActiveTab("Home")}
              className={`relative text-sm font-medium transition-colors duration-200 py-1.5 ${
                activeTab === "Home"
                  ? "text-gray-950 font-semibold"
                  : "text-gray-600 hover:text-gray-950"
              }`}
              id="nav-link-home"
            >
              Home
              {activeTab === "Home" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-evo-red animate-pulse-subtle" />
              )}
            </a>
            <Link
              href="/discover"
              className={`relative text-sm font-medium transition-colors duration-200 py-1.5 ${
                activeTab === "Discover"
                  ? "text-gray-950 font-semibold"
                  : "text-gray-600 hover:text-gray-950"
              }`}
              onClick={() => setActiveTab("Discover")}
              id="nav-link-discover"
            >
              Discover
              {activeTab === "Discover" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-evo-red animate-pulse-subtle" />
              )}
            </Link>
            {navLinks.map((link) => {
              const isActive = activeTab === link.name;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setActiveTab(link.name)}
                  className={`relative text-sm font-medium transition-colors duration-200 py-1.5 ${
                    isActive
                      ? "text-gray-950 font-semibold"
                      : "text-gray-600 hover:text-gray-950"
                  }`}
                  id={`nav-link-${link.name.toLowerCase().replace(" ", "-")}`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-evo-red animate-pulse-subtle" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center space-x-4 md:space-x-5">
            <button
              onClick={onOpenSearch}
              className="p-2 text-gray-600 hover:text-gray-950 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Search content"
              id="nav-search-btn"
            >
              <Search className="w-4 h-4" />
            </button>

            {isLoading ? (
              <div
                className="flex items-center gap-2"
                id="nav-auth-loading"
                aria-hidden="true"
              >
                <div className="h-6 w-20 animate-pulse rounded-md bg-gray-200" />
                <div className="h-8 w-12 animate-pulse rounded-full bg-gray-200" />
              </div>
            ) : isAuthenticated ? (
              <>
                <Link
                  href="/my-list"
                  className="hidden sm:inline-block text-sm font-semibold text-gray-700 hover:text-gray-950 transition-colors px-2 py-1"
                  id="nav-my-list-btn"
                >
                  My List
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 px-2 py-1.5 text-gray-700 hover:bg-gray-50 rounded-full transition-colors"
                    id="nav-user-cluster"
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                  >
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-evo-red text-white shrink-0">
                      <User className="w-4 h-4" />
                    </span>
                    <span className="hidden sm:inline-block text-sm font-semibold max-w-[10rem] truncate">
                      {user?.name || "Viewer"}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                        userMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {userMenuOpen && (
                    <>
                      <button
                        aria-label="Close account menu"
                        className="fixed inset-0 z-10 cursor-default"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div
                        role="menu"
                        className="absolute right-0 mt-2 w-56 sm:w-60 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-20"
                      >
                        {viewerLinks.map((link) => {
                          const Icon = link.icon;
                          return (
                            <Link
                              key={link.name}
                              href={link.href}
                              onClick={() => setUserMenuOpen(false)}
                              role="menuitem"
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                              <span className="truncate">{link.name}</span>
                            </Link>
                          );
                        })}
                        <div className="my-1 border-t border-gray-100" />
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            setLogoutConfirmOpen(true);
                          }}
                          role="menuitem"
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth("signin")}
                  className="hidden sm:inline-block text-sm font-semibold text-gray-700 hover:text-gray-950 transition-colors px-2 py-1"
                  id="nav-signin-btn"
                >
                  Sign In
                </button>

                <button
                  onClick={() => onOpenAuth("signup")}
                  className="bg-evo-red hover:bg-evo-red-hover text-white text-sm font-semibold px-4 sm:px-5 py-2 rounded-full sm:py-2.5 shadow-evo-button hover:shadow-evo-button-hover transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  id="nav-get-evo-btn"
                >
                  <span className="hidden sm:inline">Get EVO</span>
                  <span className="sm:hidden">Get EVO</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              onClick={onOpenSearch}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg"
              aria-label="Search content"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-gray-900 rounded-lg"
              aria-label="Toggle mobile menu"
              id="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 pb-6 border-t border-gray-100 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col space-y-2">
              <a
                href="#home"
                onClick={() => {
                  setActiveTab("Home");
                  setMobileMenuOpen(false);
                }}
                className={`text-base font-medium px-3 py-2.5 rounded-lg transition-colors ${
                  activeTab === "Home"
                    ? "text-evo-red bg-evo-red-light font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Home
              </a>
              <Link
                href="/discover"
                onClick={() => {
                  setActiveTab("Discover");
                  setMobileMenuOpen(false);
                }}
                className={`text-base font-medium px-3 py-2.5 rounded-lg transition-colors ${
                  activeTab === "Discover"
                    ? "text-evo-red bg-evo-red-light font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Discover
              </Link>
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => {
                    setActiveTab(link.name);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-base font-medium px-3 py-2.5 rounded-lg transition-colors ${
                    activeTab === link.name
                      ? "text-evo-red bg-evo-red-light font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {link.name}
                </a>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col space-y-2.5">
              {isLoading ? (
                <div
                  className="flex justify-center py-2"
                  id="nav-auth-loading-mobile"
                  aria-hidden="true"
                >
                  <div className="h-6 w-24 animate-pulse rounded-md bg-gray-200" />
                </div>
              ) : isAuthenticated ? (
                <>
                  {viewerLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{link.name}</span>
                      </Link>
                    );
                  })}
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 py-2">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-evo-red text-white shrink-0">
                      <User className="w-4 h-4" />
                    </span>
                    <span className="max-w-[12rem] truncate">
                      {user?.name || "Viewer"}
                    </span>
                  </div>
                  <button
                    onClick={() => setLogoutConfirmOpen(true)}
                    className="w-full text-center py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-100"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth("signin");
                    }}
                    className="w-full text-center py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl border border-gray-200"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth("signup");
                    }}
                    className="w-full text-center py-2.5 text-sm font-semibold text-white bg-evo-red hover:bg-evo-red-hover rounded-xl shadow-evo-button"
                  >
                    Get EVO
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>

    {/* Logout confirmation */}
    <ConfirmDialog
      open={logoutConfirmOpen}
      title="Log out of EVO?"
      message="Are you sure you want to log out?"
      confirmLabel="Logout"
      cancelLabel="Cancel"
      loading={logoutLoading}
      onConfirm={handleLogoutConfirm}
      onCancel={() => setLogoutConfirmOpen(false)}
    />
    </>
  );
}
