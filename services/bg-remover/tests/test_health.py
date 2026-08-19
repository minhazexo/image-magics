"""Tests for GET /health."""

from __future__ import annotations


def test_health_success(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["service"] == "bg-remover"
    assert data["version"] == "1.1.0"
    assert "status" in data
    assert "model_loaded" in data
