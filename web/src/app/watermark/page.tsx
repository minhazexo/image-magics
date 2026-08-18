import type { Metadata } from "next";
import { WatermarkTool } from "@/components/tools/watermark";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free Watermark Tool — Add Text & Logo Watermarks Online",
  description:
    "Add text or logo watermarks to your images with control over position, opacity, size, rotation and tiling. Free, private and in your browser.",
  path: "/watermark",
  keywords: ["watermark", "add watermark", "logo watermark", "image protection"],
});

export default function WatermarkPage() {
  return <WatermarkTool />;
}