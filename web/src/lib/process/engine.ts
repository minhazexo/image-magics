/**
 * Pure canvas-based image processing engine.
 * These functions handle a single image bitmap and produce a Blob.
 * They are designed to run inside a Web Worker (OffscreenCanvas) with a
 * main-thread fallback.
 */
import type {
  CompressionOptions,
  CropOptions,
  FilterAdjustments,
  ImageFormat,
  OptimizeOptions,
  RemoveBackgroundOptions,
  RemoveColorOptions,
  ResizeOptions,
  WatermarkOptions,
  WatermarkPosition,
} from "@/lib/types";
import { computeResizeDimensions } from "@/lib/utils/dimensions";
import { clamp } from "@/lib/utils/format";

interface Rgb {
  r: number;
  g: number;
  b: number;
}

export type Canvas2D = CanvasRenderingContext2D;

declare const OffscreenCanvas: {
  new (width: number, height: number): HTMLCanvasElement;
} | undefined;

export function isWorkerScope(): boolean {
  return typeof self !== "undefined" && typeof (self as unknown as { Window: unknown }).Window === "undefined";
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height) as unknown as HTMLCanvasElement;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function getCanvasBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  const convertToBlob = (canvas as unknown as { convertToBlob?: (o: { type: string; quality?: number }) => Promise<Blob> }).convertToBlob;
  if (typeof convertToBlob === "function") {
    return convertToBlob.call(canvas, { type, quality });
  }
  const toBlob = canvas.toBlob.bind(canvas);
  return new Promise((resolve, reject) => {
    const q = quality !== undefined && type !== "image/png" && type !== "image/bmp" ? quality : undefined;
    toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode-failed"))), type, q);
  });
}

type BlobType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/bmp"
  | "image/gif";

export function resolveMime(format: ImageFormat | "auto", sourceFormat?: ImageFormat): BlobType {
  if (format === "auto") {
    switch (sourceFormat) {
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "webp":
        return "image/webp";
      default:
        return "image/png";
    }
  }
  switch (format) {
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "bmp":
      return "image/bmp";
    case "gif":
      return "image/gif";
    default:
      return "image/png";
  }
}

export function canvasSupports(mime: BlobType): boolean {
  if (typeof document === "undefined") return true;
  const c = document.createElement("canvas");
  return c.toDataURL(mime).startsWith("data:" + mime);
}

/**
 * Draw an ImageBitmap onto a canvas, honoring resize options.
 */
export function drawScaledBitmap(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  bitmap: ImageBitmap,
  resize?: ResizeOptions | null
): { width: number; height: number } {
  let width = bitmap.width;
  let height = bitmap.height;

  if (resize) {
    const target = computeResizeDimensions({ width, height }, resize);
    width = target.width;
    height = target.height;
  }

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);

  if (resize?.sharpen) {
    applyCanvasSharpen(ctx, width, height, 0.3);
  }

  return { width, height };
}

const UNCONVOLVE_KERNEL = [0, -1, 0, -1, 5, -1, 0, -1, 0];

function applyCanvasSharpen(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) {
  if (amount <= 0) return;
  const imageData = ctx.getImageData(0, 0, width, height);
  const src = imageData.data;
  const out = ctx.createImageData(width, height);
  const data = out.data;
  const k = UNCONVOLVE_KERNEL;
  const kc = 5;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let j = -1; j <= 1; j++) {
          for (let i = -1; i <= 1; i++) {
            const srcIdx = ((y + j) * width + (x + i)) * 4 + c;
            sum += src[srcIdx] * k[(j + 1) * 3 + (i + 1)];
          }
        }
        const original = src[idx + c];
        const sharpened = sum / kc;
        data[idx + c] = clamp(Math.round(original + (sharpened - original) * amount), 0, 255);
      }
      data[idx + 3] = src[idx + 3];
    }
  }
  // edges: copy original
  for (let x = 0; x < width; x++) {
    for (let i = 0; i < 4; i++) {
      data[x * 4 + i] = src[x * 4 + i];
      data[((height - 1) * width + x) * 4 + i] = src[((height - 1) * width + x) * 4 + i];
    }
  }
  for (let y = 0; y < height; y++) {
    for (let i = 0; i < 4; i++) {
      data[(y * width) * 4 + i] = src[(y * width) * 4 + i];
      data[(y * width + width - 1) * 4 + i] = src[(y * width + width - 1) * 4 + i];
    }
  }
  ctx.putImageData(out, 0, 0);
}

