import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildMetadata } from "@/lib/seo";

const ConverterTool = dynamic(() => import("@/components/tools/converter").then((m) => m.ConverterTool), {
  ssr: false,
  loading: () => (
    <div className="container-page flex min-h-[60vh] items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading JPG→PNG converter…</div>
    </div>
  ),
});

export const metadata: Metadata = buildMetadata({
  title: "Free JPG to PNG Converter — Convert JPG Images to PNG Online",
  description:
    "Convert JPG images to high-quality lossless PNG instantly. Free, private and in your browser — no uploads required.",
  path: "/jpg-to-png",
  keywords: ["jpg to png", "jpeg to png", "convert jpg"],
});

export default function JpgToPngPage() {
  return (
    <ConverterTool
      defaultFormat="png"
      title="JPG to PNG Converter"
      description="Convert JPG images to high-quality PNG losslessly — perfect for editing, printing and transparency workflows."
      ctaLabel="Convert to PNG"
    />
  );
}