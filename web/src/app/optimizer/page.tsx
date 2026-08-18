import type { Metadata } from "next";
import { OptimizerTool } from "@/components/tools/optimizer";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free Image Optimizer — Optimize JPG, PNG, WebP & AVIF Online",
  description:
    "Optimize images for the web with full control over format, quality and size. Compress, resize and convert in one pass — free, private and entirely in your browser.",
  path: "/optimizer",
  keywords: ["image optimizer", "optimize images", "webp optimizer", "image compression"],
});

export default function OptimizerPage() {
  return <OptimizerTool />;
}