export function cropContext(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, options: CropOptions): void {
  const { x, y, width, height } = options;
  const safeX = clamp(Math.round(x), 0, canvas.width);
  const safeY = clamp(Math.round(y), 0, canvas.height);
  const safeW = clamp(Math.round(width), 1, canvas.width - safeX);
  const safeH = clamp(Math.round(height), 1, canvas.height - safeY);
  const cropped = ctx.getImageData(safeX, safeY, safeW, safeH);
  canvas.width = safeW;
  canvas.height = safeH;
  ctx.putImageData(cropped, 0, 0);
}

export function rotateCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, angle: number): void {
  // International rotations in 90-degree steps operate in-place.
  const normalized = ((Math.round(angle / 90) * 90) % 360 + 360) % 360;
  if (normalized === 0) return;
  const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let w = canvas.width;
  let h = canvas.height;
  if (normalized === 90 || normalized === 270) {
    [w, h] = [h, w];
  }
  const out = createCanvas(w, h);
  const octx = out.getContext("2d") as CanvasRenderingContext2D;
  switch (normalized) {
    case 90:
      octx.translate(w, 0);
      octx.rotate(Math.PI / 2);
      break;
    case 180:
      octx.translate(w, h);
      octx.rotate(Math.PI);
      break;
    case 270:
      octx.translate(0, h);
      octx.rotate(-Math.PI / 2);
      break;
  }
  octx.putImageData(snap, 0, 0);
  canvas.width = w;
  canvas.height = h;
  const ctx2 = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx2.drawImage(out, 0, 0);
}

export function flipCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, direction: "horizontal" | "vertical"): void {
  const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const temp = createCanvas(canvas.width, canvas.height);
  const tctx = temp.getContext("2d") as CanvasRenderingContext2D;
  if (direction === "horizontal") {
    tctx.translate(canvas.width, 0);
    tctx.scale(-1, 1);
  } else {
    tctx.translate(0, canvas.height);
    tctx.scale(1, -1);
  }
  tctx.putImageData(snap, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(temp, 0, 0);
}

function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  const value = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}



/**
 * GIMP "color to alpha" per-pixel transform: converts how much a pixel
 * resembles the target color into alpha, and shifts the RGB away from the
 * target so anti-aliased edges keep a clean blend instead of a fringe.
 * Algorithm by clahey, as adapted in GIMP's color-to-alpha plugin.
 */
function colorToAlpha(r: number, g: number, b: number, tr: number, tg: number, tb: number): { r: number; g: number; b: number; a: number } {
  const sr = r / 255;
  const sg = g / 255;
  const sb = b / 255;
  const cr = tr / 255;
  const cg = tg / 255;
  const cb = tb / 255;

  const alphaR = cr < 0.0001 ? sr : sr > cr ? (sr - cr) / (1 - cr) : sr < cr ? (cr - sr) / cr : 0;
  const alphaG = cg < 0.0001 ? sg : sg > cg ? (sg - cg) / (1 - cg) : sg < cg ? (cg - sg) / cg : 0;
  const alphaB = cb < 0.0001 ? sb : sb > cb ? (sb - cb) / (1 - cb) : sb < cb ? (cb - sb) / cb : 0;
  const a = Math.max(alphaR, alphaG, alphaB);

  if (a < 0.000001) return { r: 0, g: 0, b: 0, a: 0 };

  const nr = clamp((sr - cr) / a + cr, 0, 1);
  const ng = clamp((sg - cg) / a + cg, 0, 1);
  const nb = clamp((sb - cb) / a + cb, 0, 1);

  return { r: Math.round(nr * 255), g: Math.round(ng * 255), b: Math.round(nb * 255), a };
}

