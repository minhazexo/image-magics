"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCw, RotateCcw, FlipHorizontal2, FlipVertical2, Crop, RefreshCcw, Download } from "lucide-react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { ImageUploader } from "@/components/image/uploader";
import { SeoContent } from "@/components/layout/seo-content";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/download/download-button";
import { useToast } from "@/components/ui/toast";
import { processImage, revokeUrl } from "@/lib/process/client";
import type { ProcessingResult, UploadedImage } from "@/lib/types";
import { formatBytes, calculateSavings } from "@/lib/utils/format";
import { generateFileName } from "@/lib/utils/filename";
import { cn } from "@/lib/utils/cn";

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const ASPECTS: { label: string; ratio: number | null }[] = [
  { label: "Free", ratio: null },
  { label: "1:1", ratio: 1 },
  { label: "4:3", ratio: 4 / 3 },
  { label: "3:2", ratio: 3 / 2 },
  { label: "16:9", ratio: 16 / 9 },
  { label: "9:16", ratio: 9 / 16 },
];

export function CropperTool() {
  const toast = useToast();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [image, setImage] = useState<UploadedImage | null>(null);

  // Working image state (after rotate/flip)
  const [workUrl, setWorkUrl] = useState<string | null>(null);
  const [workWidth, setWorkWidth] = useState(0);
  const [workHeight, setWorkHeight] = useState(0);

  const [aspect, setAspect] = useState<number | null>(null);
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ mode: "move" | "nw" | "ne" | "sw" | "se"; startX: number; startY: number; rect: CropRect } | null>(null);

  const display = useMemo(() => {
    if (!image || !workWidth || !workHeight) return { width: 0, height: 0, scale: 1 };
    const containerWidth = 560;
    const containerHeight = 380;
    const scale = Math.min(containerWidth / workWidth, containerHeight / workHeight) * zoom;
    return { width: workWidth * scale, height: workHeight * scale, scale };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, workWidth, workHeight, zoom]);

  const resetCrop = useCallback(
    (w: number, h: number, keepAspect: number | null) => {
      if (!w || !h) return;
      let r: CropRect;
      if (keepAspect) {
        let rw = w;
        let rh = rw / keepAspect;
        if (rh > h) {
          rh = h;
          rw = rh * keepAspect;
        }
        r = { x: Math.round((w - rw) / 2), y: Math.round((h - rh) / 2), w: Math.round(rw), h: Math.round(rh) };
      } else {
        const margin = Math.round(Math.min(w, h) * 0.1);
        r = { x: margin, y: margin, w: w - margin * 2, h: h - margin * 2 };
      }
      setCropRect(r);
    },
    []
  );

  useEffect(() => {
    if (image) {
      if (workUrl) revokeUrl(workUrl);
      setWorkUrl(image.url);
      setWorkWidth(image.width);
      setWorkHeight(image.height);
      setZoom(1);
      setResult(null);
      resetCrop(image.width, image.height, aspect);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  useEffect(() => {
    if (workWidth && workHeight) resetCrop(workWidth, workHeight, aspect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect]);

  useEffect(() => () => {
    if (result) revokeUrl(result.url);
  }, [result]);

  const applyRotation = async (angle: number) => {
    if (!image || !workWidth || !workHeight) return;
    setProcessing(true);
    try {
      const res = await processImage(image.file, {
        operations: [{ type: "rotate", angle }],
        encode: { format: "png", quality: 100, sourceFormat: image.format as never, preserveTransparency: true },
        suffix: "cropped",
      });
      if (workUrl && workUrl !== image.url) revokeUrl(workUrl);
      setWorkUrl(res.url);
      setWorkWidth(res.width);
      setWorkHeight(res.height);
      setZoom(1);
      setResult(null);
      resetCrop(res.width, res.height, aspect);
    } finally {
      setProcessing(false);
    }
  };

  const applyFlip = async (direction: "horizontal" | "vertical") => {
    if (!image || !workUrl) return;
    setProcessing(true);
    try {
      const res = await processImage(image.file, {
        operations: [{ type: "flip", direction }],
        encode: { format: "png", quality: 100, sourceFormat: image.format as never, preserveTransparency: true },
        suffix: "cropped",
      });
      if (workUrl !== image.url) revokeUrl(workUrl);
      setWorkUrl(res.url);
      setWorkWidth(res.width);
      setWorkHeight(res.height);
      setResult(null);
      resetCrop(res.width, res.height, aspect);
    } finally {
      setProcessing(false);
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>, mode: "move" | "nw" | "ne" | "sw" | "se") => {
    if (!containerRef.current) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { mode, startX: e.clientX, startY: e.clientY, rect: { ...cropRect } };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = containerRef.current;
    if (!drag || !el) return;
    const dx = (e.clientX - drag.startX) / display.scale;
    const dy = (e.clientY - drag.startY) / display.scale;
    const w = workWidth;
    const h = workHeight;
    let r = { ...drag.rect };

    if (drag.mode === "move") {
      r.x = Math.max(0, Math.min(w - r.w, drag.rect.x + dx));
      r.y = Math.max(0, Math.min(h - r.h, drag.rect.y + dy));
    } else {
      const isLeft = drag.mode === "nw" || drag.mode === "sw";
      const isTop = drag.mode === "nw" || drag.mode === "ne";
      let x0 = isLeft ? drag.rect.x + dx : drag.rect.x;
      let y0 = isTop ? drag.rect.y + dy : drag.rect.y;
      let x1 = isLeft ? drag.rect.x + drag.rect.w : drag.rect.x + drag.rect.w + dx;
      let y1 = isTop ? drag.rect.y + drag.rect.h : drag.rect.y + drag.rect.h + dy;

      x0 = Math.max(0, Math.min(w, x0));
      y0 = Math.max(0, Math.min(h, y0));
      x1 = Math.max(0, Math.min(w, x1));
      y1 = Math.max(0, Math.min(h, y1));

      if (aspect) {
        const dxAbs = Math.abs(x1 - x0);
        const dyAbs = Math.abs(y1 - y0);
        if (dxAbs / aspect > dyAbs) {
          const targetH = dxAbs / aspect;
          y1 = y0 + Math.sign(y1 - y0 || 1) * targetH;
          if (y1 < 0 || y1 > h) {
            y1 = y1 < 0 ? 0 : h;
            x1 = x0 + Math.sign(x1 - x0 || 1) * Math.abs(y1 - y0) * aspect;
          }
        } else {
          const targetW = dyAbs * aspect;
          x1 = x0 + Math.sign(x1 - x0 || 1) * targetW;
          if (x1 < 0 || x1 > w) {
            x1 = x1 < 0 ? 0 : w;
            y1 = y0 + Math.sign(y1 - y0 || 1) * (Math.abs(x1 - x0) / aspect);
          }
        }
        x1 = Math.max(0, Math.min(w, x1));
        y1 = Math.max(0, Math.min(h, y1));
      }

      const nw = Math.abs(x1 - x0);
      const nh = Math.abs(y1 - y0);
      if (nw < 8 || nh < 8) return;
      r = { x: Math.min(x0, x1), y: Math.min(y0, y1), w: nw, h: nh };
    }
    setCropRect(r);
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const applyCrop = async () => {
    if (!image || !workWidth || !workHeight) return;
    setProcessing(true);
    try {
      const res = await processImage(image.file, {
        operations: [{ type: "crop", options: { x: cropRect.x, y: cropRect.y, width: cropRect.w, height: cropRect.h, aspectRatio: aspect ?? undefined } }],
        encode: { format: "png", quality: 100, sourceFormat: image.format as never, preserveTransparency: true },
        suffix: "cropped",
        outputName: generateFileName(image.name, { suffix: "cropped", extension: "png", dimensions: { width: Math.round(cropRect.w), height: Math.round(cropRect.h) } }),
      });
      setResult(res);
      toast.success("Crop applied", "Your cropped image is ready to download.");
    } catch {
      toast.error("Cropping failed", "We couldn't process this image. Please try another file.");
    } finally {
      setProcessing(false);
    }
  };

  const resetAll = () => {
    if (workUrl && workUrl !== image?.url) revokeUrl(workUrl);
    if (image) {
      setWorkUrl(image.url);
      setWorkWidth(image.width);
      setWorkHeight(image.height);
      setZoom(1);
      setResult(null);
      resetCrop(image.width, image.height, aspect);
    }
  };

  const handleUploaded = (incoming: UploadedImage[]) => {
    setImages(incoming);
    if (incoming.length) setImage(incoming[0]);
  };

  const cropDisplay = useMemo(() => {
    if (!workWidth || !display.scale) return { left: 0, top: 0, width: 0, height: 0 };
    const padX = (display.width - workWidth * display.scale) / 2;
    const padY = (display.height - workHeight * display.scale) / 2;
    return {
      left: padX + cropRect.x * display.scale,
      top: padY + cropRect.y * display.scale,
      width: cropRect.w * display.scale,
      height: cropRect.h * display.scale,
    };
  }, [cropRect, display, workWidth, workHeight]);

  const handlePositions = useMemo(
    () => [
      { key: "nw", style: { left: -5, top: -5 }, cursor: "nwse-resize" },
      { key: "ne", style: { right: -5, top: -5 }, cursor: "nesw-resize" },
      { key: "sw", style: { left: -5, bottom: -5 }, cursor: "nesw-resize" },
      { key: "se", style: { right: -5, bottom: -5 }, cursor: "nwse-resize" },
    ],
    []
  );

  return (
    <ToolLayout
      title="Image Cropper"
      description="Crop images to any ratio with an interactive editor."
      breadcrumbs={[{ label: "Image Cropper" }]}
    >
      {!image && images.length === 0 && (
        <div className="mx-auto max-w-2xl">
          <ImageUploader images={images} onChange={handleUploaded} maxFiles={1} multiple={false} />
        </div>
      )}

      {image && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-4">
            {images.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {images.map((img) => (
                  <button
                    key={img.id}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                      image.id === img.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-muted-foreground"
                    )}
                    onClick={() => setImage(img)}
                  >
                    {img.name}
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-4">
              <div
                ref={containerRef}
                className="relative mx-auto touch-none select-none overflow-hidden rounded-lg bg-secondary"
                style={{ width: display.width || "100%", height: display.height || 0, maxWidth: "100%" }}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                {workUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={workUrl}
                    alt="Image to crop"
                    draggable={false}
                    className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                  />
                )}

                {workWidth > 0 && cropDisplay.width > 0 && (
                  <>
                    <div
                      className="absolute z-10 border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
                      style={{
                        left: cropDisplay.left,
                        top: cropDisplay.top,
                        width: cropDisplay.width,
                        height: cropDisplay.height,
                        cursor: "move",
                        touchAction: "none",
                      }}
                      onPointerDown={(e) => onPointerDown(e, "move")}
                    />
                    {handlePositions.map((hp) => (
                      <div
                        key={hp.key}
                        className="absolute z-20 h-2.5 w-2.5 rounded-full border border-white bg-primary"
                        style={{ ...hp.style, cursor: hp.cursor, touchAction: "none" }}
                        onPointerDown={(e) => onPointerDown(e, hp.key as "nw" | "ne" | "sw" | "se")}
                      />
                    ))}
                    <div className="pointer-events-none absolute z-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
                      <div className="grid h-12 w-12 grid-cols-3 grid-rows-3">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <span key={i} className="border-[0.5px] border-white/60" />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {processing && <p className="mt-3 text-center text-sm text-muted-foreground" role="status">Processing…</p>}

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => applyRotation(90)} icon={<RotateCw className="h-4 w-4" aria-hidden />} disabled={processing}>
                  Rotate 90°
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyRotation(270)} icon={<RotateCcw className="h-4 w-4" aria-hidden />} disabled={processing}>
                  Rotate −90°
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyFlip("horizontal")} icon={<FlipHorizontal2 className="h-4 w-4" aria-hidden />} disabled={processing}>
                  Flip H
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyFlip("vertical")} icon={<FlipVertical2 className="h-4 w-4" aria-hidden />} disabled={processing}>
                  Flip V
                </Button>
                <Button variant="outline" size="sm" onClick={resetAll} icon={<RefreshCcw className="h-4 w-4" aria-hidden />} disabled={processing}>
                  Reset
                </Button>
              </div>
            </div>

            {result && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-base font-semibold">Cropped image</h2>
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={result.url} alt="Cropped result" className="h-full w-full object-contain" />
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Dimensions: </span><span className="font-semibold">{result.width} × {result.height}</span></p>
                    <p><span className="text-muted-foreground">Size: </span><span className="font-semibold">{formatBytes(result.fileSize)}</span></p>
                    <p><span className="text-muted-foreground">Original: </span><span className="font-semibold">{formatBytes(result.originalSize)}</span></p>
                    <p><span className="text-muted-foreground">Reduction: </span><span className="font-semibold text-primary">{calculateSavings(result.originalSize, result.fileSize).toFixed(1)}%</span></p>
                    <DownloadButton blob={result.blob} fileName={result.fileName} size="sm" label="Download" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-20 h-fit space-y-5 rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Crop settings</h2>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Aspect ratio">
              {ASPECTS.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  role="radio"
                  aria-checked={aspect === a.ratio}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                    aspect === a.ratio ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-muted-foreground"
                  )}
                  onClick={() => setAspect(a.ratio)}
                >
                  {a.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="zoom-slider" className="text-sm font-medium">Zoom</label>
              <input
                id="zoom-slider"
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                disabled={processing}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
              />
              <span className="text-right text-sm tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
            </div>

            {workWidth > 0 && (
              <div className="rounded-lg bg-secondary p-3 text-sm">
                <p className="flex items-center gap-2 font-medium"><Crop className="h-4 w-4" aria-hidden /> Selection</p>
                <p className="mt-1 text-muted-foreground">
                  {Math.round(cropRect.w)} × {Math.round(cropRect.h)} px
                  {aspect ? ` · ${Math.round(cropRect.w)}:${Math.round(cropRect.h)}` : ""}
                </p>
              </div>
            )}

            <Button className="w-full" size="lg" onClick={applyCrop} disabled={processing} loading={processing} icon={<Crop className="h-4 w-4" aria-hidden />}>
              Apply Crop
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => { setImage(null); setImages([]); }} disabled={processing}>
              Upload Another
            </Button>
          </aside>
        </div>
      )}

      <SeoContent
        whatItDoes="The Image Cropper lets you select any region of your image — free-form or locked to common ratios like 1:1, 4:3, 16:9 and 9:16 — then crop it with a smooth interactive editor."
        howToUse="Upload an image, drag the crop box to frame your subject, choose an aspect ratio, zoom if needed, then click Apply Crop. Rotate and flip are available before cropping."
        supportedFormats={["JPG", "PNG", "WEBP", "AVIF", "GIF", "BMP"]}
        privacyNote="Cropping is done entirely in your browser. Images never leave your device."
        faq={[
          { question: "How do I keep a fixed aspect ratio?", answer: "Select one of the ratio buttons (1:1, 4:3, 16:9…) before dragging the crop handles — the selection will snap to that ratio." },
          { question: "Does cropping change the file size?", answer: "Cropping removes pixels, which usually reduces file size. You'll see the exact before/after comparison after applying." },
        ]}
      />
    </ToolLayout>
  );
}