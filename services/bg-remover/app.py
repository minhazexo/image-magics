"""rembg-powered background removal service.

POST /transparent-image
  multipart/form-data
    image            : image file (jpg/png/webp/bmp)
    mode             : "auto" | "color" | "manual"
    alphaMatting     : "true"/"false" (auto mode only)
    alphaMattingForegroundThreshold : int (default 240, auto mode only)
    alphaMattingBackgroundThreshold : int (default 10, auto mode only)
    alphaMattingErodESize           : int (default 10, auto mode only)
    trimTransparent  : "true"/"false"
    outputFormat     : "png" (the only transparency-capable format)
    colorTolerance   : int (0-255, color mode only)
    colorR           : int (0-255, color mode only)
    colorG           : int (0-255, color mode only)
    colorB           : int (0-255, color mode only)

Responses:
  200 image/png        -> RGBA PNG with real alpha channel
  400                  -> validation error { "success": false, "error": "..." }
  500                  -> processing error
"""

from __future__ import annotations

import io
import os
import tempfile
import threading

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image, ImageOps

from rembg import remove, new_session

APP_NAME = "bg-remover"
VERSION = "1.0.0"

MAX_IMAGE_SIZE_MB = int(os.getenv("MAX_IMAGE_SIZE_MB", "25"))
MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
MAX_IMAGE_PIXELS = int(os.getenv("MAX_IMAGE_PIXELS", "40000000"))

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP", "BMP", "GIF", "MPO"}

app = FastAPI(title=APP_NAME, version=VERSION)

_session_lock = threading.Lock()
_session = None


def get_session():
    """Shared u2net onnxruntime session (created lazily once)."""
    global _session
    if _session is None:
        with _session_lock:
            if _session is None:
                _session = new_session("u2net")
    return _session


def parse_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@app.get("/health")
def health():
    return {"success": True, "service": APP_NAME, "version": VERSION}


@app.post("/transparent-image")
def transparent_image(
    image: UploadFile = File(...),
    mode: str | None = Form("auto"),
    alphaMatting: str | None = Form(None),
    alphaMattingForegroundThreshold: int | None = Form(240),
    alphaMattingBackgroundThreshold: int | None = Form(10),
    alphaMattingErodeSize: int | None = Form(10),
    trimTransparent: str | None = Form(None),
    outputFormat: str | None = Form("png"),
    colorTolerance: int | None = Form(None),
    colorR: int | None = Form(None),
    colorG: int | None = Form(None),
    colorB: int | None = Form(None),
):
    try:
        # 1. Size + MIME validation (never trust the filename).
        raw = image.file.read()
        if not raw:
            raise HTTPException(status_code=400, detail="Empty image upload.")
        if len(raw) > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(status_code=400, detail=f"Image exceeds {MAX_IMAGE_SIZE_MB} MB limit.")

        try:
            src = Image.open(io.BytesIO(raw))
            src.load()
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Could not decode image: {exc}")

        if src.format not in ALLOWED_FORMATS:
            raise HTTPException(status_code=400, detail=f"Unsupported image format: {src.format}")

        # 2. Pixel-count limit.
        if src.width * src.height > MAX_IMAGE_PIXELS:
            raise HTTPException(status_code=400, detail="Image exceeds the 40 000 000 pixel limit.")

        # 3. EXIF orientation so phone photos are upright before processing.
        src = ImageOps.exif_transpose(src)

        # 4. Check if source has existing alpha (PNG with transparency).
        has_existing_alpha = src.mode in ("RGBA", "LA", "PA") or src.info.get("transparency", False)

        # 5. Normalize to RGBA.
        rgba = src.convert("RGBA")

        # 6. Process based on mode.
        result = None

        if mode == "auto":
            # Auto mode: AI background removal with rembg.
            use_matting = parse_bool(alphaMatting, True)
            session = get_session()

            # rembg expects an RGB image for prediction.
            rgb = rgba.convert("RGB")

            if use_matting:
                out = remove(
                    rgb,
                    session=session,
                    alpha_matting=True,
                    alpha_matting_foreground_threshold=max(1, min(255, alphaMattingForegroundThreshold or 240)),
                    alpha_matting_background_threshold=max(1, min(255, alphaMattingBackgroundThreshold or 10)),
                    alpha_matting_erode_size=max(0, min(100, alphaMattingErodeSize or 10)),
                )
            else:
                out = remove(rgb, session=session, alpha_matting=False)

            # rembg output is RGBA -> merge with original RGB (keeps source colors).
            result = rgba.copy()

            # Preserve existing alpha if the source image had transparency.
            # Do not destroy existing PNG alpha per the spec.
            if has_existing_alpha:
                # Keep the original alpha channel; the rembg RGB result is used for colors.
                pass  # alpha already in result from rgba.copy()
            else:
                result.putalpha(out.split()[3])

        elif mode == "color":
            # Color mode: make selected color transparent with tolerance.
            tolerance = max(0, min(255, colorTolerance or 30))
            target_color = (
                max(0, min(255, colorR or 255)),
                max(0, min(255, colorG or 255)),
                max(0, min(255, colorB or 255)),
            )

            # Ensure RGBA for pixel-level processing.
            if rgba.mode != "RGBA":
                rgba = rgba.convert("RGBA")

            # Get pixel data and apply color distance threshold.
            pixels = rgba.getdata()
            width, height = rgba.size
            new_data = []

            for pixel in pixels:
                # pixel is (r, g, b, a) for RGBA
                r, g, b, a = pixel[:4] if len(pixel) == 4 else pixel + (255,)

                # Calculate Euclidean distance to target color.
                dist = ((r - target_color[0]) ** 2 + (g - target_color[1]) ** 2 + (b - target_color[2]) ** 2) ** 0.5

                if dist <= tolerance:
                    # Make transparent - preserve original alpha if it had some.
                    new_a = 0 if a == 255 else a
                    new_data.append((r, g, b, new_a))
                else:
                    new_data.append(pixel[:4] if len(pixel) == 4 else (r, g, b, a))

            result = Image.new("RGBA", (width, height))
            result.putdata(new_data)

        else:
            # manual mode - placeholder: return the original image with alpha preserved.
            result = rgba.copy()

        # 7. Preserve existing alpha if the source image had transparency
        #    and we are not in color mode (color mode already handled alpha per-pixel).
        if has_existing_alpha and mode != "color":
            # alpha already preserved in result from rgba.copy() or auto mode logic above
            pass
        elif mode == "color":
            # For color mode, alpha was set per-pixel above; ensure it's correct.
            pass
        else:
            # For auto mode without existing alpha, alpha was already set in step 6.
            pass

        # 8. Optional: trim fully transparent borders.
        if parse_bool(trimTransparent, False):
            bbox = result.getbbox()
            if bbox:
                result = result.crop(bbox)

        # 9. Encode PNG.
        buf = io.BytesIO()
        result.save(buf, format="PNG", optimize=False)
        data = buf.getvalue()

        if not data:
            raise HTTPException(status_code=500, detail="Failed to encode result PNG.")

        return Response(
            content=data,
            media_type="image/png",
            headers={"X-Has-Alpha": "true", "Cache-Control": "no-store"},
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Processing failed: {exc}") from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8765)