"use client";

import React from "react";
import Link from "next/link";
import { Play, Twitter, Instagram, Youtube, Github, Mail, Globe, ArrowUp } from "lucide-react";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-gray-950 text-white pt-12 lg:pt-16 pb-8 lg:pb-12 border-t border-gray-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-10 pb-8 lg:pb-12 border-b border-gray-800/80">
          {/* Col 1: Brand & Bio */}
          <div className="lg:col-span-2 sm:col-span-2 space-y-3">
            <Link href="/" className="flex flex-col items-start group">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-evo-red to-orange-500 flex items-center justify-center text-white shadow-sm shadow-evo-red/30">
                  <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                </div>
                <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-white">
                  Evo
                </span>
              </div>
              <span className="text-[9px] font-bold tracking-[0.25em] text-gray-400 uppercase -mt-0.5 pl-0.5">
                — Stream Beyond —
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-gray-400 max-w-sm leading-relaxed">
              The creator-driven video platform for long-form content. Build your Hub. Grow your network. Attract advertisers.
            </p>

            <div className="flex items-center space-x-3 pt-1">
              <a
                href="#"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-900 hover:bg-evo-red text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-900 hover:bg-evo-red text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-900 hover:bg-evo-red text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-900 hover:bg-evo-red text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Platform */}
          <div>
            <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
              <li><a href="/discover" className="hover:text-white transition-colors">Trending Videos</a></li>
              <li><a href="/discover" className="hover:text-white transition-colors">Latest Uploads</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">4K UHD Streaming</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Mobile App</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Supported Devices</a></li>
            </ul>
          </div>

          {/* Col 3: Creators & Studio */}
          <div>
            <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
              Creators
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
              <li><a href="/creator" className="hover:text-white transition-colors">Creator Studio</a></li>
              <li><a href="/creator" className="hover:text-white transition-colors">Ad-Powered Monetization</a></li>
              <li><a href="/creator" className="hover:text-white transition-colors">HLS Cloud Transcoding</a></li>
              <li><a href="/creator" className="hover:text-white transition-colors">Partner Program</a></li>
              <li><a href="/creator" className="hover:text-white transition-colors">Hub Verification</a></li>
            </ul>
          </div>

          {/* Col 4: Legal & Guidelines */}
          <div>
            <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
              Legal & Support
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
              <li><a href="#faq" className="hover:text-white transition-colors">Community Guidelines</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Help & FAQ</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] sm:text-xs text-gray-500">
          <p>© {new Date().getFullYear()} EVO Entertainment Network Inc. All rights reserved.</p>

          <div className="flex items-center space-x-4 sm:space-x-6">
            <span className="flex items-center gap-1 text-gray-400">
              <Globe className="w-3 h-3.5" />
              Global (EN)
            </span>

            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
              aria-label="Back to top"
            >
              <span className="hidden sm:inline">Back to top</span>
              <ArrowUp className="w-3 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
