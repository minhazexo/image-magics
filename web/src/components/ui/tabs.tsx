"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface TabItem {
  label: string;
  value: string;
  icon?: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div
      className={cn("flex flex-wrap gap-1 rounded-lg bg-secondary p-1", className)}
      role="tablist"
      aria-label="Tabs"
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onChange(item.value)}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function useTabs(initial: string) {
  const [value, setValue] = useState(initial);
  return { value, onChange: setValue };
}