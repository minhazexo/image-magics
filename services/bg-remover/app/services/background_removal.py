"""Auto mode — rembg segmentation + mask refinement + edge cleanup."""

from __future__ import annotations

import logging

from PIL import Image

from app.core.model import get_session
from app.services.alpha_matting import refine_mask_edges
from app.services.edge_refinement import decontaminate_matte
from rembg import remove

_log = logging.getLogger(__name__)

# rembg works best with images up to ~1024px on the longest side.
_REMBG_MAX_DIM = 1024


def _downscale_for_rembg(img: Image.Image) -> tuple[Image.Image, float]:
    """Downscale large images so rembg can process them without OOM."""
    w, h = img.size
    max_side = max(w, h)
    if max_side <= _REMBG_MAX_DIM:
        return img, 1.0
    scale = _REMBG_MAX_DIM / max_side
    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))
    _log.info("Downscaling %dx%d -> %dx%d for rembg (scale=%.2f)", w, h, new_w, new_h, scale)
    return img.resize((new_w, new_h), Image.LANCZOS), scale


def remove_background(
    img: Image.Image,
    *,
    alpha_matting: bool = True,
    fg_threshold: int = 240,
    bg_threshold: int = 10,
    erode_size: int = 10,
    edge_refinement: bool = True,
) -> Image.Image:
    """Run rembg AI removal, then apply the full edge refinement pipeline.

    Pipeline:
    1. rembg segmentation (produces smooth 256-value alpha mask)
    2. Refine mask edges with color-aware blending (preserves hair gradients)
    3. Decontaminate color fringes at edges (removes background color bleed)
    4. Directional alpha erosion (removes halos near transparent regions)
    """
    import time as _time
    orig_w, orig_h = img.size
    session = get_session()
    pipeline_steps = []

    _log.info("=== PIPELINE START: %dx%d image, alpha_matting=%s, edge_refinement=%s ===", orig_w, orig_h, alpha_matting, edge_refinement)

    # Downscale if needed to prevent OOM
    small, scale = _downscale_for_rembg(img)
    if scale < 1.0:
        pipeline_steps.append(f"downscale({scale:.2f})")
    rgb = small.convert("RGB")

    # Step 1: rembg AI segmentation
    t0 = _time.monotonic()
    out = remove(rgb, session=session, alpha_matting=False)
    mask = out.split()[3]
    _log.info("[Step 1] rembg segmentation: %.1fms, %d unique alpha values", (_time.monotonic()-t0)*1000, len(set(mask.getdata())))
    pipeline_steps.append("rembg(u2net)")

    # Step 2: Refine mask edges with color-aware blending
    if alpha_matting:
        t1 = _time.monotonic()
        refined = refine_mask_edges(
            small,
            mask,
            erode_size=max(2, erode_size // 3),
            feather=1.5,
        )
        alpha_mask = refined.split()[3]
        _log.info("[Step 2] refine_mask_edges: %.1fms, %d unique alpha values", (_time.monotonic()-t1)*1000, len(set(alpha_mask.getdata())))
        pipeline_steps.append("refine_mask_edges")
    else:
        alpha_mask = mask
        _log.info("[Step 2] refine_mask_edges: SKIPPED (alpha_matting=false)")

    # Upscale alpha back to original resolution if we downscaled
    if scale < 1.0:
        alpha_mask = alpha_mask.resize((orig_w, orig_h), Image.LANCZOS)
        _log.info("Upscaled alpha to %dx%d", orig_w, orig_h)

    # Merge: keep original RGB colours, use our refined alpha
    result = img.copy()
    result.putalpha(alpha_mask)

    # Step 3: Decontaminate color fringes
    if edge_refinement:
        t2 = _time.monotonic()
        result = decontaminate_matte(result)
        _log.info("[Step 3] decontaminate_matte: %.1fms", (_time.monotonic()-t2)*1000)
        pipeline_steps.append("decontaminate_matte")
    else:
        _log.info("[Step 3] decontaminate_matte: SKIPPED (edge_refinement=false)")

    _log.info("=== PIPELINE DONE: steps=%s ===", " -> ".join(pipeline_steps))

    return result
