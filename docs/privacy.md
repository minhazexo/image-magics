# ImageTools — Privacy Model

ImageTools is **local-first**: images are processed entirely inside the user's browser and are never uploaded to a server.

## What happens to your images

- **Processing**: all operations (resize, compress, convert, crop, filters, background removal, watermark, metadata stripping) run on the user's device using the Canvas API, inside a Web Worker where OffscreenCanvas is available.
- **Uploads**: there is no upload pipeline and no file-storage backend. The app is a static Next.js export with no server API for images.
- **Storage**: images exist only in browser memory (object URLs) while the user is on the page. Object URLs are revoked when an image is replaced or the page unloads. Nothing is written to disk or `localStorage`.

## What is persisted

Only UI preferences are stored in `localStorage` (via Zustand `persist`), under a single key:

- selected theme,
- last output format,
- last quality setting.

These are non-sensitive and reversible (clearing site data removes them).

## Third parties

- No third-party image-processing or storage services are used for image data.
- The AI background removal model is downloaded from a CDN (`staticimgly.com`) on first use and cached by the browser. The model runs locally — no image data is sent to any server.
- No analytics or tracking scripts are bundled.
- Google Fonts are self-hosted through `next/font` at build time — no runtime font requests.
- The PWA service worker only caches the app shell for offline use.

## User messaging

The UI tells users processing is local (homepage privacy section, `/privacy` page, and per-tool SEO copy). Because we cannot see user images, the contact page asks users not to include files in messages.

## Engineering safeguards

- File validation caps uploads at 100 MB and ~268 MP to avoid exhausting browser memory.
- Memory is released promptly: blob/object URLs are revoked after use.
- `next/font`, static generation, and lean client bundles keep the app responsive without tracking users.
