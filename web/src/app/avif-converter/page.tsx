import type { Metadata } from "next";
import { ConverterTool } from "@/components/tools/converter";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free AVIF Converter — Convert Images to AVIF Online",
  description:
    "Convert images to AVIF, the most efficient modern image format. Exceptional quality at a fraction of the file size — free and private.",
  path: "/avif-converter",
  keywords: ["avif converter", "convert to avif", "jpg to avif"],
});

export default function AvifConverterPage() {
  return (
    <ConverterTool
      defaultFormat="avif"
      title="AVIF Converter"
      description="Convert your images to AVIF — the modern format with the best compression efficiency."
      ctaLabel="Convert to AVIF"
    />
  );
}