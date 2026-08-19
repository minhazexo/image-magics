"use client";

import type { ReactNode } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8" : "py-12 sm:py-16",
        className
      )}
      role="status"
      aria-label={title}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4",
          compact ? "h-10 w-10" : "h-14 w-14"
        )}
      >
        {icon ?? <UploadCloud className={compact ? "h-5 w-5" : "h-7 w-7"} aria-hidden />}
      </div>
      <h3
        className={cn(
          "font-semibold text-foreground",
          compact ? "text-sm" : "text-base"
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "mt-1 text-muted-foreground max-w-sm",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function UploadEmptyState({
  onUpload,
  formats = "JPG, PNG, WebP, GIF, BMP",
  maxSize = "100 MB",
  compact = false,
}: {
  onUpload?: () => void;
  formats?: string;
  maxSize?: string;
  compact?: boolean;
}) {
  return (
    <EmptyState
      icon={<UploadCloud className={compact ? "h-5 w-5" : "h-7 w-7"} />}
      title="No image uploaded"
      description="Drag & drop an image or click to browse"
      compact={compact}
      action={
        onUpload ? (
          <button
            type="button"
            onClick={onUpload}
            className="text-sm text-primary hover:underline"
          >
            Upload an image
          </button>
        ) : undefined
      }
    />
  );
}
