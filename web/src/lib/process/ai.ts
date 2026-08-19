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
 * Sends an image to the local AI background-removal service (via the
 * /api/transparent-image proxy) and returns a true RGBA PNG blob.
 */
export interface AiResult {
  blob: Blob;
  pipeline: string;
}

export async function removeBackgroundViaAi(file: File, opts: AiBackgroundOptions = {}): Promise<AiResult> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image exceeds the 25 MB limit. Please upload a smaller image.");
  }
  const bmp = await createImageBitmap(file).catch(() => null);
  if (bmp) {
    if (bmp.width * bmp.height > MAX_IMAGE_PIXELS) {
      bmp.close?.();
      throw new Error("Image exceeds the 40 megapixel limit. Please upload a smaller image.");
    }
    bmp.close?.();
  }

  const form = new FormData();
  form.set("image", file, file.name);
  form.set("mode", opts.mode ?? "auto");
  form.set("alphaMatting", opts.alphaMatting === false ? "false" : "true");
  form.set("edgeRefinement", opts.edgeRefinement === false ? "false" : "true");
  if (opts.foregroundThreshold != null) form.set("alphaMattingForegroundThreshold", String(opts.foregroundThreshold));
  if (opts.backgroundThreshold != null) form.set("alphaMattingBackgroundThreshold", String(opts.backgroundThreshold));
  if (opts.erodeSize != null) form.set("alphaMattingErodeSize", String(opts.erodeSize));
  form.set("trimTransparent", opts.trimTransparent ? "true" : "false");
  form.set("outputFormat", "png");
  if (opts.mode === "color") {
    form.set("colorTolerance", String(opts.colorTolerance ?? 30));
    form.set("colorR", String(opts.colorR ?? 255));
    form.set("colorG", String(opts.colorG ?? 255));
    form.set("colorB", String(opts.colorB ?? 255));
  }

  const res = await fetch("/api/transparent-image", { method: "POST", body: form });
  if (!res.ok) {
    let message = `Background removal failed (${res.status}).`;
    try {
      const json = (await res.json()) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  const pipeline = res.headers.get("X-Pipeline") ?? "unknown";
  console.log("[bg-remover] Pipeline:", pipeline);

  return { blob: await res.blob(), pipeline };
}

/**
 * Decodes a processed blob and measures its alpha channel, used to verify the
 * output really contains transparency (per the spec: an all-opaque result
 * means the operation failed).
 */
export async function verifyTransparency(blob: Blob): Promise<TransparencyStats> {
  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext("2d")!;
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
