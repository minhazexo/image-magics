import type { Metadata } from "next";
import { ConverterTool } from "@/components/tools/converter";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free Image Converter — Convert JPG, PNG, WebP & AVIF Online",
  description:
    "Convert images between JPG, PNG, WebP and AVIF with format-specific quality options. Free, fast and private — nothing is uploaded.",
  path: "/converter",
  keywords: ["image converter", "convert image", "jpg to png", "png to webp"],
});

export default function ConverterPage() {
  return <ConverterTool />;
}