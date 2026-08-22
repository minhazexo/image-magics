"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Droplet, Pencil, Upload, Loader2, Check } from "lucide-react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { SeoContent } from "@/components/layout/seo-content";
import { ImageDropzone } from "@/components/image/uploader";
import { Dialog } from "@/components/ui/dialog";
import { Tabs } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/download/download-button";
import { MaskEditor } from "@/components/processing/mask-editor";
import { removeBackgroundViaAi, verifyTransparency, preloadAiModel, MAX_IMAGE_BYTES, type TransparencyStats } from "@/lib/process/ai";
import { removeColorFromCanvas, softenAlpha } from "@/lib/process/engine";
import { decontaminateMatte } from "@/lib/process/mask";
import { readExifOrientation, drawWithExifOrientation } from "@/lib/utils/exif";
import { downloadBlob } from "@/lib/process/client";
import { cn } from "@/lib/utils/cn";

type TiMode = "auto" | "color" | "manual";
type PreviewBg = "checker" | "white" | "black" | "custom";

interface TiResult {
  blob: Blob;
  url: string;
  fileName: string;
}

/** AI processing step messages (fallback if no progress callback) */
const AI_STEPS = [
  "Loading AI model in browser…",
  "Running segmentation model…",
  "Generating alpha mask…",
  "Encoding PNG…",
];

function parseColor(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const v = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode PNG."))), "image/png");
  });
}

async function toCanvas(blob: Blob): Promise<{ canvas: HTMLCanvasElement; w: number; h: number }> {
  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0);
  bmp.close?.();
  return { canvas, w: bmp.width, h: bmp.height };
}

/** Re-encodes an RGBA blob as PNG and applies professional edge refinement. */
async function decontaminate(blob: Blob): Promise<Blob> {
  const { canvas } = await toCanvas(blob);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  decontaminateMatte(canvas, ctx, 4, 5);
  softenAlpha(canvas, ctx, 0.8);
  return canvasToPng(canvas);
}

