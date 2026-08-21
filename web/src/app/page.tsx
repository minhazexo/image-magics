"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ShieldCheck, Zap, Clock, Eye, Upload,
  ImageDown, ArrowDownWideNarrow, Scissors, RefreshCw, Images,
  Crop, Palette, Type, SlidersHorizontal, PaintBucket, Eraser, FileImage, Shrink,
  Search, Settings, Download, Lock,
} from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { cn } from "@/lib/utils/cn";

/* Lazy-load the heavy ImageUploader so the homepage JS bundle stays small */
const ImageUploader = dynamic(
  () => import("@/components/image/uploader").then((m) => m.ImageUploader),
  { ssr: false }
);

import type { UploadedImage } from "@/lib/types";

/* ── Tool data ────────────────────────────────────────────────── */
const POPULAR_TOOLS = [
  { slug: "optimizer", name: "Optimizer", desc: "Optimize for web delivery", icon: ImageDown },
  { slug: "compressor", name: "Compressor", desc: "Reduce file size", icon: ArrowDownWideNarrow },
  { slug: "resizer", name: "Resizer", desc: "Resize to exact dimensions", icon: Scissors },
  { slug: "transparent-image", name: "Transparent", desc: "Remove backgrounds with AI", icon: PaintBucket },
  { slug: "converter", name: "Converter", desc: "JPG, PNG, WebP formats", icon: RefreshCw },
  { slug: "batch", name: "Batch Process", desc: "Process many images at once", icon: Images },
];

const MORE_TOOLS = [
  { slug: "cropper", name: "Cropper", icon: Crop },
  { slug: "editor", name: "Editor", icon: SlidersHorizontal },
  { slug: "watermark", name: "Watermark", icon: Type },
  { slug: "metadata-remover", name: "Metadata", icon: Eraser },
  { slug: "rotator", name: "Rotator", icon: Shrink },
  { slug: "jpg-to-png", name: "JPG → PNG", icon: FileImage },
  { slug: "png-to-jpg", name: "PNG → JPG", icon: FileImage },
  { slug: "webp-converter", name: "WebP", icon: FileImage },
  { slug: "color-to-transparent", name: "Color → Transp.", icon: Palette },
];

