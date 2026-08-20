<div align="center">

# ImageTools

**Privacy-first image processing — entirely in your browser.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/imagetools)

</div>

---

## What is this?

ImageTools is an all-in-one image processing web app with **17 tools** that run 100% locally in your browser. No uploads. No servers. No accounts. Your images never leave your device.

### Tools

| Tool | What it does |
|------|-------------|
| **Optimizer** | Smart resize + compress + format in one click |
| **Compressor** | Reduce file size with quality control |
| **Resizer** | Resize by pixels, percentage, or presets |
| **Cropper** | Free-form or aspect-ratio crop |
| **Converter** | JPG ↔ PNG ↔ WebP ↔ AVIF |
| **Transparent Image** | AI background removal (WASM, client-side) |
| **Background Remover** | Remove backgrounds with AI segmentation |
| **Color → Transparent** | Pick a color to make transparent |
| **Rotator** | 90° rotations with preview |
| **Flipper** | Horizontal & vertical mirrors |
| **Editor** | Brightness, contrast, saturation, blur, sharpen, grayscale |
| **Watermark** | Text or image watermark with positioning |
| **Metadata Remover** | Strip EXIF data for privacy |
| **Batch Processing** | Process multiple files at once |
| **JPG → PNG** | Quick format conversion |
| **PNG → JPG** | Quick format conversion |
| **WebP Converter** | Convert to/from WebP |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 14](https://nextjs.org) (App Router, static export) |
| Language | [TypeScript](https://www.typescriptlang.org) |
| UI | [React 18](https://react.dev) + [Tailwind CSS](https://tailwindcss.com) |
| State | [Zustand](https://github.com/pmndrs/zustand) (with localStorage persistence for preferences) |
| AI | [@imgly/background-removal](https://github.com/imgly/background-removal) (ONNX Runtime WASM) |
| Validation | [Zod](https://zod.dev) |
| ZIP | [JSZip](https://stuk.github.io/jszip/) |
| Testing | [Vitest](https://vitest.dev) |
| Package Manager | [Bun](https://bun.sh) |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0+ (recommended) or Node.js 18+

### Installation

```bash
# Clone the repo
git clone https://github.com/your-org/imagetools.git
cd imagetools/web

# Install dependencies
bun install

# Start dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server (Next.js + AI service) |
| `bun run dev:web` | Start Next.js dev server only |
| `bun run build` | Production build |
| `bun run start` | Serve production build |
| `bun run typecheck` | TypeScript type checking |
| `bun run lint` | ESLint |
| `bun test` | Run Vitest tests |

---

## Architecture

```
web/
├── public/                    # PWA assets, service worker, manifest
├── src/
│   ├── app/                   # Next.js App Router (17 tool pages + layout)
│   ├── components/
│   │   ├── tools/             # One component per tool
│   │   ├── processing/        # Shared workflow, format/quality controls
│   │   ├── image/             # Uploader, comparison slider, cards
│   │   ├── layout/            # Header, footer, tool layout
│   │   └── ui/                # Button, Slider, Dialog, Tabs, Toast
│   └── lib/
│       ├── process/
│       │   ├── engine.ts      # Canvas processing engine
│       │   ├── client.ts      # Web Worker management
│       │   ├── ai.ts          # AI background removal (WASM)
│       │   └── mask.ts        # Edge refinement
│       ├── workers/           # Web Worker for background processing
│       ├── store/             # Zustand state management
│       └── utils/             # Format, filename, validation helpers
└── docs/                      # Architecture, pipeline, privacy docs
```

### How Processing Works

1. **Upload** → File validated (type, size ≤ 25 MB, pixels ≤ 20 MP)
2. **Decode** → `createImageBitmap()` (or `HTMLImageElement` fallback)
3. **Process** → Operations sent to Web Worker → Canvas/OffscreenCanvas engine
4. **Result** → Blob + dimensions + timing returned to UI
5. **Download** → User saves the processed image

All processing happens in a **Web Worker** (with main-thread fallback) to keep the UI responsive.

### AI Background Removal

The Transparent Image tool uses `@imgly/background-removal` — a WASM library that runs ONNX inference entirely in the browser:

- **Model**: `isnet_fp16` (~84 MB) downloaded from CDN on first use
- **Runtime**: ONNX Runtime Web (WASM) runs locally
- **Privacy**: No image data leaves the browser
- **Caching**: Model cached after first use — zero download on subsequent visits
- **Preloading**: Model downloads in background when user visits the page

---

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/imagetools)

1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Set **Root Directory** to `web`
4. Deploy — Vercel auto-detects Next.js

### Manual

```bash
cd web
bun install
bun run build
# Output in .next/ — deploy to any static host
```

---

## Project Structure

```
imagetools/
├── web/                       # Next.js web app (primary product)
├── services/
│   └── bg-remover/            # Python backend service (legacy, optional)
├── docs/                      # Architecture, pipeline, privacy docs
├── src/                       # Python library (legacy)
└── README.md
```

---

## Privacy

- **No uploads**: All processing runs locally in your browser
- **No tracking**: No analytics, no telemetry, no cookies
- **No storage**: Images exist only in browser memory (object URLs)
- **PWA**: Installable, works offline after first visit
- **AI model**: Downloaded from CDN, cached locally, runs via WASM

See [docs/privacy.md](docs/privacy.md) for details.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### Adding a New Tool

1. Register in `web/src/lib/tools.ts`
2. Create `web/src/components/tools/<slug>.tsx`
3. Add `web/src/app/<slug>/page.tsx` with metadata
4. Engine operations go in `web/src/lib/process/engine.ts`

---

## Documentation

- [Architecture](docs/architecture.md)
- [Image Processing Pipeline](docs/image-processing.md)
- [Privacy Model](docs/privacy.md)
- [Product Spec](docs/Project.md)
- [Web App README](web/README.md)

---

## License

MIT © [Your Name/Org]

---

<div align="center">

**Built with privacy in mind. Your images stay yours.**

</div>
