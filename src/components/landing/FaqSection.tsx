"use client";

import React, { useState } from "react";
import { Mail, Plus, Minus } from "lucide-react";
import { FAQ_DATA } from "@/data/landingData";

interface FaqSectionProps {
  onContactSupport: () => void;
}

export function FaqSection({ onContactSupport }: FaqSectionProps) {
  // First item open by default like screenshot 5
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-6 md:py-8 lg:py-12 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Left Column: Heading & Support CTA */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="w-6 h-0.5 bg-evo-red" />
              <span className="text-xs font-bold uppercase tracking-widest text-evo-red">
                {FAQ_DATA.tag}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-950 tracking-tight leading-[1.15] mb-4">
              {FAQ_DATA.titleLine1} <br />
              <span className="text-evo-red">{FAQ_DATA.titleHighlight}</span>
            </h2>

            <p className="text-sm sm:text-base text-gray-500 leading-relaxed max-w-sm mb-6">
              {FAQ_DATA.subtitle}
            </p>

            <button
              onClick={onContactSupport}
              className="inline-flex items-center gap-2.5 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-gray-300 text-sm font-semibold text-gray-800 hover:border-gray-900 hover:bg-gray-50 transition-all duration-200"
              id="faq-contact-support-btn"
            >
              <Mail className="w-4 h-4 text-evo-red" />
              <span>{FAQ_DATA.cta}</span>
            </button>
          </div>

          {/* Right Column: Accordion Container */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-4 sm:p-5 lg:p-6 border border-gray-200/90 evo-card-shadow divide-y divide-gray-100">
              {FAQ_DATA.items.map((item, index) => {
                const isOpen = openIndex === index;
                return (
                  <div key={index} className="py-3 sm:py-4 first:pt-0 last:pb-0">
                    <button
                      onClick={() => toggleAccordion(index)}
                      className="w-full flex items-center justify-between text-left py-2 group focus:outline-hidden"
                      aria-expanded={isOpen}
                    >
                      <span
                        className={`text-sm sm:text-base font-bold transition-colors pr-8 ${
                          isOpen
                            ? "text-evo-red"
                            : "text-gray-900 group-hover:text-evo-red"
                        }`}
                      >
                        {item.question}
                      </span>

                      <div
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 ml-4 transition-colors ${
                          isOpen
                            ? "bg-evo-red text-white"
                            : "bg-gray-100 text-gray-500 group-hover:bg-red-50 group-hover:text-evo-red"
                        }`}
                      >
                        {isOpen ? (
                          <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                        ) : (
                          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="mt-2 pr-8 animate-in fade-in duration-200">
                        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
