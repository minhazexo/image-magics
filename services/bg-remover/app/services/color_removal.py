"""Colour-removal mode — NumPy-vectorised with smooth alpha transitions.

Uses CIE76 (Euclidean in CIELAB) for perceptual colour distance,
producing smoother edges than raw RGB Euclidean distance.
"""

from __future__ import annotations

import numpy as np
from PIL import Image


def _rgb_to_lab_batch(rgb: np.ndarray) -> np.ndarray:
    """Convert (N, 3) uint8 RGB to (N, 3) float32 CIELAB.

    Uses the sRGB → XYZ (D65) → CIELAB conversion.
    """
    srgb = rgb.astype(np.float32) / 255.0

    # Linearise sRGB
    mask = srgb > 0.04045
    srgb_lin = np.where(mask, ((srgb + 0.055) / 1.055) ** 2.4, srgb / 12.92)

    # sRGB → XYZ (D65)
    M = np.array([
        [0.4124564, 0.3575761, 0.1804375],
        [0.2126729, 0.7151522, 0.0721750],
        [0.0193339, 0.1191920, 0.9503041],
    ], dtype=np.float32)
    xyz = srgb_lin @ M.T

    # Normalise to D65 white point
    xyz[:, 0] /= 0.95047
    xyz[:, 1] /= 1.00000
    xyz[:, 2] /= 1.08883

    epsilon = 216.0 / 24389.0
    kappa = 24389.0 / 27.0
    f = np.where(xyz > epsilon, np.cbrt(xyz), (kappa * xyz + 16.0) / 116.0)

    L = 116.0 * f[:, 1] - 16.0
    a = 500.0 * (f[:, 0] - f[:, 1])
    b = 200.0 * (f[:, 1] - f[:, 2])

    return np.stack([L, a, b], axis=-1)


def remove_color(
    img: Image.Image,
    target_rgb: tuple[int, int, int],
    tolerance: int,
) -> Image.Image:
    """Remove a target colour with smooth alpha transitions.

    Uses CIELAB perceptual distance for better edge quality.
    Produces gradual transparency near the tolerance boundary
    instead of a hard binary cutout.
    """
    arr = np.array(img.convert("RGBA"), dtype=np.uint8)
    h, w = arr.shape[:2]
    rgb = arr[:, :, :3].reshape(-1, 3)

    # Convert target and image pixels to LAB
    target_lab = _rgb_to_lab_batch(np.array([target_rgb], dtype=np.uint8))[0]
    pixel_lab = _rgb_to_lab_batch(rgb)

    # Euclidean distance in CIELAB (CIE76)
    diff = pixel_lab - target_lab
    dist = np.sqrt(np.sum(diff ** 2, axis=-1)).reshape(h, w)

    # Smooth alpha transition:
    # dist=0 → alpha 0, dist=tolerance → alpha ~128, dist>tolerance → keep original
    alpha = arr[:, :, 3].astype(np.float32)
    new_alpha = np.where(
        dist <= tolerance,
        # Smooth ramp: 0 at dist=0, reaches full at dist=tolerance
        np.clip(dist / max(tolerance, 1) * 255, 0, 255),
        alpha,
    )

    # Pixels very close to target → fully transparent
    new_alpha = np.where(dist < tolerance * 0.3, 0, new_alpha)

    arr[:, :, 3] = new_alpha.astype(np.uint8)
    return Image.fromarray(arr, "RGBA")
