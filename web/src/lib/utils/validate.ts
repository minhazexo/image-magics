import { z } from "zod";

export const MAX_FILE_SIZE_MB = 100;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_PIXEL_COUNT = 268_000_000; // ~ 16k x 16k

export const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".avif"];
export const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/avif",
];

export const uploadFileSchema = z
  .object({
    name: z.string().min(1),
    type: z.string(),
    size: z.number().int().nonnegative(),
    lastModified: z.number(),
  })
  .passthrough();

export type UploadValidationResult = {
  ok: boolean;
  error?: string;
};

export function validateFileType(file: File): UploadValidationResult {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const hasExtension = ACCEPTED_EXTENSIONS.includes(`.${ext}`);
  const hasMime = ACCEPTED_MIME_TYPES.includes(file.type);

  if (!hasExtension && !hasMime) {
    return {
      ok: false,
      error: `Sorry, "${ext || file.type || "unknown"}" is not a supported image format.`,
    };
  }
  return { ok: true };
}

export function validateFileSize(file: File): UploadValidationResult {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `This image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum supported size is ${MAX_FILE_SIZE_MB} MB.`,
    };
  }
  return { ok: true };
}

export function validateDimensions(width: number, height: number): UploadValidationResult {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    return { ok: false, error: "We couldn't read this image file. Please try another file." };
  }
  if (width * height > MAX_PIXEL_COUNT) {
    return {
      ok: false,
      error: "This image is too large to process safely in your browser. Try a smaller file.",
    };
  }
  return { ok: true };
}

/**
 * Validate an actual image file by attempting to decode it in the browser.
 * Returns image dimensions on success, or a helpful error message.
 */
export async function decodeAndValidateImage(
  file: File
): Promise<{ width: number; height: number } | { error: string }> {
  const typeCheck = validateFileType(file);
  if (!typeCheck.ok) return { error: typeCheck.error! };

  const sizeCheck = validateFileSize(file);
  if (!sizeCheck.ok) return { error: sizeCheck.error! };

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    let settled = false;
    const img = new Image();

    const cleanup = () => {
      window.clearTimeout(timeout);
      URL.revokeObjectURL(url);
    };

    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ error: "Sorry, this image format is not supported by your browser." });
    }, 15000);

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const dimCheck = validateDimensions(width, height);
      if (settled) return;
      settled = true;
      cleanup();
      if (!dimCheck.ok) resolve({ error: dimCheck.error! });
      else resolve({ width, height });
    };

    img.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ error: "Sorry, this image format is not supported by your browser." });
    };

    img.src = url;
  });
}

export function isAnimatedGif(file: File): boolean {
  return file.type === "image/gif";
}

export function uiReadableError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return "This file is not a valid image.";
  }
  if (typeof error === "string") return error;
  return "We couldn't process this image. Please try another file.";
}