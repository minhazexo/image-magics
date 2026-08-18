import { describe, it, expect } from "vitest";
import { removeColorFromCanvas, removeBackgroundFromCanvas } from "@/lib/process/engine";

function makeCanvas(w: number, h: number, init: number[]): { data: Uint8ClampedArray; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const data = new Uint8ClampedArray(init);
  const stub = {
    width: w,
    height: h,
    getImageData: () => ({ data, width: w, height: h }),
    putImageData: (img: { data: Uint8ClampedArray }) => {
      for (let i = 0; i < img.data.length; i++) data[i] = img.data[i];
    },
  };
  return { data, canvas: stub as unknown as HTMLCanvasElement, ctx: stub as unknown as CanvasRenderingContext2D };
}

function solid(w: number, h: number, r: number, g: number, b: number, a = 255): number[] {
  const px: number[] = [];
  for (let i = 0; i < w * h; i++) px.push(r, g, b, a);
  return px;
}

describe("removeColorFromCanvas", () => {
  it("tolerance 0 removes only exact color matches", () => {
    const { data, canvas, ctx } = makeCanvas(4, 1, [
      255, 255, 255, 255, // exact white -> removed
      254, 255, 255, 255, // near white -> kept
      255, 0, 0, 255, // red -> kept
      255, 255, 255, 255, // exact white -> removed
    ]);
    removeColorFromCanvas(canvas, ctx, { color: { r: 255, g: 255, b: 255 }, tolerance: 0, edgeSmoothing: 0 });
    const alphas = Array.from({ length: 4 }, (_, i) => data[i * 4 + 3]);
    expect(alphas).toEqual([0, 255, 255, 0]);
  });

  it("tolerance 100 removes the target color everywhere", () => {
    const { data, canvas, ctx } = makeCanvas(2, 1, [255, 0, 0, 255, 0, 0, 255, 255]);
    removeColorFromCanvas(canvas, ctx, { color: { r: 255, g: 0, b: 0 }, tolerance: 100, edgeSmoothing: 0 });
    expect(data[3]).toBe(0); // exact target removed
    expect(data[7]).toBe(255); // unrelated blue kept
  });

  it("preserves anti-aliased edges via color-to-alpha", () => {
    // 50% white / 50% red blend at the boundary of a white background
    const { data, canvas, ctx } = makeCanvas(1, 1, [255, 128, 128, 255]);
    removeColorFromCanvas(canvas, ctx, { color: { r: 255, g: 255, b: 255 }, tolerance: 50, edgeSmoothing: 0 });
    const alpha = data[3];
    const g = data[1];
    expect(alpha).toBeGreaterThan(0); // semi-transparent, not fully removed
    expect(alpha).toBeLessThan(255); // not fully opaque either
    expect(g).toBeLessThan(128); // color shifted away from the white background
  });
});

import { decontaminateMatte } from "@/lib/process/mask";

describe("decontaminateMatte", () => {
  it("pulls background-tinted semi-transparent fringe toward the foreground color", () => {
    const w = 7;
    const h = 7;
    const px: number[] = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const inCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        const isFringe = Math.abs(x - 3) <= 2 && Math.abs(y - 3) <= 2 && !inCenter;
        if (inCenter) {
          px.push(255, 0, 0, 255); // solid subject (red)
        } else if (isFringe) {
          px.push(255, 255, 255, 90); // background-tinted fringe (white, semi)
        } else {
          px.push(255, 255, 255, 0); // transparent background
        }
      }
    }
    const { data, canvas, ctx } = makeCanvas(w, h, px);

    decontaminateMatte(canvas, ctx, 3, 3);

    const at = (x: number, y: number) => {
      const i = (y * w + x) * 4;
      return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
    };
    // center subject untouched
    expect(at(3, 3)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
    // fringe (e.g. (1,2)) pulled toward red: still semi-transparent (alpha 90),
    // but green/blue reduced and red high
    const fringe = at(1, 2);
    expect(fringe.a).toBe(90);
    expect(fringe.g).toBeLessThan(200);
    expect(fringe.r).toBeGreaterThan(180);
  });
});

describe("removeBackgroundFromCanvas", () => {
  it("keeps the subject fully opaque while removing a white background", () => {
    const w = 100;
    const h = 100;
    const init = solid(w, h, 255, 255, 255);
    // red 40x40 square in the center: x 30..69, y 30..69
    const red = [255, 0, 0];
    for (let y = 30; y < 70; y++) {
      for (let x = 30; x < 70; x++) {
        const i = (y * w + x) * 4;
        init[i] = red[0];
        init[i + 1] = red[1];
        init[i + 2] = red[2];
      }
    }
    const { data, canvas, ctx } = makeCanvas(w, h, init);
    removeBackgroundFromCanvas(canvas, ctx, { tolerance: 60 });
    const alphaAt = (x: number, y: number) => data[(y * w + x) * 4 + 3];
    expect(alphaAt(2, 2)).toBe(0); // background corner removed
    expect(alphaAt(50, 50)).toBe(255); // subject center fully opaque
    expect(alphaAt(40, 50)).toBe(255); // subject interior not faded
  });

  it("flood fill preserves background-colored holes inside the subject", () => {
    const w = 100;
    const h = 100;
    const init = solid(w, h, 255, 255, 255);
    // red ring: everything except a white 20x20 hole in the center
    const red = [255, 0, 0];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const inHole = x >= 40 && x < 60 && y >= 40 && y < 60;
        if (inHole) continue;
        const i = (y * w + x) * 4;
        init[i] = red[0];
        init[i + 1] = red[1];
        init[i + 2] = red[2];
      }
    }
    const { data, canvas, ctx } = makeCanvas(w, h, init);
    removeBackgroundFromCanvas(canvas, ctx, { tolerance: 60 });
    const alphaAt = (x: number, y: number) => data[(y * w + x) * 4 + 3];
    expect(alphaAt(2, 2)).toBe(0); // red border background removed
    expect(alphaAt(50, 50)).toBe(255); // white hole inside subject preserved
  });
});
