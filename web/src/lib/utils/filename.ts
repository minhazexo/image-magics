import type { ImageFormat, OutputFormat, ResizeOptions } from "@/lib/types";
import { clamp } from "@/lib/utils/format";

const EXTENSION_BY_FORMAT: Record<OutputFormat, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  avif: "avif",
  bmp: "bmp",
};

export function extForFormat(format: OutputFormat): string {
  return EXTENSION_BY_FORMAT[format];
}

export function stripExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx <= 0) return name;
  return name.slice(0, idx);
}

export function sanitizeBaseName(name: string): string {
  const base = stripExtension(name)
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return base.length > 0 ? base : "image";
}

export interface GeneratedNameOptions {
  suffix?: "optimized" | "compressed" | "resized" | "cropped" | "converted" | "transparent" | "edited" | "rotated" | "flipped" | "watermarked" | "cleaned" | "bg-removed";
  extension?: OutputFormat;
  dimensions?: { width: number; height: number };
  id?: string;
}

export function generateFileName(originalName: string, options: GeneratedNameOptions = {}): string {
  const base = sanitizeBaseName(originalName);
  const parts = [base];
  if (options.suffix) parts.push(options.suffix);
  if (options.dimensions) parts.push(`${options.dimensions.width}x${options.dimensions.height}`);
  if (options.id) parts.push(options.id);
  const ext = options.extension ? EXTENSION_BY_FORMAT[options.extension] : "png";
  return `${parts.join("-")}.${ext}`;
}

export function inferFormatFromName(name: string): ImageFormat | "unknown" {
  const ext = (name.split(".").pop() ?? "").toLowerCase();
  const map: Record<string, ImageFormat> = {
    jpg: "jpeg",
    jpeg: "jpeg",
    png: "png",
    webp: "webp",
    avif: "avif",
    gif: "gif",
    bmp: "bmp",
    tiff: "tiff",
    tif: "tiff",
  };
  return map[ext] ?? "unknown";
}

export function mimeForFormat(format: ImageFormat | "auto"): string {
  switch (format) {
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    case "tiff":
      return "image/tiff";
    default:
      return "application/octet-stream";
  }
}