export function TransparentImageTool() {
  // Start downloading the AI model in the background as soon as the page loads.
  // By the time the user uploads an image, the model is already cached.
  useEffect(() => {
    preloadAiModel();
  }, []);
  const [file, setFile] = useState<File | null>(null);
  const [sourceCanvas, setSourceCanvas] = useState<HTMLCanvasElement | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [result, setResult] = useState<TiResult | null>(null);
  const [stats, setStats] = useState<TransparencyStats | null>(null);
  const [mode, setMode] = useState<TiMode>("auto");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string | null>(null);

  // Auto options
  const [alphaMatting, setAlphaMatting] = useState(true);
  const [edgeRefinement, setEdgeRefinement] = useState(true);
  const [trim, setTrim] = useState(false);

  // Color options
  const [color, setColor] = useState("#ffffff");
  const [tolerance, setTolerance] = useState(40);
  const [edgeSmoothing, setEdgeSmoothing] = useState(0);
  const [feather, setFeather] = useState(2);

  // Preview background
  const [bg, setBg] = useState<PreviewBg>("checker");
  const [bgColor, setBgColor] = useState("#ff00ff");

  // Manual editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorCanvas, setEditorCanvas] = useState<HTMLCanvasElement | null>(null);
  const resultBlobRef = useRef<Blob | null>(null);

  const loadFile = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Unsupported file type. Please upload an image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image exceeds the 25 MB limit. Please upload a smaller file.");
      return;
    }
    setBusy(true);
    setProcessingStep("Decoding image…");
    setError(null);
    setNotice(null);
    setResult(null);
    setStats(null);
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Could not decode image."));
        img.src = url;
      });
      URL.revokeObjectURL(url);
      const orientation = await readExifOrientation(file);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      drawWithExifOrientation(canvas, ctx, img, orientation);
      setSourceCanvas(canvas);
      setSourceUrl(canvas.toDataURL("image/png"));
      setFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load image.");
    } finally {
      setBusy(false);
      setProcessingStep(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyResult = useCallback(async (blob: Blob) => {
    setProcessingStep("Verifying transparency…");
    const url = URL.createObjectURL(blob);
    setResult((prev) => {
      if (prev?.url.startsWith("blob:")) URL.revokeObjectURL(prev.url);
      return null;
    });
    resultBlobRef.current = blob;
    const nextStats = await verifyTransparency(blob).catch(() => null);
    setStats(nextStats);
    const base = (file?.name.replace(/\.[^.]+$/, "") ?? "image") + "-transparent.png";
    setResult({ blob, url, fileName: base });
    if (mode === "auto" && nextStats && !nextStats.hasAlpha) {
      setNotice("No transparency detected in the result — the background may not have been removed. Try again or switch modes.");
    } else {
      setNotice(null);
    }
    setProcessingStep(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, file]);

  const run = useCallback(async () => {
    if (busy) return;
    if (mode === "auto" && !file) {
      setError("Please upload an image first.");
      return;
    }
    if (mode === "color" && !sourceCanvas) {
      setError("Please upload an image first.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "auto") {
        setProcessingStep("Loading AI model in browser…");
        const aiResult = await removeBackgroundViaAi(file!, {
          alphaMatting,
          edgeRefinement,
          trimTransparent: trim,
          onProgress: (step) => setProcessingStep(step),
        });
        console.log("[transparent-image] Pipeline:", aiResult.pipeline);
        setNotice(`Pipeline: ${aiResult.pipeline}`);
        setProcessingStep("Applying edge refinement…");
        const decontaminated = await decontaminate(aiResult.blob);
        await applyResult(decontaminated);
      } else if (mode === "color") {
        setProcessingStep("Removing color…");
        const src = sourceCanvas!;
        const canvas = document.createElement("canvas");
        canvas.width = src.width;
        canvas.height = src.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(src, 0, 0);
        removeColorFromCanvas(canvas, ctx, { color: parseColor(color), tolerance, edgeSmoothing });
        if (feather > 0) softenAlpha(canvas, ctx, feather);
        setProcessingStep("Encoding PNG…");
        const blob = await canvasToPng(canvas);
        await applyResult(blob);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed.");
      setProcessingStep(null);
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, mode, file, sourceCanvas, alphaMatting, edgeRefinement, trim, color, tolerance, edgeSmoothing, feather, applyResult]);

  const openEditor = useCallback(async () => {
    if (!resultBlobRef.current) return;
    const bmp = await createImageBitmap(resultBlobRef.current);
    const canvas = document.createElement("canvas");
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bmp, 0, 0);
    bmp.close?.();
    setEditorCanvas(canvas);
    setEditorOpen(true);
  }, []);

  const commitEditor = useCallback(
    async (imageData: ImageData) => {
      const canvas = document.createElement("canvas");
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext("2d")!;
      ctx.putImageData(imageData, 0, 0);
      const blob = await canvasToPng(canvas);
      setEditorOpen(false);
      await applyResult(blob);
    },
    [applyResult]
  );

  const bgStyle = useMemo(() => {
    if (bg === "white") return { backgroundColor: "#ffffff" };
    if (bg === "black") return { backgroundColor: "#000000" };
    if (bg === "custom") return { backgroundColor: bgColor };
    return {
      backgroundImage: "repeating-conic-gradient(hsl(var(--secondary)) 0% 25%, hsl(var(--background)) 0% 50%)",
      backgroundSize: "20px 20px",
    };
  }, [bg, bgColor]);

  const runLabel = mode === "auto" ? "Remove Background (AI)" : "Make Transparent";
  const hasResult = Boolean(result);

  return (
    <ToolLayout
      title="Transparent Image"
      description="Remove backgrounds with AI or a chosen color, then export a transparent PNG with a real alpha channel."
      breadcrumbs={[{ label: "Transparent Image" }]}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {!file ? (
          /* ── Upload state ──────────────────────────────────── */
          <div className="mx-auto max-w-xl space-y-4">
            <ImageDropzone onFiles={(files) => void loadFile(files)} busy={busy} maxFiles={1} multiple={false}>
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Upload className="h-8 w-8 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium">Upload an image to make transparent</p>
                <p className="text-xs text-muted-foreground">JPG, PNG or WebP up to 25 MB</p>
              </div>
            </ImageDropzone>
          </div>
        ) : (
          /* ── Two-column layout ─────────────────────────────── */
          <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            {/* Controls */}
            <div className="space-y-4 rounded-xl border border-border bg-card p-5">
              {/* Source image thumbnail + replace */}
              <div className="flex items-center gap-3">
                {sourceUrl && (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sourceUrl} alt={file.name} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{file.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {sourceCanvas?.width}×{sourceCanvas?.height}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setSourceCanvas(null);
                    setSourceUrl(null);
                    setResult(null);
                    setStats(null);
                    setError(null);
                    setNotice(null);
                    setProcessingStep(null);
                  }}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Replace
                </button>
              </div>

              <div className="divider" />

              {/* Mode selector */}
              <div>
                <span className="section-label">Mode</span>
                <Tabs
                  className="mt-2"
                  items={[
                    { label: "Auto", value: "auto", icon: <Sparkles className="h-3.5 w-3.5" aria-hidden /> },
                    { label: "Color", value: "color", icon: <Droplet className="h-3.5 w-3.5" aria-hidden /> },
                    { label: "Manual", value: "manual", icon: <Pencil className="h-3.5 w-3.5" aria-hidden /> },
                  ]}
                  value={mode}
                  onChange={(v) => {
                    setMode(v as TiMode);
                    setError(null);
                  }}
                />
              </div>

              {/* Auto options */}
              {mode === "auto" && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-center justify-between gap-4 text-[13px]">
                      <span className="font-medium">Alpha matting</span>
                      <input
                        type="checkbox"
                        checked={alphaMatting}
                        onChange={(e) => setAlphaMatting(e.target.checked)}
                        disabled={busy}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-4 text-[13px]">
                      <span className="font-medium">Edge refinement</span>
                      <input
                        type="checkbox"
                        checked={edgeRefinement}
                        onChange={(e) => setEdgeRefinement(e.target.checked)}
                        disabled={busy}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-4 text-[13px]">
                      <span className="font-medium">Trim transparent borders</span>
                      <input
                        type="checkbox"
                        checked={trim}
                        onChange={(e) => setTrim(e.target.checked)}
                        disabled={busy}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    AI handles photos with hair, fur and glass best. Alpha matting refines fine edges. Edge cleanup removes white halos.
                  </p>
                </div>
              )}

              {/* Color options */}
              {mode === "color" && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ti-color" className="text-[13px] font-medium">Target color</label>
                    <div className="flex items-center gap-3">
                      <input
                        id="ti-color"
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        disabled={busy}
                        className="h-9 w-14 cursor-pointer rounded-md border border-input bg-background"
                      />
                      <code className="rounded-md bg-secondary px-2 py-1 text-[13px] font-medium">{color.toUpperCase()}</code>
                    </div>
                  </div>
                  <Slider label="Tolerance" value={tolerance} min={0} max={100} onChange={setTolerance} formatValue={(v) => `${v}`} disabled={busy} />
                  <Slider label="Edge smoothing" value={edgeSmoothing} min={0} max={100} onChange={setEdgeSmoothing} formatValue={(v) => `${v}`} disabled={busy} />
                  <Slider label="Feather" value={feather} min={0} max={8} onChange={setFeather} formatValue={(v) => `${v}px`} disabled={busy} />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Lower tolerance removes only the exact color. Feather softens transparent edges.
                  </p>
                </div>
              )}

              {/* Manual options */}
              {mode === "manual" && (
                <div className="space-y-3">
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    {hasResult
                      ? "Refine the mask by hand: erase leftover background or restore cut-out parts."
                      : "Run Auto or Color first, then fine-tune the mask here."}
                  </p>
                  <Button onClick={openEditor} disabled={busy || !hasResult} icon={<Pencil className="h-4 w-4" aria-hidden />}>
                    Open mask editor
                  </Button>
                </div>
              )}

              <div className="divider" />

              {/* Actions */}
              <Button onClick={run} loading={busy} className="w-full" size="lg">
                {busy ? (processingStep ?? "Processing…") : runLabel}
              </Button>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {notice && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
                  {notice}
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="space-y-4">
              {/* Preview area */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-medium">{hasResult ? "Result" : "Preview"}</p>
                  <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5" role="radiogroup" aria-label="Preview background">
                    {(
                      [
                        { key: "checker", label: "CHK" },
                        { key: "white", label: "W" },
                        { key: "black", label: "B" },
                        { key: "custom", label: "…" },
                      ] as { key: PreviewBg; label: string }[]
                    ).map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        role="radio"
                        aria-checked={bg === option.key}
                        aria-label={option.key}
                        onClick={() => setBg(option.key)}
                        className={cn(
                          "rounded px-2 py-1 text-xs font-medium transition-colors",
                          bg === option.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {bg === "custom" && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Background</span>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-7 w-10 cursor-pointer rounded border border-input bg-background"
                    />
                  </div>
                )}

                {/* Processing skeleton */}
                {busy && (
                  <div className="mt-3 flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-secondary/30">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
                    <p className="text-sm font-medium text-muted-foreground">{processingStep ?? "Processing…"}</p>
                    {mode === "auto" && (
                      <p className="text-xs text-muted-foreground/70">AI runs in your browser — model is self-hosted and cached after first use</p>
                    )}
                  </div>
                )}

                {/* Image preview */}
                {!busy && (
                  <div
                    className="mt-3 flex min-h-[260px] items-center justify-center overflow-hidden rounded-lg border border-border"
                    style={bgStyle}
                  >
                    {hasResult ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={result!.url} alt="Processed image" className="max-h-[400px] max-w-full object-contain" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sourceUrl ?? ""} alt="Original image" className="max-h-[400px] max-w-full object-contain" />
                    )}
                  </div>
                )}

                {/* Stats */}
                {stats && (
                  <p className="mt-2.5 text-xs text-muted-foreground">
                    {stats.width}×{stats.height} · alpha: {stats.hasAlpha ? "present" : "missing"} ·{" "}
                    {stats.hasAlpha ? `${Math.round((stats.transparentPixels / stats.totalPixels) * 1000) / 10}% transparent` : "opaque"}
                  </p>
                )}

                {/* Success feedback */}
                {hasResult && stats && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400 animate-slide-up">
                    <Check className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="font-medium">Done</span>
                    <span className="text-emerald-600/70 dark:text-emerald-400/70">
                      {stats.width}×{stats.height} · {Math.round((stats.transparentPixels / stats.totalPixels) * 1000) / 10}% transparent
                    </span>
                  </div>
                )}

                {/* Download actions */}
                {hasResult && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <DownloadButton blob={result!.blob} fileName={result!.fileName} disabled={busy} />
                    {mode === "manual" && (
                      <Button variant="outline" onClick={openEditor} disabled={busy} icon={<Pencil className="h-4 w-4" aria-hidden />}>
                        Edit mask
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title="Manual mask editor"
        description="Paint on the transparency mask. Erase removes parts, Restore brings back the original alpha."
        className="max-w-[min(896px,calc(100vw-2rem))]"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditorOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                downloadBlob(resultBlobRef.current ?? new Blob(), result?.fileName ?? "image-transparent.png");
              }}
              variant="outline"
              disabled={!resultBlobRef.current}
            >
              Download instead
            </Button>
          </>
        }
      >
        {editorCanvas && !busy && <MaskEditor source={editorCanvas} onApply={(d) => void commitEditor(d)} onCancel={() => setEditorOpen(false)} />}
      </Dialog>

      <SeoContent
        whatItDoes="The Transparent Image tool removes backgrounds and produces a real transparent PNG with an alpha channel. Use AI for automatic removal, a chosen color for solid backgrounds, or manual brushing to fine-tune the mask."
        howToUse="Upload an image, pick a mode (Auto, Color or Manual), adjust the options, then process. Inspect the result against checkerboard, white, black or a custom background, then download the PNG."
        supportedFormats={["JPG", "PNG", "WEBP"]}
        privacyNote="All modes run entirely in your browser. Auto mode uses a WASM AI model that downloads once and runs locally. Nothing leaves your device."
        faq={[
          { question: "What makes this a real transparent image?", answer: "The output PNG contains an actual per-pixel alpha channel — 0 for transparent, 255 for opaque and values in between for soft edges. It is not a white background or a CSS opacity effect." },
          { question: "Which mode should I use?", answer: "Auto uses AI and handles photos with hair, fur or glass best. Color removes a single color and suits logos and flat backgrounds. Manual lets you erase or restore parts of the transparency mask by hand." },
          { question: "How do I check for halos?", answer: "Flip the preview background between checkerboard, white, black and a custom color. A clean edge looks the same on every background." },
          { question: "Does Auto mode need a server?", answer: "No — Auto mode uses a WASM AI model that runs entirely in your browser. The model is self-hosted on the same server and cached by your browser after the first use. Color and Manual modes also work fully offline." },
        ]}
      />
    </ToolLayout>
  );
}
