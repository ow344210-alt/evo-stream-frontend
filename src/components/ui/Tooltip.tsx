"use client";

import React, { useState } from "react";

interface TooltipProps {
  /** Accessible content shown on hover / keyboard focus. */
  label: string;
  children: React.ReactNode;
  /** Preferred placement. Tooltips never overflow the right edge when align="end". */
  side?: "top" | "bottom";
  align?: "center" | "end";
  /** Optional id for aria-describedby wiring. */
  id?: string;
}

const POSITION_CLASSES = {
  "top-center": "bottom-full mb-2 left-1/2 -translate-x-1/2",
  "top-end": "bottom-full mb-2 right-0",
  "bottom-center": "top-full mt-2 left-1/2 -translate-x-1/2",
  "bottom-end": "top-full mt-2 right-0",
} as const;

function positionKey(side: "top" | "bottom", align: "center" | "end") {
  return `${side}-${align}` as keyof typeof POSITION_CLASSES;
}

/**
 * Lightweight, dependency-free tooltip. The wrapper is inline-flex and purely
 * presentational so it never changes the child's layout size. It appears on
 * hover AND keyboard focus (focus events bubble in React, so focusing a nested
 * button surfaces the tooltip). It uses pointer-events-none so it never blocks
 * clicks, and the child keeps its own aria-label — the tooltip text is not the
 * only accessibility mechanism.
 */
export function Tooltip({ label, children, side = "top", align = "center", id }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          id={id}
          role="tooltip"
          className={`absolute z-50 pointer-events-none select-none whitespace-nowrap rounded-md bg-[rgba(20,20,20,0.95)] text-white text-xs px-2 py-1 shadow-lg ${POSITION_CLASSES[positionKey(side, align)]}`}
        >
          {label}
        </span>
      )}
    </span>
  );
}