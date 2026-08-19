"""Thread-safe, lazy-initialised rembg model session."""

from __future__ import annotations

import logging
import threading
from typing import Any, Optional

from rembg import new_session

from app.config import settings

_log = logging.getLogger(__name__)

_lock = threading.Lock()
_session: Any = None


def get_session() -> Any:
    """Return the shared ONNX Runtime session (created once, lazily)."""
    global _session
    if _session is not None:
        return _session
    with _lock:
        if _session is not None:
            return _session
        _log.info("Initialising rembg session model=%s", settings.model_name)
        _session = new_session(settings.model_name)
        _log.info("rembg session ready")
        return _session


def is_ready() -> bool:
    """Non-blocking readiness check — True once the model has been loaded."""
    return _session is not None
