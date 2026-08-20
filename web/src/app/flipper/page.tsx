import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildMetadata } from "@/lib/seo";

const RotatorTool = dynamic(() => import("@/components/tools/rotator").then((m) => m.RotatorTool), {
  ssr: false,
  loading: () => (
    <div className="container-page flex min-h-[60vh] items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading flipper…</div>
    </div>
  ),
});

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