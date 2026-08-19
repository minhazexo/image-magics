"use client";

import { RefreshCw, Repeat, Info, Clipboard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploader, ImageDropzone } from "@/components/image/uploader";
import { ImageCard } from "@/components/image/image-card";
import { ImageComparison } from "@/components/image/image-comparison";
import { ProcessingProgress } from "@/components/processing/processing-progress";
import { DownloadButton } from "@/components/download/download-button";
import { DownloadAllButton } from "@/components/download/download-all-button";
import { ToolLayout } from "@/components/layout/tool-layout";
import { SeoContent } from "@/components/layout/seo-content";
import type { FaqItem } from "@/components/layout/seo-content";
import { InlineError } from "@/components/ui/error-state";
import { useToast } from "@/components/ui/toast";
import { useImageStore } from "@/lib/store/useImageStore";
import type { ProcessingResult, UploadedImage } from "@/lib/types";
import { processImage, revokeUrl } from "@/lib/process/client";
import { formatBytes, calculateSavings } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

/** Processing step messages for different progress ranges */
function getProcessingStep(progress: number, totalImages: number, currentImage: number): string {
  if (progress < 10) return "Preparing image…";
  if (progress < 30) return "Decoding…";
  if (progress < 60) return "Optimizing…";
  if (progress < 85) return "Almost done…";
  if (progress < 100) return "Finalizing…";
  return totalImages > 1 ? `Done ${currentImage}/${totalImages}` : "Complete";
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
        toast.success(`Processing complete`, `${completed.length} image${completed.length === 1 ? "" : "s"} processed in ${completed[0].durationMs}ms`);
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
    return null;
  }, [currentResult, selectedImageForPreview]);

  const currentStep = useMemo(
    () => getProcessingStep(progress, images.length, activeIndex + 1),
    [progress, images.length, activeIndex]
  );

  return (
    <ToolLayout title={title} description={description} breadcrumbs={[{ label: breadcrumbLabel }]}>
      {images.length === 0 ? (
        <div className="mx-auto max-w-2xl">
          <ImageUploader images={[]} onChange={addImages} maxFiles={maxFiles} multiple={multiple} />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              {acceptedFormats ? `Supported: ${acceptedFormats.join(", ")}` : "JPG, PNG, WebP, GIF, BMP"}
            </span>
            <span className="hidden sm:inline opacity-30">·</span>
            <span className="flex items-center gap-1">
              <Clipboard className="h-3 w-3" aria-hidden />
              <span className="hidden sm:inline">Paste to upload</span>
              <span className="sm:hidden">Paste</span>
            </span>
            <span className="hidden sm:inline opacity-30">·</span>
            <span className="hidden sm:inline">Images never leave your browser</span>
          </div>
        </div>
      ) : (
        <div className="space-y-5 lg:space-y-0 lg:grid lg:gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Controls — FIRST on mobile, SIDEBAR on desktop */}
          <aside
            className="order-1 lg:order-2 lg:sticky lg:top-16 h-fit space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5"
            style={{ boxShadow: "var(--shadow-xs)" }}
          >
            <h2 className="section-label">Settings</h2>
            {renderControls({ disabled: processing, image: selectedImageForPreview })}
            <div className="divider" />
            <Button
              className="w-full"
              onClick={run}
              disabled={!canProcess}
              loading={processing}
              size="lg"
            >
              {processing ? "Processing…" : ctaLabel}
            </Button>
          </aside>

          {/* Preview — SECOND on mobile, MAIN on desktop */}
          <div className="order-2 lg:order-1 min-w-0 space-y-4">
            {/* Image thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
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
            )}

            {/* Single image — show thumbnail + add more */}
            {images.length === 1 && (
              <div className="flex items-center gap-3">
                {images[0].valid && (
                  <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={images[0].url} alt={images[0].name} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{images[0].name}</p>
                  <p className="text-xs text-muted-foreground">
                    {images[0].width} × {images[0].height} · {images[0].format.toUpperCase()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Replace uploaded image"
                >
                  Replace
                </button>
              </div>
            )}

            {/* Error — inline with retry */}
            {error && (
              <InlineError
                message={error}
                onRetry={() => { setError(null); run(); }}
              />
            )}

            {/* Processing */}
            {processing && (
              <div className="card-elevated p-4 sm:p-5">
                <ProcessingProgress
                  progress={progress}
                  label="Processing"
                  step={currentStep}
                />
                <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
                  Image {Math.min(activeIndex + 1, images.length)} of {images.length}
                </p>
              </div>
            )}

            {/* Skeleton while processing */}
            {processing && (
              <div className="space-y-3">
                <div className="h-[200px] sm:h-[300px] animate-pulse rounded-lg bg-secondary/60" />
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 sm:h-16 animate-pulse rounded-lg bg-secondary/60" />
                  ))}
                </div>
              </div>
            )}

            {/* Result */}
            {!processing && currentResult && showResultCard && (
              <div className="space-y-4 animate-fade-in">
                {/* Success feedback */}
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400 animate-slide-up">
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="font-medium">Processing complete</span>
                  <span className="text-emerald-600/70 dark:text-emerald-400/70">
                    {results.length} image{results.length === 1 ? "" : "s"} processed in {currentResult.durationMs}ms
                  </span>
                </div>

                <ImageComparison
                  originalUrl={selectedImageForPreview?.url ?? ""}
                  processedUrl={currentResult.url}
                  originalLabel="Original"
                  processedLabel={currentResult.format.toUpperCase()}
                />

                {formatWarning}

                {/* Stats */}
                <div className="card-elevated p-4 sm:p-5">
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
                    <div className="stat-card">
                      <dt className="stat-label">Original</dt>
                      <dd className="stat-value">
                        {formatBytes(currentResult.originalSize)}
                        <span className="ml-1 font-normal text-muted-foreground text-[11px]">{selectedImageForPreview?.width}×{selectedImageForPreview?.height}</span>
                      </dd>
                    </div>
                    <div className="stat-card">
                      <dt className="stat-label">Optimized</dt>
                      <dd className="stat-value">
                        {formatBytes(currentResult.fileSize)}
                        <span className="ml-1 font-normal text-muted-foreground text-[11px]">{currentResult.width}×{currentResult.height}</span>
                      </dd>
                    </div>
                    <div className="stat-card">
                      <dt className="stat-label">Saved</dt>
                      <dd className="stat-value text-emerald-600 dark:text-emerald-400">
                        {formatBytes(currentResult.savedBytes)}
                      </dd>
                    </div>
                    <div className="stat-card">
                      <dt className="stat-label">Reduction</dt>
                      <dd className="stat-value text-primary">
                        {calculateSavings(currentResult.originalSize, currentResult.fileSize).toFixed(1)}%
                      </dd>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <DownloadButton
                      blob={currentResult.blob}
                      fileName={currentResult.fileName}
                      size="lg"
                      label="Download"
                    />
                    {results.length > 1 && <DownloadAllButton results={results} size="lg" />}
                    <Button
                      variant="outline"
                      onClick={() => setCurrentResult(null)}
                      icon={<Repeat className="h-4 w-4" aria-hidden />}
                    >
                      Edit Again
                    </Button>
                    <Button variant="ghost" onClick={clearAll} icon={<RefreshCw className="h-4 w-4" aria-hidden />}>
                      Process Another
                    </Button>
                  </div>

                  {/* Multi-result tabs */}
                  {results.length > 1 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {results.map((r, i) => (
                        <button
                          key={r.fileName}
                          onClick={() => {
                            setActiveIndex(i);
                            setCurrentResult(r);
                          }}
                          className={cn(
                            "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                            i === activeIndex ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground"
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

export { ImageDropzone };
export type { UploadedImage };
