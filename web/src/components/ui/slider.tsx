"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  onChange: (value: number) => void;
  /** Format of the value shown next to the label, e.g. "82" or "82%" */
  formatValue?: (value: number) => string;
  disabled?: boolean;
  className?: string;
}

/**
 * Accessible range slider. Keyboard navigable arrow keys, Home/End.
 */
export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  label,
  onChange,
  formatValue,
  disabled,
  className,
}: SliderProps) {
  const id = useId();
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <span className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
          {formatValue ? formatValue(value) : value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "accent-primary",
          className
        )}
        style={{
          background: `linear-gradient(to right, hsl(var(--primary)) ${percent}%, hsl(var(--secondary)) ${percent}%)`,
        }}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}