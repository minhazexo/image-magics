"""Tests for manual mode — client-provided mask."""

from __future__ import annotations

import io

from PIL import Image


def test_manual_requires_mask(client, colored_image):
    """Manual mode without a mask should return 400."""
    resp = client.post(
        "/transparent-image",
        files={"image": ("c.png", colored_image, "image/png")},
        data={"mode": "manual"},
    )
    assert resp.status_code == 400
    data = resp.json()
    assert data["error"]["code"] == "MASK_REQUIRED"


def test_manual_with_mask(client, colored_image, greyscale_mask):
    """Manual mode with a valid mask should produce output."""
    resp = client.post(
        "/transparent-image",
        files=[
            ("image", ("c.png", colored_image, "image/png")),
            ("mask", ("mask.png", greyscale_mask, "image/png")),
        ],
        data={"mode": "manual"},
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/png"

    img = Image.open(io.BytesIO(resp.content))
    assert img.mode == "RGBA"
    alpha = list(img.split()[3].getdata())
    # Should have both transparent and opaque pixels (circle mask)
    assert 0 in alpha, "Mask should create transparent areas"
    assert 255 in alpha, "Mask should preserve opaque areas"


def test_manual_mask_resize(client):
    """Mask of different size should be auto-resized to match source."""
    img = Image.new("RGB", (200, 200), (100, 100, 100))
    img_buf = io.BytesIO()
    img.save(img_buf, format="PNG")

    # Small mask
    mask = Image.new("L", (50, 50), 0)
    mask_buf = io.BytesIO()
    mask.save(mask_buf, format="PNG")

    resp = client.post(
        "/transparent-image",
        files=[
            ("image", ("img.png", img_buf.getvalue(), "image/png")),
            ("mask", ("mask.png", mask_buf.getvalue(), "image/png")),
        ],
        data={"mode": "manual"},
    )
    assert resp.status_code == 200


def test_manual_invalid_mask(client, colored_image):
    """Invalid mask data should return error."""
    resp = client.post(
        "/transparent-image",
        files=[
            ("image", ("c.png", colored_image, "image/png")),
            ("mask", ("bad.txt", b"not an image", "text/plain")),
        ],
        data={"mode": "manual"},
    )
    assert resp.status_code == 400
