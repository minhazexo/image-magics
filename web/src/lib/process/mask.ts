"use client";

import { clamp } from "@/lib/utils/format";

/**
 * Decontaminate color fringes around a transparency matte.
 *
 * For each non-fully-opaque pixel we replace its RGB with a blend that is
 * pulled toward the color of nearby *opaque* foreground pixels. Fully opaque
 * pixels are left untouched so the subject's colors are preserved. This
 * implements the spec's "white halo prevention / edge refinement" step for AI
 * masks that already contain a per-pixel alpha but keep the original
 * (background-tinted) RGB.
 */
export function decontaminateMatte(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  iterations = 3,
  radius = 3
): void {
  if (canvas.width < 2 || canvas.height < 2) return;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  const w = data.width;
  const h = data.height;

  for (let iter = 0; iter < iterations; iter++) {
    const snapshot = new Uint8ClampedArray(px);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const a = px[i + 3];
        if (a === 255) continue; // solid foreground untouched

        // collect opaque foreground neighbors within radius
        let cnt = 0;
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
            if (snapshot[j + 3] >= 200) {
              cnt++;
              sr += snapshot[j];
              sg += snapshot[j + 1];
              sb += snapshot[j + 2];
            }
          }
        }
        if (cnt === 0) continue;

        const fr = sr / cnt;
        const fg = sg / cnt;
        const fb = sb / cnt;
        // Pull toward foreground color the more transparent the pixel is.
        const t = a / 255;
        px[i] = clamp(Math.round(fr + (snapshot[i] - fr) * t), 0, 255);
        px[i + 1] = clamp(Math.round(fg + (snapshot[i + 1] - fg) * t), 0, 255);
        px[i + 2] = clamp(Math.round(fb + (snapshot[i + 2] - fg) * t), 0, 255);
        // alpha unchanged
      }
    }
  }

  ctx.putImageData(data, 0, 0);
}
