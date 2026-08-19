"""NumPy/SciPy-optimised edge refinement pipeline.

All pixel-level operations use vectorised NumPy instead of Python loops.
"""

from __future__ import annotations

import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import gaussian_filter, uniform_filter

from app.config import settings


def _to_rgba_array(img: Image.Image) -> np.ndarray:
    """Convert to (H, W, 4) uint8 RGBA array."""
    return np.array(img.convert("RGBA"), dtype=np.uint8)


def _from_rgba_array(arr: np.ndarray) -> Image.Image:
    return Image.fromarray(arr, "RGBA")


def refine_alpha(
    img: Image.Image,
    *,
    enabled: bool = True,
) -> Image.Image:
    """Multi-step alpha refinement: erosion -> blur -> guided contrast -> smooth."""
    if not enabled:
        return img

    alpha = img.split()[3]

    # Step 1: Slight erosion
    alpha = alpha.filter(ImageFilter.MinFilter(3))

    # Step 2: Gaussian blur
    alpha = alpha.filter(ImageFilter.GaussianBlur(radius=0.8))

    # Step 3: Guided-filter-style contrast enhancement
    guided = alpha.filter(ImageFilter.FIND_EDGES)
    guided = guided.filter(ImageFilter.MaxFilter(3))
    guided = guided.filter(ImageFilter.GaussianBlur(radius=1.0))

    a_arr = np.array(alpha, dtype=np.float32)
    g_arr = np.array(guided, dtype=np.float32) / 255.0

    midpoint = 128.0
    contrast = 1.0 + g_arr * 0.8
    refined = np.clip(midpoint + (a_arr - midpoint) * contrast, 0, 255).astype(np.uint8)

    # Mask: leave deep bg and solid fg untouched
    mask_low = a_arr < 10
    mask_high = a_arr > 245
    refined[mask_low] = a_arr[mask_low].astype(np.uint8)
    refined[mask_high] = a_arr[mask_high].astype(np.uint8)

    # Step 4: Final gentle smooth
    result_alpha = Image.fromarray(refined, "L").filter(ImageFilter.GaussianBlur(radius=0.3))

    img = img.copy()
    img.putalpha(result_alpha)
    return img


def decontaminate_matte(
    img: Image.Image,
    radius: int | None = None,
    iterations: int | None = None,
) -> Image.Image:
    """Replace background-tinted RGB at semi-transparent edges with
    Gaussian-weighted foreground colours.

    Uses scipy Gaussian filters for O(1) per-pixel cost regardless of radius.
    """
    radius = radius or settings.decontaminate_radius
    iterations = iterations or settings.decontaminate_iterations

    # For large images, skip decontamination to save memory
    w, h = img.size
    if w * h > 4_000_000:
        return img  # too large, skip to avoid OOM

    arr = _to_rgba_array(img).astype(np.float32)
    h, w = arr.shape[:2]
    sigma = radius / 2.5

    for _ in range(iterations):
        r_ch = arr[:, :, 0]
        g_ch = arr[:, :, 1]
        b_ch = arr[:, :, 2]
        a_ch = arr[:, :, 3]

        # Semi-transparent pixels to process
        process_mask = a_ch < 250
        if not process_mask.any():
            break

        # Foreground confidence mask (only use high-alpha pixels as colour source)
        fg_conf = np.where(a_ch >= 180, a_ch / 255.0, 0.0)

        # Gaussian-weighted sum of RGB using fg_conf as weight
        # scipy gaussian_filter with mode=nearest handles borders
        weight_r = r_ch * fg_conf
        weight_g = g_ch * fg_conf
        weight_b = b_ch * fg_conf

        sum_r = gaussian_filter(weight_r, sigma=sigma, mode="nearest")
        sum_g = gaussian_filter(weight_g, sigma=sigma, mode="nearest")
        sum_b = gaussian_filter(weight_b, sigma=sigma, mode="nearest")
        sum_w = gaussian_filter(fg_conf, sigma=sigma, mode="nearest")

        # Avoid division by zero
        safe_w = np.maximum(sum_w, 0.01)
        fg_r = sum_r / safe_w
        fg_g = sum_g / safe_w
        fg_b = sum_b / safe_w

        # Quadratic blend: more aggressive for low alpha
        t = a_ch / 255.0
        blend = np.where(process_mask, 1.0 - t * t, 0.0)

        arr[:, :, 0] = np.clip(r_ch + (fg_r - r_ch) * blend, 0, 255)
        arr[:, :, 1] = np.clip(g_ch + (fg_g - g_ch) * blend, 0, 255)
        arr[:, :, 2] = np.clip(b_ch + (fg_b - b_ch) * blend, 0, 255)

    return _from_rgba_array(arr.astype(np.uint8))


def directional_alpha_erosion(
    img: Image.Image,
    radius: int | None = None,
    strength: float | None = None,
) -> Image.Image:
    """Push alpha toward 0 for edge pixels near the transparent (background) side.
    Eliminates halos when fg colour ≈ bg colour (white-on-white)."""
    radius = radius or settings.directional_erosion_radius
    strength = strength or settings.directional_erosion_strength

    arr = _to_rgba_array(img)
    h, w = arr.shape[:2]
    a_ch = arr[:, :, 3].astype(np.float32)

    process_mask = (a_ch > 1) & (a_ch < 254)
    if not process_mask.any():
        return img

    # Skip for large images to avoid OOM after rembg
    if h * w > 4_000_000:
        return img

    # Count transparent and opaque neighbours using uniform filter
    a_bin_trans = (a_ch == 0).astype(np.float32)
    a_bin_opaque = (a_ch >= 250).astype(np.float32)

    k = 2 * radius + 1
    trans_count = uniform_filter(a_bin_trans, size=k, mode="constant")
    opaque_count = uniform_filter(a_bin_opaque, size=k, mode="constant")

    total = trans_count + opaque_count
    bg_ratio = np.where(total > 0, trans_count / np.maximum(total, 0.001), 0.0)

    # Apply directional erosion where bg_ratio > 0.3
    should_erode = process_mask & (bg_ratio > 0.3)
    if should_erode.any():
        reduction = np.minimum(1.0, np.power(bg_ratio, 0.7) * strength * 1.8)
        new_alpha = np.maximum(0, (a_ch * (1.0 - reduction)).astype(np.uint8))
        arr[:, :, 3] = np.where(should_erode, new_alpha, arr[:, :, 3])

    return _from_rgba_array(arr)
