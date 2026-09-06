"use client";

import React from "react";
import Image from "next/image";
import {
  Play,
  Tv,
  Users,
  Globe,
  Heart,
  Bookmark,
  Sparkles,
  ChevronRight,
  CirclePlay,
  Clock,
  DollarSign,
  Compass,
  Users as UsersIcon,
} from "lucide-react";
import { HERO_DATA } from "@/data/landingData";

interface HeroSectionProps {
  onStartWatching: () => void;
  onExplore: () => void;
}

const getStatIcon = (iconName: string) => {
  switch (iconName) {
    case "tv":
      return <Tv className="w-5 h-5 sm:w-6 sm:h-6 text-evo-red" />;
    case "users":
      return <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-evo-red" />;
    case "globe":
      return <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-evo-red" />;
    case "clock":
      return <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-evo-red" />;
    default:
      return <Tv className="w-5 h-5 sm:w-6 sm:h-6 text-evo-red" />;
  }
};

const getBulletIcon = (iconName: string) => {
  switch (iconName) {
    case "play":
      return <Play className="w-3 h-3 fill-evo-red text-evo-red ml-0.5" />;
    case "circle":
      return <CirclePlay className="w-3 h-3 text-evo-red" />;
    case "bookmark":
      return <Bookmark className="w-3 h-3 text-evo-red" />;
    default:
      return <Play className="w-3 h-3 fill-evo-red text-evo-red ml-0.5" />;
  }
};

export function HeroSection({ onStartWatching, onExplore }: HeroSectionProps) {
  return (
    <section
      id="home"
      className="relative pt-24 sm:pt-28 lg:pt-32 pb-4 sm:pb-6 lg:pb-8 overflow-hidden bg-mesh"
    >
      {/* Decorative blurred backdrop glow */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-evo-red/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-40 right-10 w-80 h-80 bg-orange-400/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Hero Copy & Actions */}
          <div className="lg:col-span-6 flex flex-col items-start text-left z-10">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200/80 shadow-xs mb-5 hover:border-evo-red/40 transition-colors">
              <div className="w-4 h-4 rounded-full bg-evo-red-light flex items-center justify-center">
                <Play className="w-2.5 h-2.5 fill-evo-red text-evo-red ml-0.5" />
              </div>
              <span className="text-xs font-semibold text-gray-700 tracking-tight">
                {HERO_DATA.pillBadge}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-gray-950 leading-[1.12] mb-5">
              {HERO_DATA.titleLine1} <br />
              {HERO_DATA.titleLine2} <br />
              <span className="text-evo-red">{HERO_DATA.titleHighlight}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-gray-600 max-w-xl mb-8 leading-relaxed font-normal">
              {HERO_DATA.subtitle}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 w-full sm:w-auto">
              <button
                onClick={onStartWatching}
                className="inline-flex items-center justify-center gap-2 bg-evo-red hover:bg-evo-red-hover text-white text-base font-semibold px-6 sm:px-7 py-3 sm:py-3.5 rounded-full shadow-evo-button hover:shadow-evo-button-hover transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                id="hero-start-watching-btn"
              >
                <span>{HERO_DATA.ctaPrimary}</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExplore}
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 text-base font-semibold px-5 sm:px-6 py-3 sm:py-3.5 rounded-full border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                id="hero-explore-content-btn"
              >
                <CirclePlay className="w-4 h-4 text-evo-red" />
                <span>{HERO_DATA.ctaSecondary}</span>
              </button>
            </div>

            {/* 3 Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 pt-4 sm:pt-6 border-t border-gray-100 w-full">
              {HERO_DATA.featureBullets.map((bullet, index) => (
                <div key={index} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                    {getBulletIcon(bullet.icon)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 leading-tight truncate">
                      {bullet.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      {bullet.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Hero Graphic Phone Mockup & Poster Showcase */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end relative hidden lg:block">
            <div className="relative w-full max-w-[420px] lg:max-w-[580px]">
              <div className="relative transform transition-transform duration-500 hover:scale-[1.02]">
                <Image
                  src="/images/evo_hero_showcase.png"
                  alt="EVO Mobile App & Streaming Showcase"
                  width={620}
                  height={620}
                  priority
                  className="w-full h-auto object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Floating Stats Bar */}
        <div className="mt-12 lg:mt-16">
          <div className="bg-white rounded-3xl border border-gray-200/90 evo-card-shadow p-5 sm:p-6 lg:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              {HERO_DATA.stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-evo-red-light flex items-center justify-center shrink-0">
                    {getStatIcon(stat.icon)}
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl sm:text-2xl font-extrabold text-gray-950 tracking-tight">
                      {stat.number}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 font-medium">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
