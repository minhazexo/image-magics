import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildMetadata } from "@/lib/seo";

const OptimizerTool = dynamic(() => import("@/components/tools/optimizer").then((m) => m.OptimizerTool), {
  ssr: false,
  loading: () => (
    <div className="container-page flex min-h-[60vh] items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading optimizer…</div>
    </div>
  ),
});

export const metadata: Metadata = buildMetadata({
  title: "Free Image Optimizer — Optimize JPG, PNG & WebP Online",
  description:
    "Optimize images for the web with full control over format, quality and size. Compress, resize and convert in one pass — free, private and entirely in your browser.",
  path: "/optimizer",
  keywords: ["image optimizer", "optimize images", "webp optimizer", "image compression"],
});

export default function OptimizerPage() {
  return <OptimizerTool />;
}
