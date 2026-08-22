<div align="center">

  <img src="public/logo.png" alt="ImageTools Logo" width="100" />

  # ImageTools

  **Privacy-first image processing — entirely in your browser.**

  [![Live Demo](https://img.shields.io/badge/Live_Demo-imtools.vercel.app-00C853?style=for-the-badge&logo=vercel&logoColor=white)](https://imtools.vercel.app)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
  [![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## 🌐 Live Demo

**[imtools.vercel.app](https://imtools.vercel.app)**

---

## 📖 What is this?

ImageTools is an all-in-one image processing web app with **15 tools** that run 100% locally in your browser. **No uploads. No servers. No accounts.** Your images never leave your device.

Built for developers, designers, photographers, and anyone who needs quick, private image manipulation without the hassle of uploading files to unknown servers.

### Why ImageTools?

- 🔒 **100% Private** — All processing happens in your browser. Nothing is uploaded anywhere.
- ⚡ **Fast** — Web Worker-based processing keeps the UI responsive even with large images.
- 🤖 **AI-Powered** — Background removal runs a full ONNX model directly in the browser via WASM.
- 📱 **Responsive** — Works beautifully on desktop, tablet, and mobile.
- 🆓 **Free & Open Source** — MIT licensed. No accounts, no paywalls.

---

## 🛠️ Tools

| Category | Tool | Description |
|:---------|:-----|:------------|
| **Optimize** | [Image Optimizer](https://imtools.vercel.app/optimizer) | Smart resize + compress + format in one click |
| | [Image Compressor](https://imtools.vercel.app/compressor) | Reduce file size with quality control |
| | [Image Resizer](https://imtools.vercel.app/resizer) | Resize by pixels, percentage, or social media presets |
| **Edit** | [Image Cropper](https://imtools.vercel.app/cropper) | Free-form or aspect-ratio crop with zoom, rotate & flip |
| | [Image Rotator](https://imtools.vercel.app/rotator) | 90° rotations and flips with instant preview |
| | [Image Editor](https://imtools.vercel.app/editor) | Brightness, contrast, saturation, blur, sharpen, grayscale with undo/redo |
| | [Watermark Tool](https://imtools.vercel.app/watermark) | Text or image watermarks with full positioning control |
| **Convert** | [Image Converter](https://imtools.vercel.app/converter) | JPG ↔ PNG ↔ WebP with quality control |
| | [JPG to PNG](https://imtools.vercel.app/jpg-to-png) | Lossless JPG → PNG conversion |
| | [PNG to JPG](https://imtools.vercel.app/png-to-jpg) | PNG → JPG with configurable background color |
| | [WEBP Converter](https://imtools.vercel.app/webp-converter) | Convert any image to/from WebP |
| **Background** | [Transparent Image Maker](https://imtools.vercel.app/transparent-image) | AI background removal (WASM, client-side) + manual mask editor |
| | [Color to Transparent](https://imtools.vercel.app/color-to-transparent) | Pick a color with eyedropper and make it transparent |
| **Privacy** | [Metadata Remover](https://imtools.vercel.app/metadata-remover) | Strip EXIF, GPS, and camera data from photos |
| **Batch** | [Batch Processor](https://imtools.vercel.app/batch) | Process multiple files at once and download as ZIP |

---

## ⚡ Tech Stack

| Layer | Technology |
|:------|:-----------|
| Framework | [Next.js 14](https://nextjs.org) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org) 5.x |
| UI | [React 18](https://react.dev) + [Tailwind CSS](https://tailwindcss.com) 3.x |
| State | [Zustand](https://github.com/pmndrs/zustand) with localStorage persistence |
| AI | [@imgly/background-removal](https://github.com/imgly/background-removal) (ONNX Runtime WASM) |
| Validation | [Zod](https://zod.dev) |
| ZIP | [JSZip](https://stuk.github.io/jszip/) |
| Icons | [Lucide React](https://lucide.dev) |
| Testing | [Vitest](https://vitest.dev) |
| Package Manager | [Bun](https://bun.sh) |

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0+ (recommended) or Node.js 18+

### Installation

```bash
# Clone the repo
git clone https://github.com/minhazexo/image-magics.git
cd image-magics

# Install dependencies
bun install

# Start dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 Scripts

| Command | Description |
|:--------|:------------|
| `bun run dev` | Start dev server (Next.js + AI service) |
| `bun run dev:web` | Start Next.js dev server only |
| `bun run build` | Production build |
| `bun run start` | Serve production build |
| `bun run typecheck` | TypeScript type checking |
| `bun run lint` | ESLint |
| `bun test` | Run Vitest tests |
| `bun run test:watch` | Run Vitest in watch mode |

---

## 🏗️ Architecture

```
src/
├── app/                         # Next.js App Router (15 tool pages)
│   ├── layout.tsx               # Root layout with header, footer, theme
│   ├── page.tsx                 # Homepage
│   └── <slug>/page.tsx          # One page per tool
│
├── components/
│   ├── tools/                   # One component per tool (15 total)
│   │   ├── batch.tsx
│   │   ├── compressor.tsx
│   │   ├── converter.tsx
│   │   ├── cropper.tsx
│   │   ├── editor.tsx
│   │   ├── metadata-remover.tsx
│   │   ├── optimizer.tsx
│   │   ├── resizer.tsx
│   │   ├── rotator.tsx
│   │   ├── transparent-image.tsx
│   │   ├── watermark.tsx
│   │   └── color-to-transparent.tsx
│   │
│   ├── processing/              # Shared processing UI
│   │   ├── tool-workflow.tsx    # Upload → Process → Download pipeline
│   │   ├── mask-editor.tsx      # Manual transparency mask editor
│   │   ├── format-selector.tsx  # Output format picker
│   │   ├── quality-slider.tsx   # Quality control
│   │   └── resize-controls.tsx  # Dimension inputs
│   │
│   ├── image/                   # Image-specific components
│   │   ├── uploader.tsx         # Drag & drop upload zone
│   │   ├── image-card.tsx       # Thumbnail card
│   │   ├── image-comparison.tsx # Before/after slider
│   │   └── eyedropper.tsx      # Color picker
│   │
│   ├── layout/                  # App shell
│   │   ├── header.tsx           # Navigation header
│   │   ├── footer.tsx           # Site footer
│   │   ├── tool-layout.tsx      # Per-tool page wrapper
│   │   └── seo-content.tsx      # SEO-friendly static content
│   │
│   ├── ui/                      # Reusable primitives
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── slider.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   └── tooltip.tsx
│   │
│   ├── download/                # Download buttons
│   └── providers/               # Theme, client-only wrappers
│
├── hooks/
│   └── use-scroll-reveal.ts     # Scroll animation hook
│
└── lib/
    ├── process/                 # Core processing engine
    │   ├── engine.ts            # Canvas operations (resize, crop, filters, etc.)
    │   ├── client.ts            # Web Worker management
    │   ├── ai.ts                # AI background removal (WASM/ONNX)
    │   ├── mask.ts              # Edge refinement & decontamination
    │   └── zip.ts               # ZIP archive creation
    │
    ├── workers/
    │   └── imageWorker.ts       # Web Worker for background processing
    │
    ├── store/
    │   └── useImageStore.ts     # Zustand state management
    │
    ├── utils/                   # Helpers
    │   ├── cn.ts                # Tailwind class merging
    │   ├── dimensions.ts        # Pixel/percent calculations
    │   ├── exif.ts              # EXIF orientation handling
    │   ├── filename.ts          # Filename sanitization
    │   ├── format.ts            # Format detection & clamp
    │   └── validate.ts          # File validation (type, size, pixels)
    │
    ├── tools.ts                 # Tool registry (metadata, icons, categories)
    ├── types.ts                 # Shared TypeScript types
    └── seo.ts                   # SEO metadata helpers
```

### How Processing Works

```
Upload → Validate → Decode → Process (Web Worker) → Result → Download
```

1. **Upload** — File validated (type, size ≤ 25 MB, pixels ≤ 20 MP)
2. **Decode** — `createImageBitmap()` for off-main-thread decoding
3. **Process** — Operations dispatched to a Web Worker via `postMessage`
4. **Engine** — Canvas / OffscreenCanvas operations (resize, crop, filters, format)
5. **Result** — Blob + dimensions + timing returned to UI
6. **Download** — User saves the processed image

All processing runs in a **Web Worker** (with main-thread fallback) to keep the UI responsive during heavy operations.

### AI Background Removal

The Transparent Image tool uses `@imgly/background-removal` — a WASM library that runs ONNX inference entirely in the browser:

- **Model**: `isnet_fp16` (~84 MB) downloaded from CDN on first use
- **Runtime**: ONNX Runtime Web (WASM) runs locally
- **Privacy**: No image data leaves the browser
- **Caching**: Model cached after first use — zero download on subsequent visits
- **Preloading**: Model downloads in background when user visits the page
- **Mask Editor**: Manual brush-based editor for fine-tuning the AI output

---

## 🚢 Deployment

### Vercel (Recommended)

The live site is deployed on Vercel: **[imtools.vercel.app](https://imtools.vercel.app)**

1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Deploy — Vercel auto-detects Next.js

### Manual

```bash
bun install
bun run build
# Output in .next/ — deploy to any static host
```

---

## 🔒 Privacy

| Principle | Implementation |
|:----------|:---------------|
| **No uploads** | All processing runs locally in your browser |
| **No tracking** | No analytics, no telemetry, no cookies |
| **No storage** | Images exist only in browser memory (object URLs) |
| **Offline-capable** | PWA manifest, works offline after first visit |
| **AI runs locally** | ONNX model downloaded from CDN, cached, runs via WASM |

---

## 🧪 Testing

```bash
# Run all tests
bun test

# Watch mode
bun run test:watch

# Type check
bun run typecheck

# Lint
bun run lint
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### Adding a New Tool

1. Register the tool in `src/lib/tools.ts`
2. Create the tool component in `src/components/tools/<slug>.tsx`
3. Add a page in `src/app/<slug>/page.tsx` with metadata
4. Add any new engine operations in `src/lib/process/engine.ts`

---

## 📄 License

MIT © [minhazexo](https://github.com/minhazexo)

---

<div align="center">

**Built with privacy in mind. Your images stay yours.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/minhazexo/image-magics)

</div>
