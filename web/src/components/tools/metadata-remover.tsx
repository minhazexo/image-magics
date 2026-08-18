"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ScanEye, Loader2, Download } from "lucide-react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { ImageUploader } from "@/components/image/uploader";
import { ImageCard } from "@/components/image/image-card";
import { SeoContent } from "@/components/layout/seo-content";
import { Button } from "@/components/ui/button";
import { DownloadAllButton } from "@/components/download/download-all-button";
import { useToast } from "@/components/ui/toast";
import { detectExif, processImage, revokeUrl } from "@/lib/process/client";
import type { ProcessingResult, UploadedImage } from "@/lib/types";
import { formatBytes, calculateSavings } from "@/lib/utils/format";

interface ExifState {
  id: string;
  checking: boolean;
  detected: boolean;
}

export function MetadataRemoverTool() {
  const toast = useToast();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [exifStates, setExifStates] = useState<Record<string, ExifState>>({});
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResult[]>([]);

  useEffect(() => {
    images.forEach((img) => {
      setExifStates((prev) => ({ ...prev, [img.id]: { id: img.id, checking: true, detected: false } }));
      detectExif(img.file).then((detected) => {
        setExifStates((prev) => ({ ...prev, [img.id]: { id: img.id, checking: false, detected } }));
      });
    });
  }, [images]);

  useEffect(
    () => () => {
      results.forEach((r) => revokeUrl(r.url));
    },
    [results]
  );

  const stripMetadata = async () => {
    const valid = images.filter((i) => i.valid);
    if (!valid.length || processing) return;
    setProcessing(true);
    setResults([]);
    try {
      const done: ProcessingResult[] = [];
      for (const img of valid) {
        const res = await processImage(img.file, {
          operations: [{ type: "removeMetadata" }],
          encode: {
            format: img.format === "jpeg" ? "jpeg" : "png",
            quality: 92,
            sourceFormat: img.format as never,
            preserveTransparency: true,
          },
          suffix: "cleaned",
        });
        done.push(res);
      }
      setResults(done);
      toast.success("Metadata removed", `${done.length} file${done.length === 1 ? "" : "s"} cleaned.`);
    } catch {
      toast.error("Processing failed", "We couldn't process this image. Please try another file.");
    } finally {
      setProcessing(false);
    }
  };

  const detectedCount = images.filter((i) => exifStates[i.id]?.detected).length;
  const checkedCount = images.filter((i) => exifStates[i.id] && !exifStates[i.id].checking).length;

  return (
    <ToolLayout
      title="Metadata Remover"
      description="Strip EXIF, GPS and camera information from your photos for privacy."
      breadcrumbs={[{ label: "Metadata Remover" }]}
    >
      {images.length === 0 ? (
        <div className="mx-auto max-w-2xl">
          <ImageUploader images={images} onChange={setImages} maxFiles={20} multiple />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Files checked</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{checkedCount}/{images.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Metadata detected</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{detectedCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {results.length > 0 ? "Metadata removed" : "Pending"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img, i) => {
              const state = exifStates[img.id];
              return (
                <div key={img.id} className="relative">
                  <ImageCard image={img} index={i} onRemove={(id) => setImages((prev) => prev.filter((x) => x.id !== id))} />
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                    {!state ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Checking…
                      </span>
                    ) : state.checking ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Checking…
                      </span>
                    ) : state.detected ? (
                      <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                        <ScanEye className="h-3.5 w-3.5" aria-hidden /> Metadata detected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> No metadata
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={stripMetadata} disabled={processing || !images.some((i) => i.valid)} loading={processing} icon={<ShieldCheck className="h-4 w-4" aria-hidden />}>
              Strip Metadata
            </Button>
            {results.length > 0 && (
              <>
                <DownloadAllButton results={results} size="lg" />
                <span className="text-sm text-muted-foreground">
                  {results.length} file{results.length === 1 ? "" : "s"} · avg reduction {calculateSavings(results.reduce((a, r) => a + r.originalSize, 0), results.reduce((a, r) => a + r.fileSize, 0)).toFixed(1)}%
                </span>
              </>
            )}
          </div>

          {results.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-base font-semibold">Cleaned files</h2>
              <div className="mt-4 grid gap-2">
                {results.map((r) => (
                  <div key={r.fileName} className="flex items-center justify-between gap-3 rounded-lg bg-secondary px-4 py-3 text-sm">
                    <span className="min-w-0 truncate font-medium">{r.fileName}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatBytes(r.originalSize)} → {formatBytes(r.fileSize)} · −{calculateSavings(r.originalSize, r.fileSize).toFixed(0)}%
                    </span>
                    <a
                      href={r.url}
                      download={r.fileName}
                      className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden /> Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <SeoContent
        whatItDoes="The Metadata Remover scans your images for EXIF data — GPS location, camera model, software and timestamps — and re-encodes them without it, so no identifying information leaks."
        howToUse="Upload your photos. Each file is scanned and its status shown. Click Strip Metadata, then download the cleaned files."
        supportedFormats={["JPG (EXIF supported)", "PNG", "WEBP"]}
        privacyNote="Scanning happens locally in your browser. No metadata ever leaves your device."
        faq={[
          { question: "Why does my JPEG show 'Metadata detected'?", answer: "JPEGs commonly embed EXIF data with GPS and camera info. Re-encoding strips it completely." },
          { question: "Is all metadata always removed?", answer: "Our re-encoding pipeline outputs clean files without the original metadata segments. For JPEG, EXIF/APP1, GPS and camera blocks are discarded." },
          { question: "Will the image quality change?", answer: "We re-encode JPEGs at high quality (92). There may be a very slight generational quality change, which is the cost of a clean file." },
        ]}
      />
    </ToolLayout>
  );
}