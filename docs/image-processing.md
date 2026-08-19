# ImageTools — Image Processing Pipeline

ImageTools uses a **hybrid architecture**: most processing runs in the browser via Web Workers, while AI-powered background removal uses a local Python backend service. This document describes how images flow from upload to download.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                 │
│                                                                 │
│  Tool UI → processImage() → Web Worker → engine.ts → Canvas     │
│                                                                 │
│  Special path (Auto mode):                                      │
│  Transparent Image → ai.ts → /api/transparent-image             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NEXT.JS API PROXY                             │
│  /api/transparent-image → http://127.0.0.1:8765                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                 PYTHON BACKEND SERVICE                          │
│  FastAPI + rembg + NumPy/SciPy on port 8765                    │
│  Pipeline: rembg → refine_mask_edges → decontaminate_matte      │
└─────────────────────────────────────────────────────────────────┘
```

## The Single AI Pipeline: Transparent Image

```
User Upload
    ↓
File Validation (25 MB, 20 MP)
    ↓
Transparent Image UI (/transparent-image)
    ↓
POST /api/transparent-image
    ↓
Next.js API Proxy (route.ts)
    ↓
Python FastAPI Service (port 8765)
    ↓
rembg / U2Net AI Segmentation
    ↓
Alpha Mask (256 unique values)
    ↓
Edge Refinement (refine_mask_edges)
    ↓
Matte / Color Decontamination (decontaminate_matte)
    ↓
RGBA PNG Response
    ↓
Client-side Final Polish (decontaminateMatte + softenAlpha)
    ↓
Preview + Download
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
| `removeBackground` | Color-based flood fill with border matting (client-side) |
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

## 6. Transparent Image — Server-Side AI Pipeline

The `/transparent-image` page in Auto mode uses the Python backend:

```
Browser                    Next.js Proxy              Python Backend
───────                    ─────────────              ──────────────
ai.ts                      route.ts                   app/api/routes.py
  │                          │                           │
  ▼                          ▼                           ▼
POST /api/transparent-image  →  fetch(SERVICE_URL)  →   remove_background()
  │                                                       │
  │  FormData: image, mode, alphaMatting,                 │  Pipeline:
  │            edgeRefinement, trimTransparent             │  1. rembg (u2net AI segmentation)
  │                                                       │  2. refine_mask_edges (color-aware)
  │◀── response: PNG + X-Pipeline header ─────────────────│  3. decontaminate_matte (RGB cleanup)
  │
  ▼
Client-side polish:
  4. decontaminateMatte() (client)
  5. softenAlpha() (client)
```

### Pipeline steps (server-side)

| Step | Module | What it does |
|------|--------|-------------|
| 1. rembg segmentation | `background_removal.py` | AI model (u2net) produces smooth 256-value alpha mask |
| 2. refine_mask_edges | `alpha_matting.py` | Color-aware edge refinement — preserves hair gradients |
| 3. decontaminate_matte | `edge_refinement.py` | Replaces background-tinted RGB at edges with foreground colors |

### Pipeline steps (client-side)

| Step | Module | What it does |
|------|--------|-------------|
| 4. decontaminateMatte | `mask.ts` | Second-pass Gaussian-weighted RGB cleanup at edges |
| 5. softenAlpha | `engine.ts` | Very light alpha smoothing (0.8px) for natural transitions |

### Modes

| Mode | What happens |
|------|-------------|
| Auto | Full server-side AI pipeline (rembg → refine → decontaminate) |
| Color | Client-side CIELAB color removal (no backend needed) |
| Manual | Client-side mask editor (no backend needed) |

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

### Server-side (`color_removal.py`)

Uses CIELAB (CIE76) perceptual color distance for better edge quality. NumPy-vectorized for performance. Produces smooth alpha transitions near the tolerance boundary.

## 9. Manual Mode

### Server-side (`manual_mode.py`)

Accepts a client-uploaded mask image (grayscale or RGBA). The mask is resized to match source dimensions and applied as the alpha channel. White (255) = opaque foreground, Black (0) = transparent background.

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

## 12. Backend Service (`services/bg-remover/`)

### Running the service

```bash
cd services/bg-remover
pip install -r requirements.txt
python app.py
# Starts on http://127.0.0.1:8765
```

### API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check + model status |
| `/transparent-image` | POST | Background removal (multipart/form-data) |

### Configuration (environment variables)

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 8765 | Server port |
| `MAX_IMAGE_SIZE_MB` | 25 | Max upload size |
| `MAX_IMAGE_PIXELS` | 20000000 | Max pixel count |
| `MAX_CONCURRENT_JOBS` | 4 | Concurrency limit |
| `RATE_LIMIT_REQUESTS` | 30 | Requests per window |
| `RATE_LIMIT_WINDOW_SECONDS` | 60 | Rate limit window |
| `REMBG_MODEL` | u2net | Segmentation model |

### Processing pipeline

```
Input → EXIF fix → RGBA normalize → Validate → Mode switch
                                                  │
                    ┌─────────────────────────────┤
                    │                             │
                    ▼                             ▼
              Auto mode                     Color mode
                    │                             │
                    ▼                             ▼
        rembg (u2net) + downscale        CIELAB distance
                    │                     (NumPy vectorized)
                    ▼                             │
        refine_mask_edges                        │
        (color-aware edge blend)                 │
                    │                             │
                    ▼                             │
        Upscale alpha to original                 │
                    │                             │
                    ▼                             │
        decontaminate_matte                       │
        (RGB fringe removal)                      │
                    │                             │
                    ▼                             ▼
              Encode PNG ←────────────────────────┘
                    │
                    ▼
            Response: image/png
            Headers: X-Pipeline, X-Has-Alpha
```

### Test results (portrait with hair)

```
Step 1: rembg segmentation    ~400ms, 256 unique alpha values
Step 2: refine_mask_edges      ~17ms, 242 unique alpha values
Step 3: decontaminate_matte    ~25ms
Total:                        ~465ms, 120KB PNG
```

242 unique alpha values (out of 256) = extremely smooth gradients at hair edges.

## 13. File Reference

### Frontend

| File | Purpose |
|------|---------|
| `src/lib/process/engine.ts` | Core processing engine (canvas operations) |
| `src/lib/process/client.ts` | Worker management + job API |
| `src/lib/process/ai.ts` | Backend API client for transparent-image |
| `src/lib/process/mask.ts` | Edge refinement (decontaminate, feather, smooth) |
| `src/lib/workers/imageWorker.ts` | Web Worker for background processing |
| `src/lib/types.ts` | TypeScript types for all operations |
| `src/components/tools/transparent-image.tsx` | Transparent Image Maker tool |
| `src/app/api/transparent-image/route.ts` | Next.js API proxy to Python backend |

### Backend

| File | Purpose |
|------|---------|
| `services/bg-remover/app.py` | Entry point (delegates to app.main) |
| `services/bg-remover/app/main.py` | FastAPI app factory |
| `services/bg-remover/app/config.py` | Centralized configuration |
| `services/bg-remover/app/api/routes.py` | API endpoints (/health, /transparent-image) |
| `services/bg-remover/app/services/background_removal.py` | Auto mode pipeline |
| `services/bg-remover/app/services/alpha_matting.py` | Trimap + distance transform matting |
| `services/bg-remover/app/services/edge_refinement.py` | Decontaminate + directional erosion |
| `services/bg-remover/app/services/color_removal.py` | CIELAB color removal |
| `services/bg-remover/app/services/manual_mode.py` | Client-mask application |
| `services/bg-remover/app/services/image_processing.py` | EXIF, encode, trim utilities |
