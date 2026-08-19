/// <reference lib="webworker" />
/**
 * Image processing Web Worker.
 * Receives a File + operations, decodes it, processes it on an OffscreenCanvas,
 * and posts back a Blob. Keeps heavy work off the main UI thread.
 */
import { processBitmap } from "@/lib/process/engine";
import type { ProcessingOperation } from "@/lib/types";

export interface ProcessRequest {
  id: string;
  type: "process";
  file: File;
  operations: ProcessingOperation[];
  encode: {
    format: "auto" | import("@/lib/types").OutputFormat;
    quality: number;
    sourceFormat?: import("@/lib/types").ImageFormat;
    stripMetadata?: boolean;
    progressive?: boolean;
    preserveTransparency?: boolean;
  };
}

export interface ProcessResponse {
  id: string;
  ok: true;
  blob: Blob;
  width: number;
  height: number;
  mimeType: string;
  durationMs: number;
}

export interface ProcessErrorResponse {
  id: string;
  ok: false;
  error: string;
}

self.onmessage = async (event: MessageEvent<ProcessRequest>) => {
  const { id, file, operations, encode } = event.data;
  const started = performance.now();
  try {
    const bitmap = await createImageBitmap(file);
    // processBitmap is now async (supports AI-based removal)
    const result = await processBitmap(bitmap, operations as never, encode as never);
    const response: ProcessResponse = {
      id,
      ok: true,
      blob: result.blob,
      width: result.width,
      height: result.height,
      mimeType: result.mimeType,
      durationMs: Math.round(performance.now() - started),
    };
    (self as unknown as Worker).postMessage(response);
    bitmap.close?.();
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    // Suppress extension-originated message channel errors
    if (
      error.includes("message channel closed") ||
      error.includes("asynchronous response") ||
      error.includes("response was not received")
    ) {
      return;
    }
    const response: ProcessErrorResponse = { id, ok: false, error };
    (self as unknown as Worker).postMessage(response);
  }
};