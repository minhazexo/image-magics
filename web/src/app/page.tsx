"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ShieldCheck, Zap, Clock, Eye,
  ImageDown, ArrowDownWideNarrow, Scissors, RefreshCw, Images,
  Crop, Palette, Type, SlidersHorizontal, PaintBucket, Eraser, FileImage, Shrink,
} from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { ImageUploader } from "@/components/image/uploader";
import type { UploadedImage } from "@/lib/types";
import { useImageStore } from "@/lib/store/useImageStore";
import { cn } from "@/lib/utils/cn";

const ALL_TOOLS = [
  { slug: "optimizer", name: "Image Optimizer", desc: "Optimize for web delivery", icon: ImageDown, category: "popular" },
  { slug: "compressor", name: "Image Compressor", desc: "Reduce file size", icon: ArrowDownWideNarrow, category: "popular" },
  { slug: "resizer", name: "Image Resizer", desc: "Resize to exact dimensions", icon: Scissors, category: "popular" },
  { slug: "transparent-image", name: "Transparent Image", desc: "Remove backgrounds with AI", icon: PaintBucket, category: "popular" },
  { slug: "converter", name: "Image Converter", desc: "JPG, PNG, WebP", icon: RefreshCw, category: "popular" },
  { slug: "batch", name: "Batch Processor", desc: "Process many images at once", icon: Images, category: "popular" },
  { slug: "cropper", name: "Image Cropper", desc: "Crop to any ratio", icon: Crop, category: "more" },
  { slug: "editor", name: "Image Editor", desc: "Filters, brightness, contrast", icon: SlidersHorizontal, category: "more" },
  { slug: "watermark", name: "Watermark Tool", desc: "Add text or logo", icon: Type, category: "more" },
  { slug: "metadata-remover", name: "Metadata Remover", desc: "Strip EXIF & GPS data", icon: Eraser, category: "more" },
  { slug: "rotator", name: "Image Rotator", desc: "Rotate & flip", icon: Shrink, category: "more" },
  { slug: "jpg-to-png", name: "JPG to PNG", desc: "Convert JPG to PNG", icon: FileImage, category: "more" },
  { slug: "png-to-jpg", name: "PNG to JPG", desc: "Convert PNG to JPG", icon: FileImage, category: "more" },
  { slug: "webp-converter", name: "WebP Converter", desc: "Convert to WebP", icon: FileImage, category: "more" },
  { slug: "color-to-transparent", name: "Color to Transparent", desc: "Pick color, make transparent", icon: Palette, category: "more" },
];

export default function HomePage() {
  const router = useRouter();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const addImagesToStore = useImageStore((s) => s.addImages);
  const [showAll, setShowAll] = useState(false);

  const handleUploaded = (incoming: UploadedImage[]) => {
    setImages(incoming);
    if (incoming.length) {
      addImagesToStore(incoming);
      router.push("/optimizer");
    }
  };

  const popularTools = useMemo(() => ALL_TOOLS.filter((t) => t.category === "popular"), []);
  const moreTools = useMemo(() => ALL_TOOLS.filter((t) => t.category === "more"), []);
  const displayedTools = showAll ? ALL_TOOLS : popularTools;

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="container-page flex flex-col items-center pb-8 pt-12 text-center sm:pt-16">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Image tools that run
            <br />
            <span className="text-primary">entirely in your browser.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground sm:text-base">
            Optimize, compress, resize, convert, crop, and remove backgrounds — instantly, privately, and for free.
          </p>
        </div>
      </section>

      {/* ── Upload CTA ───────────────────────────────────── */}
      <section className="container-page pb-12">
        <div className="mx-auto max-w-2xl">
          <ImageUploader images={images} onChange={handleUploaded} />
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Drag & drop or paste · JPG, PNG, WebP · Up to 100 MB · Nothing leaves your device
          </p>
        </div>
      </section>

      {/* ── Popular Tools ─────────────────────────────────── */}
      <section className="container-page py-10" aria-labelledby="popular-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="popular-heading" className="text-lg font-bold tracking-tight sm:text-xl">
              Popular Tools
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Most-used image utilities</p>
          </div>
          <Link href="/tools" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displayedTools.map((tool) => (
            <a
              key={tool.slug}
              href={`/${tool.slug}`}
              className="group card-interactive flex items-center gap-3 p-3.5 block hover:no-underline"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <tool.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">
                  {tool.name}
                </h3>
                <p className="text-xs text-muted-foreground truncate">{tool.desc}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </a>
          ))}
        </div>
        {!showAll && (
          <div className="mt-5 text-center">
            <button
              onClick={() => setShowAll(true)}
              className="text-sm font-medium text-primary hover:underline"
            >
              Show all {ALL_TOOLS.length} tools
            </button>
          </div>
        )}
      </section>

      {/* ── Why Use This Platform ─────────────────────────── */}
      <section className="border-y border-border bg-secondary/30 py-12">
        <div className="container-page">
          <div className="mx-auto max-w-lg text-center">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Why ImageTools?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Built for speed and privacy, not marketing.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Zap, title: "Instant", desc: "No upload wait. Processing starts the moment you drop a file." },
              { icon: ShieldCheck, title: "Private", desc: "Your images never leave your browser. Zero server uploads." },
              { icon: Clock, title: "No limits", desc: "No daily quotas, no watermarks, no accounts required." },
              { icon: Eye, title: "See results", desc: "Live before/after comparison with pixel-level detail." },
            ].map((item) => (
              <div key={item.title} className="card-base p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-4 w-4" />
                </span>
                <h3 className="mt-3 font-semibold text-sm">{item.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Highlights ────────────────────────────── */}
      <section className="container-page py-12">
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">How it works</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            { step: "01", title: "Drop your image", desc: "Drag, drop, paste, or click to upload. Works with JPG, PNG, WebP, GIF, and BMP." },
            { step: "02", title: "Pick a tool", desc: "Choose optimize, compress, resize, convert, crop, remove background, or any other tool." },
            { step: "03", title: "Download result", desc: "See the comparison instantly. Download the processed image or process another." },
          ].map((item) => (
            <div key={item.step} className="relative">
              <span className="text-4xl font-bold text-primary/10">{item.step}</span>
              <h3 className="mt-1 font-semibold text-sm">{item.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="container-page py-12">
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">Frequently asked questions</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {[
            { q: "Is ImageTools free?", a: "Yes. Every tool is free to use with no account, no watermarks, and no limits." },
            { q: "Are my images uploaded?", a: "No. All processing happens locally in your browser. Your images never leave your device." },
            { q: "What formats are supported?", a: "JPG, PNG, WebP, GIF, and BMP input. Output supports JPG, PNG, and WebP." },
            { q: "Does compression reduce quality?", a: "Compression trades some quality for a smaller file. You control the quality slider and see a live before/after." },
            { q: "Can I batch-process images?", a: "Yes. Upload multiple images and process them all at once, then download as a ZIP." },
            { q: "Is there a file size limit?", a: "Up to 100 MB per image. For most photos and graphics this is more than enough." },
          ].map((item) => (
            <details key={item.q} className="group card-base p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium">
                {item.q}
                <span className="text-muted-foreground transition-transform group-open:rotate-45 text-lg shrink-0" aria-hidden>+</span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
