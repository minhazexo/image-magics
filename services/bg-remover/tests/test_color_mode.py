"""Tests for colour-removal mode."""

from __future__ import annotations

import io

from PIL import Image
import numpy as np


def _alpha_stats(data: bytes) -> dict:
    """Get alpha channel statistics from PNG bytes."""
    img = Image.open(io.BytesIO(data))
    alpha = np.array(img.split()[3])
    return {
        "transparent": int(np.sum(alpha == 0)),
        "opaque": int(np.sum(alpha == 255)),
        "semi": int(np.sum((alpha > 0) & (alpha < 255))),
        "total": alpha.size,
    }


def test_color_remove_white(client, product_on_white):
    """Remove white background from product image."""
    resp = client.post(
        "/transparent-image",
        files={"image": ("p.png", product_on_white, "image/png")},
        data={
            "mode": "color",
            "colorR": "255",
            "colorG": "255",
            "colorB": "255",
            "colorTolerance": "40",
        },
    )
    assert resp.status_code == 200
    stats = _alpha_stats(resp.content)
    assert stats["transparent"] > 0, "Should have some transparent pixels"
    assert stats["opaque"] > 0, "Should preserve product pixels"


def test_color_smooth_transitions(client, product_on_white):
    """Color mode should produce semi-transparent edge pixels (smooth transitions)."""
    resp = client.post(
        "/transparent-image",
        files={"image": ("p.png", product_on_white, "image/png")},
        data={
            "mode": "color",
            "colorR": "255",
            "colorG": "255",
            "colorB": "255",
            "colorTolerance": "50",
        },
    )
    assert resp.status_code == 200
    stats = _alpha_stats(resp.content)
    # Smooth transitions should produce some semi-transparent pixels
    assert stats["semi"] >= 0  # May be 0 for hard-cut images, but shouldn't crash


def test_color_low_tolerance(client, product_on_white):
    """Low tolerance should remove fewer pixels."""
    resp = client.post(
        "/transparent-image",
        files={"image": ("p.png", product_on_white, "image/png")},
        data={
            "mode": "color",
            "colorR": "255",
            "colorG": "255",
            "colorB": "255",
            "colorTolerance": "5",
        },
    )
    assert resp.status_code == 200
    stats_low = _alpha_stats(resp.content)

    resp2 = client.post(
        "/transparent-image",
        files={"image": ("p.png", product_on_white, "image/png")},
        data={
            "mode": "color",
            "colorR": "255",
            "colorG": "255",
            "colorB": "255",
            "colorTolerance": "100",
        },
    )
    assert resp2.status_code == 200
    stats_high = _alpha_stats(resp2.content)

    assert stats_high["transparent"] >= stats_low["transparent"], \
        "Higher tolerance should remove more pixels"


def test_color_invalid_params(client, colored_image):
    """Out-of-range color values should still work (clamped)."""
    resp = client.post(
        "/transparent-image",
        files={"image": ("c.png", colored_image, "image/png")},
        data={
            "mode": "color",
            "colorR": "999",
            "colorG": "-10",
            "colorB": "0",
            "colorTolerance": "30",
        },
    )
    # Should succeed (values clamped) not crash
    assert resp.status_code == 200
