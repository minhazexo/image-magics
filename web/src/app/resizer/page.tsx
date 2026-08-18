import type { Metadata } from "next";
import { ResizerTool } from "@/components/tools/resizer";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free Image Resizer — Resize Images to Any Dimension Online",
  description:
    "Resize images to exact pixels, percentages or social media presets like Instagram, Facebook and YouTube. Batch resize up to 100 images for free.",
  path: "/resizer",
  keywords: ["image resizer", "resize image", "social media image size"],
});

export default function ResizerPage() {
  return <ResizerTool />;
}