/**
 * Remove a specific color within a tolerance, with soft edge smoothing.
 * Uses the color-to-alpha transform so anti-aliased borders are preserved.
 */
export function removeColorFromCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  options: RemoveColorOptions
): void {
  const { r, g, b } = options.color;
  const tolerance = clamp(options.tolerance, 0, 100);
  const softness = clamp(options.edgeSmoothing, 0, 100);
  const radius = (tolerance / 100) * 441; // max rgb distance ~ 441
  const softRadius = Math.max(0, radius * (softness / 100));
  const reach = radius + softRadius;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;

  for (let i = 0; i < px.length; i += 4) {
    const dr = px[i] - r;
    const dg = px[i + 1] - g;
    const db = px[i + 2] - b;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);

    if (dist > reach) continue;

    const cta = colorToAlpha(px[i], px[i + 1], px[i + 2], r, g, b);

    let strength: number;
    if (radius <= 0) {
      strength = dist <= softRadius ? 1 : 0;
    } else if (dist <= radius - softRadius) {
      strength = 1;
    } else {
      strength = clamp(1 - (dist - (radius - softRadius)) / Math.max(0.0001, softRadius), 0, 1);
    }
    if (strength <= 0) continue;

    const keep = 1 - strength * (1 - cta.a);
    px[i] = Math.round(px[i] + (cta.r - px[i]) * strength);
    px[i + 1] = Math.round(px[i + 1] + (cta.g - px[i + 1]) * strength);
    px[i + 2] = Math.round(px[i + 2] + (cta.b - px[i + 2]) * strength);
    px[i + 3] = Math.round(px[i + 3] * keep);
  }
  ctx.putImageData(data, 0, 0);
}

/**
 * Remove a background estimated from the image's borders.
 *
 * A flood fill seeded from the image border only removes the *connected*
 * background region, so interior pixels that happen to share the background
 * color (holes in the subject) are preserved. Boundary pixels are passed
 * through the color-to-alpha transform to keep clean anti-aliased edges.
 */
/**
 * Remove a background estimated from the image's borders.
 *
 * A flood fill seeded from the image border only removes the *connected*
 * background region, so interior pixels that happen to share the background
 * color (holes in the subject) are preserved. Boundary pixels are passed
 * through the color-to-alpha transform to keep clean anti-aliased edges.
 */
