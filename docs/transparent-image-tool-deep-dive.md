# Transparent Image Tool — Deep Dive

This document describes **everything** used to make images transparent: the full pipeline, every algorithm, every file, what works, what was tried and abandoned, and what's still broken.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Backend Pipeline (Python/FastAPI)](#2-backend-pipeline)
3. [Client Pipeline (TypeScript/Canvas)](#3-client-pipeline)
4. [Auto Mode — AI Background Removal](#4-auto-mode)
5. [Color Mode — Color-Based Removal](#5-color-mode)
6. [Manual Mode — Client Mask](#6-manual-mode)
7. [Alpha Matting & Edge Quality](#7-alpha-matting)
8. [White Halo Prevention](#8-halo-prevention)
9. [Performance & Memory Safety](#9-performance)
10. [What Was Tried and Abandoned](#10-abandoned)
11. [Known Issues](#11-known-issues)
12. [File Reference](#12-file-reference)

---

## 1. Architecture Overview

```
User uploads image
        ↓
Frontend (Next.js)
  ├── ImageDropzone → validates file size/type
  ├── Reads file → creates canvas (EXIF orientation)
  └── Sends to API
        ↓
API Proxy (web/src/app/api/transparent-image/route.ts)
  └── Forwards to bg-remover service (http://127.0.0.1:8765)
        ↓
Backend (services/bg-remover/app/)
  ├── Validates image (format, size, pixel count, decompression bomb)
  ├── EXIF orientation fix
  ├── Normalize to RGBA
  ├── Mode dispatch: auto / color / manual
  │     ├── auto  → rembg AI → mask refinement → decontaminate
  │     ├── color → CIELAB distance → smooth alpha
  │     └── manual → apply client-provided mask
  ├── Optional: trim transparent borders
  └── Encode as PNG, return
        ↓
Frontend post-processing (client-side)
  ├── decontaminateMatte() — replace background color at edges
  └── softenAlpha() — light Gaussian blur on alpha
        ↓
Result displayed with checkerboard/white/black preview
```

---

## 2. Backend Pipeline

### Files

| File | Purpose |
|------|---------|
| `app/main.py` | FastAPI app factory, CORS, exception handlers, model warmup |
| `app/config.py` | All settings via environment variables |
| `app/core/validation.py` | Image validation: format, dims, pixel count, decompression bomb |
| `app/core/model.py` | Thread-safe lazy rembg ONNX session |
| `app/core/errors.py` | Structured `{success, error: {code, message}}` responses |
| `app/core/logging_config.py` | Request logging with request ID, mode, duration |
| `app/api/routes.py` | `GET /health` and `POST /transparent-image` endpoints |
| `app/services/background_removal.py` | **Auto mode**: rembg + mask refinement + decontaminate |
| `app/services/alpha_matting.py` | Trimap generation, distance-transform matting, mask edge refinement |
| `app/services/edge_refinement.py` | `decontaminate_matte`, `directional_alpha_erosion`, `refine_alpha` |
| `app/services/color_removal.py` | CIELAB-based color removal with smooth transitions |
| `app/services/manual_mode.py` | Apply client-provided mask to alpha channel |
| `app/services/image_processing.py` | EXIF fix, PNG encode, trim transparent borders |

### Request Flow

```
POST /transparent-image
  ├── Read raw bytes
  ├── validate_upload() — checks format, size, pixels, decompression bomb
  ├── fix_exif_orientation() — PIL ImageOps.exif_transpose
  ├── has_alpha() — detect existing transparency
  ├── to_rgba() — normalize to RGBA
  ├── Dispatch by mode:
  │     auto  → remove_background()
  │     color → remove_color()
  │     manual → apply_mask()
  ├── Optional: trim_transparent()
  └── encode_png() → Response(image/png)
```

---

## 3. Client Pipeline

### Files

| File | Purpose |
|------|---------|
| `web/src/components/tools/transparent-image.tsx` | Main UI: upload, controls, preview, download |
| `web/src/lib/process/ai.ts` | `removeBackgroundViaAi()` — sends to API, `verifyTransparency()` |
| `web/src/lib/process/mask.ts` | `decontaminateMatte`, `smoothAlpha`, `cleanupAlphaNoise`, `featherAlphaEdges`, `refineEdges` |
| `web/src/lib/process/engine.ts` | `removeColorFromCanvas`, `softenAlpha`, `colorToAlpha` (GIMP algorithm) |
| `web/src/components/processing/mask-editor.tsx` | Manual mask editor: erase/restore/undo/redo/zoom |

### Client-Side Processing (Auto Mode)

```typescript
// transparent-image.tsx → decontaminate()
async function decontaminate(blob: Blob): Promise<Blob> {
  const { canvas } = await toCanvas(blob);          // Decode to canvas
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  // 1. Decontaminate color fringes (RGB only, not alpha)
  decontaminateMatte(canvas, ctx, 4, 5);

  // 2. Light alpha smooth at transition boundaries
  softenAlpha(canvas, ctx, 0.8);

  return canvasToPng(canvas);
}
```

**Key insight**: The client-side pipeline is intentionally minimal now. The backend produces good alpha (242 unique values, 5.8% hard edges), so the client only cleans up RGB color fringes and applies a very light alpha smooth.

---

## 4. Auto Mode — AI Background Removal

### Model: rembg + u2net

- **Model**: `u2net` (ONNX format, ~170MB)
- **Session**: Thread-safe lazy singleton via `get_session()`
- **Input**: RGB image (downscaled to max 1024px if needed)
- **Output**: RGBA with smooth alpha mask (256 unique values)

### Why u2net and not BiRefNet?

rembg ships with many models (`birefnet-portrait`, `birefnet-general`, `bria-rmbg`, etc.) but:
- They require downloading large model weights (300-500MB each)
- Only `u2net` was pre-downloaded on this system
- Downloading during a request would timeout
- u2net produces smooth gradients already (256 unique alpha values)

### Pipeline

```
Input image (RGB, any size)
    ↓
_downscale_for_rembg() — resize to max 1024px longest side
    ↓
rembg remove() — alpha_matting=False (pymatting OOMs)
    ↓
Binary mask → smooth 256-value alpha (rembg already does this)
    ↓
refine_mask_edges() — color-aware edge refinement
    ↓
Upscale alpha back to original resolution (if downscaled)
    ↓
Merge: original RGB + refined alpha
    ↓
decontaminate_matte() — replace background-tinted RGB at edges
    ↓
Output: RGBA PNG
```

### Downscaling

rembg internally creates huge ONNX tensors. Images >1024px on longest side are downscaled before processing, then the alpha mask is upscaled back to original resolution. This prevents OOM.

```python
_REMBG_MAX_DIM = 1024

def _downscale_for_rembg(img):
    max_side = max(img.size)
    if max_side <= _REMBG_MAX_DIM:
        return img, 1.0
    scale = _REMBG_MAX_DIM / max_side
    return img.resize((new_w, new_h), Image.LANCZOS), scale
```

---

## 5. Color Mode — Color-Based Removal

### Algorithm: CIELAB Perceptual Distance

Instead of raw RGB Euclidean distance (which produces harsh edges), we use **CIELAB color space** (CIE76 distance):

```
RGB → sRGB linearize → XYZ (D65) → CIELAB
    ↓
Distance = sqrt((L1-L2)² + (a1-a2)² + (b1-b2)²)
    ↓
Smooth alpha transition:
  dist=0        → alpha=0 (fully transparent)
  dist=tolerance → alpha≈128 (half transparent)
  dist>tolerance → keep original alpha
```

### Why CIELAB?

RGB distance treats all color channels equally, but human vision is more sensitive to some colors. CIELAB produces perceptually uniform distances, so:
- Red-to-orange feels like the same "distance" as blue-to-cyan
- Anti-aliased edges produce smoother alpha transitions
- Less color fringing at boundaries

### File: `color_removal.py`

```python
def remove_color(img, target_rgb, tolerance):
    # Convert to CIELAB
    pixel_lab = _rgb_to_lab_batch(rgb)
    target_lab = _rgb_to_lab_batch(target)

    # Euclidean distance in CIELAB
    dist = sqrt(sum((pixel_lab - target_lab)²))

    # Smooth alpha: dist=0→0, dist=tolerance→255
    new_alpha = clip(dist / tolerance * 255, 0, 255)
    # Very close to target → fully transparent
    new_alpha[dist < tolerance * 0.3] = 0
```

---

## 6. Manual Mode — Client Mask

### How it works

1. User uploads a mask image (grayscale or RGBA PNG)
2. Backend validates and decodes the mask
3. If mask dimensions don't match source, mask is resized with LANCZOS
4. Mask's alpha/grayscale channel is applied as the output alpha

### File: `manual_mode.py`

```python
def apply_mask(source, mask_raw):
    mask = Image.open(mask_raw)

    # Extract alpha from mask
    if mask.mode == "RGBA":
        mask_alpha = mask.split()[3]
    elif mask.mode in ("L", "LA"):
        mask_alpha = mask.split()[0]
    else:
        mask_alpha = mask.convert("L")

    # Resize to match source if needed
    if mask_alpha.size != source.size:
        mask_alpha = mask_alpha.resize(source.size, Image.LANCZOS)

    # Apply as alpha channel
    result = source.convert("RGBA")
    result.putalpha(mask_alpha)
    return result
```

### Mask Editor (Client-Side)

The `MaskEditor` component (`mask-editor.tsx`) provides:
- **Erase tool**: Sets alpha to 0 (transparent)
- **Restore tool**: Sets alpha to original value
- **Brush size**: 2–120px
- **Zoom**: 1x–8x
- **Undo/Redo**: Up to 20 history states
- **Reset**: Restore original alpha

The editor works on the **alpha channel only** — it does not paint RGB pixels.

---

## 7. Alpha Matting & Edge Quality

### The Problem

rembg without `alpha_matting=True` produces a smooth but sometimes hard-edged mask. With `alpha_matting=True`, rembg uses `pymatting` which allocates ~1.86 GiB internally and OOMs on any system.

### What We Tried

#### Attempt 1: pymatting (abandoned)
```python
# rembg's built-in alpha matting
out = remove(rgb, session=session, alpha_matting=True)
# → Uses pymatting's closed-form matting
# → OOM: "Unable to allocate 1.86 GiB for array (250000000,)"
```
**Result**: OOM on every system. pymatting's `ichol` (incomplete Cholesky) creates huge sparse matrices.

#### Attempt 2: Trimap + Distance Transform (current)
```python
# alpha_matting.py
trimap = generate_trimap(mask, erode_size=5, dilate_size=12)
alpha = matte_from_trimap(rgb, trimap)
```
**Result**: Works, but the mask from rembg is already good. The trimap approach was throwing away the existing smooth gradients.

#### Attempt 3: refine_mask_edges (current — best)
```python
# Preserve existing smooth mask, only refine edges with color awareness
refined = refine_mask_edges(img, mask, erode_size=3, feather=1.5)
```
**Result**: Best results. Preserves rembg's 256-value gradients while improving edge accuracy.

### How `refine_mask_edges` Works

```
1. Find edge region: pixels where mask is between 10 and 245
2. Compute FG and BG mean colors from known regions
3. For each edge pixel:
   - Compute color distance to FG mean and BG mean
   - Color-based alpha = 1 - (dist_to_fg / total_dist)
   - Blend: 70% existing mask + 30% color-based alpha
4. Gaussian smooth on edge region only (sigma=1.5)
5. Blend smoothed edges back with original mask
```

**Critical fix**: Initially, the function set `fg_mask=255` and `bg_mask=0` after smoothing, which created hard boundaries. Now it preserves the original mask values for solid regions.

### How `decontaminate_matte` Works (Backend)

For each semi-transparent pixel, replace its RGB with a Gaussian-weighted average of nearby opaque foreground pixels:

```
1. For each pixel where alpha < 250:
   - Collect neighbors where alpha >= 140 (foreground)
   - Weight by Gaussian distance × foreground confidence
   - Compute weighted average RGB
2. Blend toward foreground color:
   - blend = 1 - (alpha/255)²  (quadratic: more aggressive for low alpha)
   - new_rgb = old_rgb + (fg_avg - old_rgb) * blend
3. Alpha channel is NOT modified
```

This eliminates background color bleed on hair edges without destroying the alpha gradients.

### How `directional_alpha_erosion` Works (Currently Disabled)

For edge pixels near the transparent (background) side, push alpha toward 0:

```
1. Count transparent (alpha=0) and opaque (alpha>=250) neighbors
2. bg_ratio = transparent_count / (transparent + opaque)
3. If bg_ratio > 0.3:
   - reduction = bg_ratio^0.7 * strength * 1.8
   - new_alpha = alpha * (1 - reduction)
```

**Why it's disabled**: It pushes semi-transparent pixels to 0, creating hard alpha jumps that destroy hair strand transparency. The rembg mask + refine_mask_edges already produce clean alpha without it.

---

## 8. White Halo Prevention

### What Causes Halos

When the AI mask is correct but the original RGB at edge pixels still contains the background color, you get a visible "halo" around the subject.

Example: A person with dark hair on a white background. The mask correctly identifies hair strands, but the RGB values of those semi-transparent hair pixels are tinted white from the background.

### How We Fix It

**Backend** (`decontaminate_matte` in `edge_refinement.py`):
- Uses scipy `gaussian_filter` for O(1) per-pixel cost
- Only modifies RGB, never alpha
- Replaces background-tinted RGB with Gaussian-weighted foreground colors
- Quadratic blend: more aggressive for lower alpha values

**Client** (`decontaminateMatte` in `mask.ts`):
- Same algorithm but in TypeScript with canvas ImageData
- Used as a second pass after the backend (catches any remaining fringes)
- Gaussian-weighted sampling with sigma = radius/2.5

### What Does NOT Work

- **Aggressive erosion/dilation**: Destroys hair details
- **Simple alpha blur**: Smears the subject into the background
- **Making white pixels transparent**: Can destroy white products, clothing, teeth

---

## 9. Performance & Memory Safety

### Large Image Handling

| Limit | Value | Env Var |
|-------|-------|---------|
| Max file size | 25 MB | `MAX_IMAGE_SIZE_MB` |
| Max pixels | 20 MP | `MAX_IMAGE_PIXELS` |
| Max width/height | 8192 px | `MAX_IMAGE_WIDTH/HEIGHT` |
| rembg max dim | 1024 px | hardcoded `_REMBG_MAX_DIM` |
| Max concurrent jobs | 4 | `MAX_CONCURRENT_JOBS` |
| Rate limit | 30 req/60s | `RATE_LIMIT_REQUESTS/WINDOW` |

### Memory-Safe Steps

1. **Downscale before rembg**: Images >1024px are resized to fit
2. **Skip decontaminate for >4MP**: `decontaminate_matte` allocates float32 arrays; skipped for large images
3. **Skip directional_erosion for >4MP**: Same reason
4. **No pymatting**: Always disabled; our `refine_mask_edges` is O(1) per pixel

### Processing Time (typical)

| Image Size | Backend | Client | Total |
|-----------|---------|--------|-------|
| 300×300 | ~1s | ~0.5s | ~1.5s |
| 1024×768 | ~2s | ~1s | ~3s |
| 4000×3000 | ~3s (downscaled) | ~2s | ~5s |

---

## 10. What Was Tried and Abandoned

### Abandoned: `refine_alpha` (MinFilter + FIND_EDGES)

```python
# edge_refinement.py → refine_alpha()
alpha = alpha.filter(ImageFilter.MinFilter(3))      # Erode
alpha = alpha.filter(ImageFilter.GaussianBlur(0.8))  # Blur
guided = alpha.filter(ImageFilter.FIND_EDGES)         # Edge detect
# ... contrast enhancement ...
```

**Why abandoned**: This was designed for cleaning up hard binary masks. When rembg already produces smooth 256-value masks, this step **eroded and hardened** the smooth edges, increasing hard edges from 5.6% to 64.4%.

### Abandoned: `directional_alpha_erosion`

```python
# Push alpha toward 0 for background-facing edge pixels
bg_ratio = trans_count / (trans_count + opaque_count)
reduction = bg_ratio^0.7 * strength * 1.8
new_alpha = alpha * (1 - reduction)
```

**Why abandoned**: It creates hard alpha jumps at the transparent boundary, destroying hair strand transparency. Average edge jump went from 5.9 to 67.0 when enabled.

### Abandoned: Aggressive Client-Side Post-Processing

```typescript
// OLD pipeline (too aggressive):
softenAlpha(canvas, ctx, 3);          // 3px Gaussian blur — too much
decontaminateMatte(canvas, ctx, 6, 6); // 6 iterations — overkill
refineEdges(canvas, ctx, {             // Full refinement suite
  smoothRadius: 2.0,
  featherRadius: 3.0,
  cleanupRadius: 2,
  cleanupThreshold: 0.5,
});
decontaminateMatte(canvas, ctx, 3, 4); // Second pass — redundant
```

**Why abandoned**: The backend already produces clean alpha. Aggressive client-side processing was undoing the backend's work.

### Abandoned: pymatting Alpha Matting

```python
out = remove(rgb, session=session, alpha_matting=True)
# Internally calls pymatting.estimate_alpha_cf()
# → ichol() allocates 1.86 GiB for shape (250000000,)
```

**Why abandoned**: OOM on every system. pymatting's closed-form matting requires solving a large linear system that doesn't scale.

---

## 11. Known Issues

### 1. Hair edges still not perfect

The current pipeline produces smooth alpha (avg jump 5.9, 5.8% hard edges) but hair strands can still look slightly choppy at 300×300 resolution. At higher resolutions (1024+), the quality is much better.

**Root cause**: rembg's u2net model doesn't have the resolution to capture individual hair strands at low resolutions.

**Potential fix**: Download and use `birefnet-portrait` model (specifically designed for portraits with hair). Requires ~400MB download.

### 2. Alpha matting toggle is misleading

The "Alpha matting" checkbox in the UI sends `alphaMatting=true` to the backend, but the backend now uses `refine_mask_edges` instead of pymatting. The label should be updated to "Edge refinement" or similar.

### 3. Color mode doesn't use CIELAB in the client

The backend `color_removal.py` uses CIELAB, but the client `removeColorFromCanvas` in `engine.ts` uses the GIMP color-to-alpha algorithm (which is also good, but different).

### 4. White-on-white is inherently limited

When the foreground color is nearly identical to the background (e.g., white product on white bg), no algorithm can distinguish them. The mask will always be imperfect.

---

## 12. File Reference

### Backend Files

```
services/bg-remover/
├── app.py                          # Backward-compatible entry point
├── requirements.txt                # Dependencies
├── app/
│   ├── main.py                     # FastAPI app factory
│   ├── config.py                   # All settings (env vars)
│   ├── core/
│   │   ├── errors.py               # Structured error responses
│   │   ├── logging_config.py       # Request logging
│   │   ├── model.py                # Thread-safe rembg session
│   │   └── validation.py           # Image validation
│   ├── api/
│   │   ├── schemas.py              # Pydantic models
│   │   └── routes.py               # /health + POST /transparent-image
│   └── services/
│       ├── background_removal.py   # Auto mode pipeline
│       ├── alpha_matting.py        # Trimap + distance matting + refine_mask_edges
│       ├── edge_refinement.py      # decontaminate_matte, directional_erosion
│       ├── color_removal.py        # CIELAB color removal
│       ├── manual_mode.py          # Client mask application
│       └── image_processing.py     # EXIF, encode, trim
└── tests/
    ├── test_health.py
    ├── test_validation.py
    ├── test_auto_mode.py
    ├── test_color_mode.py
    ├── test_manual_mode.py
    └── test_edge_processing.py
```

### Frontend Files

```
web/src/
├── app/
│   ├── transparent-image/page.tsx          # Page with SEO metadata
│   └── api/transparent-image/route.ts      # API proxy to bg-remover
├── components/
│   ├── tools/transparent-image.tsx         # Main UI component
│   └── processing/mask-editor.tsx          # Manual mask editor
└── lib/
    ├── process/
    │   ├── ai.ts                           # removeBackgroundViaAi, verifyTransparency
    │   ├── mask.ts                         # decontaminateMatte, smoothAlpha, refineEdges
    │   ├── engine.ts                       # removeColorFromCanvas, softenAlpha
    │   └── client.ts                       # downloadBlob
    └── utils/
        └── exif.ts                         # readExifOrientation
```

### Key Algorithms Summary

| Algorithm | Location | What it does | Modifies |
|-----------|----------|-------------|----------|
| rembg u2net | `background_removal.py` | AI segmentation | Alpha mask |
| refine_mask_edges | `alpha_matting.py` | Color-aware edge refinement | Alpha (preserves existing) |
| decontaminate_matte | `edge_refinement.py` | Replace bg color at edges | RGB only |
| directional_alpha_erosion | `edge_refinement.py` | Push alpha near transparent (DISABLED) | Alpha |
| CIELAB color removal | `color_removal.py` | Perceptual color distance | Alpha |
| decontaminateMatte (client) | `mask.ts` | RGB fringe cleanup | RGB only |
| softenAlpha (client) | `engine.ts` | Light Gaussian blur | Alpha |

---

## Revision History

| Date | Change |
|------|--------|
| 2026-08-19 | Initial implementation: rembg + pymatting + edge refinement |
| 2026-08-19 | Fixed: pymatting OOM → disabled alpha_matting in rembg |
| 2026-08-19 | Added: refine_mask_edges (preserves smooth gradients) |
| 2026-08-19 | Removed: directional_alpha_erosion (destroyed hair edges) |
| 2026-08-19 | Removed: refine_alpha (MinFilter+FIND_EDGES hardened smooth masks) |
| 2026-08-19 | Simplified client pipeline: only decontaminate + light smooth |
| 2026-08-19 | Fixed: refine_mask_edges hard FG/BG boundary (was setting to 0/255) |
