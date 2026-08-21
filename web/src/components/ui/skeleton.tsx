"use client";

import { cn } from "@/lib/utils/cn";

interface SkeletonProps {
  className?: string;
}

/**
 * Animated skeleton placeholder for loading states.
 * Uses a subtle shimmer effect consistent with the design system.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-secondary/60",
        className
      )}
      aria-hidden="true"
    />
  );
}

/**
 * Full-page loading skeleton for tool pages.
 * Shows a realistic layout preview while the tool bundle loads.
 */
export function ToolPageSkeleton({ name }: { name?: string }) {
  return (
    <div className="container-page py-6 sm:py-8" role="status" aria-label="Loading">
      {/* Breadcrumb skeleton */}
      <div className="mb-4 flex items-center gap-1.5">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-20" />
      </div>

      {/* Title skeleton */}
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Content: two-column layout skeleton */}
      <div className="space-y-5 lg:space-y-0 lg:grid lg:gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Sidebar skeleton */}
        <aside className="order-1 lg:order-2 rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <div className="divider" />
          <Skeleton className="h-11 w-full rounded-md" />
        </aside>

        {/* Main content skeleton */}
        <div className="order-2 lg:order-1 space-y-4">
          <Skeleton className="h-[300px] w-full" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {name ? `Loading ${name}…` : "Loading tool…"}
      </p>
    </div>
  );
}
