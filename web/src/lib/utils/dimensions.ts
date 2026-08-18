import type { ResizeMode, ResizeOptions } from "@/lib/types";

export interface Dimension {
  width: number;
  height: number;
}

export interface TargetSize {
  width: number;
  height: number;
}

/**
 * Compute the target output dimensions for a resize operation.
 * Handles pixel/percent modes, aspect-ratio locking, and contain/cover fits.
 */
export function computeResizeDimensions(
  original: Dimension,
  options: ResizeOptions
): TargetSize {
  const { width, height } = original;
  if (width <= 0 || height <= 0) return { width, height };

  const mode: ResizeMode = options.mode ?? "pixels";

  if (mode === "percent") {
    const percent = options.percent ?? 100;
    const factor = percent / 100;
    return {
      width: Math.max(1, Math.round(width * factor)),
      height: Math.max(1, Math.round(height * factor)),
    };
  }

  const fit = options.fit ?? "fill";
  const hasWidth = typeof options.width === "number" && options.width > 0;
  const hasHeight = typeof options.height === "number" && options.height > 0;
  const ratio = width / height;

  if (!hasWidth && !hasHeight) return { width, height };
  if (hasWidth && !hasHeight) {
    const w = Math.round(options.width!);
    return { width: w, height: options.lockAspectRatio ? Math.round(w / ratio) : original.height };
  }
  if (hasHeight && !hasWidth) {
    const h = Math.round(options.height!);
    return { width: options.lockAspectRatio ? Math.round(h * ratio) : original.width, height: h };
  }

  const w = options.width!;
  const h = options.height!;

  if (fit === "fill") {
    return { width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h)) };
  }
  if (fit === "contain") {
    const scale = Math.min(w / width, h / height);
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale)),
    };
  }
  // cover
  const scale = Math.max(w / width, h / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function getAspectRatio({ width, height }: Dimension): number {
  return height === 0 ? 1 : width / height;
}

export function preserveAspect(
  current: Dimension,
  next: Partial<Dimension>,
  side: "width" | "height"
): Partial<Dimension> {
  const ratio = getAspectRatio(current);
  if (side === "width" && typeof next.width === "number" && next.width > 0) {
    return { width: next.width, height: Math.round(next.width / ratio) };
  }
  if (side === "height" && typeof next.height === "number" && next.height > 0) {
    return { width: Math.round(next.height * ratio), height: next.height };
  }
  return next;
}

export const SOCIAL_PRESETS: { label: string; width: number; height: number }[] = [
  { label: "Instagram Post", width: 1080, height: 1080 },
  { label: "Instagram Story", width: 1080, height: 1920 },
  { label: "Facebook Post", width: 1200, height: 630 },
  { label: "Facebook Cover", width: 1200, height: 630 },
  { label: "YouTube Thumbnail", width: 1280, height: 720 },
  { label: "YouTube Banner", width: 2560, height: 1440 },
  { label: "X/Twitter Post", width: 1600, height: 900 },
  { label: "LinkedIn Post", width: 1200, height: 627 },
];

export const PERCENT_PRESETS = [10, 25, 50, 75, 100, 150, 200];

export function clampDimension(value: number): number {
  return clamp(Math.round(value), 1, 20000);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Estimate a safe processing budget.
 * Returns true if the image fits within reasonable memory limits.
 */
export function isSafeToProcess(width: number, height: number, maxPixels = 268_000_000): boolean {
  return width * height <= maxPixels;
}