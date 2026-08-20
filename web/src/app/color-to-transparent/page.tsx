import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildMetadata } from "@/lib/seo";

const ColorToTransparentTool = dynamic(
  () => import("@/components/tools/color-to-transparent").then((m) => m.ColorToTransparentTool),
  {
    ssr: false,
    loading: () => (
      <div className="container-page flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading color tool…</div>
      </div>
    ),
  }
);

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