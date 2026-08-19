"""Manual mode — apply a client-provided mask to the alpha channel.

The mask is expected as a separate file upload (grayscale or RGBA).
White (255) = opaque foreground, Black (0) = transparent background.
"""

from __future__ import annotations

import io

import numpy as np
from PIL import Image

from app.core.errors import ErrorCode, error_response


def apply_mask(source: Image.Image, mask_raw: bytes) -> Image.Image:
    """Apply a mask image to the source's alpha channel.

    The mask is resized to match source dimensions if needed.
    Grayscale masks are used directly as the alpha channel.
    RGBA masks use the alpha channel of the mask.
    """
    if not mask_raw:
        raise error_response(ErrorCode.MASK_REQUIRED)

    try:
        mask = Image.open(io.BytesIO(mask_raw))
        mask.load()
    except Exception:
        raise error_response(ErrorCode.INVALID_IMAGE, detail="Could not decode mask image.")

    # Convert mask to grayscale for alpha use
    if mask.mode == "RGBA":
        mask_alpha = mask.split()[3]
    elif mask.mode in ("L", "LA"):
        mask_alpha = mask.split()[0]
    else:
        mask_alpha = mask.convert("L")

    # Resize mask to source dimensions if they differ
    if mask_alpha.size != source.size:
        mask_alpha = mask_alpha.resize(source.size, Image.LANCZOS)

    # Apply mask as the alpha channel
    result = source.convert("RGBA")
    result.putalpha(mask_alpha)
    return result
