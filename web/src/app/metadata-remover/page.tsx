import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildMetadata } from "@/lib/seo";

const MetadataRemoverTool = dynamic(
  () => import("@/components/tools/metadata-remover").then((m) => m.MetadataRemoverTool),
  {
    ssr: false,
    loading: () => (
      <div className="container-page flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading metadata remover…</div>
      </div>
    ),
  }
);

export const metadata: Metadata = buildMetadata({
  title: "Free Metadata Remover — Strip EXIF & GPS Data Online",
  description:
    "Remove EXIF, GPS location and camera information from your images for privacy. Free and private.",
  path: "/metadata-remover",
  keywords: ["metadata remover", "exif remover", "gps remover", "privacy"],
});

export default function MetadataRemoverPage() {
  return <MetadataRemoverTool />;
}
