"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Undo2, Redo2, RefreshCcw, RotateCw, FlipHorizontal2, FlipVertical2, Download, Sparkles } from "lucide-react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { ImageUploader } from "@/components/image/uploader";
import { SeoContent } from "@/components/layout/seo-content";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DownloadButton } from "@/components/download/download-button";
import { useToast } from "@/components/ui/toast";
import { processImage, revokeUrl } from "@/lib/process/client";
import { applyFilterOptions } from "@/lib/process/engine";
import type { FilterAdjustments, ProcessingOperation, ProcessingResult, UploadedImage } from "@/lib/types";
import { DEFAULT_FILTERS } from "@/lib/types";
import { formatBytes, calculateSavings } from "@/lib/utils/format";
import { generateFileName } from "@/lib/utils/filename";

interface EditorSnapshot extends FilterAdjustments {
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

const PREVIEW_MAX = 720;

export function EditorTool() {
  const toast = useToast();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [image, setImage] = useState<UploadedImage | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<HTMLImageElement | null>(null);

  const [filters, setFilters] = useState<FilterAdjustments>({ ...DEFAULT_FILTERS });
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const [history, setHistory] = useState<EditorSnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const currentSnapshot = useCallback(
    (): EditorSnapshot => ({ ...filters, rotation, flipH, flipV }),
    [filters, rotation, flipH, flipV]
  );

  const pushHistory = useCallback((snapshot: EditorSnapshot) => {
    setHistory((prev) => {
      const next = [...prev.slice(0, historyIndex + 1), snapshot];
      return next.slice(-50);
    });
    setHistoryIndex((i) => Math.min(i + 1, 49));
  }, [historyIndex]);

  useEffect(() => {
    if (image) {
      const img = new Image();
      img.onload = () => {
        sourceRef.current = img;
        renderPreview(img, filters, rotation, flipH, flipV);
      };
      img.src = image.url;
      setResult(null);
      setHistory([]);
      setHistoryIndex(-1);
      setFilters({ ...DEFAULT_FILTERS });
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs once per uploaded image and resets all state
  }, [image]);

  const renderPreview = useCallback(
    (img: HTMLImageElement, f: FilterAdjustments, rot: number, fh: boolean, fv: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      const needsSwap = (rot % 180) !== 0;
      const dispW = needsSwap ? h : w;
      const dispH = needsSwap ? w : h;
      const scale = Math.min(1, PREVIEW_MAX / Math.max(dispW, dispH));
      const cw = Math.max(1, Math.round(dispW * scale));
      const ch = Math.max(1, Math.round(dispH * scale));
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, cw, ch);
      ctx.save();
      ctx.translate(cw / 2, ch / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.scale(fv ? -1 : 1, fh ? -1 : 1);
      const drawW = needsSwap ? h * scale : w * scale;
      const drawH = needsSwap ? w * scale : h * scale;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
      applyFilterOptions(canvas, ctx, f);
    },
    []
  );

  // Debounced live preview
  useEffect(() => {
    if (!sourceRef.current) return;
    const t = window.setTimeout(() => {
      renderPreview(sourceRef.current!, filters, rotation, flipH, flipV);
    }, 150);
    return () => window.clearTimeout(t);
  }, [filters, rotation, flipH, flipV, renderPreview]);

  const updateFilter = (key: keyof FilterAdjustments, value: number | boolean) => {
    const prev = currentSnapshot();
    setFilters((f) => ({ ...f, [key]: value }));
    // commit to history on discrete changes (not during slider drag spamming)
    if (typeof value === "boolean") pushHistory(prev);
  };

  const commitSnapshot = useCallback((next: EditorSnapshot) => {
    pushHistory(currentSnapshot());
    setFilters(next);
    setRotation(next.rotation);
    setFlipH(next.flipH);
    setFlipV(next.flipV);
  }, [pushHistory, currentSnapshot]);

  const undo = () => {
    if (historyIndex < 0) return;
    const snap = history[historyIndex];
    setHistoryIndex((i) => i - 1);
    setFilters(snap);
    setRotation(snap.rotation);
    setFlipH(snap.flipH);
    setFlipV(snap.flipV);
    setResult(null);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const snap = history[historyIndex + 1];
    setHistoryIndex((i) => i + 1);
    setFilters(snap);
    setRotation(snap.rotation);
    setFlipH(snap.flipH);
    setFlipV(snap.flipV);
    setResult(null);
  };

  const reset = () => {
    commitSnapshot({ ...currentSnapshot(), ...DEFAULT_FILTERS, rotation: 0, flipH: false, flipV: false });
    setResult(null);
  };

  const rotate = () => commitSnapshot({ ...currentSnapshot(), rotation: (rotation + 90) % 360 });
  const toggleFlipH = () => commitSnapshot({ ...currentSnapshot(), flipH: !flipH });
  const toggleFlipV = () => commitSnapshot({ ...currentSnapshot(), flipV: !flipV });

  const exportImage = async () => {
    if (!image) return;
    setProcessing(true);
    try {
      const operations: ProcessingOperation[] = [
        ...(rotation !== 0 ? [{ type: "rotate" as const, angle: rotation }] : []),
        ...(flipH ? [{ type: "flip" as const, direction: "horizontal" as const }] : []),
        ...(flipV ? [{ type: "flip" as const, direction: "vertical" as const }] : []),
        { type: "applyFilters" as const, options: filters },
      ];
      const res = await processImage(image.file, {
        operations,
        encode: { format: "png", quality: 100, sourceFormat: image.format as never, preserveTransparency: true },
        suffix: "edited",
        outputName: generateFileName(image.name, { suffix: "edited", extension: "png" }),
      });
      setResult(res);
      toast.success("Editing complete", "Your edited image is ready to download.");
    } catch {
      toast.error("Processing failed", "We couldn't process this image. Please try another file.");
    } finally {
      setProcessing(false);
    }
  };

  const handleUploaded = (incoming: UploadedImage[]) => {
    setImages(incoming);
    if (incoming.length) setImage(incoming[0]);
  };

  const slider = (key: keyof FilterAdjustments, label: string, min: number, max: number, step = 1, fmt?: (v: number) => string) => (
    <Slider
      key={key}
      label={label}
      value={typeof filters[key] === "number" ? (filters[key] as number) : 0}
      min={min}
      max={max}
      step={step}
      onChange={(v) => updateFilter(key, v)}
      formatValue={fmt}
      disabled={processing}
    />
  );

  return (
    <ToolLayout
      title="Image Editor"
      description="Adjust brightness, contrast, saturation and more with instant preview and undo/redo."
      breadcrumbs={[{ label: "Image Editor" }]}
    >
      {!image && images.length === 0 && (
        <div className="mx-auto max-w-2xl">
          <ImageUploader images={images} onChange={handleUploaded} maxFiles={1} multiple={false} />
        </div>
      )}

      {image && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-4">
            <div className="overflow-hidden rounded-xl border border-border bg-card p-4">
              <canvas ref={canvasRef} className="mx-auto block max-w-full" />
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex < 0 || processing} icon={<Undo2 className="h-4 w-4" aria-hidden />}>
                  Undo
                </Button>
                <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1 || processing} icon={<Redo2 className="h-4 w-4" aria-hidden />}>
                  Redo
                </Button>
                <Button variant="outline" size="sm" onClick={reset} icon={<RefreshCcw className="h-4 w-4" aria-hidden />} disabled={processing}>
                  Reset
                </Button>
                <Button variant="outline" size="sm" onClick={rotate} icon={<RotateCw className="h-4 w-4" aria-hidden />} disabled={processing}>
                  Rotate 90°
                </Button>
                <Button variant="outline" size="sm" onClick={toggleFlipH} icon={<FlipHorizontal2 className="h-4 w-4" aria-hidden />} disabled={processing}>
                  Flip H
                </Button>
                <Button variant="outline" size="sm" onClick={toggleFlipV} icon={<FlipVertical2 className="h-4 w-4" aria-hidden />} disabled={processing}>
                  Flip V
                </Button>
              </div>
            </div>

            {result && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-base font-semibold">Result</h2>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={result.url} alt="Edited result" className="h-full w-full object-contain" />
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Dimensions: </span><span className="font-semibold">{result.width} × {result.height}</span></p>
                    <p><span className="text-muted-foreground">Size: </span><span className="font-semibold">{formatBytes(result.fileSize)}</span></p>
                    <p><span className="text-muted-foreground">Original: </span><span className="font-semibold">{formatBytes(result.originalSize)}</span></p>
                    <DownloadButton blob={result.blob} fileName={result.fileName} label="Download" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-20 h-fit space-y-5 rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Adjustments</h2>
            {slider("brightness", "Brightness", -100, 100, 1, (v) => `${v > 0 ? "+" : ""}${v}`)}
            {slider("contrast", "Contrast", -100, 100, 1, (v) => `${v > 0 ? "+" : ""}${v}`)}
            {slider("saturation", "Saturation", -100, 100, 1, (v) => `${v > 0 ? "+" : ""}${v}`)}
            {slider("exposure", "Exposure", -100, 100, 1, (v) => `${v > 0 ? "+" : ""}${v}`)}
            {slider("blur", "Blur", 0, 20, 1, (v) => `${v}px`)}
            {slider("sharpen", "Sharpen", 0, 100, 1, (v) => `${v}%`)}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Opacity</label>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(filters.opacity * 100)}
                onChange={(e) => updateFilter("opacity", Number(e.target.value) / 100)}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
                disabled={processing}
              />
              <span className="text-right text-sm tabular-nums text-muted-foreground">{Math.round(filters.opacity * 100)}%</span>
            </div>
            <label className="flex items-center justify-between gap-2 text-sm">
              Grayscale
              <input
                type="checkbox"
                checked={filters.grayscale}
                onChange={(e) => updateFilter("grayscale", e.target.checked)}
                className="h-4 w-4 rounded accent-primary"
                disabled={processing}
              />
            </label>

            <Button className="w-full" size="lg" onClick={exportImage} disabled={processing} loading={processing} icon={<Sparkles className="h-4 w-4" aria-hidden />}>
              Export Image
            </Button>
          </aside>
        </div>
      )}

      <SeoContent
        whatItDoes="The Image Editor applies brightness, contrast, saturation, exposure, blur, sharpen, grayscale and opacity adjustments with a live preview. Every change is non-destructive with full undo/redo."
        howToUse="Upload an image, drag the adjustment sliders and watch the preview update. Rotate or flip as needed, then click Export Image to download the full-resolution result."
        supportedFormats={["JPG", "PNG", "WEBP", "GIF", "BMP"]}
        privacyNote="All editing happens locally in your browser. Nothing is uploaded and nothing is stored."
        faq={[
          { question: "Is editing non-destructive?", answer: "Yes. Your original file is never modified — edits are applied to a copy, and you can undo or redo freely until you export." },
          { question: "What resolution is exported?", answer: "The full original resolution is exported with all adjustments baked in." },
        ]}
      />
    </ToolLayout>
  );
}