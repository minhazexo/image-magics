import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildMetadata } from "@/lib/seo";

const TransparentImageTool = dynamic(
  () => import("@/components/tools/transparent-image").then((m) => m.TransparentImageTool),
  {
    ssr: false,
    loading: () => (
      <div className="container-page flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading transparent image tool…</div>
      </div>
    ),
  }
);

export const metadata: Metadata = buildMetadata({
  title: "Free Transparent Image Maker — Remove Background Online",
  description:
    "Remove backgrounds with AI or a chosen color, then export a transparent PNG with a real alpha channel.",
  path: "/transparent-image",
  keywords: ["transparent image", "remove background", "background remover", "png transparent"],
});

export default function TransparentImagePage() {
  return <TransparentImageTool />;
}
