import type { Metadata } from "next";
import { TransparentImageTool } from "@/components/tools/transparent-image";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free Transparent Image Maker — Make Image Backgrounds Transparent Online",
  description:
    "Make white or any custom color background transparent with tolerance and edge-smoothing controls. Instant transparent PNGs — free and private.",
  path: "/transparent-image",
  keywords: ["transparent image", "make transparent", "remove white background", "transparent png"],
});

export default function TransparentImagePage() {
  return <TransparentImageTool />;
}