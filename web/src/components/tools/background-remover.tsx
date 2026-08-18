"use client";

import { useRef, useState } from "react";
import { ToolWorkflow } from "@/components/processing/tool-workflow";
import type { ProcessJobSpec } from "@/components/processing/tool-workflow";
import { Slider } from "@/components/ui/slider";
import type { UploadedImage } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { blobToDataUrl } from "@/lib/process/client";

type BgKind = "transparent" | "white" | "black" | "color" | "gradient" | "image";

export function BackgroundRemoverTool() {
  const [tolerance, setTolerance] = useState(60);
  const [bgKind, setBgKind] = useState<BgKind>("transparent");
  const [color, setColor] = useState("#ffffff");
  const [gradientFrom, setGradientFrom] = useState("#667eea");
  const [gradientTo, setGradientTo] = useState("#764ba2");
  const [bgImage, setBgImage] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const buildJob = (image: UploadedImage): ProcessJobSpec => {
    const background =
      bgKind === "transparent"
        ? { type: "transparent" as const }
        : bgKind === "white"
          ? { type: "white" as const }
          : bgKind === "black"
            ? { type: "black" as const }
            : bgKind === "color"
              ? { type: "color" as const, color }
              : bgKind === "gradient"
                ? { type: "gradient" as const, from: gradientFrom, to: gradientTo }
                : { type: "image" as const, dataUrl: bgImage ?? "" };

    return {
      operations: [
        {
          type: "removeBackground",
          options: { tolerance, background } as never,
        },
      ],
      encode: { format: "png", quality: 100, sourceFormat: image.format as never, preserveTransparency: true },
      suffix: "bg-removed",
    };
  };

  const bgOptions: { key: BgKind; label: string }[] = [
    { key: "transparent", label: "Transparent" },
    { key: "white", label: "White" },
    { key: "black", label: "Black" },
    { key: "color", label: "Custom color" },
    { key: "gradient", label: "Gradient" },
    { key: "image", label: "Image" },
  ];

  return (
    <ToolWorkflow
      title="Background Remover"
      description="Remove image backgrounds automatically — right in your browser."
      breadcrumbLabel="Background Remover"
      ctaLabel="Remove Background"
      whatItDoes="The Background Remover analyzes the border colors of your image and generates a matte that separates the subject from the background. The result is a transparent PNG, which you can also place on a solid color, gradient or image background."
      howToUse="Upload an image, adjust the tolerance to control how much of the background is removed, pick a replacement background (or keep it transparent), then click Remove Background."
      supportedFormats={["JPG", "PNG", "WEBP", "AVIF"]}
      privacyNote="Background removal runs locally in your browser. The model-like matting is performed on your device — nothing is uploaded to any server."
      faq={[
        { question: "How does background removal work?", answer: "We estimate the background from the image's border colors and build a soft alpha matte, so edges stay clean. Best results come from photos with a fairly uniform background." },
        { question: "Why does the tool use a local approach?", answer: "Privacy-first means your photo never leaves your device. The local matting engine produces good results for most photos without sending images to a third party." },
        { question: "What output format is used?", answer: "Transparent backgrounds require PNG. If you pick a solid color or image background, you can also export to JPG, WebP or AVIF." },
      ]}
      buildJob={buildJob}
      renderControls={({ disabled }) => (
        <div className="space-y-5">
          <Slider label="Background tolerance" value={tolerance} min={1} max={100} onChange={setTolerance} formatValue={(v) => `${v}%`} disabled={disabled} />

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Background</span>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Background replacement">
              {bgOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  role="radio"
                  aria-checked={bgKind === opt.key}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                    bgKind === opt.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-muted-foreground"
                  )}
                  onClick={() => setBgKind(opt.key)}
                  disabled={disabled}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {bgKind === "color" && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bg-color" className="text-sm font-medium">Background color</label>
              <input
                id="bg-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={disabled}
                className="h-10 w-full cursor-pointer rounded-md border border-input bg-background"
              />
            </div>
          )}

          {bgKind === "gradient" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bg-grad-from" className="text-sm font-medium">From</label>
                <input
                  id="bg-grad-from"
                  type="color"
                  value={gradientFrom}
                  onChange={(e) => setGradientFrom(e.target.value)}
                  disabled={disabled}
                  className="h-10 w-full cursor-pointer rounded-md border border-input bg-background"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bg-grad-to" className="text-sm font-medium">To</label>
                <input
                  id="bg-grad-to"
                  type="color"
                  value={gradientTo}
                  onChange={(e) => setGradientTo(e.target.value)}
                  disabled={disabled}
                  className="h-10 w-full cursor-pointer rounded-md border border-input bg-background"
                />
              </div>
            </div>
          )}

          {bgKind === "image" && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Background image</span>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) setBgImage(await blobToDataUrl(file));
                }}
                disabled={disabled}
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={disabled}
                className="flex h-12 items-center justify-center rounded-md border border-dashed border-border bg-secondary text-sm text-muted-foreground transition-colors hover:border-primary/50"
              >
                {bgImage ? "Replace background image…" : "Upload background image"}
              </button>
              {bgImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bgImage} alt="Background image preview" className="mx-auto max-h-20 rounded-md border border-border object-contain" />
              )}
            </div>
          )}

          {bgKind !== "transparent" && (
            <p className="text-xs text-muted-foreground">
              Tip: exporting with a non-transparent background also lets you use JPG, WebP or AVIF output.
            </p>
          )}
        </div>
      )}
    />
  );
}