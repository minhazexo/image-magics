import { describe, it, expect } from "vitest";
import {
  computeResizeDimensions,
  getAspectRatio,
  preserveAspect,
  clampDimension,
  isSafeToProcess,
} from "@/lib/utils/dimensions";

describe("computeResizeDimensions", () => {
  it("returns original dimensions for invalid input", () => {
    expect(computeResizeDimensions({ width: 0, height: 100 }, {})).toEqual({ width: 0, height: 100 });
  });

  it("returns original when no target is given", () => {
    expect(computeResizeDimensions({ width: 400, height: 300 }, {})).toEqual({ width: 400, height: 300 });
  });

  it("applies percent mode", () => {
    const result = computeResizeDimensions({ width: 400, height: 300 }, { mode: "percent", percent: 50 });
    expect(result).toEqual({ width: 200, height: 150 });
  });

  it("never returns sub-pixel dimensions in percent mode", () => {
    const result = computeResizeDimensions({ width: 1, height: 1 }, { mode: "percent", percent: 10 });
    expect(result.width).toBeGreaterThanOrEqual(1);
    expect(result.height).toBeGreaterThanOrEqual(1);
  });

  it("resizes by width alone and keeps aspect ratio when locked", () => {
    const result = computeResizeDimensions({ width: 400, height: 200 }, { width: 100, lockAspectRatio: true });
    expect(result).toEqual({ width: 100, height: 50 });
  });

  it("resizes by width alone and keeps original height when not locked", () => {
    const result = computeResizeDimensions({ width: 400, height: 200 }, { width: 100 });
    expect(result).toEqual({ width: 100, height: 200 });
  });

  it("resizes by height alone and keeps aspect ratio when locked", () => {
    const result = computeResizeDimensions({ width: 400, height: 200 }, { height: 100, lockAspectRatio: true });
    expect(result).toEqual({ width: 200, height: 100 });
  });

  it("fills both dimensions exactly", () => {
    const result = computeResizeDimensions({ width: 400, height: 200 }, { width: 100, height: 80, fit: "fill" });
    expect(result).toEqual({ width: 100, height: 80 });
  });

  it("contains within both dimensions preserving aspect ratio", () => {
    const result = computeResizeDimensions({ width: 400, height: 200 }, { width: 100, height: 100, fit: "contain" });
    expect(result).toEqual({ width: 100, height: 50 });
  });

  it("covers both dimensions preserving aspect ratio", () => {
    const result = computeResizeDimensions({ width: 400, height: 200 }, { width: 100, height: 100, fit: "cover" });
    expect(result).toEqual({ width: 200, height: 100 });
  });
});

describe("getAspectRatio", () => {
  it("computes width/height ratio", () => {
    expect(getAspectRatio({ width: 200, height: 100 })).toBe(2);
    expect(getAspectRatio({ width: 300, height: 300 })).toBe(1);
  });

  it("guards against division by zero", () => {
    expect(getAspectRatio({ width: 200, height: 0 })).toBe(1);
  });
});

describe("preserveAspect", () => {
  it("derives height from a width change", () => {
    const result = preserveAspect({ width: 200, height: 100 }, { width: 400 }, "width");
    expect(result).toEqual({ width: 400, height: 200 });
  });

  it("derives width from a height change", () => {
    const result = preserveAspect({ width: 200, height: 100 }, { height: 50 }, "height");
    expect(result).toEqual({ width: 100, height: 50 });
  });

  it("returns input unchanged when no dimension supplied", () => {
    expect(preserveAspect({ width: 200, height: 100 }, {}, "width")).toEqual({});
  });
});

describe("clampDimension", () => {
  it("rounds and clamps to [1, 20000]", () => {
    expect(clampDimension(10.6)).toBe(11);
    expect(clampDimension(0)).toBe(1);
    expect(clampDimension(-40)).toBe(1);
    expect(clampDimension(99999)).toBe(20000);
    expect(clampDimension(123)).toBe(123);
  });
});

describe("isSafeToProcess", () => {
  it("accepts images within the pixel budget", () => {
    expect(isSafeToProcess(1920, 1080)).toBe(true);
  });

  it("rejects images over the pixel budget", () => {
    expect(isSafeToProcess(30000, 30000)).toBe(false);
  });
});