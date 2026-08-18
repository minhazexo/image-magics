"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ToolWorkflow } from "@/components/processing/tool-workflow";
import type { ProcessJobSpec } from "@/components/processing/tool-workflow";
import { QualitySlider } from "@/components/processing/quality-slider";
import { FormatSelector } from "@/components/processing/format-selector";
import { ResizeControls } from "@/components/processing/resize-controls";
import type { OutputFormat, ResizeOptions, UploadedImage } from "@/lib/types";
import { useImageStore } from "@/lib/store/useImageStore";
import { Button } from "@/components/ui/button";

export function OptimizerTool() {
  const preferences = useImageStore((s) => s.preferences);
  const updatePreferences = useImageStore((s) => s.updatePreferences);
  const [format, setFormat] = useState<OutputFormat | "auto">("auto");
  const [quality, setQuality] = useState(preferences.lastQuality);
  const [stripMetadata, setStripMetadata] = useState(true);
  const [progressive, setProgressive] = useState(true);
  const [sharpen, setSharpen] = useState(false);
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [resize, setResize] = useState<ResizeOptions>({ lockAspectRatio: true });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const buildJob = (image: UploadedImage): ProcessJobSpec => {
    const operations: ProcessJobSpec["operations"] = [];
    if (resizeEnabled) {
      operations.push({
        type: "resize",
        options: { ...resize, mode: resize.mode ?? "pixels", sharpen: resize.sharpen ?? sharpen },
      });
    }
    operations.push({ type: "removeMetadata" });

    return {
      operations,
      encode: {
        format,
        quality,
        sourceFormat: image.format as never,
        stripMetadata,
        progressive: format === "jpeg" ? progressive : false,
        preserveTransparency: true,
      },
      suffix: "optimized",
    };
  };

  return (
    <ToolWorkflow
      title="Image Optimizer"
      description="Optimize your images for the web — choose format, quality and size in one pass."
      breadcrumbLabel="Image Optimizer"
      ctaLabel="Optimize Image"
      whatItDoes="The Image Optimizer re-encodes your image with the exact format, quality and dimensions you choose, stripping unneeded metadata for the smallest possible file that still looks great. All processing happens locally in your browser."
      howToUse="Upload one or more images, pick an output format and quality, optionally enable resizing, then click Optimize Image. Compare the before/after result and download the optimized file."
      supportedFormats={["JPG", "PNG", "WEBP", "AVIF", "GIF", "BMP"]}
      privacyNote="Your images are processed locally in your browser. They are never uploaded to our servers and are automatically released from memory after download."
      faq={[
        { question: "What is the best format for the web?", answer: "WebP or AVIF offer the best quality-per-byte for photos. Use PNG when you need transparency and JPG for maximum compatibility." },
        { question: "Does optimizing strip metadata?", answer: "Yes — by default we strip EXIF, GPS and camera information. You can disable this in Advanced Settings." },
        { question: "What quality should I use?", answer: "82 is a great starting point for photos. Try the presets and use the before/after slider to find the right balance." },
      ]}
      buildJob={buildJob}
      renderControls={({ disabled, image }) => (
        <div className="space-y-5">
          <FormatSelector
            value={format}
            onChange={(v) => {
              setFormat(v);
              if (v !== "auto") updatePreferences({ lastFormat: v });
            }}
            includeAuto
            disabled={disabled}
          />

          <QualitySlider value={quality} onChange={(v) => { setQuality(v); updatePreferences({ lastQuality: v }); }} disabled={disabled} />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="resize-toggle" className="text-sm font-medium">Resize</label>
              <button
                id="resize-toggle"
                type="button"
                role="switch"
                aria-checked={resizeEnabled}
                disabled={disabled}
                className="relative h-6 w-11 rounded-full bg-secondary transition-colors disabled:opacity-50"
                onClick={() => setResizeEnabled((v) => !v)}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-all ${resizeEnabled ? "left-[calc(100%-22px)]" : "left-0.5"}`} />
              </button>
            </div>
            {resizeEnabled && image && (
              <ResizeControls
                originalWidth={image.width}
                originalHeight={image.height}
                value={resize}
                onChange={setResize}
                disabled={disabled}
              />
            )}
          </div>

          <div>
            <Button
              variant="ghost"
              size="sm"
              className="px-0 text-primary"
              onClick={() => setShowAdvanced((v) => !v)}
              aria-expanded={showAdvanced}
            >
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Advanced Settings
            </Button>
            {showAdvanced && (
              <div className="mt-2 space-y-3">
                <label className="flex items-center justify-between gap-2 text-sm">
                  Strip metadata (EXIF/GPS)
                  <input
                    type="checkbox"
                    checked={stripMetadata}
                    onChange={(e) => setStripMetadata(e.target.checked)}
                    disabled={disabled}
                    className="h-4 w-4 rounded accent-primary"
                  />
                </label>
                <label className="flex items-center justify-between gap-2 text-sm">
                  Progressive JPEG
                  <input
                    type="checkbox"
                    checked={progressive}
                    onChange={(e) => setProgressive(e.target.checked)}
                    disabled={disabled || format !== "jpeg"}
                    className="h-4 w-4 rounded accent-primary"
                  />
                </label>
                <label className="flex items-center justify-between gap-2 text-sm">
                  Sharpen after resize
                  <input
                    type="checkbox"
                    checked={sharpen}
                    onChange={(e) => setSharpen(e.target.checked)}
                    disabled={disabled}
                    className="h-4 w-4 rounded accent-primary"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    />
  );
}