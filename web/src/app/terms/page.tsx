import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service — ImageTools",
  description:
    "The terms of service governing your use of ImageTools, a privacy-first image tool suite.",
  path: "/terms",
  keywords: ["terms", "terms of service"],
});

const SECTIONS = [
  {
    title: "1. Acceptance of terms",
    body: "By using ImageTools you agree to these terms. If you do not agree, please do not use the service.",
  },
  {
    title: "2. Use of the service",
    body: "ImageTools is provided free of charge for personal and commercial use. You are responsible for ensuring you have the rights to process any image you upload. Because processing is local, we cannot access or moderate your files.",
  },
  {
    title: "3. No warranties",
    body: "The service is provided \"as is\" without warranties of any kind. While we aim for excellent output quality, results depend on your browser and the source image, and we make no guarantee of specific file sizes or quality outcomes.",
  },
  {
    title: "4. Limitation of liability",
    body: "To the maximum extent permitted by law, ImageTools shall not be liable for any indirect, incidental or consequential damages arising from your use of the service.",
  },
  {
    title: "5. Changes",
    body: "We may update these terms from time to time. Continued use after changes constitutes acceptance of the updated terms.",
  },
  {
    title: "6. Contact",
    body: "Questions about these terms? Reach us via the contact page.",
  },
];

export default function TermsPage() {
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
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