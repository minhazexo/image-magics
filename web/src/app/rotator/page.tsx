import type { Metadata } from "next";
import { RotatorTool } from "@/components/tools/rotator";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free Image Rotator & Flipper — Rotate Images Online",
  description:
    "Rotate images 90° left, 90° right or 180°, and flip them horizontally or vertically. Free, private and instant.",
  path: "/rotator",
  keywords: ["image rotator", "rotate image", "flip image"],
});

export default function RotatorPage() {
  return <RotatorTool />;
}