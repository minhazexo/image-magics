"""Tests for input validation and error handling."""

from __future__ import annotations


def test_empty_upload(client):
    resp = client.post(
        "/transparent-image",
        files={"image": ("empty.png", b"", "image/png")},
    )
    assert resp.status_code == 400
    data = resp.json()
    assert data["success"] is False
    assert data["error"]["code"] == "EMPTY_UPLOAD"


def test_text_file_not_image(client):
    resp = client.post(
        "/transparent-image",
        files={"image": ("test.txt", b"hello world", "text/plain")},
    )
    assert resp.status_code == 400
    data = resp.json()
    assert data["success"] is False
    assert data["error"]["code"] in ("INVALID_IMAGE", "UNSUPPORTED_FORMAT")


def test_oversized_file(client):
    # Create a file larger than max (simulate with dummy bytes)
    big = b"\x89PNG\r\n\x1a\n" + b"\x00" * (26 * 1024 * 1024)
    resp = client.post(
        "/transparent-image",
        files={"image": ("big.png", big, "image/png")},
    )
    assert resp.status_code == 400
    data = resp.json()
    assert data["success"] is False
    assert data["error"]["code"] == "FILE_TOO_LARGE"


def test_invalid_mode(client, colored_image):
    resp = client.post(
        "/transparent-image",
        files={"image": ("img.png", colored_image, "image/png")},
        data={"mode": "invalid_mode"},
    )
    assert resp.status_code == 400
    data = resp.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_MODE"


def test_error_schema(client):
    """All errors follow the consistent {success, error: {code, message}} schema."""
    resp = client.post(
        "/transparent-image",
        files={"image": ("empty.png", b"", "image/png")},
    )
    data = resp.json()
    assert "success" in data
    assert "error" in data
    assert "code" in data["error"]
    assert "message" in data["error"]
