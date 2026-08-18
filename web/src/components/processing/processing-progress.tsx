"use client";

import { cn } from "@/lib/utils/cn";

interface ProcessingProgressProps {
  progress: number; // 0-100
  label?: string;
  className?: string;
  showPercent?: boolean;
}

export function ProcessingProgress({ progress, label, className, showPercent = true }: ProcessingProgressProps) {
  const clamped = Math.max(0, Math.min(100, progress));
  return (
    <div className={cn("w-full", className)}>
      {(label || showPercent) && (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showPercent && (
            <span className="tabular-nums text-muted-foreground" aria-live="polite">
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}