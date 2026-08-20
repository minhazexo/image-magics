import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildMetadata } from "@/lib/seo";

const RotatorTool = dynamic(() => import("@/components/tools/rotator").then((m) => m.RotatorTool), {
  ssr: false,
  loading: () => (
    <div className="container-page flex min-h-[60vh] items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading rotator…</div>
    </div>
  ),
});

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