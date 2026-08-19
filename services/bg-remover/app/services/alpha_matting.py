"""Lightweight alpha matting using trimap generation + distance transform.

This replaces pymatting (which OOMs on any system) with a fast,
memory-efficient approach that produces good hair/fur transparency.

Algorithm:
1. Generate trimap from binary mask (erode=FG, dilate=BG, gap=unknown)
2. Distance-transform interpolation in unknown region
3. Gaussian smoothing for natural transitions
"""

from __future__ import annotations

import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import distance_transform_edt, gaussian_filter


def generate_trimap(
    mask: np.ndarray,
    erode_size: int = 5,
    dilate_size: int = 12,
) -> np.ndarray:
    """Generate a trimap from a binary mask.

    Returns:
        trimap: uint8 array where 255=foreground, 0=background, 128=unknown

    The erode_size controls how far inside the subject the FG region extends.
    The dilate_size controls how far outside the subject the BG region extends.
    The gap between them becomes the unknown region for matting.
    """
    from scipy.ndimage import binary_erosion, binary_dilation

    # Binarize: anything > 128 is foreground
    binary = (mask > 128).astype(np.uint8)

    # Erode to get definite foreground (small erosion keeps hair interior)
    if erode_size > 0:
        struct_erode = np.ones((erode_size * 2 + 1, erode_size * 2 + 1), dtype=bool)
        fg = binary_erosion(binary, structure=struct_erode, iterations=1).astype(np.uint8) * 255
    else:
        fg = binary * 255

    # Dilate to get the outer boundary of BG (where BG definitely starts)
    struct_dilate = np.ones((dilate_size * 2 + 1, dilate_size * 2 + 1), dtype=bool)
    bg_outer = binary_dilation(binary, structure=struct_dilate, iterations=1).astype(np.uint8)

    # BG = outside the dilated mask (definitely background)
    bg = (1 - bg_outer) * 255

    # Unknown = everything that is neither FG nor BG
    unknown = ((fg == 0) & (bg == 0)).astype(np.uint8) * 128

    trimap = np.maximum(fg, np.maximum(bg, unknown))
    return trimap


def matte_from_trimap(
    image_rgb: np.ndarray,
    trimap: np.ndarray,
) -> np.ndarray:
    """Estimate alpha from trimap using distance-transform interpolation.

    For each unknown pixel, alpha is interpolated based on distance to
    the nearest foreground and background pixels.  The RGB values are
    used to create an edge-aware blend (closer to FG color → higher alpha).

    Args:
        image_rgb: (H, W, 3) uint8 RGB image
        trimap: (H, W) uint8 with 255=FG, 0=BG, 128=unknown

    Returns:
        alpha: (H, W) uint8 array
    """
    h, w = trimap.shape

    # Start with the trimap as initial alpha
    alpha = trimap.astype(np.float32)

    # Find unknown region
    unknown = trimap == 128

    if not unknown.any():
        return trimap

    # Create binary masks for FG and BG
    fg_mask = trimap == 255
    bg_mask = trimap == 0

    # Distance from each pixel to nearest FG and BG pixel
    # distance_transform_edt gives distance to nearest 0-valued pixel
    # So we invert: distance to FG = distance_transform_edt(~fg_mask)
    dist_to_fg = distance_transform_edt(~fg_mask).astype(np.float32)
    dist_to_bg = distance_transform_edt(~bg_mask).astype(np.float32)

    # For unknown pixels, interpolate alpha based on distance ratio
    total_dist = dist_to_fg + dist_to_bg
    total_dist = np.maximum(total_dist, 1.0)  # avoid division by zero

    # Distance-based alpha: closer to FG → higher alpha
    # Apply a power curve to push values toward 0 or 255 (less milky)
    raw_dist = 1.0 - (dist_to_fg / total_dist)
    dist_alpha = np.power(raw_dist, 0.8)  # slight S-curve

    # Edge-aware refinement: use RGB color similarity to sharpen edges
    # If a pixel's color is closer to FG neighbors, boost its alpha
    rgb = image_rgb.astype(np.float32)

    # Compute mean FG and BG colors from known regions
    if fg_mask.any():
        fg_mean_color = rgb[fg_mask].mean(axis=0)
    else:
        fg_mean_color = np.array([128.0, 128.0, 128.0])

    if bg_mask.any():
        bg_mean_color = rgb[bg_mask].mean(axis=0)
    else:
        bg_mean_color = np.array([255.0, 255.0, 255.0])

    # Color distance to FG and BG means (CIELAB would be better but RGB is fast)
    color_dist_fg = np.sqrt(np.sum((rgb - fg_mean_color) ** 2, axis=-1))
    color_dist_bg = np.sqrt(np.sum((rgb - bg_mean_color) ** 2, axis=-1))
    color_total = color_dist_fg + color_dist_bg + 1e-6
    color_alpha = 1.0 - (color_dist_fg / color_total)

    # Combine distance-based and color-based alpha
    # Weight: 50% distance (shape), 50% color (edge accuracy)
    combined = 0.5 * dist_alpha + 0.5 * color_alpha

    # Apply only to unknown region
    alpha[unknown] = np.clip(combined[unknown] * 255, 0, 255)

    # Smooth the alpha with Gaussian for natural transitions
    alpha_smooth = gaussian_filter(alpha, sigma=0.8)

    # Keep FG and BG regions from trimap (don't smooth known regions)
    alpha_smooth[fg_mask] = 255.0
    alpha_smooth[bg_mask] = 0.0

    return np.clip(alpha_smooth, 0, 255).astype(np.uint8)


