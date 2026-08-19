import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildMetadata } from "@/lib/seo";

const ConverterTool = dynamic(() => import("@/components/tools/converter").then((m) => m.ConverterTool), {
  ssr: false,
  loading: () => (
    <div className="container-page flex min-h-[60vh] items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading converter…</div>
    </div>
  ),
});

export const metadata: Metadata = buildMetadata({
  title: "Free Image Converter — Convert JPG, PNG & WebP Online",
  description:
    "Convert images between JPG, PNG and WebP with format-specific quality options. Free, fast and private — nothing is uploaded.",
  path: "/converter",
  keywords: ["image converter", "convert image", "jpg to png", "png to webp"],
});

export default function ConverterPage() {
  return <ConverterTool />;
}
