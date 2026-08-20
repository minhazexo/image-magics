# ImageTools — Image Processing Pipeline

ImageTools uses a **fully client-side architecture**: all processing — including AI-powered background removal — runs entirely in the browser. No images are ever uploaded to a server.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                 │
│                                                                 │
│  Tool UI → processImage() → Web Worker → engine.ts → Canvas     │
│                                                                 │
│  AI path (Transparent Image, Auto mode):                        │
│  Transparent Image → ai.ts → @imgly/background-removal (WASM)  │
│  Model loaded from CDN, cached by browser after first use       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

All 17 tools run locally. No server, no uploads, no accounts.

## The AI Pipeline: Transparent Image (Client-Side)

```
User Upload
    ↓
File Validation (25 MB, 20 MP)
    ↓
Transparent Image UI (/transparent-image)
    ↓
@imgly/background-removal (WASM, runs in browser)
    ↓
ONNX Runtime Web (WASM) + isnet_fp16 model
    ↓
Alpha Mask (smooth 256-value gradients)
    ↓
Client-side Edge Refinement (decontaminateMatte + softenAlpha)
    ↓
Preview + Download (PNG with real alpha channel)
```

---

## 1. Validation (`src/lib/utils/validate.ts`)

Before decoding, each file is checked:

- **Type**: extension or MIME must be in the accepted set (JPG, PNG, WebP, GIF, BMP, AVIF).
- **Size**: ≤ 25 MB (`MAX_IMAGE_BYTES`).
- **Dimensions**: after decoding, width × height must be finite, ≥ 1 px, and ≤ 20 MP (`MAX_IMAGE_PIXELS`).

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
| `removeBackground` | AI-based segmentation via WASM (client-side) |
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

## 6. Transparent Image — Client-Side AI Pipeline

The `/transparent-image` page in Auto mode uses `@imgly/background-removal` — a WASM library that runs ONNX inference entirely in the browser.

```
Browser (all processing)
─────────────────────────
ai.ts                    →  lazy-import @imgly/background-removal
  │
  ▼
removeBackground(file, { progress })
  │
  ├── 1. Fetch ONNX model from CDN (cached after first use)
  │      → isnet_fp16 (~84 MB, served via staticimgly.com CDN)
  │      → ONNX Runtime WASM (~12 MB)
  │
  ├── 2. Run segmentation inference (WASM, ~2-5s)
  │      → Produces smooth 256-value alpha mask
  │
  └── 3. Return RGBA Blob
           │
           ▼
     Client-side polish:
       4. decontaminateMatte() (mask.ts) — edge RGB cleanup
       5. softenAlpha() (engine.ts) — 0.8px alpha smoothing
           │
           ▼
     Preview + Download (PNG with real alpha channel)
```

### How model loading works

1. **Preload**: when the transparent-image page loads, `preloadAiModel()` starts downloading the model in the background via CDN.
2. **Lazy load**: the WASM library is only imported when the user clicks "Remove Background" — not on initial page load.
3. **Caching**: the browser caches the model files. After the first use, subsequent visits have zero download.

### Pipeline steps

| Step | Module | What it does |
|------|--------|-------------|
| 1. AI segmentation | `@imgly/background-removal` (WASM) | ONNX model produces smooth 256-value alpha mask |
| 2. decontaminateMatte | `mask.ts` | Gaussian-weighted RGB cleanup at semi-transparent edges |
| 3. softenAlpha | `engine.ts` | Very light alpha smoothing (0.8px) for natural transitions |

### Modes

| Mode | What happens |
|------|-------------|
| Auto | Full client-side AI pipeline (WASM segmentation → edge refinement) |
| Color | Client-side CIELAB color removal (no AI needed) |
| Manual | Client-side mask editor (no AI needed) |

## 7. Client-Side Edge Refinement (`src/lib/process/mask.ts`)

The mask module provides professional-grade edge processing:

| Function | Purpose |
|----------|---------|
| `decontaminateMatte` | Replaces background-tinted RGB at semi-transparent edges with Gaussian-weighted foreground colors |
| `smoothAlpha` | Gaussian blur on alpha channel only — removes jagged pixel edges |
| `cleanupAlphaNoise` | Majority-vote filter removes isolated transparent/opaque specks |
| `featherAlphaEdges` | Edge-aware feathering — only softens transition boundaries, preserves hard edges |
| `refineEdges` | Full pipeline: cleanup → feather → smooth |

## 8. Color Removal

### Client-side (`engine.ts` — `removeColorFromCanvas`)

Uses GIMP-style color-to-alpha transform with tolerance and edge smoothing. Good for solid-color backgrounds.

## 9. Manual Mode

### Client-side mask editor (`components/processing/mask-editor.tsx`)

Interactive canvas-based editor with erase/restore brushes. Modifies the alpha channel directly and commits back as a new RGBA PNG.

## 10. Result & memory hygiene

The client wraps the output into a `ProcessingResult`:

- `blob` + `url` (object URL) for download/preview,
- `originalSize`, `savedBytes`, `savedPercent` for the comparison UI,
- `durationMs` for transparency about performance.

Object URLs are revoked when an image is replaced or the page unloads, so browser memory is released automatically.

## 11. Batch & ZIP (`src/lib/process/zip.ts`)

The batch tool processes items sequentially against the same worker, tracks per-item progress, and offers a **Download all as ZIP** button that packs results with JSZip using `STORE` (no compression — the images are already compressed).

## 12. File Reference

| File | Purpose |
|------|---------|
| `src/lib/process/engine.ts` | Core processing engine (canvas operations) |
| `src/lib/process/client.ts` | Worker management + job API |
| `src/lib/process/ai.ts` | Client-side AI background removal (WASM) |
| `src/lib/process/mask.ts` | Edge refinement (decontaminate, feather, smooth) |
| `src/lib/workers/imageWorker.ts` | Web Worker for background processing |
| `src/lib/types.ts` | TypeScript types for all operations |
| `src/components/tools/transparent-image.tsx` | Transparent Image Maker tool |
