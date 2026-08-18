"use client";

import { useState } from "react";
import { ToolWorkflow } from "@/components/processing/tool-workflow";
import type { ProcessJobSpec } from "@/components/processing/tool-workflow";
import { FormatSelector } from "@/components/processing/format-selector";
import { ResizeControls } from "@/components/processing/resize-controls";
import type { OutputFormat, ResizeOptions, UploadedImage } from "@/lib/types";

export function ResizerTool() {
  const [format, setFormat] = useState<OutputFormat>("jpeg");
  const [quality, setQuality] = useState(88);
  const [resize, setResize] = useState<ResizeOptions>({ lockAspectRatio: true });

  const buildJob = (image: UploadedImage): ProcessJobSpec => ({
    operations: [{ type: "resize", options: resize }, { type: "removeMetadata" }],
    encode: {
      format,
      quality,
      sourceFormat: image.format as never,
      preserveTransparency: true,
    },
    suffix: "resized",
  });

  return (
    <ToolWorkflow
      title="Image Resizer"
      description="Resize images to exact dimensions, percentages or popular social media presets."
      breadcrumbLabel="Image Resizer"
      ctaLabel="Resize Images"
      whatItDoes="The Image Resizer scales your images to precise pixel dimensions, percentages, or one of the built-in social media presets — with optional format conversion."
      howToUse="Upload images, choose pixels or percentage, set your target size (or pick a social preset), choose an output format, then click Resize Images. Batch resize is fully supported."
      supportedFormats={["JPG", "PNG", "WEBP", "AVIF", "GIF", "BMP"]}
      privacyNote="Resizing happens locally in your browser. Images are never uploaded to our servers."
      faq={[
        { question: "Can I resize images without losing quality?", answer: "Resizing down always loses some detail, but our LANCZOS-quality resampling keeps results as sharp as possible. Sharpening after resize is available in the optimizer." },
        { question: "Can I resize multiple images at once?", answer: "Yes — upload many images and the same resize settings apply to all of them." },
        { question: "What do the social presets do?", answer: "Presets like Instagram Post (1080×1080) and YouTube Thumbnail (1280×720) instantly set the exact recommended dimensions." },
      ]}
      buildJob={buildJob}
      renderControls={({ disabled, image }) => (
        <div className="space-y-5">
          <ResizeControls
            originalWidth={image?.width ?? 1200}
            originalHeight={image?.height ?? 800}
            value={resize}
            onChange={setResize}
            disabled={disabled}
          />
          <FormatSelector value={format} onChange={(f) => setFormat(f as OutputFormat)} disabled={disabled} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="resizer-quality" className="text-sm font-medium">Quality</label>
            <input
              id="resizer-quality"
              type="range"
              min={1}
              max={100}
              value={quality}
              disabled={disabled}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
            />
            <span className="text-right text-sm tabular-nums text-muted-foreground">{quality}</span>
          </div>
        </div>
      )}
    />
  );
}