/**
 * Client-side API for the processing engine.
 * Runs in a Web Worker when available, falling back to the main thread.
 * Owns blob/object-URL lifecycle helpers.
 */
import type {
  ImageFormat,
  OutputFormat,
  ProcessingOperation,
  ProcessingResult,
} from "@/lib/types";
import { inferFormatFromName, mimeForFormat, generateFileName } from "@/lib/utils/filename";
import { calculateSavings } from "@/lib/utils/format";

let worker: Worker | null = null;
let pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>();

function getWorker(): Worker | null {
  if (worker) return worker;
  try {
    if (typeof window === "undefined" || !("Worker" in window)) return null;
    const instance = new Worker(new URL("../workers/imageWorker.ts", import.meta.url), {
      type: "module",
    });
    instance.onmessage = (event: MessageEvent) => {
      const msg = event.data as { id: string; ok: boolean } & { error?: string };
      const p = pending.get(msg.id);
      if (!p) return;
      pending.delete(msg.id);
      if (msg.ok) p.resolve(msg);
      else p.reject(new Error(msg.error ?? "processing-failed"));
    };
    instance.onerror = () => {
      worker = null;
      pending.forEach((p) => p.reject(new Error("worker-crashed")));
      pending.clear();
    };
    worker = instance;
    return instance;
  } catch {
    return null;
  }
}

export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  pending.forEach((p) => p.reject(new Error("terminated")));
  pending.clear();
}

interface EncodeConfig {
  format: "auto" | OutputFormat;
  quality: number;
  sourceFormat?: ImageFormat;
  stripMetadata?: boolean;
  progressive?: boolean;
  preserveTransparency?: boolean;
}

export interface ProcessJobInput {
  file: File;
  operations: ProcessingOperation[];
  encode: EncodeConfig;
  suffix?: "optimized" | "compressed" | "resized" | "cropped" | "converted" | "transparent" | "edited" | "rotated" | "flipped" | "watermarked" | "cleaned" | "bg-removed";
  fileName?: string;
}

export interface ProcessJobOutput {
  blob: Blob;
  url: string;
  format: OutputFormat | "png";
  mimeType: string;
  width: number;
  height: number;
  fileSize: number;
  durationMs: number;
}

function resolveOutputFormat(format: "auto" | OutputFormat, sourceFormat?: ImageFormat): OutputFormat {
  if (format !== "auto") return format;
  switch (sourceFormat) {
    case "jpeg":
      return "jpeg";
    case "webp":
      return "webp";
    case "png":
    default:
      return "png";
  }
}

/**
 * Process a single file with the given operations.
 * Runs in a worker; falls back to the main thread when workers are unavailable.
 */
export async function processFile(job: ProcessJobInput): Promise<ProcessJobOutput> {
  const outputFormat = resolveOutputFormat(job.encode.format, job.encode.sourceFormat);
  const w = getWorker();
  const started = performance.now();

  const runInWorker = (): Promise<{ blob: Blob; width: number; height: number; mimeType: string; durationMs: number }> => {
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      pending.set(id, {
        resolve: (v) => resolve(v as { blob: Blob; width: number; height: number; mimeType: string; durationMs: number }),
        reject,
      });
      w!.postMessage({
        id,
        type: "process",
        file: job.file,
        operations: job.operations,
        encode: {
          format: job.encode.format,
          quality: job.encode.quality,
          sourceFormat: job.encode.sourceFormat,
          stripMetadata: job.encode.stripMetadata,
          progressive: job.encode.progressive,
          preserveTransparency: job.encode.preserveTransparency,
        },
      });
      window.setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error("processing-timeout"));
        }
      }, 300_000);
    });
  };

  let result: { blob: Blob; width: number; height: number; mimeType: string; durationMs: number };

  if (w) {
    try {
      result = await runInWorker();
    } catch (err) {
      // Fall back to main thread on worker failure.
      result = await processOnMainThread(job);
    }
  } else {
    result = await processOnMainThread(job);
  }

  const url = URL.createObjectURL(result.blob);
  return {
    blob: result.blob,
    url,
    format: outputFormat,
    mimeType: result.mimeType,
    width: result.width,
    height: result.height,
    fileSize: result.blob.size,
    durationMs: result.durationMs,
  };
}

async function processOnMainThread(job: ProcessJobInput) {
  const { processBitmap } = await import("@/lib/process/engine");
  const bitmap = await createImageBitmap(job.file);
  try {
    const result = await processBitmap(
      bitmap,
      job.operations as never,
      {
        format: job.encode.format,
        quality: job.encode.quality,
        sourceFormat: job.encode.sourceFormat,
        compression: {
          progressive: job.encode.progressive,
          preserveTransparency: job.encode.preserveTransparency,
        },
      } as never
    );
    return { ...result, durationMs: 0 };
  } finally {
    bitmap.close?.();
  }
}

/**
 * Convenience: process a file and produce a full ProcessingResult
 * including savings stats and a generated download filename.
 */
export async function processImage(
  file: File,
  options: { operations: ProcessingOperation[]; encode: EncodeConfig; suffix?: ProcessJobInput["suffix"]; outputName?: string }
): Promise<ProcessingResult> {
  const output = await processFile({
    file,
    operations: options.operations,
    encode: options.encode,
    suffix: options.suffix,
    fileName: options.outputName,
  });

  const savedBytes = Math.max(0, file.size - output.fileSize);
  const savingsPercent = calculateSavings(file.size, output.fileSize);
  const sourceFormat = inferFormatFromName(file.name);
  const fileName =
    options.outputName ??
    generateFileName(file.name, {
      suffix: options.suffix ?? "optimized",
      extension: output.format,
      dimensions: { width: output.width, height: output.height },
    });

  return {
    blob: output.blob,
    url: output.url,
    format: output.format,
    mimeType: output.mimeType,
    width: output.width,
    height: output.height,
    fileSize: output.fileSize,
    originalSize: file.size,
    savedBytes,
    savingsPercent,
    fileName,
    durationMs: output.durationMs,
  };
}

export function supportsFormatInBrowser(format: OutputFormat): boolean {
  if (typeof document === "undefined") return true;
  const c = document.createElement("canvas");
  return c.toDataURL(mimeForFormat(format)).startsWith("data:" + mimeForFormat(format));
}

export { mimeForFormat };

export function revokeUrl(url: string): void {
  if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(blob);
  });
}

export function createThumbnailUrl(file: File, maxSize = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("thumb-failed"));
    };
    img.src = url;
  });
}

/** Read EXIF presence without shipping a full EXIF parser. */
export async function detectExif(file: File): Promise<boolean> {
  if (file.type !== "image/jpeg") return false;
  const buffer = await file.slice(0, 64 * 1024).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  for (let i = 2; i < Math.min(bytes.length - 4, 64 * 1024); i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xe1) return true;
  }
  return false;
}