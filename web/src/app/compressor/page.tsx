import type { Metadata } from "next";
import { CompressorTool } from "@/components/tools/compressor";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free Image Compressor — Compress JPG, PNG, WebP & AVIF Online",
  description:
    "Compress JPG, PNG and WebP images without losing noticeable quality. Instant before/after comparison and one-click download — free and private.",
  path: "/compressor",
  keywords: ["image compressor", "compress image", "reduce image size", "jpg compressor"],
});

export default function CompressorPage() {
  return <CompressorTool />;
}