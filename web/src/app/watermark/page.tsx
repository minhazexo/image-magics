import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildMetadata } from "@/lib/seo";

const WatermarkTool = dynamic(() => import("@/components/tools/watermark").then((m) => m.WatermarkTool), {
  ssr: false,
  loading: () => (
    <div className="container-page flex min-h-[60vh] items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading watermark tool…</div>
    </div>
  ),
});

export const metadata: Metadata = buildMetadata({
  title: "Free Watermark Tool — Add Text or Logo Watermark Online",
  description:
    "Add text or image watermarks to protect your images. Custom position, opacity, size and rotation.",
  path: "/watermark",
  keywords: ["watermark tool", "add watermark", "text watermark", "logo watermark"],
});

export default function WatermarkPage() {
  return <WatermarkTool />;
}
