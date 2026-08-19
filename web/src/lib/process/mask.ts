"use client";

import { clamp } from "@/lib/utils/format";

/* ------------------------------------------------------------------ */
/*  Gaussian kernel helper                                             */
/* ------------------------------------------------------------------ */

function gaussianWeight(dx: number, dy: number, sigma: number): number {
  const d2 = dx * dx + dy * dy;
  return Math.exp(-d2 / (2 * sigma * sigma));
}

/* ------------------------------------------------------------------ */
/*  Decontaminate color fringes around a transparency matte.           */
/*                                                                    */
/*  For each semi-transparent pixel we replace its RGB with a         */
/*  Gaussian-weighted blend of nearby opaque foreground pixels.        */
/*  Fully opaque pixels are left untouched so the subject's colors    */
/*  are preserved.  The more transparent a pixel is, the more we      */
/*  pull its color toward the foreground — this eliminates background  */
/*  color bleed on hair, fur, glass and other soft edges.             */
/* ------------------------------------------------------------------ */

export function decontaminateMatte(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  iterations = 4,
  radius = 5
): void {
  if (canvas.width < 2 || canvas.height < 2) return;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  const w = data.width;
  const h = data.height;
  const sigma = radius / 2.5; // Gaussian spread

  for (let iter = 0; iter < iterations; iter++) {
    const snapshot = new Uint8ClampedArray(px);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const a = px[i + 3];
        if (a >= 254) continue; // solid foreground untouched

        // Collect opaque foreground neighbors with Gaussian weighting
        let totalWeight = 0;
        let sr = 0;
        let sg = 0;
        let sb = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;
            const j = (ny * w + nx) * 4;
            // Weight: Gaussian distance * foreground confidence
            if (snapshot[j + 3] >= 140) {
              const gw = gaussianWeight(dx, dy, sigma);
              const fgConfidence = snapshot[j + 3] / 255;
              const w = gw * fgConfidence;
              totalWeight += w;
              sr += snapshot[j] * w;
              sg += snapshot[j + 1] * w;
              sb += snapshot[j + 2] * w;
            }
          }
        }
        if (totalWeight < 0.01) continue;

        const fr = sr / totalWeight;
        const fg = sg / totalWeight;
        const fb = sb / totalWeight;

        // Pull toward foreground color proportionally to transparency.
        // Fully transparent (a=0) → fully replaced; semi-transparent → partial blend.
        const t = a / 255;
        const blendStrength = 1 - t * t; // quadratic: more aggressive for low alpha
        px[i] = clamp(Math.round(snapshot[i] + (fr - snapshot[i]) * blendStrength), 0, 255);
        px[i + 1] = clamp(Math.round(snapshot[i + 1] + (fg - snapshot[i + 1]) * blendStrength), 0, 255);
        px[i + 2] = clamp(Math.round(snapshot[i + 2] + (fb - snapshot[i + 2]) * blendStrength), 0, 255);
        // alpha unchanged
      }
    }
  }

  ctx.putImageData(data, 0, 0);
}

/* ------------------------------------------------------------------ */
/*  Smooth the alpha channel with a Gaussian-like blur.                */
/*  This removes jagged pixel edges and produces the soft, natural     */
/*  transitions expected from professional tools.                     */
/* ------------------------------------------------------------------ */

export function smoothAlpha(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  radius: number = 1.5
): void {
  if (radius <= 0 || canvas.width < 3 || canvas.height < 3) return;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  const w = canvas.width;
  const h = canvas.height;
  const r = Math.max(1, Math.round(radius));
  const sigma = radius / 2;

  const alphaOut = new Float32Array(w * h);

  // Gaussian blur on alpha only
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let weightSum = 0;
      for (let dy = -r; dy <= r; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          const gw = gaussianWeight(dx, dy, Math.max(sigma, 0.5));
          sum += px[(ny * w + nx) * 4 + 3] * gw;
          weightSum += gw;
        }
      }
      alphaOut[y * w + x] = sum / weightSum;
    }
  }

  // Write back smoothed alpha
  for (let i = 0; i < alphaOut.length; i++) {
    px[i * 4 + 3] = clamp(Math.round(alphaOut[i]), 0, 255);
  }
  ctx.putImageData(data, 0, 0);
}

/* ------------------------------------------------------------------ */
/*  Clean up noise in the alpha matte.                                 */
/*                                                                    */
/*  Removes isolated transparent specks inside the subject and        */
/*  isolated opaque specks in the background by checking the          */
/*  majority vote in a small neighborhood.                            */
/* ------------------------------------------------------------------ */

