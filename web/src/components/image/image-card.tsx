"use client";

import { X, FileWarning } from "lucide-react";
import type { UploadedImage } from "@/lib/types";
import { formatBytes } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

interface ImageCardProps {
  image: UploadedImage;
  onRemove: (id: string) => void;
  onSelect?: (id: string) => void;
  selected?: boolean;
  index?: number;
}

export function ImageCard({ image, onRemove, onSelect, selected, index }: ImageCardProps) {
  const invalid = !image.valid;

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-xl border bg-card transition-all duration-200",
        invalid ? "border-destructive/40" : "border-border",
        selected ? "border-primary ring-2 ring-primary/20 shadow-sm" : "hover:border-border/80 hover:shadow-xs",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => !invalid && onSelect?.(image.id)}
        className="block w-full cursor-pointer text-left focus-visible:outline-none"
        aria-label={onSelect ? `Select ${image.name}` : undefined}
        aria-pressed={selected}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={invalid ? "" : image.url}
            alt={image.name}
            className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-90"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.opacity = "0.15";
            }}
          />
          {invalid && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-secondary p-3 text-center">
              <FileWarning className="h-5 w-5 text-destructive" aria-hidden />
              <p className="text-xs font-medium text-destructive">{image.error ?? "Unsupported file"}</p>
            </div>
          )}
          {typeof index === "number" && (
            <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {index + 1}
            </span>
          )}
        </div>
      </button>

      <div className="flex items-start justify-between gap-2 p-2.5">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium" title={image.name}>
            {image.name}
          </p>
          {!invalid && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {image.width}×{image.height} · {formatBytes(image.size)}
            </p>
          )}
          {invalid && <p className="mt-0.5 text-[11px] text-muted-foreground">Invalid file</p>}
        </div>
        <Tooltip content="Remove">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
            onClick={() => onRemove(image.id)}
            aria-label={`Remove ${image.name}`}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
