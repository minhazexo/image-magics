"use client";

import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw, UploadCloud, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type ErrorType = "processing" | "network" | "format" | "size" | "generic";

interface ErrorConfig {
  icon: ReactNode;
  title: string;
  description: string;
  action?: string;
}

const ERROR_CONFIGS: Record<ErrorType, ErrorConfig> = {
  processing: {
    icon: <AlertTriangle className="h-6 w-6" />,
    title: "Processing failed",
    description: "We couldn't process this image. Try a different file or reduce the image size.",
    action: "Try another file",
  },
  network: {
    icon: <WifiOff className="h-6 w-6" />,
    title: "Connection lost",
    description: "Unable to connect to the processing service. Check your internet connection and try again.",
    action: "Retry",
  },
  format: {
    icon: <AlertTriangle className="h-6 w-6" />,
    title: "Unsupported format",
    description: "This image format is not supported. Try JPG, PNG, or WebP.",
    action: "Upload a different file",
  },
  size: {
    icon: <AlertTriangle className="h-6 w-6" />,
    title: "File too large",
    description: "This image exceeds the maximum file size. Try compressing it first or use a smaller image.",
    action: "Upload a smaller file",
  },
  generic: {
    icon: <AlertTriangle className="h-6 w-6" />,
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
    action: "Try again",
  },
};

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  description?: string;
  error?: string;
  onRetry?: () => void;
  onUpload?: () => void;
  className?: string;
  compact?: boolean;
}

export function ErrorState({
  type = "generic",
  title,
  description,
  error,
  onRetry,
  onUpload,
  className,
  compact = false,
}: ErrorStateProps) {
  const config = ERROR_CONFIGS[type];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-6" : "py-10",
        className
      )}
      role="alert"
      aria-label={title ?? config.title}
    >
      <div className="flex items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4 h-12 w-12">
        {config.icon}
      </div>
      <h3 className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}>
        {title ?? config.title}
      </h3>
      <p className={cn("mt-1 text-muted-foreground max-w-sm", compact ? "text-xs" : "text-sm")}>
        {description ?? config.description}
      </p>
      {error && (
        <p className="mt-2 max-w-md text-xs text-destructive/80 break-all">{error}</p>
      )}
      {(onRetry || onUpload) && (
        <div className="mt-4 flex gap-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              icon={<RefreshCw className="h-4 w-4" aria-hidden />}
            >
              {config.action ?? "Retry"}
            </Button>
          )}
          {onUpload && (
            <Button
              size="sm"
              onClick={onUpload}
              icon={<UploadCloud className="h-4 w-4" aria-hidden />}
            >
              Upload new file
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function InlineError({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3.5 text-sm",
        className
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="text-foreground">{message}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Try a different image or reduce the file size.
        </p>
      </div>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="shrink-0"
        >
          Retry
        </Button>
      )}
    </div>
  );
}
