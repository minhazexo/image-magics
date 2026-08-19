"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ToolLayoutProps {
  title: string;
  description: string;
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
  className?: string;
}

export function ToolLayout({ title, description, breadcrumbs = [], children, className }: ToolLayoutProps) {
  const crumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }, ...breadcrumbs];

  return (
    <div className={cn("container-page py-6 sm:py-8", className)}>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          {crumbs.map((crumb, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {crumb.href ? (
                <Link href={crumb.href} className="transition-colors hover:text-foreground">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-medium text-foreground">
                  {crumb.label}
                </span>
              )}
              {i < crumbs.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" aria-hidden />}
            </li>
          ))}
        </ol>
      </nav>

      {/* Page header */}
      <header className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-tight sm:text-2xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">{description}</p>
      </header>

      {children}
    </div>
  );
}

interface ToolCardProps {
  href: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
}

export function ToolCard({ href, name, description, icon, className }: ToolCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group card-interactive flex flex-col gap-3 p-5",
        className
      )}
    >
      {icon && (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
          {icon}
        </span>
      )}
      <div>
        <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 self-start text-sm font-medium text-primary">
        Open Tool
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}