export function cleanupAlphaNoise(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  radius: number = 2,
  threshold: number = 0.6
): void {
  if (canvas.width < 3 || canvas.height < 3) return;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  const w = canvas.width;
  const h = canvas.height;
  const r = radius;

  const newAlpha = new Uint8ClampedArray(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const currentA = px[i + 3];

      // Count neighbors that are "similar" (both foreground or both background)
      let fgCount = 0;
      let bgCount = 0;
      let total = 0;
      for (let dy = -r; dy <= r; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          const neighborA = px[(ny * w + nx) * 4 + 3];
          total++;
          if (neighborA > 128) fgCount++;
          else bgCount++;
        }
      }

      if (total === 0) {
        newAlpha[y * w + x] = currentA;
        continue;
      }

      const fgRatio = fgCount / total;
      const bgRatio = bgCount / total;

      // If this pixel is an outlier (e.g., transparent speck inside subject)
      if (currentA > 128 && bgRatio > threshold) {
        // Opaque pixel surrounded by background — likely noise
        newAlpha[y * w + x] = Math.round(currentA * (1 - bgRatio));
      } else if (currentA <= 128 && fgRatio > threshold) {
        // Transparent pixel surrounded by foreground — likely noise
        newAlpha[y * w + x] = Math.round(255 * fgRatio);
      } else {
        newAlpha[y * w + x] = currentA;
      }
    }
  }

  for (let i = 0; i < newAlpha.length; i++) {
    px[i * 4 + 3] = newAlpha[i];
  }
  ctx.putImageData(data, 0, 0);
}

/* ------------------------------------------------------------------ */
/*  Professional edge feathering.                                      */
/*                                                                    */
/*  Unlike a simple box blur, this applies feathering only along      */
/*  the alpha transition boundary — preserving hard edges where the   */
/*  subject is solid and only softening the transition zone.          */
/* ------------------------------------------------------------------ */

export function featherAlphaEdges(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  featherRadius: number = 1.5
): void {
  if (featherRadius <= 0 || canvas.width < 3 || canvas.height < 3) return;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  const w = canvas.width;
  const h = canvas.height;

  // First pass: identify edge pixels (where alpha transitions)
  const isEdge = new Uint8Array(w * h);
  const r = Math.max(1, Math.ceil(featherRadius));

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = px[(y * w + x) * 4 + 3];
      // Check if any neighbor has significantly different alpha
      let maxDiff = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          const neighborA = px[(ny * w + nx) * 4 + 3];
          maxDiff = Math.max(maxDiff, Math.abs(a - neighborA));
        }
      }
      if (maxDiff > 12) isEdge[y * w + x] = 1;
    }
  }

  // Second pass: apply Gaussian feather only to edge pixels
  const sigma = featherRadius / 2;
  const alphaOut = new Float32Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (!isEdge[idx]) {
        alphaOut[idx] = px[idx * 4 + 3];
        continue;
      }

      let sum = 0;
      let weightSum = 0;
      for (let dy = -r; dy <= r; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          const nIdx = ny * w + nx;
          const gw = gaussianWeight(dx, dy, Math.max(sigma, 0.5));
          // Weight more heavily if neighbor is also an edge pixel
          const edgeBoost = isEdge[nIdx] ? 1.5 : 1.0;
          sum += px[nIdx * 4 + 3] * gw * edgeBoost;
          weightSum += gw * edgeBoost;
        }
      }
      alphaOut[idx] = sum / weightSum;
    }
  }

  for (let i = 0; i < alphaOut.length; i++) {
    px[i * 4 + 3] = clamp(Math.round(alphaOut[i]), 0, 255);
  }
  ctx.putImageData(data, 0, 0);
}

/* ------------------------------------------------------------------ */
/*  Full professional edge refinement pipeline.                        */
/*  Call this after decontaminateMatte for best results.               */
/* ------------------------------------------------------------------ */

export function refineEdges(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  options: {
    smoothRadius?: number;
    featherRadius?: number;
    cleanupRadius?: number;
    cleanupThreshold?: number;
  } = {}
): void {
  const {
    smoothRadius = 1.0,
    featherRadius = 1.5,
    cleanupRadius = 2,
    cleanupThreshold = 0.6,
  } = options;

  // 1. Clean up noise specks in the alpha matte
  cleanupAlphaNoise(canvas, ctx, cleanupRadius, cleanupThreshold);

  // 2. Feather only the transition edges
  featherAlphaEdges(canvas, ctx, featherRadius);

  // 3. Light overall smooth for natural look
  smoothAlpha(canvas, ctx, smoothRadius);
}
