"use client";

import type { ReactNode } from "react";

export interface FaqItem {
  question: string;
  answer: string;
}

interface SeoContentProps {
  whatItDoes: string;
  howToUse: string;
  supportedFormats?: string[];
  privacyNote?: string;
  faq?: FaqItem[];
}

export function SeoContent({ whatItDoes, howToUse, supportedFormats, privacyNote, faq = [] }: SeoContentProps) {
  return (
    <section className="mt-16 grid gap-6 border-t border-border pt-10 lg:grid-cols-2" aria-label="About this tool">
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">What this tool does</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{whatItDoes}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">How to use it</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{howToUse}</p>
      </div>

      {supportedFormats && supportedFormats.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Supported formats</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {supportedFormats.map((f) => (
              <span key={f} className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {privacyNote && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Privacy</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{privacyNote}</p>
        </div>
      )}

      {faq.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Frequently asked questions</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {faq.map((item) => (
              <details key={item.question} className="group rounded-lg border border-border p-4">
                <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium">
                  {item.question}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export interface ResultStatProps {
  label: string;
  value: ReactNode;
}

export function ResultCard({ title, stats, children }: { title: string; stats?: ResultStatProps[]; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {stats && (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg bg-secondary p-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
    </div>
  );
}