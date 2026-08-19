import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildMetadata } from "@/lib/seo";

const ResizerTool = dynamic(() => import("@/components/tools/resizer").then((m) => m.ResizerTool), {
  ssr: false,
  loading: () => (
    <div className="container-page flex min-h-[60vh] items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading resizer…</div>
    </div>
  ),
});

export const metadata: Metadata = buildMetadata({
  title: "Free Image Resizer — Resize Photos Online",
  description:
    "Resize images to exact dimensions, percentages or popular social media presets. Free, fast and private.",
  path: "/resizer",
  keywords: ["image resizer", "resize photo", "social media sizes", "resize dimensions"],
});

export default function ResizerPage() {
  return <ResizerTool />;
}
