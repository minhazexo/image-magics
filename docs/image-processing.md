# ImageTools — Image Processing Pipeline

All processing happens in the browser. This document describes how images flow from the uploader to a downloadable result.

## 1. Validation (`src/lib/utils/validate.ts`)

Before decoding, each file is checked:

- **Type**: extension or MIME must be in the accepted set (JPG, PNG, WebP, GIF, BMP, AVIF).
- **Size**: ≤ 100 MB (`MAX_FILE_SIZE_MB`).
- **Dimensions**: after decoding, width × height must be finite, ≥ 1 px, and ≤ ~268 MP (`MAX_PIXEL_COUNT`) to stay within a safe browser memory budget.

## 2. Decode

The uploader reads the file and creates an object URL for preview. Processing decodes with `createImageBitmap` (preferred) or `HTMLImageElement` fallback, then measures dimensions for validation and for the "before" side of the comparison.

## 3. Operation list

Every job is a list of `ProcessingOperation`s (see `src/lib/types.ts`):

| Operation | Purpose |
| --- | --- |
| `optimize` | Resize + convert + compression preset in one pass |
| `resize` | Pixel/percent sizing with `fill` / `contain` / `cover` fits |
| `crop` | Explicit rectangle crop |
| `rotate` / `flip` | 90° steps, horizontal/vertical mirrors |
| `watermark` | Text or image watermark with position, padding, scale, opacity |
| `applyFilters` | Brightness, contrast, saturation, blur, sharpen, grayscale, exposure, opacity |
| `removeColor` | Make a chosen color transparent (tolerance + edge smoothing) |
| `removeBackground` | Uniform-color background removal with border matting, optional replacement (transparent / white / black / color / gradient / image) |
| `convert` | Format + quality conversion |
| `removeMetadata` | Strips EXIF/metadata (re-encode without embedded data) |

## 4. Engine (`src/lib/process/engine.ts`)

The engine is worker-compatible: it uses `OffscreenCanvas` when available and `HTMLCanvasElement` otherwise, sharing `createCanvas`, `getCanvasBlob`, and `drawScaledBitmap` helpers.

Key behaviors:

- **Canvas context**: non-premultiplied `2d` context with `imageSmoothingQuality: "high"` where supported.
- **JPEG alpha**: when converting to a lossy format without transparency, the image is first flattened onto a chosen background (default white).
- **Lossless PNG/WebP**: `quality: 100` is mapped to lossless compression for `image/png` and `image/webp`.
- **AVIF**: canvas `image/avif` support is probed per-browser and reported by `canvasSupports`.
- **Output size hint**: `estimateOutputSizeHint` gives a rough final-size estimate from format/quality/source so the UI can show live savings before processing.

## 5. Worker vs. main thread (`src/lib/process/client.ts`)

- If `OffscreenCanvas` is supported, each job is sent to `src/lib/workers/imageWorker.ts`, which returns `{ blob, width, height, mimeType, durationMs }` without blocking the UI thread.
- Otherwise the same pipeline runs on the main thread via `processBitmap`.
- The client manages worker lifecycle (one worker, reused across jobs) and falls back on failure.

## 6. Result & memory hygiene

The client wraps the output into a `ProcessingResult`:

- `blob` + `url` (object URL) for download/preview,
- `originalSize`, `savedBytes`, `savedPercent` for the comparison UI,
- `durationMs` for transparency about performance.

Object URLs are revoked when an image is replaced or the page unloads, so browser memory is released automatically.

## 7. Batch & ZIP (`src/lib/process/zip.ts`)

The batch tool processes items sequentially against the same worker, tracks per-item progress, and offers a **Download all as ZIP** button that packs results with JSZip using `STORE` (no compression — the images are already compressed).
