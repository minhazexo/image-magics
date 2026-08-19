"""Pydantic models for API validation and OpenAPI docs."""

from __future__ import annotations

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    success: bool = True
    service: str = "bg-remover"
    version: str = "1.1.0"
    status: str = "healthy"
    model_loaded: bool = False


class ErrorResponse(BaseModel):
    success: bool = False
    error: dict = Field(
        ...,
        json_schema_extra={"example": {"code": "INVALID_IMAGE", "message": "The uploaded file is not a valid image."}},
    )
