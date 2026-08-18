# Image Magics

## Overview

Image Magics is a project for image processing and manipulation. It has two parts:

- **ImageTools (web app)** — a privacy-first, all-in-one image optimizer and image-tools website. Every tool runs **locally in your browser**; images are never uploaded. This is the primary, actively developed product.
- **Python library** — the original package for advanced image processing, still available under `src/` and `setup.py`.

> Web app product spec: [`docs/Project.md`](docs/Project.md) · Architecture: [`docs/architecture.md`](docs/architecture.md) · Processing pipeline: [`docs/image-processing.md`](docs/image-processing.md) · Privacy model: [`docs/privacy.md`](docs/privacy.md)

## ImageTools (web app)

A Next.js 14 (App Router) + React 18 + TypeScript + Tailwind app with 17 tools: optimizer, compressor, resizer, cropper, converter, background remover, transparent image, color→transparent, rotator, flipper, editor (filters + undo/redo), watermark, metadata remover, JPG→PNG, PNG→JPG, WebP converter, AVIF converter, and batch processing with ZIP download.

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

- `npm run build` — production build (fully static, 25 routes)
- `npm run typecheck` — TypeScript check
- `npm test` — Vitest unit tests

See [`web/README.md`](web/README.md) for full details.

## Python library (legacy)

The original Image Magics Python package focuses on:

- **Core Image Processing**: Basic operations like filters, transformations, and enhancements
- **AI-Powered Enhancements**: Advanced features using machine learning for image analysis and modification
- **Performance**: Optimized for speed and efficiency with optional GPU acceleration
- **Usability**: Clean API with comprehensive documentation

### Installation

```bash
pip install image-magics
```

Or with optional dependencies:

```bash
# With OpenCV support (for advanced image processing)
pip install image-magics[opencv]

# With PyTorch support (for AI features)
pip install image-magics[torch]

# With development tools
pip install image-magics[dev]
```

### Basic Usage

```python
from image_magics import Image

# Load and process an image
img = Image.load("input.jpg")
processed = img.grayscale().enhance_contrast(1.5)
processed.save("output.jpg")
```

### Features

- 📸 Image loading and saving (multiple formats)
- 🎨 Color filters and adjustments
- 🔄 Geometric transformations
- 🧠 AI-powered image analysis and enhancement
- 🧪 Comprehensive testing suite
- 📚 Detailed documentation

### Testing

Run tests with:
```bash
pytest tests/
```

## License

MIT License - see [LICENSE](LICENSE) file for details.