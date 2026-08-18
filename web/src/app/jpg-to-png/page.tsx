import type { Metadata } from "next";
import { ConverterTool } from "@/components/tools/converter";
import { buildMetadata } from "@/lib/seo";

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