import type { Metadata } from "next";
import { BatchTool } from "@/components/tools/batch";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free Batch Image Processor — Compress & Resize Many Images at Once",
  description:
    "Batch compress, resize and convert up to 100+ images at once with identical settings, then download them as a ZIP. Free, fast and entirely in your browser.",
  path: "/batch",
  keywords: ["batch image processor", "bulk compress", "bulk resize", "zip images"],
});

export default function BatchPage() {
  return <BatchTool />;
}