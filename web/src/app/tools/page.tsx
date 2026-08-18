import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORY_ORDER, TOOLS, categoryIcon } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "All Image Tools — Optimize, Edit, Convert & More",
  description:
    "Every ImageTools utility in one place: optimizer, compressor, resizer, cropper, converter, background remover, watermark, metadata remover and batch processing.",
  path: "/tools",
  keywords: ["image tools", "image utilities", "photo tools"],
});

export default function ToolsPage() {
  return (
    <div className="container-page py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">All Image Tools</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every tool runs locally in your browser. No uploads, no accounts, no limits.
        </p>
      </header>

      <div className="space-y-12">
        {CATEGORY_ORDER.map((category) => {
          const Icon = categoryIcon(category);
          const tools = TOOLS.filter((t) => t.category === category);
          return (
            <section key={category} aria-labelledby={`cat-${category}`}>
              <h2 id={`cat-${category}`} className="flex items-center gap-2 text-xl font-semibold">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
                {category}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => {
                  const ToolIcon = tool.icon;
                  return (
                    <Link
                      key={tool.slug}
                      href={`/${tool.slug}`}
                      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 tool-card-hover"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ToolIcon className="h-5 w-5" aria-hidden />
                      </span>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary">{tool.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{tool.shortDescription}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}