export function removeBackgroundFromCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  options: RemoveBackgroundOptions
): void {
  const tolerance = clamp(options.tolerance ?? 60, 0, 100);
  const radius = (tolerance / 100) * 441;
  const radiusSq = radius * radius;

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  const w = canvas.width;
  const h = canvas.height;

  // Sample a border background color (median of the border band).
  const samples: Rgb[] = [];
  const wPri = Math.max(1, Math.round(w * 0.01));
  const hPri = Math.max(1, Math.round(h * 0.01));
  for (let y = 0; y < Math.min(hPri, h); y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      samples.push({ r: px[idx], g: px[idx + 1], b: px[idx + 2] });
      const idx2 = ((h - 1 - y) * w + x) * 4;
      samples.push({ r: px[idx2], g: px[idx2 + 1], b: px[idx2 + 2] });
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < Math.min(wPri, w); x++) {
      const idx = (y * w + x) * 4;
      samples.push({ r: px[idx], g: px[idx + 1], b: px[idx + 2] });
      const idx2 = (y * w + (w - 1 - x)) * 4;
      samples.push({ r: px[idx2], g: px[idx2 + 1], b: px[idx2 + 2] });
    }
  }

  if (!samples.length) return;

  // Robust center estimate (median)
  const sortedR = samples.map((s) => s.r).sort((a, b) => a - b);
  const sortedG = samples.map((s) => s.g).sort((a, b) => a - b);
  const sortedB = samples.map((s) => s.b).sort((a, b) => a - b);
  const mid = sortedR.length >> 1;
  const bg: Rgb = {
    r: sortedR[mid],
    g: sortedG[mid],
    b: sortedB[mid],
  };

  const distSqToBg = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    const dr = px[i] - bg.r;
    const dg = px[i + 1] - bg.g;
    const db = px[i + 2] - bg.b;
    return dr * dr + dg * dg + db * db;
  };

  // Flood fill from the border: 1 = background (to be removed).
  const mask = new Uint8Array(w * h);
  const stack: number[] = [];
  const pushIfBg = (x: number, y: number) => {
    const idx = y * w + x;
    if (mask[idx]) return;
    if (distSqToBg(x, y) <= radiusSq) {
      mask[idx] = 1;
      stack.push(idx);
    }
  };
  for (let x = 0; x < w; x++) {
    pushIfBg(x, 0);
    pushIfBg(x, h - 1);
  }
  for (let y = 1; y < h - 1; y++) {
    pushIfBg(0, y);
    pushIfBg(w - 1, y);
  }
  while (stack.length) {
    const idx = stack.pop() as number;
    const x = idx % w;
    const y = (idx - x) / w;
    if (x > 0) pushIfBg(x - 1, y);
    if (x < w - 1) pushIfBg(x + 1, y);
    if (y > 0) pushIfBg(x, y - 1);
    if (y < h - 1) pushIfBg(x, y + 1);
  }

  // Remove the interior of the background and decontaminate its boundary.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (mask[idx] !== 1) continue;
      const i = idx * 4;

      let touchesFg = false;
      for (let dy = -1; dy <= 1 && !touchesFg; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (mask[ny * w + nx] === 0) {
            touchesFg = true;
            break;
          }
        }
      }

      if (!touchesFg) {
        px[i + 3] = 0;
        continue;
      }

      const dist = Math.sqrt(distSqToBg(x, y));
      const strength = clamp(1 - (dist - radius) / Math.max(2, radius * 0.08), 0, 1);
      const cta = colorToAlpha(px[i], px[i + 1], px[i + 2], bg.r, bg.g, bg.b);
      const keep = 1 - strength * (1 - cta.a);
      px[i] = Math.round(px[i] + (cta.r - px[i]) * strength);
      px[i + 1] = Math.round(px[i + 1] + (cta.g - px[i + 1]) * strength);
      px[i + 2] = Math.round(px[i + 2] + (cta.b - px[i + 2]) * strength);
      px[i + 3] = Math.round(px[i + 3] * keep);
    }
  }
  ctx.putImageData(data, 0, 0);
}

/**
 * Soften the alpha channel with a small box blur (feather). Keeps RGB
 * untouched and limits the feather to a few pixels so edges stay clean.
 */
export function softenAlpha(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, radius: number): void {
  const pxRadius = Math.max(0, Math.min(8, Math.round(radius)));
  if (pxRadius === 0) return;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const src = data.data;
  const out = new Uint8ClampedArray(src);
  const w = canvas.width;
  const h = canvas.height;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -pxRadius; dy <= pxRadius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -pxRadius; dx <= pxRadius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          sum += src[(ny * w + nx) * 4 + 3];
          count++;
        }
      }
      out[(y * w + x) * 4 + 3] = count ? Math.round(sum / count) : src[(y * w + x) * 4 + 3];
    }
  }
  for (let i = 3; i < src.length; i += 4) src[i] = out[i];
  ctx.putImageData(data, 0, 0);
}

