import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About ImageTools",
  description:
    "ImageTools is a privacy-first suite of image utilities that run entirely in your browser. Learn about our mission, technology and approach.",
  path: "/about",
  keywords: ["about", "image tools", "privacy-first"],
});

const VALUES = [
  {
    title: "Privacy by design",
    text: "The entire product is built around one rule: your images never leave your device. Every pixel is processed locally with browser-native technology.",
  },
  {
    title: "Fast by nature",
    text: "Because there is no server round-trip, processing starts instantly. Large images are handled with workers and memory-aware safeguards.",
  },
  {
    title: "Simple and honest",
    text: "No accounts, no fake stats, no hidden limits. Upload, process, download. What you see is what happens.",
  },
];

export default function AboutPage() {
  return (
    <div className="container-page py-10">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">About ImageTools</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          ImageTools is an all-in-one image optimizer and editing suite. Compress, resize, convert,
          crop, remove backgrounds and clean metadata — all directly in your browser, all without
          uploading a single file.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {VALUES.map((v) => (
          <div key={v.title} className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold">{v.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
          </div>
        ))}
      </div>

      <section className="mt-12 rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">How the technology works</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Each tool is a thin interface over a shared processing engine that draws onto HTML Canvas
          (and OffscreenCanvas inside Web Workers where supported). Formats such as WebP are
          encoded with the browser&apos;s native encoders, so you always get high-quality output with no
          extra downloads. ZIP archives for batch downloads are generated locally with JSZip. This
          architecture keeps bundles small, keeps memory predictable, and means the tools work offline
          once the page is loaded.
        </p>
      </section>

      <section className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">Our roadmap</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>WASM-powered background removal with AI matting running fully offline</li>
          <li>Advanced editor tools: healing brush, straighten, selective color</li>
          <li>Local history via IndexedDB so you can return to recent jobs</li>
          <li>A developer API for privacy-preserving server-side processing</li>
        </ul>
      </section>
    </div>
  );
}