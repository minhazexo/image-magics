"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCw, RotateCcw, FlipHorizontal2, FlipVertical2, RefreshCcw, Download } from "lucide-react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { ImageUploader } from "@/components/image/uploader";
import { SeoContent } from "@/components/layout/seo-content";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/download/download-button";
import { useToast } from "@/components/ui/toast";
import { processImage, revokeUrl } from "@/lib/process/client";
import type { ProcessingOperation, ProcessingResult, UploadedImage } from "@/lib/types";
import { formatBytes, calculateSavings } from "@/lib/utils/format";
import { generateFileName } from "@/lib/utils/filename";

interface TransformState {
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

export function RotatorTool() {
  const toast = useToast();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [transform, setTransform] = useState<TransformState>({ rotation: 0, flipH: false, flipV: false });
  const [workUrl, setWorkUrl] = useState<string | null>(null);
  const [workWidth, setWorkWidth] = useState(0);
  const [workHeight, setWorkHeight] = useState(0);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (image) {
      if (workUrl && workUrl !== image.url) revokeUrl(workUrl);
      setWorkUrl(image.url);
      setWorkWidth(image.width);
      setWorkHeight(image.height);
      setTransform({ rotation: 0, flipH: false, flipV: false });
      setResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  useEffect(
    () => () => {
      if (result) revokeUrl(result.url);
    },
    [result]
  );

  const applyTransform = useCallback(
    async (next: TransformState) => {
      if (!image) return;
      setProcessing(true);
      try {
        const operations: ProcessingOperation[] = [
        ...(next.rotation !== 0 ? [{ type: "rotate" as const, angle: next.rotation }] : []),
        ...(next.flipH ? [{ type: "flip" as const, direction: "horizontal" as const }] : []),
        ...(next.flipV ? [{ type: "flip" as const, direction: "vertical" as const }] : []),
      ];
        const res = await processImage(image.file, {
          operations,
          encode: { format: "png", quality: 100, sourceFormat: image.format as never, preserveTransparency: true },
          suffix: "edited",
          outputName: generateFileName(image.name, { suffix: "rotated", extension: "png" }),
        });
        if (workUrl && workUrl !== image.url) revokeUrl(workUrl);
        setTransform(next);
        setWorkUrl(res.url);
        setWorkWidth(res.width);
        setWorkHeight(res.height);
        setResult(res);
      } catch {
        toast.error("Processing failed", "We couldn't process this image. Please try another file.");
      } finally {
        setProcessing(false);
      }
    },
    [image, workUrl, toast]
  );

  const rotate = (delta: number) => {
    const rotation = (transform.rotation + delta) % 360;
    applyTransform({ ...transform, rotation });
  };

  const toggleFlip = (axis: "H" | "V") => {
    const next = axis === "H" ? { ...transform, flipH: !transform.flipH } : { ...transform, flipV: !transform.flipV };
    applyTransform(next);
  };

  const reset = () => {
    if (image) {
      if (workUrl && workUrl !== image.url) revokeUrl(workUrl);
      setWorkUrl(image.url);
      setWorkWidth(image.width);
      setWorkHeight(image.height);
      setTransform({ rotation: 0, flipH: false, flipV: false });
      setResult(null);
    }
  };

  const handleUploaded = (incoming: UploadedImage[]) => {
    setImages(incoming);
    if (incoming.length) setImage(incoming[0]);
  };

  return (
    <ToolLayout
      title="Image Rotator & Flipper"
      description="Rotate and flip your images in one click."
      breadcrumbs={[{ label: "Image Rotator" }]}
    >
      {!image && images.length === 0 && (
        <div className="mx-auto max-w-2xl">
          <ImageUploader images={images} onChange={handleUploaded} maxFiles={1} multiple={false} />
        </div>
      )}

      {image && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-4">
            {images.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {images.map((img) => (
                  <button
                    key={img.id}
                    className="rounded-md border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50"
                    onClick={() => setImage(img)}
                  >
                    {img.name}
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="relative mx-auto flex aspect-[4/3] w-full max-w-xl items-center justify-center overflow-hidden rounded-lg bg-secondary">
                {workUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={workUrl}
                    alt="Rotated preview"
                    className="max-h-full max-w-full object-contain"
                    style={{ maxWidth: "100%", maxHeight: "100%" }}
                  />
                )}
                {processing && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-sm font-medium text-white" role="status">
                    Processing…
                  </span>
                )}
              </div>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {workWidth} × {workHeight} px
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => rotate(270)} icon={<RotateCcw className="h-4 w-4" aria-hidden />} disabled={processing}>
                  Rotate left
                </Button>
                <Button variant="outline" size="sm" onClick={() => rotate(90)} icon={<RotateCw className="h-4 w-4" aria-hidden />} disabled={processing}>
                  Rotate right
                </Button>
                <Button variant="outline" size="sm" onClick={() => rotate(180)} icon={<RefreshCcw className="h-4 w-4" aria-hidden />} disabled={processing}>
                  180°
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleFlip("H")} icon={<FlipHorizontal2 className="h-4 w-4" aria-hidden />} disabled={processing}>
                  Flip horizontal
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleFlip("V")} icon={<FlipVertical2 className="h-4 w-4" aria-hidden />} disabled={processing}>
                  Flip vertical
                </Button>
              </div>
            </div>

            {result && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-base font-semibold">Result</h2>
                <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-secondary p-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dimensions</dt>
                    <dd className="mt-1 text-sm font-semibold">{result.width} × {result.height}</dd>
                  </div>
                  <div className="rounded-lg bg-secondary p-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Size</dt>
                    <dd className="mt-1 text-sm font-semibold">{formatBytes(result.fileSize)}</dd>
                  </div>
                  <div className="rounded-lg bg-secondary p-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reduction</dt>
                    <dd className="mt-1 text-sm font-semibold text-primary">{calculateSavings(result.originalSize, result.fileSize).toFixed(1)}%</dd>
                  </div>
                </dl>
                <div className="mt-5 flex gap-2">
                  <DownloadButton blob={result.blob} fileName={result.fileName} label="Download" />
                  <Button variant="outline" onClick={reset}>Reset</Button>
                </div>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-20 h-fit rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Actions</h2>
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="secondary" onClick={() => rotate(90)} disabled={processing} icon={<RotateCw className="h-4 w-4" aria-hidden />}>
                Rotate 90° right
              </Button>
              <Button variant="secondary" onClick={() => rotate(270)} disabled={processing} icon={<RotateCcw className="h-4 w-4" aria-hidden />}>
                Rotate 90° left
              </Button>
              <Button variant="secondary" onClick={() => rotate(180)} disabled={processing} icon={<RefreshCcw className="h-4 w-4" aria-hidden />}>
                Rotate 180°
              </Button>
              <Button variant="secondary" onClick={() => toggleFlip("H")} disabled={processing} icon={<FlipHorizontal2 className="h-4 w-4" aria-hidden />}>
                Flip horizontal
              </Button>
              <Button variant="secondary" onClick={() => toggleFlip("V")} disabled={processing} icon={<FlipVertical2 className="h-4 w-4" aria-hidden />}>
                Flip vertical
              </Button>
            </div>
            {result && <DownloadButton className="mt-4 w-full" blob={result.blob} fileName={result.fileName} />}
          </aside>
        </div>
      )}

      <SeoContent
        whatItDoes="The Image Rotator & Flipper turns images 90° left, 90° right or 180°, and mirrors them horizontally or vertically. Every operation is instantly applied and ready to download."
        howToUse="Upload an image, then click rotate or flip buttons. The preview updates instantly. Download the result when you're happy."
        supportedFormats={["JPG", "PNG", "WEBP", "GIF", "BMP"]}
        privacyNote="Rotation and flipping happen locally in your browser. Your images are never uploaded."
        faq={[
          { question: "Does rotating reduce image quality?", answer: "Rotating in 90° steps is lossless. Other angles are resampled, which can soften edges slightly." },
          { question: "Can I combine rotate and flip?", answer: "Yes — each action applies to the current result, so you can chain rotations and flips freely." },
        ]}
      />
    </ToolLayout>
  );
}