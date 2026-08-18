import type { Metadata } from "next";
import { ColorToTransparentTool } from "@/components/tools/color-to-transparent";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free Color to Transparent — Remove a Specific Color from Images Online",
  description:
    "Remove any specific color from an image with an eyedropper, tolerance slider and edge softness. Real-time transparent preview — free and private.",
  path: "/color-to-transparent",
  keywords: ["color to transparent", "remove color", "make color transparent"],
});

export default function ColorToTransparentPage() {
  return <ColorToTransparentTool />;
}