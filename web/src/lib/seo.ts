import type { Metadata } from "next";

export interface SeoOptions {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}

export function buildMetadata({ title, description, path, keywords }: SeoOptions): Metadata {
  const canonical = `https://imagetools.example.com${path}`;
  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: "ImageTools",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}