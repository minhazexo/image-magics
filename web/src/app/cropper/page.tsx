import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildMetadata } from "@/lib/seo";

const CropperTool = dynamic(() => import("@/components/tools/cropper").then((m) => m.CropperTool), {
  ssr: false,
  loading: () => (
    <div className="container-page flex min-h-[60vh] items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading cropper…</div>
    </div>
  ),
});

export const metadata: Metadata = buildMetadata({
  title: "Free Image Cropper — Crop Photos to Any Aspect Ratio Online",
  description:
    "Crop images to any ratio with an interactive editor. Free crop or fixed ratios like 1:1, 16:9 and 4:3.",
  path: "/cropper",
  keywords: ["image cropper", "crop photo", "aspect ratio", "16:9"],
});

export default function CropperPage() {
  return <CropperTool />;
}
