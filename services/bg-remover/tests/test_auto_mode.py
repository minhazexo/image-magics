"""Tests for auto mode — AI background removal."""

from __future__ import annotations

import io

from PIL import Image


def _has_alpha_channel(data: bytes) -> bool:
    """Check if PNG data contains a real alpha channel."""
    img = Image.open(io.BytesIO(data))
    if img.mode != "RGBA":
        return False
    alpha = list(img.split()[3].getdata())
    return any(a < 255 for a in alpha)


def test_auto_basic(client, product_on_white):
    resp = client.post(
        "/transparent-image",
        files={"image": ("product.png", product_on_white, "image/png")},
        data={"mode": "auto", "alphaMatting": "false", "edgeRefinement": "true"},
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/png"
    assert _has_alpha_channel(resp.content)


def test_auto_no_matting(client, colored_image):
    resp = client.post(
        "/transparent-image",
        files={"image": ("col.png", colored_image, "image/png")},
        data={"mode": "auto", "alphaMatting": "false", "edgeRefinement": "false"},
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/png"


def test_auto_trim(client, product_on_white):
    resp = client.post(
        "/transparent-image",
        files={"image": ("p.png", product_on_white, "image/png")},
        data={"mode": "auto", "trimTransparent": "true", "alphaMatting": "false"},
    )
    assert resp.status_code == 200
    img = Image.open(io.BytesIO(resp.content))
    # Trimmed image should be smaller than original
    assert img.width <= 128
    assert img.height <= 128


def test_auto_preserves_rgba(client, rgba_image):
    """RGBA input should not lose existing alpha."""
    resp = client.post(
        "/transparent-image",
        files={"image": ("rgba.png", rgba_image, "image/png")},
        data={"mode": "auto"},
    )
    assert resp.status_code == 200
    img = Image.open(io.BytesIO(resp.content))
    assert img.mode == "RGBA"
