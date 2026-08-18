"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { RefreshCw, Repeat, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploader, ImageDropzone } from "@/components/image/uploader";
import { ImageCard } from "@/components/image/image-card";
import { ImageComparison } from "@/components/image/image-comparison";
import { ProcessingProgress } from "@/components/processing/processing-progress";
import { DownloadButton } from "@/components/download/download-button";
import { DownloadAllButton } from "@/components/download/download-all-button";
import { ToolLayout, ToolCard } from "@/components/layout/tool-layout";
import { SeoContent } from "@/components/layout/seo-content";
import type { FaqItem } from "@/components/layout/seo-content";
import { useToast } from "@/components/ui/toast";
import { useImageStore } from "@/lib/store/useImageStore";
import type { ProcessingResult, UploadedImage } from "@/lib/types";
import { processImage, revokeUrl, supportsFormatInBrowser } from "@/lib/process/client";
import { formatBytes, calculateSavings } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export interface ProcessJobSpec {
  operations: Parameters<typeof processImage>[1]["operations"];
  encode: Parameters<typeof processImage>[1]["encode"];
  suffix?: Parameters<typeof processImage>[1]["suffix"];
  outputName?: string;
}

interface ToolWorkflowProps {
  title: string;
  description: string;
  breadcrumbLabel: string;
  renderControls: (ctx: { disabled: boolean; image: UploadedImage | null }) => ReactNode;
  buildJob: (image: UploadedImage) => ProcessJobSpec;
  maxFiles?: number;
  multiple?: boolean;
  acceptedFormats?: string[];
  whatItDoes: string;
  howToUse: string;
  supportedFormats?: string[];
  privacyNote?: string;
  faq?: FaqItem[];
  comparisonPlaceholder?: ReactNode;
  showResultCard?: boolean;
  ctaLabel?: string;
}

/**
 * Shared single-page tool workflow:
 * Upload → Configure → Process → Compare → Download.
 */
