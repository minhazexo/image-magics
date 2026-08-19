"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, ImageDown, ArrowDownWideNarrow, Scissors, RefreshCw, Images, Eraser, Type, Crop, SlidersHorizontal, PaintBucket } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils/cn";

const TOOLS_MENU = [
  { href: "/optimizer", label: "Optimizer", desc: "Optimize for web", icon: ImageDown },
  { href: "/compressor", label: "Compressor", desc: "Reduce file size", icon: ArrowDownWideNarrow },
  { href: "/resizer", label: "Resizer", desc: "Resize dimensions", icon: Scissors },
  { href: "/cropper", label: "Cropper", desc: "Crop images", icon: Crop },
  { href: "/converter", label: "Converter", desc: "Format conversion", icon: RefreshCw },
  { href: "/transparent-image", label: "Transparent", desc: "Remove background", icon: PaintBucket },
  { href: "/editor", label: "Editor", desc: "Filters & adjustments", icon: SlidersHorizontal },
  { href: "/watermark", label: "Watermark", desc: "Add text/logo", icon: Type },
  { href: "/metadata-remover", label: "Metadata", desc: "Strip EXIF data", icon: Eraser },
  { href: "/batch", label: "Batch", desc: "Process many at once", icon: Images },
];

const NAV_LINKS = [
  { href: "/tools", label: "All Tools" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => setToolsOpen(false), [pathname]);

  useEffect(() => {
    if (!toolsOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setToolsOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [toolsOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        mobileButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="container-page relative flex h-14 items-center gap-4">
        {/* Mobile: theme toggle (left) */}
        <div className="flex items-center lg:hidden">
          <ThemeToggle hideTooltip />
        </div>

        {/* Logo: centered on mobile, left on desktop */}
        <Link
          href="/"
          className={cn(
            "flex shrink-0 items-center",
            "absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0"
          )}
          aria-label="ImageTools home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ImageTools" className="h-10 w-auto object-contain" />
        </Link>

        {/* Desktop nav: centered */}
        <nav className="hidden items-center gap-1 absolute left-1/2 -translate-x-1/2 lg:flex" aria-label="Main navigation">
          <div className="relative" ref={dropdownRef}
            onMouseEnter={() => setToolsOpen(true)}
            onMouseLeave={() => {
              const timer = setTimeout(() => setToolsOpen(false), 150);
              (dropdownRef.current as any).__cleanup = () => clearTimeout(timer);
            }}
          >
            <button
              className={cn(
                "flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                toolsOpen ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
              aria-expanded={toolsOpen}
              aria-haspopup="true"
            >
              Tools
              <ChevronDown className={cn("h-3 w-3 transition-transform", toolsOpen && "rotate-180")} aria-hidden />
            </button>
            {toolsOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-[320px] rounded-xl border border-border bg-card p-2 shadow-lg animate-scale-in" role="menu">
                <div className="grid grid-cols-2 gap-0.5">
                  {TOOLS_MENU.map((tool) => (
                    <Link key={tool.href} href={tool.href} role="menuitem"
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        isActive(tool.href) ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/60"
                      )}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <tool.icon className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium text-[13px]">{tool.label}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{tool.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                isActive(link.href) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side: theme (desktop) + hamburger (mobile) */}
        <div className="flex items-center gap-1 ml-auto">
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
          <button
            ref={mobileButtonRef}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileOpen ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav id="mobile-menu" className="border-t border-border bg-background lg:hidden animate-fade-in" aria-label="Mobile navigation">
          <div className="container-page flex flex-col gap-1 py-3 max-h-[calc(80vh-56px)] overflow-y-auto">
            <p className="section-label mb-1 px-1">Tools</p>
            <div className="grid grid-cols-2 gap-1">
              {TOOLS_MENU.map((tool) => {
                const active = isActive(tool.href);
                return (
                  <Link key={tool.href} href={tool.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2.5 py-2.5 text-sm transition-colors",
                      active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <tool.icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{tool.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="divider my-1" />
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(link.href) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent"
                )}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
