"use client";

import { cn } from "@/lib/utils/cn";

interface ProcessingProgressProps {
  progress: number; // 0-100
  label?: string;
  className?: string;
  showPercent?: boolean;
  /** Optional step message shown below the bar */
  step?: string;
}

export function ProcessingProgress({ progress, label, className, showPercent = true, step }: ProcessingProgressProps) {
  const clamped = Math.max(0, Math.min(100, progress));
  return (
    <div className={cn("w-full", className)}>
      {(label || showPercent) && (
        <div className="mb-2 flex items-center justify-between text-sm">
          {label && (
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {label}
            </span>
          )}
          {showPercent && (
            <span className="tabular-nums text-muted-foreground" aria-live="polite">
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {step && (
        <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
          {step}
        </p>
      )}
    </div>
  );
}
