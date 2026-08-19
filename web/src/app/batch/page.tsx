import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildMetadata } from "@/lib/seo";

const BatchTool = dynamic(() => import("@/components/tools/batch").then((m) => m.BatchTool), {
  ssr: false,
  loading: () => (
    <div className="container-page flex min-h-[60vh] items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading batch processor…</div>
    </div>
  ),
});

export const metadata: Metadata = buildMetadata({
  title: "Free Batch Image Processor — Resize, Convert & Compress Multiple Images",
  description:
    "Process multiple images at once — resize, convert, compress and download as ZIP. Free, fast and private.",
  path: "/batch",
  keywords: ["batch image processor", "bulk resize", "bulk compress", "zip download"],
});

export default function BatchPage() {
  return <BatchTool />;
}