def refine_mask_edges(
    img: Image.Image,
    mask: Image.Image,
    erode_size: int = 3,
    feather: float = 1.5,
) -> Image.Image:
    """Refine the edges of an existing smooth mask.

    Unlike apply_alpha_matting which replaces the mask entirely, this
    preserves the existing smooth gradients and only improves the edges.

    The mask from rembg already has smooth gradients (256 unique values).
    We should NOT throw this away — we should refine it.

    Args:
        img: Original RGB/RGBA image
        mask: Smooth mask from rembg (already has good alpha gradients)
        erode_size: How much to erode the edge boundary
        feather: Gaussian sigma for edge smoothing

    Returns:
        RGBA image with refined alpha channel
    """
    rgb = np.array(img.convert("RGB"), dtype=np.uint8)
    mask_arr = np.array(mask.convert("L"), dtype=np.float32)

    h, w = mask_arr.shape

    # Find edge region: where mask transitions from opaque to transparent
    # Edge = pixels where mask is between 10 and 245
    edge_mask = (mask_arr > 10) & (mask_arr < 245)

    if not edge_mask.any():
        # No edges to refine — mask is already clean
        result = img.convert("RGBA")
        result.putalpha(Image.fromarray(np.clip(mask_arr, 0, 255).astype(np.uint8), "L"))
        return result

    # Compute color-based alpha refinement in the edge region
    # Use the existing mask as the base, but refine with color similarity
    fg_mask = mask_arr >= 245
    bg_mask = mask_arr <= 10

    if fg_mask.any():
        fg_mean = rgb[fg_mask].mean(axis=0)
    else:
        fg_mean = np.array([128.0, 128.0, 128.0])

    if bg_mask.any():
        bg_mean = rgb[bg_mask].mean(axis=0)
    else:
        bg_mean = np.array([255.0, 255.0, 255.0])

    # Color distance in edge region
    color_dist_fg = np.sqrt(np.sum((rgb.astype(np.float32) - fg_mean) ** 2, axis=-1))
    color_dist_bg = np.sqrt(np.sum((rgb.astype(np.float32) - bg_mean) ** 2, axis=-1))
    color_total = color_dist_fg + color_dist_bg + 1e-6
    color_alpha = (1.0 - color_dist_fg / color_total) * 255

    # Blend existing mask with color-based alpha in edge region
    # Weight: 70% existing mask (it's already good), 30% color refinement
    refined = mask_arr.copy()
    refined[edge_mask] = 0.7 * mask_arr[edge_mask] + 0.3 * color_alpha[edge_mask]

    # Light Gaussian smooth on edges only for natural transitions
    from scipy.ndimage import gaussian_filter
    smoothed = gaussian_filter(refined, sigma=feather)

    # Blend smoothed edges back with original mask to avoid hard boundaries
    # Smoothed only affects the edge region; solid regions keep original values
    result_alpha = mask_arr.copy()
    result_alpha[edge_mask] = smoothed[edge_mask]

    result = img.convert("RGBA")
    result.putalpha(Image.fromarray(np.clip(result_alpha, 0, 255).astype(np.uint8), "L"))

    return result
