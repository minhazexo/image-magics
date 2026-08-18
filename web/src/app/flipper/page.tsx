import type { Metadata } from "next";
import { RotatorTool } from "@/components/tools/rotator";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free Image Flipper — Mirror Images Horizontally & Vertically",
  description:
    "Flip images horizontally or vertically in one click. Also supports 90° and 180° rotation — free and private.",
  path: "/flipper",
  keywords: ["flip image", "mirror image", "image flipper"],
});

export default function FlipperPage() {
  return <RotatorTool />;
}