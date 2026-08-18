import type { Metadata } from "next";
import { ConverterTool } from "@/components/tools/converter";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free WEBP Converter — Convert Images to WebP Online",
  description:
    "Convert JPG, PNG and other images to WebP for files up to 35% smaller. High quality, transparency support — free and private.",
  path: "/webp-converter",
  keywords: ["webp converter", "convert to webp", "jpg to webp", "png to webp"],
});

export default function WebpConverterPage() {
  return (
    <ConverterTool
      defaultFormat="webp"
      title="WEBP Converter"
      description="Convert any image to WebP — dramatically smaller files with excellent visual quality."
      ctaLabel="Convert to WEBP"
    />
  );
}