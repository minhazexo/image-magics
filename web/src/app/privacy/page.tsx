import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy — ImageTools",
  description:
    "ImageTools processes every image locally in your browser. Your images are never uploaded to our servers. Read our full privacy policy.",
  path: "/privacy",
  keywords: ["privacy", "privacy policy", "local processing"],
});

const SECTIONS = [
  {
    title: "1. Local-first processing",
    body: "All image tools run entirely inside your browser. When you upload an image, it is decoded, processed and encoded on your own device using browser APIs such as Canvas and OffscreenCanvas. No image data is transmitted over the network to our servers.",
  },
  {
    title: "2. What we never do",
    body: "We never upload your images, never store them on our servers, never send them to third-party services, and never sell or share image contents. Background removal also runs locally — no third-party AI API receives your photo.",
  },
  {
    title: "3. Anonymous usage data",
    body: "We may collect anonymous, aggregate product analytics (for example: which tool was opened, how long a page was used, whether a download was clicked). These events never contain image data, file contents or filenames. You can block analytics with your browser's privacy settings without affecting functionality.",
  },
  {
    title: "4. Local storage",
    body: "We store only lightweight preferences — such as your theme and last used quality setting — in your browser's localStorage. No images are persisted. You can clear this at any time through your browser settings.",
  },
  {
    title: "5. How long data lives",
    body: "Images exist only in the memory of your browser session and are released automatically after processing and download. Closing the tab removes all traces.",
  },
  {
    title: "6. Contact",
    body: "Questions about this policy? Reach us via the contact page and we will respond promptly.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-3 text-muted-foreground">Last updated: {new Date().toISOString().slice(0, 10)}</p>
      <div className="mt-8 space-y-6">
        {SECTIONS.map((s) => (
          <section key={s.title} className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}