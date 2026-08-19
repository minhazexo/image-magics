"""Application factory — creates and configures the FastAPI app."""

from __future__ import annotations

import logging
import threading

from fastapi import FastAPI
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.errors import http_exception_handler, unhandled_exception_handler
from app.api.routes import router


def _configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )


def create_app() -> FastAPI:
    _configure_logging()

    app = FastAPI(
        title="bg-remover",
        version="1.1.0",
        description="Production-ready background removal API powered by rembg/U2Net.",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Exception handlers
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routes
    app.include_router(router)

    # Pre-load model in background so first request isn't slow
    def _warmup():
        try:
            from app.core.model import get_session
            get_session()
        except Exception:
            logging.getLogger(__name__).warning("Model warmup failed — will retry on first request")

    threading.Thread(target=_warmup, daemon=True).start()

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=False)
