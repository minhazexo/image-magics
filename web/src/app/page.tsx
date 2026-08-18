"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, Zap, ImageDown, ArrowDownWideNarrow, Scissors, RefreshCw, Eraser, Images } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { ImageUploader } from "@/components/image/uploader";
import type { UploadedImage } from "@/lib/types";
import { useImageStore } from "@/lib/store/useImageStore";
import { cn } from "@/lib/utils/cn";

const PRIVACY_POINTS = [
  {
    title: "Local processing",
    text: "Every image is processed in your browser with WebAssembly-grade canvas technology. Your files never leave your device.",
  },
  {
    title: "No unnecessary uploads",
    text: "There is no upload pipeline. We cannot see, store or access your images at any point.",
  },
  {
    title: "No permanent storage",
    text: "Nothing is saved on our servers. Close the tab and your images are gone.",
  },
  {
    title: "Fast processing",
    text: "Processing happens on your machine, so there is no network latency and no queue to wait through.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const addImagesToStore = useImageStore((s) => s.addImages);

  const handleUploaded = (incoming: UploadedImage[]) => {
    setImages(incoming);
    if (incoming.length) {
      addImagesToStore(incoming);
      router.push("/optimizer");
    }
  };

  // Tool cards defined inline to avoid loading all tool definitions on homepage init
  const toolCards = useMemo(
    () => [
      {
        slug: "optimizer",
        name: "Image Optimizer",
        description: "Optimize images for the web with full control over format, quality and size.",
        icon: ImageDown,
      },
      {
        slug: "compressor",
        name: "Image Compressor",
        description: "Reduce image file size while preserving visual quality.",
        icon: ArrowDownWideNarrow,
      },
      {
        slug: "resizer",
        name: "Image Resizer",
        description: "Resize images to exact dimensions or by percentage.",
        icon: Scissors,
      },
      {
        slug: "converter",
        name: "Image Converter",
        description: "Convert between JPG, PNG, WEBP and AVIF.",
        icon: RefreshCw,
      },
      {
        slug: "background-remover",
        name: "Background Remover",
        description: "Remove image backgrounds locally and replace them with transparent, color or gradient.",
        icon: Eraser,
      },
      {
        slug: "batch",
        name: "Batch Image Processor",
        description: "Resize, convert and compress many images at once and download as ZIP.",
        icon: Images,
      },
    ],
    []
  );

  return (
    <div>
      {/* Hero */}
      <section className="container-page flex flex-col items-center pb-16 pt-16 text-center sm:pt-24">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Powerful Image Tools.
            <br />
            <span className="bg-gradient-to-r from-primary to-fuchsia-500 bg-clip-text text-transparent">
              Simple. Fast. Private.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Optimize, compress, resize, convert, crop and remove backgrounds from images
            directly in your browser. No uploads, no accounts, no waiting.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => document.getElementById("hero-dropzone")?.scrollIntoView({ behavior: "smooth" })}>
              Upload Image
            </Button>
            <Link href="/tools" className={buttonStyles("secondary", "lg")}>
              Explore Tools
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        <div id="hero-dropzone" className="mt-12 w-full max-w-3xl scroll-mt-24">
          <ImageUploader images={images} onChange={handleUploaded} dropzoneLabel={undefined} />
        </div>
      </section>

      {/* Tool grid */}
      <section className="container-page py-12" aria-labelledby="tools-heading">
        <h2 id="tools-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
          Everything You Need for Image Optimization
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {toolCards.map((tool) => (
            <a
              key={tool.slug}
              href={`/${tool.slug}`}
              className={cn(
                "group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 tool-card-hover",
                "block hover:no-underline"
              )}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
                aria-hidden
              >
                {[tool.icon].map((Icon) => (
                  <Icon className="h-5 w-5" aria-hidden />
                ))}
              </span>
              <div>
                <h3 className="font-semibold text-card-foreground group-hover:text-primary">{tool.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 self-start text-sm font-medium text-primary">
                Open Tool
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M9 5l7 7 2-4-4-2L14 3" />
                </svg>
              </span>
            </a>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/tools" className={buttonStyles("outline", "default")}>
            View all tools
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Privacy section */}
      <section className="border-y border-border bg-secondary/40 py-16">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Privacy first
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Your Images Stay Private</h2>
            <p className="mt-3 text-muted-foreground">
              Your images are processed locally in your browser. Your files are not uploaded
              to our servers.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRIVACY_POINTS.map((point) => {
              return (
                <div key={point.title} className="rounded-xl border border-border bg-card p-6">
                  <h3 className="mt-4 font-semibold">{point.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{point.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ teaser */}
      <section className="container-page py-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Frequently asked questions</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            {
              q: "Is this image compressor free?",
              a: "Yes. Every tool is free to use with no account required.",
            },
            {
              q: "Are my images uploaded?",
              a: "No. All processing happens locally in your browser. Your images never leave your device.",
            },
            {
              q: "Does image compression reduce quality?",
              a: "Compression trades some quality for a smaller file size. You control the quality with the slider and see a live before/after comparison.",
            },
            {
              q: "What image formats are supported?",
              a: "JPG, PNG, WebP, GIF, BMP and AVIF input. Output supports JPG, PNG, WebP and AVIF where your browser supports them.",
            },
          ].map((item) => (
            <details key={item.q} className="group rounded-xl border border-border bg-card p-5">
              <summary className="flex cursor-pointer items-center justify-between gap-2 font-medium">
                {item.q}
                <span className="text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}