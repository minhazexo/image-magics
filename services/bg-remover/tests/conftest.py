"""Shared test fixtures."""

from __future__ import annotations

import io
import os

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app


@pytest.fixture(scope="module")
def client():
    """FastAPI test client (module-scoped to avoid re-creating)."""
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


def _make_image(
    size: tuple[int, int] = (100, 100),
    mode: str = "RGB",
    color: tuple[int, ...] = (255, 255, 255),
) -> bytes:
    """Create an in-memory image and return its PNG bytes."""
    img = Image.new(mode, size, color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _make_product_on_white(product_color: tuple[int, int] = (200, 40, 40)) -> bytes:
    """White background with a colored product rectangle."""
    img = Image.new("RGB", (128, 128), (255, 255, 255))
    for x in range(32, 96):
        for y in range(32, 96):
            img.putpixel((x, y), product_color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _make_rgba_image(size: tuple[int, int] = (80, 80)) -> bytes:
    """RGBA image with existing partial transparency."""
    img = Image.new("RGBA", size, (100, 200, 50, 128))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _make_greyscale_mask(size: tuple[int, int] = (100, 100)) -> bytes:
    """Grayscale mask: white circle on black background."""
    img = Image.new("L", size, 0)
    cx, cy = size[0] // 2, size[1] // 2
    r = min(size) // 4
    for x in range(size[0]):
        for y in range(size[1]):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2:
                img.putpixel((x, y), 255)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def white_image():
    return _make_image(color=(255, 255, 255))


@pytest.fixture
def colored_image():
    return _make_image(color=(128, 64, 32))


@pytest.fixture
def product_on_white():
    # rembg works best with images that have dimensions divisible by 32
    return _make_product_on_white()


@pytest.fixture
def rgba_image():
    return _make_rgba_image()


@pytest.fixture
def greyscale_mask():
    return _make_greyscale_mask()
