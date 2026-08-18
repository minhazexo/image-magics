"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { ToolWorkflow } from "@/components/processing/tool-workflow";
import type { ProcessJobSpec } from "@/components/processing/tool-workflow";
import { FormatSelector } from "@/components/processing/format-selector";
import { QualitySlider } from "@/components/processing/quality-slider";
import type { OutputFormat, UploadedImage } from "@/lib/types";
import { FORMAT_OPTIONS } from "@/lib/types";

interface ConverterToolProps {
  defaultFormat?: OutputFormat;
  title?: string;
  description?: string;
  ctaLabel?: string;
}

export function ConverterTool({
  defaultFormat = "webp",
  title = "Image Converter",
  description = "Convert between JPG, PNG, WEBP and AVIF.",
  ctaLabel = "Convert Image",
}: ConverterToolProps) {
  const [format, setFormat] = useState<OutputFormat>(defaultFormat);
  const [quality, setQuality] = useState(88);

  const buildJob = (image: UploadedImage): ProcessJobSpec => ({
    operations: [{ type: "removeMetadata" }],
    encode: {
      format,
      quality,
      sourceFormat: image.format as never,
      preserveTransparency: format === "png" ? true : false,
    },
    suffix: "converted",
  });

  const pngToJpgWarning = format === "jpeg";

  return (
    <ToolWorkflow
      title={title}
      description={description}
      breadcrumbLabel={title}
      ctaLabel={ctaLabel}
      whatItDoes="The Image Converter re-encodes your image into the format you choose with format-specific quality settings, keeping results crisp and compatible."
      howToUse="Upload an image, choose the output format, set the quality, and click the convert button. A before/after comparison and download follow immediately."
      supportedFormats={["JPG", "PNG", "WEBP", "AVIF"]}
      privacyNote="Conversion happens locally in your browser. Your files are never uploaded to our servers."
      faq={[
        { question: "Why does JPG not support transparency?", answer: "The JPG format stores pixels as opaque RGB values. Transparent areas from a PNG are flattened to a background color (white by default) when converting to JPG." },
        { question: "What is WEBP?", answer: "WebP is a modern image format from Google that compresses photos 25–35% smaller than JPG at similar quality, and supports transparency." },
        { question: "What is AVIF?", answer: "AVIF is a next-generation format based on AV1 video compression. It offers even better compression than WebP, especially for photos." },
      ]}
      buildJob={buildJob}
      renderControls={({ disabled, image }) => (
        <div className="space-y-5">
          <FormatSelector value={format} onChange={(f) => setFormat(f as OutputFormat)} disabled={disabled} />
          <QualitySlider value={quality} onChange={setQuality} disabled={disabled} />
          {pngToJpgWarning && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
              <p className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>JPG does not support transparency. Transparent areas will use the selected background color.</span>
              </p>
              {image?.format === "png" && <p className="mt-1 pl-6">Your PNG will be flattened to a white background.</p>}
            </div>
          )}
          {format === "png" && (
            <p className="text-xs text-muted-foreground">
              PNG is lossless — quality is not applied, but file sizes are larger.
            </p>
          )}
          <div className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
            Output: {FORMAT_OPTIONS.find((f) => f.value === format)?.label}
          </div>
        </div>
      )}
    />
  );
}