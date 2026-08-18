import type { Metadata } from "next";
import { ConverterTool } from "@/components/tools/converter";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free PNG to JPG Converter — Convert PNG to JPG Online",
  description:
    "Convert PNG images to JPG with a clean white background. Smaller files, universal compatibility — free and private.",
  path: "/png-to-jpg",
  keywords: ["png to jpg", "convert png", "png to jpeg"],
});

export default function PngToJpgPage() {
  return (
    <ConverterTool
      defaultFormat="jpeg"
      title="PNG to JPG Converter"
      description="Convert PNG images to compact JPG files. Transparent areas are flattened to a white background."
      ctaLabel="Convert to JPG"
    />
  );
}