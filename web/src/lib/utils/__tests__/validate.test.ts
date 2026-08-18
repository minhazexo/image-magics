import { describe, it, expect } from "vitest";
import {
  MAX_FILE_SIZE_BYTES,
  uploadFileSchema,
  validateFileType,
  validateFileSize,
  validateDimensions,
  uiReadableError,
} from "@/lib/utils/validate";
import { z } from "zod";

function fakeFile(name: string, type: string, size: number): File {
  return { name, type, size, lastModified: 0 } as File;
}

describe("validateFileType", () => {
  it("accepts files by extension", () => {
    expect(validateFileType(fakeFile("photo.jpg", "application/octet-stream", 10)).ok).toBe(true);
    expect(validateFileType(fakeFile("photo.JPEG", "", 10)).ok).toBe(true);
  });

  it("accepts files by MIME type", () => {
    expect(validateFileType(fakeFile("noext", "image/png", 10)).ok).toBe(true);
  });

  it("rejects unsupported files", () => {
    const result = validateFileType(fakeFile("notes.pdf", "application/pdf", 10));
    expect(result.ok).toBe(false);
    expect(result.error).toContain("not a supported");
  });
});

describe("validateFileSize", () => {
  it("accepts files within the limit", () => {
    expect(validateFileSize(fakeFile("a.png", "image/png", 1024)).ok).toBe(true);
    expect(validateFileSize(fakeFile("a.png", "image/png", MAX_FILE_SIZE_BYTES)).ok).toBe(true);
  });

  it("rejects oversized files with a size hint", () => {
    const result = validateFileSize(fakeFile("a.png", "image/png", MAX_FILE_SIZE_BYTES + 1));
    expect(result.ok).toBe(false);
    expect(result.error).toContain("too large");
  });
});

describe("validateDimensions", () => {
  it("accepts valid dimensions", () => {
    expect(validateDimensions(800, 600).ok).toBe(true);
  });

  it("rejects non-finite or sub-pixel dimensions", () => {
    expect(validateDimensions(0, 100).ok).toBe(false);
    expect(validateDimensions(Number.NaN, 100).ok).toBe(false);
  });

  it("rejects extremely large images", () => {
    expect(validateDimensions(40000, 40000).ok).toBe(false);
  });
});

describe("uploadFileSchema", () => {
  it("parses valid file metadata", () => {
    const parsed = uploadFileSchema.parse({ name: "a.png", type: "image/png", size: 10, lastModified: 1 });
    expect(parsed.size).toBe(10);
  });

  it("rejects invalid metadata", () => {
    expect(() => uploadFileSchema.parse({ name: "", type: "image/png", size: -1, lastModified: 1 })).toThrow(z.ZodError);
  });
});

describe("uiReadableError", () => {
  it("returns a friendly message for zod errors", () => {
    expect(uiReadableError(new z.ZodError([]))).toContain("not a valid image");
  });

  it("passes through string errors", () => {
    expect(uiReadableError("custom")).toBe("custom");
  });

  it("falls back for unknown errors", () => {
    expect(uiReadableError(new Error("boom"))).toContain("We couldn't process");
  });
});