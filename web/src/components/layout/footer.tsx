import Link from "next/link";
import { ShieldCheck, Lock, Zap } from "lucide-react";

const TOOL_LINKS = [
  { href: "/optimizer", label: "Optimizer" },
  { href: "/compressor", label: "Compressor" },
  { href: "/converter", label: "Converter" },
  { href: "/transparent-image", label: "Transparent Image" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/tools", label: "All Tools" },
  { href: "/contact", label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function Footer() {
  return (
    <footer className="relative z-20 border-t border-border bg-background">
      <div className="container-page grid gap-6 py-6 sm:grid-cols-2 md:grid-cols-4">
        {/* Brand */}
        <div className="sm:col-span-2 md:col-span-1">
          <Link href="/" className="inline-flex items-center font-semibold" aria-label="ImageTools home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ImageTools" className="h-8 w-auto object-contain" loading="lazy" decoding="async" />
          </Link>
          <p className="mt-2 max-w-xs text-xs text-muted-foreground leading-relaxed">
            Privacy-first image tools. Everything runs locally in your browser.
          </p>
          <div className="mt-2 flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Lock className="h-2.5 w-2.5" aria-hidden /> Local</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-2.5 w-2.5" aria-hidden /> No uploads</span>
            <span className="inline-flex items-center gap-1"><Zap className="h-2.5 w-2.5" aria-hidden /> Fast</span>
          </div>
        </div>

        {/* Tools */}
        <div>
          <h2 className="section-label">Tools</h2>
          <ul className="mt-1.5 grid gap-0.5">
            {TOOL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/tools" className="text-xs font-medium text-primary transition-colors hover:underline">
                View All Tools →
              </Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h2 className="section-label">Company</h2>
          <ul className="mt-1.5 grid gap-0.5">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="section-label mt-3">Legal</h2>
          <ul className="mt-1.5 grid gap-0.5">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Privacy */}
        <div>
          <h2 className="section-label">Privacy promise</h2>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Your images are processed locally in your browser. Your files are not
            uploaded to our servers and are never stored on our infrastructure.
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-1 py-3 text-[11px] text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} ImageTools. All rights reserved.</span>
          <span>Made with privacy in mind.</span>
        </div>
      </div>
    </footer>
  );
}
