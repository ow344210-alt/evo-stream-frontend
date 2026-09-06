"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, DollarSign, Sparkles } from "lucide-react";
import { CREATOR_DATA } from "@/data/landingData";

interface CreatorSectionProps {
  onLaunchCreatorStudio: () => void;
}

export function CreatorSection({ onLaunchCreatorStudio }: CreatorSectionProps) {
  const [activeStep, setActiveStep] = useState<number>(0);

  return (
    <section id="creator" className="py-6 md:py-8 lg:py-12 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 lg:mb-14">
          <div className="inline-flex items-center gap-2 mb-2 sm:mb-3">
            <span className="w-6 h-0.5 bg-evo-red" />
            <span className="text-xs font-bold uppercase tracking-widest text-evo-red">
              {CREATOR_DATA.tag}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-950 tracking-tight leading-[1.15] mb-4">
            {CREATOR_DATA.titleLine1}{" "}
            <span className="text-evo-red">{CREATOR_DATA.titleHighlight}</span>{" "}
            <br />
            {CREATOR_DATA.titleLine3}
          </h2>

          <p className="text-sm sm:text-base text-gray-500 leading-relaxed max-w-2xl mx-auto">
            {CREATOR_DATA.subtitle}
          </p>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Left Column: 3 Steps + CTA */}
          <div className="lg:col-span-6 flex flex-col space-y-3">
            {CREATOR_DATA.steps.map((stepItem, index) => {
              const isSelected = activeStep === index;
              return (
                <div
                  key={stepItem.step}
                  onClick={() => setActiveStep(index)}
                  className={`rounded-2xl p-4 sm:p-5 lg:p-6 transition-all duration-300 cursor-pointer border ${
                    isSelected
                      ? "bg-white border-gray-200 evo-card-shadow"
                      : "bg-gray-50/70 border-transparent hover:bg-gray-50 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span
                      className={`text-sm font-extrabold tracking-wider shrink-0 ${
                        isSelected ? "text-evo-red" : "text-gray-400"
                      }`}
                    >
                      {stepItem.step}
                    </span>

                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-gray-950 mb-1">
                        {stepItem.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {stepItem.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="pt-2 sm:pt-4">
              <button
                onClick={onLaunchCreatorStudio}
                className="inline-flex items-center justify-center gap-2 bg-evo-red hover:bg-evo-red-hover text-white text-sm sm:text-base font-semibold px-5 sm:px-6 lg:px-7 py-3 rounded-full shadow-evo-button hover:shadow-evo-button-hover transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
                id="creator-launch-studio-btn"
              >
                <span>{CREATOR_DATA.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Ad-Powered Monetization Highlight + Checklist */}
          <div className="lg:col-span-6 flex flex-col space-y-4">
            {/* Top Stat Highlight Card */}
            <div className="rounded-3xl p-5 sm:p-6 lg:p-7 bg-red-50/60 border border-red-100/90 flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-evo-red flex items-center justify-center text-white shadow-md shadow-evo-red/30 shrink-0">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-950 tracking-tight">
                    {CREATOR_DATA.revenueHighlight.percentage}
                  </div>
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {CREATOR_DATA.revenueHighlight.title}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed font-normal">
                {CREATOR_DATA.revenueHighlight.desc}
              </p>
            </div>

            {/* Bottom Checklist Card */}
            <div className="rounded-3xl p-5 sm:p-6 lg:p-7 bg-white border border-gray-100/90 evo-card-shadow">
              <div className="space-y-3">
                {CREATOR_DATA.checklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="mt-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-evo-red" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium leading-tight">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
