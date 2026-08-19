"""FastAPI routes — /health and POST /transparent-image."""

from __future__ import annotations

import asyncio
import io
import time

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from app.config import settings
from app.core.errors import ErrorCode, error_response
from app.core.logging_config import RequestLogger
from app.core.model import is_ready
from app.core.validation import validate_upload
from app.api.schemas import HealthResponse
from app.services.background_removal import remove_background
from app.services.color_removal import remove_color
from app.services.manual_mode import apply_mask
from app.services.image_processing import (
    encode_png,
    fix_exif_orientation,
    has_alpha,
    to_rgba,
    trim_transparent,
)

router = APIRouter()

# --- Concurrency limiter ---
_semaphore: asyncio.Semaphore | None = None


def _get_semaphore() -> asyncio.Semaphore:
    global _semaphore
    if _semaphore is None:
        _semaphore = asyncio.Semaphore(settings.max_concurrent_jobs)
    return _semaphore


# --- Rate limiting (simple in-memory sliding window) ---
_rate_buckets: dict[str, list[float]] = {}


def _check_rate_limit(key: str = "global") -> None:
    now = time.monotonic()
    window = settings.rate_limit_window_s
    max_req = settings.rate_limit_requests

    if key not in _rate_buckets:
        _rate_buckets[key] = []

    # Prune old entries
    _rate_buckets[key] = [t for t in _rate_buckets[key] if now - t < window]

    if len(_rate_buckets[key]) >= max_req:
        raise error_response(
            ErrorCode.INVALID_PARAMETER,
            status=429,
            detail=f"Rate limit exceeded. Max {max_req} requests per {window:.0f}s.",
        )
    _rate_buckets[key].append(now)


def _parse_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _clamp(value: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, value))


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(model_loaded=is_ready())


@router.post("/transparent-image")
async def transparent_image(
    image: UploadFile = File(..., description="Image file (JPEG, PNG, WebP, BMP)"),
    mask: UploadFile | None = File(None, description="Mask image for manual mode (grayscale/RGBA PNG)"),
    mode: str | None = Form("auto", description="Processing mode: auto | color | manual"),
    alphaMatting: str | None = Form(None, description="Enable alpha matting (auto mode)"),
    alphaMattingForegroundThreshold: int | None = Form(240),
    alphaMattingBackgroundThreshold: int | None = Form(10),
    alphaMattingErodeSize: int | None = Form(10),
    trimTransparent: str | None = Form(None, description="Crop fully transparent borders"),
    edgeRefinement: str | None = Form(None, description="Enable edge refinement (auto mode)"),
    outputFormat: str | None = Form("png", description="Output format (only png supported)"),
    colorTolerance: int | None = Form(None, description="Color tolerance 0-255 (color mode)"),
    colorR: int | None = Form(None, description="Target R 0-255 (color mode)"),
    colorG: int | None = Form(None, description="Target G 0-255 (color mode)"),
    colorB: int | None = Form(None, description="Target B 0-255 (color mode)"),
) -> Response:
    logger = RequestLogger()

    # Rate limit
    _check_rate_limit()

    # Validate mode
    valid_modes = {"auto", "color", "manual"}
    if mode not in valid_modes:
        raise error_response(ErrorCode.INVALID_MODE)

    # Read and validate image
    raw = await image.read()
    logger.begin(mode, f"{len(raw)} bytes", len(raw))

    try:
        src = validate_upload(raw)
    except Exception as e:
        logger.failure("VALIDATION_FAILED", str(e))
        raise

    src = fix_exif_orientation(src)
    original_alpha = has_alpha(src)
    rgba = to_rgba(src)
    w, h = rgba.size

    # Process based on mode
    try:
        if mode == "auto":
            use_matting = _parse_bool(alphaMatting, True)
            use_edge = _parse_bool(edgeRefinement, True)

            result = remove_background(
                rgba,
                alpha_matting=use_matting,
                fg_threshold=_clamp(alphaMattingForegroundThreshold or 240, 1, 255),
                bg_threshold=_clamp(alphaMattingBackgroundThreshold or 10, 1, 255),
                erode_size=_clamp(alphaMattingErodeSize or 10, 0, 100),
                edge_refinement=use_edge,
            )

            # Preserve existing alpha if source had transparency
            if original_alpha:
                result.putalpha(rgba.split()[3])

        elif mode == "color":
            tolerance = _clamp(colorTolerance if colorTolerance is not None else 30, 0, 255)
            target = (
                _clamp(colorR if colorR is not None else 255, 0, 255),
                _clamp(colorG if colorG is not None else 255, 0, 255),
                _clamp(colorB if colorB is not None else 255, 0, 255),
            )
            result = remove_color(rgba, target, tolerance)

        else:  # manual
            if mask is None:
                raise error_response(ErrorCode.MASK_REQUIRED)
            mask_bytes = await mask.read()
            result = apply_mask(rgba, mask_bytes)

        # Trim
        if _parse_bool(trimTransparent, False):
            result = trim_transparent(result)

        # Encode PNG
        png_data = encode_png(result)

        if not png_data:
            raise error_response(ErrorCode.PROCESSING_FAILED)

        logger.success(len(png_data), has_alpha=has_alpha(result))

        # Build pipeline info header so the frontend can display which steps ran
        pipeline_info = f"mode={mode}"
        if mode == "auto":
            pipeline_info += f" rembg=on refine={'on' if use_matting else 'off'} decontaminate={'on' if use_edge else 'off'}"
        elif mode == "color":
            pipeline_info += f" color=({target[0]},{target[1]},{target[2]}) tolerance={tolerance}"

        return Response(
            content=png_data,
            media_type="image/png",
            headers={
                "X-Has-Alpha": "true",
                "X-Pipeline": pipeline_info,
                "Cache-Control": "no-store",
            },
        )

    except HTTPException:
        raise
    except Exception as exc:
        import logging
        logging.getLogger(__name__).exception("Processing failed")
        logger.failure("PROCESSING_FAILED", str(exc))
        raise error_response(ErrorCode.PROCESSING_FAILED, status=500)
