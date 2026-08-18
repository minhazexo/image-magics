"use client";

import { useState } from "react";
import { ToolWorkflow } from "@/components/processing/tool-workflow";
import type { ProcessJobSpec } from "@/components/processing/tool-workflow";
import { Slider } from "@/components/ui/slider";
import { EyedropperImage } from "@/components/image/eyedropper";
import type { UploadedImage } from "@/lib/types";

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function rgbToHex({ r, g, b }: Rgb): string {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  const v = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

export function ColorToTransparentTool() {
  const [color, setColor] = useState<Rgb>({ r: 255, g: 255, b: 255 });
  const [tolerance, setTolerance] = useState(30);
  const [edgeSmoothing, setEdgeSmoothing] = useState(35);

  const buildJob = (image: UploadedImage): ProcessJobSpec => ({
    operations: [
      {
        type: "removeColor",
        options: { color, tolerance, edgeSmoothing },
      },
    ],
    encode: { format: "png", quality: 100, sourceFormat: image.format as never, preserveTransparency: true },
    suffix: "transparent",
  });

  return (
    <ToolWorkflow
      title="Color to Transparent"
      description="Pick any color and remove it with the eyedropper."
      breadcrumbLabel="Color to Transparent"
      ctaLabel="Make Transparent"
      whatItDoes="The Color to Transparent tool removes an exact color (picked with the eyedropper or color picker) and replaces it with transparency, with fine tolerance and edge-softness control."
      howToUse="Upload an image, click on the image preview to sample a color (or use the color picker), adjust tolerance and edge softness, then click Make Transparent."
      supportedFormats={["JPG", "PNG", "WEBP", "AVIF"]}
      privacyNote="Color removal runs locally in your browser. Nothing is uploaded."
      faq={[
        { question: "What does the eyedropper do?", answer: "Click anywhere on the image to sample the exact color under your cursor and set it as the color to remove." },
        { question: "How is edge softness different from tolerance?", answer: "Tolerance decides how many similar colors are removed. Edge softness feathers the boundary so the cut-out looks smooth." },
      ]}
      buildJob={buildJob}
      renderControls={({ disabled, image }) => (
        <div className="space-y-5">
          {image && image.valid && (
            <EyedropperImage
              src={image.url}
              onPickColor={(c) => {
                setColor(c);
              }}
              className="mb-1"
            />
          )}
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ct-color" className="text-sm font-medium">Selected color</label>
              <input
                id="ct-color"
                type="color"
                value={rgbToHex(color)}
                onChange={(e) => setColor(hexToRgb(e.target.value))}
                disabled={disabled}
                className="h-10 w-16 cursor-pointer rounded-md border border-input bg-background"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <span
                className="h-8 w-8 rounded-md border border-border"
                style={{ backgroundColor: rgbToHex(color) }}
                aria-hidden
              />
              <code className="rounded-md bg-secondary px-2 py-1 text-xs font-medium">{rgbToHex(color).toUpperCase()}</code>
            </div>
          </div>
          <Slider label="Tolerance" value={tolerance} min={0} max={100} onChange={setTolerance} disabled={disabled} />
          <Slider label="Edge softness" value={edgeSmoothing} min={0} max={100} onChange={setEdgeSmoothing} disabled={disabled} />
        </div>
      )}
    />
  );
}