export function applyFilterOptions(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  filters: FilterAdjustments
): void {
  const { brightness, contrast, saturation, grayscale, exposure, blur, sharpen, opacity } = filters;
  const needsSimple = brightness !== 0 || contrast !== 0 || saturation !== 0 || grayscale || exposure !== 0;

  if (needsSimple) {
    const parts: string[] = [];
    parts.push(`brightness(${100 + brightness * 100}%)`);
    parts.push(`contrast(${100 + contrast * 100}%)`);
    parts.push(`saturate(${100 + saturation * 100}%)`);
    parts.push(`brightness(${100 + exposure * 100 * 0.9}%)`);
    if (grayscale) parts.push("grayscale(100%)");
    const prev = ctx.filter;
    ctx.filter = parts.join(" ");
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = prev;
  }

  if (blur > 0) {
    const prev = ctx.filter;
    ctx.filter = `blur(${blur}px)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = prev;
  }

  if (sharpen > 0) {
    applyCanvasSharpen(ctx, canvas.width, canvas.height, sharpen);
  }

  if (opacity < 1) {
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px = data.data;
    for (let i = 3; i < px.length; i += 4) {
      px[i] = Math.round(px[i] * opacity);
    }
    ctx.putImageData(data, 0, 0);
  }
}

function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function computeWatermarkSize(base: number, scale: number): number {
  return Math.max(8, Math.round(base * scale));
}

function drawTextWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, options: Extract<WatermarkOptions, { kind: "text" }>): void {
  const defaultSize = Math.max(w, h) * 0.05;
  const fontSize = options.size > 0 ? options.size : defaultSize;
  const margin = options.margin > 0 ? options.margin : Math.max(w, h) * 0.03;

  ctx.save();
  ctx.globalAlpha = clamp(options.opacity, 0, 1);
  ctx.fillStyle = options.color;
  ctx.font = `${fontSize}px ${options.font}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  const textWidth = ctx.measureText(options.text).width;
  const textHeight = fontSize;
  const pad = scaleByRatio(w, 28);

  const drawOne = (x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(degreesToRadians(options.rotation));
    ctx.fillText(options.text, 0, 0);
    ctx.restore();
  };

  if (options.tiled) {
    const tileW = textWidth + pad;
    const tileH = textHeight + pad;
    for (let y = -tileH; y < h + tileH; y += tileH) {
      for (let x = -tileW; x < w + tileW; x += tileW) {
        drawOne(x, y);
      }
    }
  } else {
    const p = positionedPoint(w, h, options.position, margin);
    drawOne(p.x, p.y);
  }
  ctx.restore();
}

function scaleByRatio(base: number, val: number): number {
  return Math.max(8, Math.round(base * (val / 100)));
}

function positionedPoint(w: number, h: number, position: WatermarkPosition, margin: number) {
  const xMap = { left: margin, center: w / 2, right: w - margin };
  const yMap = { top: margin, center: h / 2, bottom: h - margin };
  return { x: xMap[position.horizontal], y: yMap[position.vertical] };
}

function drawImageWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, options: Extract<WatermarkOptions, { kind: "image" }>): void {
  const targetWidth = computeWatermarkSize(w, options.scale);
  const margin = options.margin > 0 ? options.margin : Math.max(w, h) * 0.03;

  ctx.save();
  ctx.globalAlpha = clamp(options.opacity, 0, 1);
  const img = new Image();
  img.decoding = "sync";
  img.src = options.dataUrl;

  const ratio = img.height > 0 && img.width > 0 ? img.height / img.width : 1;
  const drawH = targetWidth * ratio;
  const pad = scaleByRatio(w, 40);

  const drawOne = (x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(degreesToRadians(options.rotation));
    ctx.drawImage(img, -targetWidth / 2, -drawH / 2, targetWidth, drawH);
    ctx.restore();
  };

  if (options.tiled) {
    const tileW = targetWidth + pad;
    const tileH = drawH + pad;
    for (let y = -tileH; y < h + tileH; y += tileH) {
      for (let x = -tileW; x < w + tileW; x += tileW) {
        drawOne(x, y);
      }
    }
  } else {
    const p = positionedPoint(w, h, options.position, margin);
    drawOne(p.x, p.y);
  }
  ctx.restore();
}

