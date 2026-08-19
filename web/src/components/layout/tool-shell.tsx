"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ToolShellProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  children: ReactNode;
  className?: string;
  /** Full-width layout without max-width constraint */
  fullWidth?: boolean;
}

/**
 * Consistent tool page shell used by all tools.
 * Provides: breadcrumb, title, description, and content area.
 */
export function ToolShell({
  title,
  description,
  breadcrumbs = [],
  children,
  className,
  fullWidth = false,
}: ToolShellProps) {
  return (
    <section className={cn("space-y-6", className)} aria-labelledby="tool-title">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[12px] text-muted-foreground">
          <Link href="/tools" className="transition-colors hover:text-foreground">
            Tools
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" aria-hidden />
              {crumb.href ? (
                <Link href={crumb.href} className="transition-colors hover:text-foreground">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title & Description */}
      <div className="space-y-1">
        <h1 id="tool-title" className="text-[22px] font-semibold tracking-tight sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>

      {/* Content */}
      <div className={cn(fullWidth ? "" : "max-w-5xl")}>{children}</div>
    </section>
  );
}

/**
 * Consistent controls panel used in tool sidebars.
 */
export function ToolPanel({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "lg:sticky lg:top-16 h-fit space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5",
        className
      )}
      style={{ boxShadow: "var(--shadow-xs)" }}
    >
      {title && <h2 className="section-label">{title}</h2>}
      {children}
    </aside>
  );
}

/**
 * Consistent divider between control sections.
 */
export function ToolDivider() {
  return <div className="divider" />;
}

/**
 * Consistent info card with subtle background.
 */
export function ToolInfoCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg bg-secondary p-3 text-sm", className)}>
      {children}
    </div>
  );
}
