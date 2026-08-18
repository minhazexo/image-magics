import Link from "next/link";
import { Wand2, ShieldCheck, Lock, Zap } from "lucide-react";

const TOOL_LINKS = [
  { href: "/optimizer", label: "Image Optimizer" },
  { href: "/compressor", label: "Image Compressor" },
  { href: "/resizer", label: "Image Resizer" },
  { href: "/cropper", label: "Image Cropper" },
  { href: "/converter", label: "Image Converter" },
  { href: "/background-remover", label: "Background Remover" },
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
    <footer className="mt-16 border-t border-border bg-secondary/40">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link href="/" className="flex items-center gap-2 font-semibold" aria-label="ImageTools home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wand2 className="h-4 w-4" aria-hidden />
            </span>
            <span>ImageTools</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            Privacy-first image tools. Everything runs locally in your browser.
          </p>
          <div className="mt-4 flex items-center gap-3 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5" aria-hidden /> Local</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" aria-hidden /> No uploads</span>
            <span className="inline-flex items-center gap-1"><Zap className="h-3.5 w-3.5" aria-hidden /> Fast</span>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Tools</h2>
          <ul className="mt-3 grid gap-2">
            {TOOL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Company</h2>
          <ul className="mt-3 grid gap-2">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="mt-6 text-sm font-semibold">Legal</h2>
          <ul className="mt-3 grid gap-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Privacy promise</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Your images are processed locally in your browser. Your files are not
            uploaded to our servers and are never stored on our infrastructure.
          </p>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} ImageTools. All rights reserved.
        </div>
      </div>
    </footer>
  );
}