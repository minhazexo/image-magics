# ImageTools (web)

A privacy-first, all-in-one image optimizer and image-tools website. Everything runs **locally in the browser** — your images are never uploaded to a server.

Built from the product spec in [`docs/Project.md`](../docs/Project.md).

## Features

- **17 tools** under one interface: Optimizer, Compressor, Resizer, Cropper, Converter, Background Remover, Transparent Image, Color → Transparent, Rotator, Flipper, Editor (filters + undo/redo), Watermark, Metadata Remover, JPG → PNG, PNG → JPG, WebP Converter, AVIF Converter, and Batch Processing.
- **Local-first**: canvas/OffscreenCanvas processing in a Web Worker (with a main-thread fallback). No uploads, no accounts, no server storage.
- **Before/after comparison**: drag slider showing original vs. result with byte savings.
- **Batch + ZIP**: process many files at once and download all results as a ZIP (JSZip).
- **Privacy**: no telemetry, no tracking, no permanent storage. Persisted state is limited to UI preferences (theme, last format, last quality).
- **PWA**: installable, with an offline app shell service worker.

## Getting started

Requirements: Node.js 18+ (tested with Node 22).

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (static export-ready) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint via `next lint` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |

## Structure

```
web/
├── public/                  # PWA assets, sw.js, manifest
├── src/
│   ├── app/                 # Next.js App Router pages + layout + metadata
│   ├── components/
│   │   ├── image/           # Uploader, comparison slider, eyedropper, cards
│   │   ├── layout/          # Header, footer, tool layout, SEO content, contact form
│   │   ├── processing/      # Shared single-image workflow, format/quality controls
│   │   ├── tools/           # One component per tool (16 + batch)
│   │   └── ui/              # Button, Slider, Dialog, Tabs, Tooltip, Toast
│   └── lib/
│       ├── process/         # Engine (canvas ops), worker, client, ZIP
│       ├── store/           # Zustand store (images, queue, preferences)
│       ├── utils/           # Format, filename, dimensions, validation
│       └── tools.ts         # Tool registry (slugs, categories, metadata)
```

## Docs

- [Architecture](../docs/architecture.md)
- [Image processing pipeline](../docs/image-processing.md)
- [Privacy model](../docs/privacy.md)

## Tech stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Zustand · Zod · JSZip · Vitest.
