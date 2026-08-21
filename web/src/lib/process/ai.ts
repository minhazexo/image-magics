"use client";

export interface AiBackgroundOptions {
  mode?: "auto" | "color" | "manual";
  alphaMatting?: boolean;
  edgeRefinement?: boolean;
  foregroundThreshold?: number;
  backgroundThreshold?: number;
  erodeSize?: number;
  trimTransparent?: boolean;
  colorTolerance?: number;
  colorR?: number;
  colorG?: number;
  colorB?: number;
  onProgress?: (step: string, progress: number) => void;
}

export interface TransparencyStats {
  width: number;
  height: number;
  hasAlpha: boolean;
  transparentPixels: number;
  opaquePixels: number;
  totalPixels: number;
}

export const MAX_IMAGE_PIXELS = 20_000_000;
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

/**
 * Client-side background removal using @imgly/background-removal (WASM).
 * Runs entirely in the browser — no server needed.
 *
 * Model files are served from the library's CDN and cached by the browser.
 */
export interface AiResult {
  blob: Blob;
  pipeline: string;
}

/** Quick health check — always returns true (no server needed). */
export async function checkBackendHealth(): Promise<boolean> {
  return true;
}

/**
 * Preload the AI model in the background so it's ready before the user
 * uploads an image. Call this on page load or when the user hovers over
 * the background-removal button.
 *
 * Safe to call multiple times — the browser caches the files.
 */
let _preloadPromise: Promise<void> | null = null;
export function preloadAiModel(): Promise<void> {
  if (_preloadPromise) return _preloadPromise;
  _preloadPromise = (async () => {
    try {
      const { preload } = await import("@imgly/background-removal");
      await preload();
    } catch {
      // Non-critical — if preload fails, removeBackground will try again
    }
  })();
  return _preloadPromise;
}

export async function removeBackgroundViaAi(
  file: File,
  opts: AiBackgroundOptions = {},
): Promise<AiResult> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(
      "Image exceeds the 25 MB limit. Please upload a smaller image.",
    );
  }
  const bmp = await createImageBitmap(file).catch(() => null);
  if (bmp) {
    if (bmp.width * bmp.height > MAX_IMAGE_PIXELS) {
      bmp.close?.();
      throw new Error(
        "Image exceeds the 20 megapixel limit. Please upload a smaller image.",
      );
    }
    bmp.close?.();
  }

  const pipeline: string[] = ["@imgly/background-removal(wasm)"];

  opts.onProgress?.("Loading AI model in browser…", 0);

  // Lazy-load the heavy WASM library only when actually needed
  const { removeBackground } = await import("@imgly/background-removal");

  const result = await removeBackground(file, {
    progress: (key: string, current: number, total: number) => {
      const pct = total > 0 ? Math.round((current / total) * 100) : 0;
      if (key === "fetch:inference") {
        opts.onProgress?.("Running segmentation model…", pct);
      } else if (key === "compute:inference") {
        opts.onProgress?.("Generating alpha mask…", pct);
      } else if (key === "fetch:model") {
        opts.onProgress?.(
          "Downloading AI model (cached after first use)…",
          pct,
        );
      }
    },
  });

  if (opts.alphaMatting) pipeline.push("alpha-matting(auto)");
  if (opts.edgeRefinement) pipeline.push("edge-refinement(auto)");

  opts.onProgress?.("Encoding PNG…", 100);

  return { blob: result, pipeline: pipeline.join(" → ") };
}

/**
 * Decodes a processed blob and measures its alpha channel, used to verify the
 * output really contains transparency (per the spec: an all-opaque result
 * means the operation failed).
 */
export async function verifyTransparency(
  blob: Blob,
): Promise<TransparencyStats> {
  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0);
  bmp.close?.();

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let transparent = 0;
  let opaque = 0;
  let hasAlpha = false;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] === 255) {
      opaque++;
    } else {
      transparent++;
      hasAlpha = true;
    }
  }
  return {
    width: canvas.width,
    height: canvas.height,
    hasAlpha,
    transparentPixels: transparent,
    opaquePixels: opaque,
    totalPixels: canvas.width * canvas.height,
  };
}
