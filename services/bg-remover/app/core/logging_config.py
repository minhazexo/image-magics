"""Structured request logging."""

from __future__ import annotations

import logging
import time
import uuid
from contextvars import ContextVar
from typing import Optional

_request_id: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


def get_request_id() -> str:
    rid = _request_id.get()
    if rid is None:
        rid = uuid.uuid4().hex[:12]
        _request_id.set(rid)
    return rid


def set_request_id(rid: str) -> None:
    _request_id.set(rid)


class RequestLogger:
    """Logs a processing request with structured fields."""

    def __init__(self) -> None:
        self.log = logging.getLogger("bg_removal")
        self.start: float = 0.0
        self.request_id: str = ""

    def begin(self, mode: str, size: str, file_size: int) -> None:
        self.start = time.perf_counter()
        self.request_id = get_request_id()
        self.log.info(
            "request_start request_id=%s mode=%s size=%s file_size=%d",
            self.request_id, mode, size, file_size,
        )

    def success(self, output_size: int, has_alpha: bool) -> None:
        duration_ms = int((time.perf_counter() - self.start) * 1000)
        self.log.info(
            "request_ok request_id=%s duration_ms=%d output_size=%d has_alpha=%s",
            self.request_id, duration_ms, output_size, has_alpha,
        )

    def failure(self, error_code: str, detail: str) -> None:
        duration_ms = int((time.perf_counter() - self.start) * 1000)
        self.log.warning(
            "request_fail request_id=%s duration_ms=%d error=%s detail=%s",
            self.request_id, duration_ms, error_code, detail,
        )
