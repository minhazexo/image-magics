"""Structured error handling with consistent JSON error responses."""

from __future__ import annotations

from enum import Enum
from typing import Any

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse


class ErrorCode(str, Enum):
    EMPTY_UPLOAD = "EMPTY_UPLOAD"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    INVALID_IMAGE = "INVALID_IMAGE"
    UNSUPPORTED_FORMAT = "UNSUPPORTED_FORMAT"
    IMAGE_TOO_LARGE = "IMAGE_TOO_LARGE"
    INVALID_MODE = "INVALID_MODE"
    INVALID_PARAMETER = "INVALID_PARAMETER"
    MASK_REQUIRED = "MASK_REQUIRED"
    PROCESSING_TIMEOUT = "PROCESSING_TIMEOUT"
    PROCESSING_FAILED = "PROCESSING_FAILED"
    INTERNAL_ERROR = "INTERNAL_ERROR"


_MESSAGES: dict[ErrorCode, str] = {
    ErrorCode.EMPTY_UPLOAD: "The uploaded file is empty.",
    ErrorCode.FILE_TOO_LARGE: "The uploaded file exceeds the size limit.",
    ErrorCode.INVALID_IMAGE: "The uploaded file is not a valid image.",
    ErrorCode.UNSUPPORTED_FORMAT: "The image format is not supported.",
    ErrorCode.IMAGE_TOO_LARGE: "The image dimensions exceed the allowed limit.",
    ErrorCode.INVALID_MODE: "The specified mode is not valid.",
    ErrorCode.INVALID_PARAMETER: "One or more parameters are out of range.",
    ErrorCode.MASK_REQUIRED: "A mask image is required for manual mode.",
    ErrorCode.PROCESSING_TIMEOUT: "Image processing exceeded the time limit.",
    ErrorCode.PROCESSING_FAILED: "Image processing failed.",
    ErrorCode.INTERNAL_ERROR: "An unexpected internal error occurred.",
}


def error_response(code: ErrorCode, status: int = 400, detail: str | None = None) -> HTTPException:
    """Create a structured HTTPException with error code and message."""
    message = detail or _MESSAGES.get(code, "Unknown error.")
    return HTTPException(
        status_code=status,
        detail={"success": False, "error": {"code": code.value, "message": message}},
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Global handler that formats all HTTPExceptions consistently."""
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": {"code": "UNKNOWN", "message": str(exc.detail)}},
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all: never expose stack traces to clients."""
    import logging
    logging.getLogger(__name__).exception("Unhandled exception")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {"code": ErrorCode.INTERNAL_ERROR.value, "message": "An unexpected error occurred."},
        },
    )
