import type { Metadata } from "next";
import { EditorTool } from "@/components/tools/editor";
import { buildMetadata } from "@/lib/seo";

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