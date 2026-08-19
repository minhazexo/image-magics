"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Trash2, CheckCircle2, XCircle, Clock, Loader2, FileImage } from "lucide-react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { ImageUploader } from "@/components/image/uploader";
import { SeoContent } from "@/components/layout/seo-content";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { FormatSelector } from "@/components/processing/format-selector";
import { ProcessingProgress } from "@/components/processing/processing-progress";
import { DownloadAllButton } from "@/components/download/download-all-button";
import { DownloadButton } from "@/components/download/download-button";
import { useToast } from "@/components/ui/toast";
import { useImageStore } from "@/lib/store/useImageStore";
import type { OutputFormat, QueueItemMeta } from "@/lib/types";
import { processImage, revokeUrl, createThumbnailUrl } from "@/lib/process/client";
import { formatBytes, calculateSavings } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const STATUS_ICONS = {
  waiting: Clock,
  processing: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
};

const STATUS_LABELS: Record<QueueItemMeta["status"], string> = {
  waiting: "Waiting",
  processing: "Processing…",
  completed: "Complete",
  failed: "Failed",
};

export function BatchTool() {
  const images = useImageStore((s) => s.images);
  const addImages = useImageStore((s) => s.addImages);
  const removeImage = useImageStore((s) => s.removeImage);
  const queue = useImageStore((s) => s.queue);
  const setQueueItem = useImageStore((s) => s.setQueueItem);
  const setBatchProgress = useImageStore((s) => s.setBatchProgress);
  const clearQueue = useImageStore((s) => s.clearQueue);
  const toast = useToast();

  const [resizeWidth, setResizeWidth] = useState(0);
  const [format, setFormat] = useState<OutputFormat>("webp");
  const [quality, setQuality] = useState(82);
  const runningRef = useRef(false);

  const processing = queue.some((q) => q.status === "processing");

  // Build thumbnails lazily (store already has preview URLs from validation)
  useEffect(() => {
    queue
      .filter((q) => !q.thumbUrl || q.thumbUrl === q.file.name)
      .forEach((q) => {
        createThumbnailUrl(q.file)
          .then((thumb) => setQueueItem(q.id, { thumbUrl: thumb }))
          .catch(() => {});
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length]);

  useEffect(
    () => () => {
      if (runningRef.current) {
        clearQueue();
      }
    },
    [clearQueue]
  );

  const processAll = useCallback(async () => {
    if (runningRef.current) return;
    const pending = queue.filter((q) => q.status !== "completed");
    if (!pending.length) return;
    runningRef.current = true;
    setBatchProgress(0, queue.length, true);

    let completedCount = 0;
    for (const item of pending) {
      setQueueItem(item.id, { status: "processing", progress: 0 });
      try {
        const spec = {
          operations: (resizeWidth > 0
            ? [{ type: "resize", options: { width: resizeWidth, lockAspectRatio: true } }]
            : []) as never,
          encode: { format, quality, sourceFormat: item.file.type as never, preserveTransparency: true } as never,
          suffix: "compressed" as const,
        };
        const result = await processImage(item.file, spec);
        setQueueItem(item.id, {
          status: "completed",
          progress: 100,
          result,
          thumbUrl: item.thumbUrl || item.file.name,
        });
        completedCount++;
        setBatchProgress(completedCount, queue.length, true);
      } catch {
        setQueueItem(item.id, { status: "failed", error: "Processing failed" });
      }
    }
    runningRef.current = false;
    setBatchProgress(completedCount, queue.length, false);
    toast.success("Batch complete", `${completedCount} of ${queue.length} images processed.`);
  }, [queue, setQueueItem, setBatchProgress, resizeWidth, format, quality, toast]);

  const completedResults = queue.filter((q) => q.result).map((q) => q.result!);

  const totalOriginal = queue.reduce((a, q) => a + q.originalSize, 0);
  const totalOutput = completedResults.reduce((a, r) => a + r.fileSize, 0);

  return (
    <ToolLayout
      title="Batch Image Processor"
      description="Resize, convert and compress many images at once, then download them as a ZIP."
      breadcrumbs={[{ label: "Batch Image Processor" }]}
    >
      {images.length === 0 ? (
        <div className="mx-auto max-w-2xl">
          <ImageUploader images={images} onChange={addImages} maxFiles={100} multiple />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Upload up to 100 images. Everything is processed locally in your browser.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{queue.length}</span> image{queue.length === 1 ? "" : "s"} queued ·{" "}
                <span className="font-semibold text-foreground">{queue.filter((q) => q.status === "completed").length}</span> completed
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  queue.forEach((q) => q.result && revokeUrl(q.result.url));
                  clearQueue();
                }}
                icon={<Trash2 className="h-4 w-4" aria-hidden />}
                disabled={processing}
              >
                Clear queue
              </Button>
            </div>

            <div className="space-y-3">
              {queue.map((item) => {
                const Icon = STATUS_ICONS[item.status];
                const statusColor = item.status === "completed" ? "text-emerald-500" : item.status === "failed" ? "text-destructive" : item.status === "processing" ? "text-primary" : "text-muted-foreground";
                return (
                  <div key={item.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
                      {item.thumbUrl && item.thumbUrl !== item.file.name ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.thumbUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <FileImage className="h-5 w-5" aria-hidden />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={item.file.name}>{item.file.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.result
                          ? `${formatBytes(item.originalSize)} → ${formatBytes(item.result.fileSize)} · ${calculateSavings(item.originalSize, item.result.fileSize).toFixed(1)}% smaller`
                          : `${formatBytes(item.originalSize)}`}
                      </p>
                      {item.status === "processing" && (
                        <ProcessingProgress progress={item.progress} className="mt-2 max-w-xs" showPercent={false} />
                      )}
                      {item.status === "failed" && (
                        <p className="mt-1 text-xs text-destructive">{item.error ?? "Processing failed"}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", statusColor)}>
                        <Icon className={cn("h-4 w-4", item.status === "processing" && "animate-spin")} aria-hidden />
                        {STATUS_LABELS[item.status]}
                      </span>
                      {item.result && (
                        <DownloadButton blob={item.result.blob} fileName={item.result.fileName} size="sm" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeImage(item.id)}
                        disabled={processing}
                        aria-label={`Remove ${item.file.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {completedResults.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-base font-semibold">Batch summary</h2>
                <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-secondary p-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total original</dt>
                    <dd className="mt-1 text-sm font-semibold tabular-nums">{formatBytes(totalOriginal)}</dd>
                  </div>
                  <div className="rounded-lg bg-secondary p-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total output</dt>
                    <dd className="mt-1 text-sm font-semibold tabular-nums">{formatBytes(totalOutput)}</dd>
                  </div>
                  <div className="rounded-lg bg-secondary p-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total reduction</dt>
                    <dd className="mt-1 text-sm font-semibold tabular-nums text-primary">{calculateSavings(totalOriginal, totalOutput).toFixed(1)}%</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-20 h-fit space-y-5 rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Batch settings</h2>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="batch-width" className="text-sm font-medium">
                Max width <span className="text-xs font-normal text-muted-foreground">(0 = keep original)</span>
              </label>
              <input
                id="batch-width"
                type="number"
                min={0}
                max={20000}
                value={resizeWidth}
                onChange={(e) => setResizeWidth(Math.max(0, Number(e.target.value) || 0))}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <FormatSelector value={format} onChange={(f) => setFormat(f as OutputFormat)} />

            <Slider label="Quality" value={quality} min={1} max={100} onChange={setQuality} disabled={processing} />

            <Button className="w-full" size="lg" onClick={processAll} disabled={processing || !queue.length} loading={processing} icon={<Play className="h-4 w-4" aria-hidden />}>
              {processing ? "Processing…" : `Process ${queue.length} image${queue.length === 1 ? "" : "s"}`}
            </Button>

            <DownloadAllButton results={completedResults} size="lg" className="w-full" disabled={!completedResults.length} />

            <p className="text-xs leading-relaxed text-muted-foreground">
              All files are processed sequentially in your browser and zipped locally with JSZip. Nothing is uploaded to a server.
            </p>
          </aside>
        </div>
      )}

      <SeoContent
        whatItDoes="The Batch Image Processor applies one set of settings — resize width, output format and quality — to dozens of images at once, showing live per-file status and progress. The finished files are zipped in your browser."
        howToUse="Upload many images, set the global resize/format/quality options, click Process, watch each file move from Waiting to Complete, then download everything as a ZIP."
        supportedFormats={["JPG", "PNG", "WEBP", "GIF", "BMP"]}
        privacyNote="Batch processing is 100% local. Images are never uploaded; the ZIP archive is created inside your browser."
        faq={[
          { question: "Can I compress multiple images?", answer: "Yes — this tool is built for exactly that. Upload 10, 50 or even 100+ images and process them with identical settings." },
          { question: "How do I download everything?", answer: "Click Download All after processing. A ZIP archive with all optimized files is generated in your browser." },
          { question: "Why does processing happen sequentially?", answer: "Processing one image at a time keeps memory usage predictable and prevents the tab from freezing on huge batches." },
        ]}
      />
    </ToolLayout>
  );
}