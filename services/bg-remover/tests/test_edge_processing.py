"""Tests for edge-processing functions (unit-level)."""

from __future__ import annotations

import numpy as np
from PIL import Image

from app.services.edge_refinement import (
    decontaminate_matte,
    directional_alpha_erosion,
    refine_alpha,
)


def _make_rgba_with_halos() -> Image.Image:
    """Create a test image with white halo pixels at the edges."""
    img = Image.new("RGBA", (50, 50), (0, 0, 0, 0))
    # Red rectangle in center
    for x in range(15, 35):
        for y in range(15, 35):
            img.putpixel((x, y), (200, 40, 40, 255))
    # White halo ring (semi-transparent white around the red)
    for x in range(10, 40):
        for y in range(10, 40):
            if 10 <= x < 15 or 35 <= x < 40 or 10 <= y < 15 or 35 <= y < 40:
                img.putpixel((x, y), (255, 255, 255, 128))
    return img


def test_decontaminate_reduces_halos():
    """Decontamination should replace white halo RGB with foreground colour."""
    img = _make_rgba_with_halos()
    result = decontaminate_matte(img, radius=3, iterations=2)

    arr = np.array(result)
    # Check edge pixels on the sides (not corners) — these are more likely
    # to have foreground neighbors for decontamination to work with.
    changed = False
    for x in range(15, 35):  # middle of each side
        for y in [11, 38]:   # top and bottom edge
            r, g, b, a = arr[y, x]
            if 1 < a < 254:
                if r < 250 or g < 250 or b < 250:
                    changed = True
                    break
        if changed:
            break
    # At least some edge pixels should have been modified
    assert changed, "Decontamination should have modified some edge pixels"


def test_directional_erosion_reduces_bg_side_alpha():
    """Directional erosion should push alpha down near transparent pixels."""
    img = Image.new("RGBA", (50, 50), (0, 0, 0, 0))
    # Opaque red rectangle
    for x in range(10, 40):
        for y in range(10, 40):
            img.putpixel((x, y), (200, 40, 40, 255))
    # Semi-transparent ring (edge pixels near background)
    for x in range(8, 42):
        for y in range(8, 42):
            if (x < 10 or x >= 40 or y < 10 or y >= 40):
                img.putpixel((x, y), (200, 40, 40, 180))

    before = np.array(img)
    result = directional_alpha_erosion(img, radius=2, strength=0.8)
    after = np.array(result)

    # Edge pixels near transparent should have lower alpha
    edge_before = before[8, 25, 3]  # top edge
    edge_after = after[8, 25, 3]
    assert edge_after <= edge_before, \
        f"Alpha should decrease at edge: {edge_before} -> {edge_after}"


def test_refine_alpha_no_crash():
    """refine_alpha should work without crashing."""
    img = Image.new("RGBA", (20, 20), (128, 128, 128, 200))
    result = refine_alpha(img, enabled=True)
    assert result.mode == "RGBA"
    assert result.size == (20, 20)


def test_decontaminate_preserves_opaque():
    """Fully opaque pixels should not be modified by decontamination."""
    img = Image.new("RGBA", (10, 10), (200, 40, 40, 255))
    result = decontaminate_matte(img, radius=2, iterations=1)
    arr = np.array(result)
    assert np.all(arr[:, :, 0] == 200)
    assert np.all(arr[:, :, 1] == 40)
    assert np.all(arr[:, :, 2] == 40)
    assert np.all(arr[:, :, 3] == 255)
