"use client";

import { cn } from "@/lib/utils/cn";

interface SuccessCheckProps {
  className?: string;
  size?: number;
}

/**
 * Animated checkmark SVG that draws itself on mount.
 * Use for success states after processing completes.
 */
export function SuccessCheck({ className, size = 32 }: SuccessCheckProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-emerald-500", className)}
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        className="fill-emerald-500/10 stroke-emerald-500"
        strokeWidth="1.5"
      />
      <path
        d="M8 12.5l2.5 2.5L16 9.5"
        className="animate-check stroke-emerald-500"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
