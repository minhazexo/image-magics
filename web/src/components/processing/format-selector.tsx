"use client";

import { useId } from "react";
import { FORMAT_OPTIONS } from "@/lib/types";
import type { OutputFormat } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { supportsFormatInBrowser } from "@/lib/process/client";

interface FormatSelectorProps {
  value: OutputFormat | "auto";
  onChange: (format: OutputFormat | "auto") => void;
  includeAuto?: boolean;
  autoValue?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function FormatSelector({
  value,
  onChange,
  includeAuto = false,
  autoValue = "auto",
  disabled,
  className,
  label = "Format",
}: FormatSelectorProps) {
  const id = useId();

  const options = includeAuto
    ? [{ value: autoValue as OutputFormat | "auto", label: "Auto", extension: "best", mime: "" }, ...FORMAT_OPTIONS]
    : FORMAT_OPTIONS;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label} id={id}>
        {options.map((opt) => {
          const active = value === opt.value;
          const supported = opt.value === autoValue || supportsFormatInBrowser(opt.value as OutputFormat);
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled || !supported}
              title={supported ? opt.label : `${opt.label} is not supported by your browser`}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-muted-foreground hover:border-primary/50",
                !supported && "opacity-40"
              )}
              onClick={() => onChange(opt.value as OutputFormat | "auto")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}