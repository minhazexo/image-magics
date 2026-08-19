import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildMetadata } from "@/lib/seo";

const EditorTool = dynamic(() => import("@/components/tools/editor").then((m) => m.EditorTool), {
  ssr: false,
  loading: () => (
    <div className="container-page flex min-h-[60vh] items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading editor…</div>
    </div>
  ),
});

export const metadata: Metadata = buildMetadata({
  title: "Free Image Editor — Brightness, Contrast, Filters & More Online",
  description:
    "Edit images in your browser with brightness, contrast, saturation, blur, sharpen and grayscale controls, plus rotate and flip. Undo/redo included — free and private.",
  path: "/editor",
  keywords: ["image editor", "photo editor", "brightness", "contrast", "filters"],
});

export default function EditorPage() {
  return <EditorTool />;
}
