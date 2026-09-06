"use client";

import React from "react";
import { Monitor, Users, DollarSign, Compass } from "lucide-react";
import { FEATURES_DATA } from "@/data/landingData";

export function FeaturesSection() {
  const getCardIcon = (iconName: string, isFilled: boolean) => {
    switch (iconName) {
      case "monitor":
        return <Monitor className="w-5 h-5 text-evo-red" />;
      case "users":
        return <Users className="w-5 h-5 text-white" />;
      case "dollar-sign":
        return <DollarSign className="w-5 h-5 text-evo-red" />;
      case "compass":
      default:
        return <Compass className="w-5 h-5 text-evo-red" />;
    }
  };

  return (
    <section id="features" className="py-6 md:py-8 lg:py-12 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 lg:mb-16">
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="w-6 h-0.5 bg-evo-red" />
              <span className="text-xs font-bold uppercase tracking-widest text-evo-red">
                {FEATURES_DATA.tag}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-950 tracking-tight leading-[1.15]">
              {FEATURES_DATA.titleLine1} <br />
              <span className="text-evo-red">{FEATURES_DATA.titleHighlight}</span>
            </h2>
            <p className="mt-4 sm:mt-5 text-sm sm:text-base text-gray-500 max-w-2xl font-normal leading-relaxed">
              {FEATURES_DATA.subtitle}
            </p>
          </div>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {FEATURES_DATA.cards.map((card) => {
            const isFilled = card.accent === "filled";
            return (
              <div
                key={card.id}
                className="bg-white rounded-3xl p-5 sm:p-6 lg:p-7 border border-gray-100/90 evo-card-shadow evo-card-hover flex flex-col justify-between group"
              >
                <div>
                  {/* Icon container */}
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-5 sm:mb-7 transition-transform duration-300 group-hover:scale-110 ${
                      isFilled
                        ? "bg-evo-red shadow-md shadow-evo-red/30"
                        : "bg-evo-red-light border border-red-100/80"
                    }`}
                  >
                    {getCardIcon(card.icon, isFilled)}
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold text-gray-950 tracking-tight mb-2 sm:mb-3">
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
