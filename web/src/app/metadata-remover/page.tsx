import type { Metadata } from "next";
import { MetadataRemoverTool } from "@/components/tools/metadata-remover";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free EXIF & Metadata Remover — Remove GPS Data from Photos Online",
  description:
    "Remove EXIF, GPS location and camera information from your photos before sharing. Detect and strip metadata in your browser — free and private.",
  path: "/metadata-remover",
  keywords: ["remove metadata", "exif remover", "remove gps", "clean photo metadata"],
});

export default function MetadataRemoverPage() {
  return <MetadataRemoverTool />;
}