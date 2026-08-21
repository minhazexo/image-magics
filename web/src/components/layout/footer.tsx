import Link from "next/link";
import { ShieldCheck, Lock, Zap } from "lucide-react";

const TOOL_LINKS = [
  { href: "/optimizer", label: "Image Optimizer" },
  { href: "/compressor", label: "Image Compressor" },
  { href: "/resizer", label: "Image Resizer" },
  { href: "/cropper", label: "Image Cropper" },
  { href: "/converter", label: "Image Converter" },
  { href: "/transparent-image", label: "Transparent Image" },
  { href: "/watermark", label: "Watermark" },
  { href: "/metadata-remover", label: "Metadata Remover" },
  { href: "/editor", label: "Image Editor" },
  { href: "/batch", label: "Batch Processor" },
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
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 md:grid-cols-4">
        {/* Brand */}
        <div className="sm:col-span-2 md:col-span-1">
          <Link href="/" className="inline-flex items-center font-semibold" aria-label="ImageTools home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ImageTools" className="h-10 sm:h-14 w-auto object-contain" loading="lazy" decoding="async" />
          </Link>
          <p className="mt-2.5 max-w-xs text-sm text-muted-foreground leading-relaxed">
            Privacy-first image tools. Everything runs locally in your browser.
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" aria-hidden /> Local</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" aria-hidden /> No uploads</span>
            <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3" aria-hidden /> Fast</span>
          </div>
        </div>

        {/* Tools */}
        <div>
          <h2 className="section-label">Tools</h2>
          <ul className="mt-2.5 grid gap-1.5">
            {TOOL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h2 className="section-label">Company</h2>
          <ul className="mt-2.5 grid gap-1.5">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="section-label mt-5">Legal</h2>
          <ul className="mt-2.5 grid gap-1.5">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Privacy */}
        <div>
          <h2 className="section-label">Privacy promise</h2>
          <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
            Your images are processed locally in your browser. Your files are not
            uploaded to our servers and are never stored on our infrastructure.
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} ImageTools. All rights reserved.</span>
          <span>Made with privacy in mind.</span>
        </div>
      </div>
    </footer>
  );
}
