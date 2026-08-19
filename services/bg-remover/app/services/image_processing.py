"""Image processing utilities: EXIF, encoding, trimming."""

from __future__ import annotations

import io

from PIL import Image, ImageOps


def fix_exif_orientation(img: Image.Image) -> Image.Image:
    """Apply EXIF orientation so phone photos are upright."""
    return ImageOps.exif_transpose(img)


def has_alpha(img: Image.Image) -> bool:
    """Check if the image already contains transparency."""
    return img.mode in ("RGBA", "LA", "PA") or img.info.get("transparency", False) is not False


def to_rgba(img: Image.Image) -> Image.Image:
    """Normalize to RGBA."""
    return img.convert("RGBA")


def trim_transparent(img: Image.Image) -> Image.Image:
    """Crop fully transparent borders."""
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def encode_png(img: Image.Image, optimize: bool = False) -> bytes:
    """Encode as PNG and return bytes."""
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=optimize)
    return buf.getvalue()
