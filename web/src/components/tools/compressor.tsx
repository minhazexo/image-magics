"use client";

import { useState } from "react";
import { ToolWorkflow } from "@/components/processing/tool-workflow";
import type { ProcessJobSpec } from "@/components/processing/tool-workflow";
import { QualitySlider } from "@/components/processing/quality-slider";
import { FormatSelector } from "@/components/processing/format-selector";
import type { OutputFormat, UploadedImage } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { estimateOutputSizeHint } from "@/lib/process/engine";

type CompressionMode = "maximum" | "balanced" | "quality";

const MODE_QUALITY: Record<CompressionMode, number> = {
  maximum: 45,
  balanced: 72,
  quality: 88,
};

export function CompressorTool() {
  const [mode, setMode] = useState<CompressionMode>("balanced");
  const [format, setFormat] = useState<OutputFormat>("webp");
  const [manual, setManual] = useState(false);
  const [quality, setQuality] = useState(MODE_QUALITY.balanced);

  const effectiveQuality = manual ? quality : MODE_QUALITY[mode];

  const buildJob = (image: UploadedImage): ProcessJobSpec => ({
    operations: [{ type: "removeMetadata" }],
    encode: {
      format,
      quality: effectiveQuality,
      sourceFormat: image.format as never,
      preserveTransparency: true,
    },
    suffix: "compressed",
  });

  return (
    <ToolWorkflow
      title="Image Compressor"
      description="Compress your images without losing noticeable quality."
      breadcrumbLabel="Image Compressor"
      ctaLabel="Compress Image"
      whatItDoes="The Image Compressor reduces file size by re-encoding your image with an efficient format (WebP by default) and a carefully chosen quality level, removing metadata along the way."
      howToUse="Upload an image, pick a compression mode (or use manual quality), optionally change the output format, then click Compress Image. Compare the result and download it."
      supportedFormats={["JPG", "PNG", "WEBP", "AVIF", "GIF", "BMP"]}
      privacyNote="Compression happens locally in your browser. No files are uploaded, and nothing is stored on our servers."
      faq={[
        { question: "Can I compress multiple images?", answer: "Yes — upload several images at once and they will all be compressed with the same settings." },
        { question: "Does image compression reduce quality?", answer: "Compression trades a small amount of visual quality for a much smaller file. Use the before/after slider to see the exact difference." },
        { question: "What is WebP?", answer: "WebP is a modern image format that produces files roughly 25–35% smaller than JPG at equivalent quality, with transparency support." },
      ]}
      buildJob={buildJob}
      renderControls={({ disabled }) => (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Compression mode">
            {(
              [
                { key: "maximum", label: "Maximum", hint: "Smallest file" },
                { key: "balanced", label: "Balanced", hint: "Recommended" },
                { key: "quality", label: "Quality", hint: "Best visuals" },
              ] as { key: CompressionMode; label: string; hint: string }[]
            ).map((m) => (
              <button
                key={m.key}
                type="button"
                role="radio"
                aria-checked={mode === m.key}
                disabled={disabled}
                className={cn(
                  "rounded-lg border p-3 text-center transition-colors",
                  mode === m.key ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-primary/40"
                )}
                onClick={() => {
                  setMode(m.key);
                  setManual(false);
                }}
              >
                <span className="block text-sm font-medium">{m.label}</span>
                <span className="block text-xs text-muted-foreground">{m.hint}</span>
              </button>
            ))}
          </div>

          <FormatSelector value={format} onChange={(f) => setFormat(f as OutputFormat)} disabled={disabled} />

          <div>
            <label className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">Manual quality</span>
              <input
                type="checkbox"
                checked={manual}
                onChange={(e) => {
                  setManual(e.target.checked);
                  if (e.target.checked) setQuality(MODE_QUALITY[mode]);
                }}
                disabled={disabled}
                className="h-4 w-4 rounded accent-primary"
              />
            </label>
            {manual && (
              <div className="mt-3">
                <QualitySlider value={quality} onChange={setQuality} disabled={disabled} />
              </div>
            )}
          </div>

          <div className="rounded-lg bg-secondary p-3 text-sm">
            <span className="text-muted-foreground">Estimated size at quality {effectiveQuality}: </span>
            <span className="font-semibold tabular-nums">~40% smaller on average</span>
          </div>
        </div>
      )}
    />
  );
}

export { estimateOutputSizeHint };