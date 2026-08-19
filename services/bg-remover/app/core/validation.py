"""Image validation — never trust the upload."""

from __future__ import annotations

import io
from typing import BinaryIO

from PIL import Image
try:
    from PIL.Image import DecompressionBombError as DecompressionBomb
except ImportError:
    DecompressionBomb = Exception  # type: ignore

from app.config import settings
from app.core.errors import ErrorCode, error_response

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP", "BMP"}
SINGLE_FRAME_FORMATS = {"JPEG", "PNG", "WebP", "BMP", "TIFF"}


def validate_upload(raw: bytes) -> Image.Image:
    """Validate and decode an uploaded image.  Raises HTTPException on failure."""
    if not raw:
        raise error_response(ErrorCode.EMPTY_UPLOAD)

    if len(raw) > settings.max_image_size_bytes:
        raise error_response(ErrorCode.FILE_TOO_LARGE)

    try:
        img = Image.open(io.BytesIO(raw))
        img.load()
    except DecompressionBomb:
        raise error_response(ErrorCode.IMAGE_TOO_LARGE, detail="Image triggers decompression bomb protection.")
    except Exception:
        raise error_response(ErrorCode.INVALID_IMAGE)

    fmt = (img.format or "").upper()
    if fmt not in ALLOWED_FORMATS:
        raise error_response(ErrorCode.UNSUPPORTED_FORMAT, detail=f"Supported: JPEG, PNG, WebP, BMP. Got: {fmt}.")

    w, h = img.size
    if w * h > settings.max_image_pixels:
        raise error_response(ErrorCode.IMAGE_TOO_LARGE)
    if w > settings.max_image_width or h > settings.max_image_height:
        raise error_response(ErrorCode.IMAGE_TOO_LARGE)

    return img