export function ToolWorkflow({
  title,
  description,
  breadcrumbLabel,
  renderControls,
  buildJob,
  maxFiles = 20,
  multiple = true,
  acceptedFormats,
  whatItDoes,
  howToUse,
  supportedFormats,
  privacyNote,
  faq,
  comparisonPlaceholder,
  showResultCard = true,
  ctaLabel = "Optimize Image",
}: ToolWorkflowProps) {
  const images = useImageStore((s) => s.images);
  const addImages = useImageStore((s) => s.addImages);
  const removeImage = useImageStore((s) => s.removeImage);
  const clearImages = useImageStore((s) => s.clearImages);
  const toast = useToast();

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<ProcessingResult | null>(null);
  const runningRef = useRef(false);

  const activeImage = images[activeIndex] ?? null;

  useEffect(() => {
    return () => {
      if (runningRef.current) {
        // revoke any lingering URLs when unmounting mid-run
        // results are revoked lazily; nothing to force here
      }
    };
  }, []);

  useEffect(() => {
    if (activeIndex >= images.length) setActiveIndex(Math.max(0, images.length - 1));
    setResults([]);
    setCurrentResult(null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  const canProcess = images.some((i) => i.valid) && !processing;

  const run = useCallback(async () => {
    const validImages = images.filter((i) => i.valid);
    if (!validImages.length || runningRef.current) return;
    runningRef.current = true;
    setProcessing(true);
    setError(null);
    setResults([]);
    setCurrentResult(null);
    setProgress(0);

    const completed: ProcessingResult[] = [];
    const urls: string[] = [];

    try {
      for (let i = 0; i < validImages.length; i++) {
        const image = validImages[i];
        setProgress((i / validImages.length) * 100);
        const spec = buildJob(image);
        const result = await processImage(image.file, spec);
        urls.push(result.url);
        completed.push(result);
      }
      setProgress(100);
      setResults(completed);
      setActiveIndex(0);
      if (completed.length) {
        setCurrentResult(completed[0]);
        toast.success(`Processing complete`, `${completed.length} image${completed.length === 1 ? "" : "s"} optimized.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg === "processing-timeout" ? "Processing timed out. Try a smaller image." : "We couldn't process this image. Please try another file.");
      toast.error("Processing failed", "We couldn't process this image. Please try another file.");
    } finally {
      runningRef.current = false;
      setProcessing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, buildJob, toast]);

  const revokeResults = useCallback(() => {
    results.forEach((r) => revokeUrl(r.url));
    setResults([]);
    setCurrentResult(null);
    setError(null);
  }, [results]);

  const clearAll = useCallback(() => {
    revokeResults();
    images.forEach((img) => {
      if (img.url.startsWith("blob:")) revokeUrl(img.url);
    });
    clearImages();
  }, [revokeResults, images, clearImages]);

  const selectedImageForPreview = activeImage ?? images[0] ?? null;
  const sourceIsTiny = useMemo(
    () => !!(selectedImageForPreview && selectedImageForPreview.width * selectedImageForPreview.height < 40_000),
    [selectedImageForPreview]
  );

  const formatWarning = useMemo(() => {
    const result = currentResult;
    if (!result) return null;
    const originalFormat = images[activeIndex]?.format.toUpperCase();
    if (result.format === "jpeg" && selectedImageForPreview?.format === "png") {
      return (
        <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            JPG does not support transparency. Transparent areas in your original PNG were flattened to white.
          </span>
        </p>
      );
    }
    void originalFormat;
    return null;
  }, [currentResult, images, activeIndex, selectedImageForPreview]);

  return (
    <ToolLayout title={title} description={description} breadcrumbs={[{ label: breadcrumbLabel }]}>
      {images.length === 0 ? (
        <div className="mx-auto max-w-2xl">
          <ImageUploader images={[]} onChange={addImages} maxFiles={maxFiles} multiple={multiple} />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {acceptedFormats ? `Supported formats: ${acceptedFormats.join(", ")}` : "JPG, PNG, WEBP, GIF, BMP, AVIF"} · Images never leave your browser
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Preview column */}
          <div className="min-w-0 space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((img, i) => (
                <ImageCard
                  key={img.id}
                  image={img}
                  index={i}
                  selected={i === activeIndex}
                  onSelect={() => setActiveIndex(i)}
                  onRemove={removeImage}
                />
              ))}
            </div>

            {error && (
              <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {processing && (
              <div className="rounded-xl border border-border bg-card p-5">
                <ProcessingProgress progress={progress} label="Processing image" />
                <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
                  Processing {Math.min(Math.ceil((progress / 100) * images.length) + 1, images.length)} / {images.length}
                </p>
              </div>
            )}

            {currentResult && showResultCard && (
              <div className="space-y-4">
                <ImageComparison
                  originalUrl={selectedImageForPreview?.url ?? ""}
                  processedUrl={currentResult.url}
                  originalLabel="Original"
                  processedLabel={currentResult.format.toUpperCase()}
                />

                {formatWarning}

                <div className="rounded-xl border border-border bg-card p-5">
                  <h2 className="text-base font-semibold">Optimization result</h2>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-secondary p-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Original</dt>
                      <dd className="mt-1 text-sm font-semibold tabular-nums">
                        {formatBytes(currentResult.originalSize)}
                        <span className="ml-1 font-normal text-muted-foreground">{selectedImageForPreview?.width}×{selectedImageForPreview?.height}</span>
                      </dd>
                    </div>
                    <div className="rounded-lg bg-secondary p-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Optimized</dt>
                      <dd className="mt-1 text-sm font-semibold tabular-nums">
                        {formatBytes(currentResult.fileSize)}
                        <span className="ml-1 font-normal text-muted-foreground">{currentResult.width}×{currentResult.height}</span>
                      </dd>
                    </div>
                    <div className="rounded-lg bg-secondary p-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Saved</dt>
                      <dd className="mt-1 text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatBytes(currentResult.savedBytes)}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-secondary p-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reduction</dt>
                      <dd className="mt-1 text-sm font-semibold tabular-nums text-primary">
                        {calculateSavings(currentResult.originalSize, currentResult.fileSize).toFixed(1)}%
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <DownloadButton
                      blob={currentResult.blob}
                      fileName={currentResult.fileName}
                      size="lg"
                      label="Download"
                    />
                    {results.length > 1 && <DownloadAllButton results={results} size="lg" />}
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setCurrentResult(null)}
                      icon={<Repeat className="h-4 w-4" aria-hidden />}
                    >
                      Edit Again
                    </Button>
                    <Button variant="ghost" size="lg" onClick={clearAll} icon={<RefreshCw className="h-4 w-4" aria-hidden />}>
                      Process Another
                    </Button>
                  </div>

                  {results.length > 1 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {results.map((r, i) => (
                        <button
                          key={r.fileName}
                          onClick={() => {
                            setActiveIndex(i);
                            setCurrentResult(r);
                          }}
                          className={cn(
                            "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                            i === activeIndex ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-muted-foreground"
                          )}
                          aria-pressed={i === activeIndex}
                        >
                          {r.fileName} · {formatBytes(r.fileSize)} (−{calculateSavings(r.originalSize, r.fileSize).toFixed(0)}%)
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {sourceIsTiny && !processing && !currentResult && (
              <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                This image is very small, so compression savings may be minimal.
              </p>
            )}
          </div>

          {/* Controls column */}
          <aside className="lg:sticky lg:top-20 h-fit space-y-4 rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Settings</h2>
            {renderControls({ disabled: processing, image: selectedImageForPreview })}
            <Button
              size="lg"
              className="w-full"
              onClick={run}
              disabled={!canProcess}
              loading={processing}
            >
              {ctaLabel}
            </Button>
            {!supportsFormatInBrowser("avif") && (
              <p className="text-xs text-muted-foreground">
                Your browser may not support AVIF output; it will be hidden from the format picker.
              </p>
            )}
          </aside>
        </div>
      )}

      <SeoContent
        whatItDoes={whatItDoes}
        howToUse={howToUse}
        supportedFormats={supportedFormats}
        privacyNote={privacyNote}
        faq={faq}
      />
    </ToolLayout>
  );
}

export { ImageDropzone, ToolCard };
export type { UploadedImage };