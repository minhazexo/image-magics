"""Backward-compatible entry point.

This file delegates to the modular app/ package.
Run with: python app.py
"""

import os

# Limit threading to reduce peak memory under cgroup 2 GB limit
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["ONNX_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

from app.main import app

if __name__ == "__main__":
    import uvicorn
    from app.config import settings
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=False)
