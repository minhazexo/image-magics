import { describe, it, expect } from "vitest";
import {
  extForFormat,
  stripExtension,
  sanitizeBaseName,
  generateFileName,
  inferFormatFromName,
  mimeForFormat,
} from "@/lib/utils/filename";

describe("extForFormat", () => {
  it("maps output formats to file extensions", () => {
    expect(extForFormat("jpeg")).toBe("jpg");
    expect(extForFormat("png")).toBe("png");
    expect(extForFormat("webp")).toBe("webp");
    expect(extForFormat("bmp")).toBe("bmp");
  });
});

describe("stripExtension", () => {
  it("strips a single trailing extension", () => {
    expect(stripExtension("photo.jpg")).toBe("photo");
    expect(stripExtension("a.b.c.png")).toBe("a.b.c");
  });

  it("handles names without an extension", () => {
    expect(stripExtension("photo")).toBe("photo");
  });

  it("does not strip leading-dot hidden files", () => {
    expect(stripExtension(".gitignore")).toBe(".gitignore");
  });
});

describe("sanitizeBaseName", () => {
  it("sanitizes unsafe characters", () => {
    expect(sanitizeBaseName("my photo!!.jpg")).toBe("my-photo");
  });

  it("collapses repeated dashes", () => {
    expect(sanitizeBaseName("a  b---c.png")).toBe("a-b-c");
  });

  it("trims leading and trailing dashes/dots", () => {
    expect(sanitizeBaseName("--photo--.jpg")).toBe("photo");
  });

  it("falls back to 'image' when empty", () => {
    expect(sanitizeBaseName("!!!.png")).toBe("image");
  });
});

describe("generateFileName", () => {
  it("appends suffix, dimensions and id in order", () => {
    const name = generateFileName("my photo.jpg", {
      suffix: "optimized",
      dimensions: { width: 800, height: 600 },
      id: "abc",
      extension: "webp",
    });
    expect(name).toBe("my-photo-optimized-800x600-abc.webp");
  });

  it("defaults to png extension", () => {
    expect(generateFileName("photo.png")).toBe("photo.png");
  });

  it("defaults extension when none provided", () => {
    expect(generateFileName("x.png", { suffix: "cropped" })).toBe("x-cropped.png");
  });
});

describe("inferFormatFromName", () => {
  it("infers common formats from extensions", () => {
    expect(inferFormatFromName("a.jpg")).toBe("jpeg");
    expect(inferFormatFromName("a.jpeg")).toBe("jpeg");
    expect(inferFormatFromName("a.PNG")).toBe("png");
    expect(inferFormatFromName("a.webp")).toBe("webp");
    expect(inferFormatFromName("a.gif")).toBe("gif");
    expect(inferFormatFromName("a.tiff")).toBe("tiff");
  });

  it("returns unknown for other extensions", () => {
    expect(inferFormatFromName("a.svg")).toBe("unknown");
    expect(inferFormatFromName("noext")).toBe("unknown");
  });
});

describe("mimeForFormat", () => {
  it("maps formats to MIME types", () => {
    expect(mimeForFormat("jpeg")).toBe("image/jpeg");
    expect(mimeForFormat("png")).toBe("image/png");
    expect(mimeForFormat("webp")).toBe("image/webp");
    expect(mimeForFormat("gif")).toBe("image/gif");
    expect(mimeForFormat("bmp")).toBe("image/bmp");
    expect(mimeForFormat("tiff")).toBe("image/tiff");
  });

  it("falls back for unknown formats", () => {
    expect(mimeForFormat("auto")).toBe("application/octet-stream");
  });
});