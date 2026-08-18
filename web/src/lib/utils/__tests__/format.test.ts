import { describe, it, expect } from "vitest";
import { formatBytes, calculateSavings, formatSavings, estimateQualityLabel, clamp } from "@/lib/utils/format";

describe("formatBytes", () => {
  it("returns '0 B' for zero, negative, and non-finite values", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(-5)).toBe("0 B");
    expect(formatBytes(Number.NaN)).toBe("0 B");
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe("0 B");
  });

  it("formats whole bytes without decimals", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats KB, MB, GB with one decimal", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1.0 GB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });
});

describe("calculateSavings", () => {
  it("computes percentage savings", () => {
    expect(calculateSavings(100, 50)).toBe(50);
    expect(calculateSavings(100, 100)).toBe(0);
    expect(calculateSavings(100, 150)).toBe(0);
  });

  it("returns 0 when original size is invalid", () => {
    expect(calculateSavings(0, 50)).toBe(0);
    expect(calculateSavings(-10, 50)).toBe(0);
  });

  it("never exceeds 100%", () => {
    expect(calculateSavings(100, 0)).toBe(100);
  });
});

describe("formatSavings", () => {
  it("renders one decimal and a percent sign", () => {
    expect(formatSavings(200, 150)).toBe("25.0%");
  });
});

describe("estimateQualityLabel", () => {
  it("maps quality ranges to labels", () => {
    expect(estimateQualityLabel(100)).toBe("Lossless-ish");
    expect(estimateQualityLabel(95)).toBe("Lossless-ish");
    expect(estimateQualityLabel(85)).toBe("High quality");
    expect(estimateQualityLabel(72)).toBe("Balanced");
    expect(estimateQualityLabel(55)).toBe("Good");
    expect(estimateQualityLabel(30)).toBe("Maximum compression");
  });
});

describe("clamp", () => {
  it("clamps values within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});