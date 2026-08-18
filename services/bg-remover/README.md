# Background Remover service (rembg)

Flask-free FastAPI wrapper around `rembg` (u2net) that produces true RGBA PNGs
with real per-pixel alpha for the `/transparent-image` Auto mode.

## Install

- Python 3.10+ (tested with 3.14)
- The first run downloads the `u2net` model (~170 MB) from GitHub into
  `~/.u2net`.

```powershell
cd services\bg-remover
python -m pip install -r requirements.txt
```

## Run

```powershell
python app.py          # listens on http://127.0.0.1:8765
```

Or with uvicorn:

```powershell
uvicorn app:app --host 127.0.0.1 --port 8765
```

## API

`POST /transparent-image` (multipart/form-data)

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| image | file | — | jpg/png/webp/bmp, ≤ 25 MB, ≤ 40 megapixels |
| mode | string | auto | only `auto` supported by this service |
| alphaMatting | string | true | `true`/`false` |
| alphaMattingForegroundThreshold | int | 240 | 1–255 |
| alphaMattingBackgroundThreshold | int | 10 | 1–255 |
| alphaMattingErodeSize | int | 10 | 0–100 |
| trimTransparent | string | false | crop fully transparent borders |
| outputFormat | string | png | png only (transparency) |

Returns `image/png` (RGBA) on success; `{ "success": false, "error": ... }`
JSON with a 4xx/5xx status on failure.

`GET /health` → service status.

## Config

Environment variables:

- `MAX_IMAGE_SIZE_MB` (default 25)
- `MAX_IMAGE_PIXELS` (default 40000000)

## Privacy

The service runs on your own machine. Images are accepted in memory, processed
locally, and never stored on disk or sent anywhere.