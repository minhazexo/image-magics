"""Backward-compatible entry point.

This file delegates to the modular app/ package.
Run with: python app.py
"""

from app.main import app

if __name__ == "__main__":
    import uvicorn
    from app.config import settings
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=False)