function scaleWatermark(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, options: WatermarkOptions): void {
  const w = canvas.width;
  const h = canvas.height;
  if (options.kind === "text") {
    drawTextWatermark(ctx, w, h, options);
  } else {
    drawImageWatermark(ctx, w, h, options);
  }
}

interface OptimizeSettings {
  quality: number;
  mime: BlobType;
  lossless?: boolean;
  progressive?: boolean;
}

function pickEncodeSettings(format: ImageFormat | "auto", source: ImageFormat | undefined, quality: number, opts: Partial<CompressionOptions>): OptimizeSettings {
  const mime = resolveMime(format, source);
  if (mime === "image/png") {
    const lossless = opts.preserveTransparency !== false || mime === "image/png";
    return { quality: Math.min(100, quality), mime, lossless };
  }
  if (mime === "image/bmp") {
    return { quality: 100, mime };
  }
  return { quality: clamp(quality, 1, 100), mime };
}

/**
 * Main entry point: process an ImageBitmap with a set of operations.
 * Returns (blob, finalDimensions, finalMimeType).
 */
export async function processBitmap(
  bitmap: ImageBitmap,
  operations: Array<{
    type: string;
    options?: unknown;
    angle?: number;
    direction?: "horizontal" | "vertical";
  }>,
  encode?: { format: ImageFormat | "auto"; quality: number; sourceFormat?: ImageFormat; compression?: Partial<CompressionOptions> }
): Promise<{ blob: Blob; width: number; height: number; mimeType: string }> {
  const canvas = createCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  let currentWidth = bitmap.width;
  let currentHeight = bitmap.height;

  ctx.drawImage(bitmap, 0, 0);

  for (const op of operations) {
    switch (op.type) {
      case "resize": {
        const dims = drawScaledBitmap(canvas, ctx, bitmap, op.options as ResizeOptions | null);
        currentWidth = dims.width;
        currentHeight = dims.height;
        break;
      }
      case "crop": {
        cropContext(canvas, ctx, op.options as CropOptions);
        currentWidth = canvas.width;
        currentHeight = canvas.height;
        break;
      }
      case "rotate": {
        rotateCanvas(canvas, ctx, op.angle ?? 0);
        currentWidth = canvas.width;
        currentHeight = canvas.height;
        break;
      }
      case "flip": {
        flipCanvas(canvas, ctx, op.direction ?? "horizontal");
        break;
      }
      case "removeColor": {
        removeColorFromCanvas(canvas, ctx, op.options as RemoveColorOptions);
        break;
      }
      case "removeBackground": {
        removeBackgroundFromCanvas(canvas, ctx, op.options as RemoveBackgroundOptions);
        break;
      }
      case "watermark": {
        scaleWatermark(canvas, ctx, op.options as WatermarkOptions);
        break;
      }
      case "applyFilters": {
        applyFilterOptions(canvas, ctx, op.options as FilterAdjustments);
        break;
      }
    }
  }

  const settings = encode
    ? pickEncodeSettings(encode.format, encode.sourceFormat, encode.quality, encode.compression ?? {})
    : { quality: 92, mime: "image/png" as BlobType };

  // Flatten transparency for formats that don't support alpha (JPEG/BMP).
  if (settings.mime === "image/jpeg" || settings.mime === "image/bmp") {
    const flat = createCanvas(canvas.width, canvas.height);
    const fctx = flat.getContext("2d") as CanvasRenderingContext2D;
    fctx.fillStyle = "#ffffff";
    fctx.fillRect(0, 0, flat.width, flat.height);
    fctx.drawImage(canvas, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(flat, 0, 0);
  }

  const blob = await getCanvasBlob(canvas, settings.mime, settings.quality);
  return { blob, width: currentWidth, height: currentHeight, mimeType: settings.mime };
}

export function estimateOutputSizeHint(sourceSize: number, quality: number): number {
  // Very rough heuristic used only for pre-upload estimates.
  const factor = clamp(quality / 100, 0, 1);
  return Math.max(1, Math.round(sourceSize * (0.15 + factor * 0.65)));
}

export type { Rgb };