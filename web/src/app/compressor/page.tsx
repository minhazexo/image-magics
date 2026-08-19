import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildMetadata } from "@/lib/seo";

const CompressorTool = dynamic(() => import("@/components/tools/compressor").then((m) => m.CompressorTool), {
  ssr: false,
  loading: () => (
    <div className="container-page flex min-h-[60vh] items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading compressor…</div>
    </div>
  ),
});

export const metadata: Metadata = buildMetadata({
  title: "Free Image Compressor — Compress JPG, PNG & WebP Online",
  description:
    "Compress JPG, PNG and WebP images without losing noticeable quality. Instant before/after comparison and one-click download — free and private.",
  path: "/compressor",
  keywords: ["image compressor", "compress image", "reduce image size", "jpg compressor"],
});

export default function CompressorPage() {
  return <CompressorTool />;
}
