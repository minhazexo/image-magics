"use client";

import { useMemo, useRef, useState } from "react";
import { Type, Image as ImageIcon } from "lucide-react";
import { ToolWorkflow } from "@/components/processing/tool-workflow";
import type { ProcessJobSpec } from "@/components/processing/tool-workflow";
import { Slider } from "@/components/ui/slider";
import type { UploadedImage, WatermarkOptions, WatermarkPosition } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { blobToDataUrl } from "@/lib/process/client";

const POSITIONS: { key: WatermarkPosition; label: string }[] = [
  { key: { horizontal: "left", vertical: "top" }, label: "Top left" },
  { key: { horizontal: "center", vertical: "top" }, label: "Top center" },
  { key: { horizontal: "right", vertical: "top" }, label: "Top right" },
  { key: { horizontal: "left", vertical: "center" }, label: "Center left" },
  { key: { horizontal: "center", vertical: "center" }, label: "Center" },
  { key: { horizontal: "right", vertical: "center" }, label: "Center right" },
  { key: { horizontal: "left", vertical: "bottom" }, label: "Bottom left" },
  { key: { horizontal: "center", vertical: "bottom" }, label: "Bottom center" },
  { key: { horizontal: "right", vertical: "bottom" }, label: "Bottom right" },
];

const FONTS = ["Arial", "Helvetica", "Georgia", "Verdana", "Tahoma", "Courier New", "Impact", "Trebuchet MS"];

export function WatermarkTool() {
  const [kind, setKind] = useState<"text" | "image">("text");
  const [text, setText] = useState("Your Brand");
  const [position, setPosition] = useState<WatermarkPosition>({ horizontal: "center", vertical: "center" });
  const [opacity, setOpacity] = useState(50);
  const [scale, setScale] = useState(20);
  const [rotation, setRotation] = useState(0);
  const [color, setColor] = useState("#ffffff");
  const [font, setFont] = useState("Arial");
  const [margin, setMargin] = useState(3);
  const [tiled, setTiled] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const isPosition = (p: WatermarkPosition) => p.horizontal === position.horizontal && p.vertical === position.vertical;

  const buildJob = (image: UploadedImage): ProcessJobSpec => {
    const options: WatermarkOptions =
      kind === "text"
        ? { kind: "text", text, position, opacity: opacity / 100, size: 0, rotation, color, font, margin, tiled, scale: scale / 100 }
        : { kind: "image", dataUrl: logoDataUrl ?? "", position, opacity: opacity / 100, rotation, margin, tiled, scale: scale / 100 };

    return {
      operations: [{ type: "watermark", options }],
      encode: { format: "png", quality: 92, sourceFormat: image.format as never, preserveTransparency: true },
      suffix: "watermarked",
    };
  };

  const handleLogoUpload = async (file: File | undefined) => {
    if (!file) return;
    const dataUrl = await blobToDataUrl(file);
    setLogoDataUrl(dataUrl);
    setKind("image");
  };

  const preview = useMemo(() => {
    if (kind === "text" && !text) return null;
    if (kind === "image" && !logoDataUrl) return null;
    return null;
  }, [kind, text, logoDataUrl]);

  void preview;

  return (
    <ToolWorkflow
      title="Watermark Tool"
      description="Add text or logo watermarks to protect your images."
      breadcrumbLabel="Watermark Tool"
      ctaLabel="Apply Watermark"
      whatItDoes="The Watermark Tool places a text or image/logo watermark on your image with full control over position, opacity, size, rotation, color, font and margin. Tiling is supported."
      howToUse="Upload an image, choose a text or image watermark, style it with the controls, then click Apply Watermark. Download the result as a PNG."
      supportedFormats={["JPG", "PNG", "WEBP", "AVIF"]}
      privacyNote="Watermarking happens locally in your browser. Logos you upload are used only to create the watermark and are never transmitted."
      faq={[
        { question: "Can I use my logo as a watermark?", answer: "Yes — switch to Image watermark and upload your logo. PNG logos with transparency work best." },
        { question: "What is tiled mode?", answer: "Tiled mode repeats the watermark across the whole image, which is useful to make removal difficult." },
      ]}
      buildJob={buildJob}
      renderControls={({ disabled }) => (
        <div className="space-y-5">
          <div className="flex gap-1.5" role="tablist" aria-label="Watermark type">
            {(
              [
                { key: "text", label: "Text", icon: Type },
                { key: "image", label: "Image / Logo", icon: ImageIcon },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={kind === tab.key}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    kind === tab.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-muted-foreground"
                  )}
                  onClick={() => setKind(tab.key)}
                  disabled={disabled}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {kind === "text" ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="wm-text" className="text-sm font-medium">Watermark text</label>
                <input
                  id="wm-text"
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={disabled}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="wm-color" className="text-sm font-medium">Color</label>
                  <input
                    id="wm-color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    disabled={disabled}
                    className="h-10 w-full cursor-pointer rounded-md border border-input bg-background"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="wm-font" className="text-sm font-medium">Font</label>
                  <select
                    id="wm-font"
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                    disabled={disabled}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {FONTS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Logo image</span>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                  disabled={disabled}
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={disabled}
                  className="flex h-12 items-center justify-center rounded-md border border-dashed border-border bg-secondary text-sm text-muted-foreground transition-colors hover:border-primary/50"
                >
                  {logoDataUrl ? "Replace logo…" : "Upload logo (PNG recommended)"}
                </button>
              </div>
              {logoDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoDataUrl} alt="Logo preview" className="mx-auto max-h-20 rounded-md border border-border object-contain" />
              )}
            </div>
          )}

          <Slider label="Opacity" value={opacity} min={1} max={100} onChange={setOpacity} formatValue={(v) => `${v}%`} disabled={disabled} />
          <Slider label="Size" value={scale} min={5} max={60} onChange={setScale} formatValue={(v) => `${v}%`} disabled={disabled} />
          <Slider label="Rotation" value={rotation} min={-180} max={180} onChange={setRotation} formatValue={(v) => `${v}°`} disabled={disabled} />
          <Slider label="Margin" value={margin} min={0} max={15} onChange={setMargin} formatValue={(v) => `${v}%`} disabled={disabled} />

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Position</span>
            <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Watermark position">
              {POSITIONS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  role="radio"
                  aria-checked={isPosition(p.key)}
                  disabled={disabled || tiled}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                    isPosition(p.key) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-muted-foreground",
                    tiled && "opacity-40"
                  )}
                  onClick={() => setPosition(p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between gap-2 text-sm">
            Tiled watermark
            <input type="checkbox" checked={tiled} onChange={(e) => setTiled(e.target.checked)} disabled={disabled} className="h-4 w-4 rounded accent-primary" />
          </label>
        </div>
      )}
    />
  );
}