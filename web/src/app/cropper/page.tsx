import type { Metadata } from "next";
import { CropperTool } from "@/components/tools/cropper";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free Image Cropper — Crop Photos to Any Ratio Online",
  description:
    "Crop images free-form or to exact ratios like 1:1, 4:3, 16:9 and 9:16 with a smooth interactive editor. Rotate, flip and zoom before cropping.",
  path: "/cropper",
  keywords: ["image cropper", "crop image", "crop photo", "aspect ratio"],
});

export default function CropperPage() {
  return <CropperTool />;
}