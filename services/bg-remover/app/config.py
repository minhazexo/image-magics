"""Centralized configuration — all tunables in one place."""

from __future__ import annotations

import os
from dataclasses import dataclass, field


def _int(env: str, default: int) -> int:
    return int(os.getenv(env, str(default)))


def _float(env: str, default: float) -> float:
    return float(os.getenv(env, str(default)))


def _str(env: str, default: str) -> str:
    return os.getenv(env, default)


@dataclass(frozen=True)
class Settings:
    # --- Limits ---
    max_image_size_mb: int = field(default_factory=lambda: _int("MAX_IMAGE_SIZE_MB", 25))
    max_image_pixels: int = field(default_factory=lambda: _int("MAX_IMAGE_PIXELS", 20_000_000))
    max_image_width: int = field(default_factory=lambda: _int("MAX_IMAGE_WIDTH", 8192))
    max_image_height: int = field(default_factory=lambda: _int("MAX_IMAGE_HEIGHT", 8192))
    max_processing_time_s: float = field(default_factory=lambda: _float("MAX_PROCESSING_TIME", 120.0))
    max_concurrent_jobs: int = field(default_factory=lambda: _int("MAX_CONCURRENT_JOBS", 4))

    # --- Rate limiting ---
    rate_limit_requests: int = field(default_factory=lambda: _int("RATE_LIMIT_REQUESTS", 30))
    rate_limit_window_s: float = field(default_factory=lambda: _float("RATE_LIMIT_WINDOW_SECONDS", 60.0))

    # --- Model ---
    model_name: str = field(default_factory=lambda: _str("REMBG_MODEL", "silueta"))

    # --- Edge refinement ---
    edge_refinement_enabled: bool = True
    decontaminate_radius: int = 5
    decontaminate_iterations: int = 3
    directional_erosion_radius: int = 3
    directional_erosion_strength: float = 0.6

    # --- Server ---
    host: str = field(default_factory=lambda: _str("HOST", "127.0.0.1"))
    port: int = field(default_factory=lambda: _int("PORT", 8765))

    @property
    def max_image_size_bytes(self) -> int:
        return self.max_image_size_mb * 1024 * 1024


settings = Settings()