/* ── Reveal wrapper ───────────────────────────────────────────── */
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function HomePage() {
  const router = useRouter();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [showAll, setShowAll] = useState(false);

  const handleUploaded = (incoming: UploadedImage[]) => {
    setImages(incoming);
    if (incoming.length) {
      import("@/lib/store/useImageStore").then(({ useImageStore }) => {
        useImageStore.getState().addImages(incoming);
        router.push("/optimizer");
      });
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — HERO
          ═══════════════════════════════════════════════════════ */}
      <section className="min-h-[85vh] flex items-center">
        <div className="container-page w-full py-20 text-center">
          <Reveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary sm:text-sm">
              Privacy-first image processing
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="text-5xl font-bold tracking-tighter sm:text-6xl lg:text-8xl">
              IMAGETOOLS
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground sm:text-xl">
              Image tools that run entirely in your browser.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground/70">
              Optimize, compress, resize, convert, and remove backgrounds — instantly, privately, and for free.
            </p>
          </Reveal>
          <Reveal delay={400}>
            <div className="mt-8 flex items-center justify-center gap-4">
              <a
                href="#upload"
                className="btn-press inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
              >
                <Upload className="h-4 w-4" />
                Start editing
              </a>
              <Link
                href="/tools"
                className="btn-press inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-6 py-3 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-card"
              >
                View all tools
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — STATS
          ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 border-y border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container-page">
          <div className="grid grid-cols-3 divide-x divide-border/50">
            {[
              { value: "15+", label: "Tools" },
              { value: "5+", label: "Formats" },
              { value: "100%", label: "Private" },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 100}>
                <div className="py-10 text-center sm:py-14">
                  <span className="stat-number">{stat.value}</span>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:text-sm">
                    {stat.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3 — UPLOAD CTA
          ═══════════════════════════════════════════════════════ */}
      <section id="upload" className="relative z-10 container-page scroll-mt-20 py-16 sm:py-20">
        <Reveal>
          <div className="mx-auto max-w-2xl">
            <ImageUploader images={images} onChange={handleUploaded} />
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Drag & drop or paste · JPG, PNG, WebP, GIF, BMP · Up to 100 MB · Nothing leaves your device
            </p>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4 — BIG STATEMENT
          ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 border-y border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container-page py-16 sm:py-24">
          <Reveal>
            <p className="big-statement mx-auto max-w-3xl text-center">
              Every image processed locally. No uploads. No servers. No compromises.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <p className="mx-auto mt-6 max-w-lg text-center text-sm text-muted-foreground leading-relaxed sm:text-base">
              Your photos never leave your browser. All compression, conversion, and editing happens on your device — fast, private, and free.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 5 — TOOLS GRID
          ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 container-page py-16 sm:py-20" aria-labelledby="tools-heading">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Tools</p>
              <h2 id="tools-heading" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Everything you need
              </h2>
            </div>
            <Link href="/tools" className="hidden text-sm font-medium text-primary hover:underline sm:inline-flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_TOOLS.map((tool, i) => (
            <Reveal key={tool.slug} delay={i * 60}>
              <a
                href={`/${tool.slug}`}
                className="group card-interactive flex items-center gap-4 p-5 block hover:no-underline"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <tool.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">
                    {tool.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{tool.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </a>
            </Reveal>
          ))}
        </div>

        {/* Show more tools */}
        {!showAll && (
          <Reveal delay={400}>
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowAll(true)}
                className="text-sm font-medium text-primary hover:underline"
              >
                Show all {POPULAR_TOOLS.length + MORE_TOOLS.length} tools
              </button>
            </div>
          </Reveal>
        )}

        {showAll && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-3">
            {MORE_TOOLS.map((tool) => (
              <a
                key={tool.slug}
                href={`/${tool.slug}`}
                className="group card-interactive flex items-center gap-3 p-3.5 block hover:no-underline"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <tool.icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-card-foreground group-hover:text-primary transition-colors">
                  {tool.name}
                </span>
              </a>
            ))}
          </div>
        )}

        <Reveal>
          <div className="mt-8 text-center sm:hidden">
            <Link href="/tools" className="text-sm font-medium text-primary hover:underline">
              View all tools →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 6 — HOW IT WORKS
          ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 border-y border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container-page py-16 sm:py-24">
          <Reveal>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Process</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                How it works
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                Four simple steps from upload to download. No account, no waiting.
              </p>
            </div>
          </Reveal>

          {/* Stepper — horizontal on lg, vertical on mobile */}
          <div className="relative mt-14">
            {/* Connector line — horizontal on lg */}
            <div className="absolute left-[22px] top-0 h-full w-px bg-border lg:left-0 lg:top-[28px] lg:h-px lg:w-full" />

            <div className="grid gap-10 lg:grid-cols-4 lg:gap-0">
              {[
                {
                  step: "01",
                  icon: Upload,
                  title: "Drop your image",
                  desc: "Drag, drop, paste, or click to upload. Works with JPG, PNG, WebP, GIF, and BMP.",
                },
                {
                  step: "02",
                  icon: Search,
                  title: "Pick a tool",
                  desc: "Choose optimize, compress, resize, convert, crop, remove background, or any other tool.",
                },
                {
                  step: "03",
                  icon: Settings,
                  title: "Adjust settings",
                  desc: "Fine-tune quality, dimensions, format, and other parameters to your needs.",
                },
                {
                  step: "04",
                  icon: Download,
                  title: "Download result",
                  desc: "See the comparison instantly. Download the processed image or process another.",
                },
              ].map((item, i) => (
                <Reveal key={item.step} delay={i * 120}>
                  <div className="relative flex gap-5 lg:flex-col lg:items-center lg:text-center lg:gap-0">
                    {/* Step circle */}
                    <div className="relative z-10 flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border-2 border-primary/20 bg-background lg:h-14 lg:w-14">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary lg:h-12 lg:w-12">
                        <item.icon className="h-5 w-5" />
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-0.5 lg:pt-7">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary/50">Step {item.step}</span>
                      <h3 className="mt-1.5 text-sm font-semibold lg:text-base">{item.title}</h3>
                      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed sm:text-sm lg:text-xs">{item.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 7 — WHY IMAGETOOLS
          ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 container-page py-16 sm:py-24" aria-labelledby="why-heading">
        <Reveal>
          <div className="mx-auto max-w-lg text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Why ImageTools</p>
            <h2 id="why-heading" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Built for speed and privacy, not marketing.
            </h2>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Zap, title: "Instant", desc: "No upload wait. Processing starts the moment you drop a file." },
            { icon: ShieldCheck, title: "Private", desc: "Your images never leave your browser. Zero server uploads." },
            { icon: Clock, title: "No limits", desc: "No daily quotas, no watermarks, no accounts required." },
            { icon: Eye, title: "See results", desc: "Live before/after comparison with pixel-level detail." },
          ].map((item, i) => (
            <Reveal key={item.title} delay={i * 80}>
              <div className="card-base p-6 text-center sm:text-left">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-sm">{item.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="mt-12 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Lock className="h-3 w-3" /> Encrypted</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> No tracking</span>
            <span className="inline-flex items-center gap-1.5"><Zap className="h-3 w-3" /> Client-side only</span>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 8 — FAQ
          ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 border-y border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container-page py-16 sm:py-24">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">FAQ</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Frequently asked questions
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              { q: "Is ImageTools free?", a: "Yes. Every tool is free to use with no account, no watermarks, and no limits." },
              { q: "Are my images uploaded?", a: "No. All processing happens locally in your browser. Your images never leave your device." },
              { q: "What formats are supported?", a: "JPG, PNG, WebP, GIF, and BMP input. Output supports JPG, PNG, and WebP." },
              { q: "Does compression reduce quality?", a: "Compression trades some quality for a smaller file. You control the quality slider and see a live before/after." },
              { q: "Can I batch-process images?", a: "Yes. Upload multiple images and process them all at once, then download as a ZIP." },
              { q: "Is there a file size limit?", a: "Up to 100 MB per image. For most photos and graphics this is more than enough." },
            ].map((item, i) => (
              <Reveal key={item.q} delay={i * 60}>
                <details className="group card-base p-5">
                  <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium">
                    {item.q}
                    <span className="text-muted-foreground transition-transform group-open:rotate-45 text-lg shrink-0" aria-hidden>+</span>
                  </summary>
                  <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 9 — BOTTOM CTA
          ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 container-page py-20 sm:py-28">
        <Reveal>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Start processing your images.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground sm:text-base">
              No sign-up. No uploads. Just drop your image and go.
            </p>
            <div className="mt-8">
              <a
                href="#upload"
                className="btn-press inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
              >
                <Upload className="h-4 w-4" />
                Upload an image
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
