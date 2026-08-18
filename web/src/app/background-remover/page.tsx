import type { Metadata } from "next";
import { BackgroundRemoverTool } from "@/components/tools/background-remover";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free Background Remover — Remove Image Backgrounds Online",
  description:
    "Remove image backgrounds and create transparent PNGs automatically. Replace with solid colors, gradients or images. Free, private and in your browser.",
  path: "/background-remover",
  keywords: ["background remover", "remove background", "transparent background", "cutout"],
});

export default function BackgroundRemoverPage() {
  return <BackgroundRemoverTool />;
}