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
    <div className={cn("container-page py-8", className)}>
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
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
              {i < crumbs.length - 1 && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
            </li>
          ))}
        </ol>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-base text-muted-foreground">{description}</p>
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
        "group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 tool-card-hover",
        className
      )}
    >
      {icon && (
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
      )}
      <div>
        <h3 className="font-semibold text-card-foreground group-hover:text-primary">{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 self-start text-sm font-medium text-primary">
        Open Tool
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}