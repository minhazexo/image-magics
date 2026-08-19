"use client";

import { useCallback, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Tooltip } from "@/components/ui/tooltip";

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
  /** Optional description below the slider */
  description?: string;
  /** Show tooltip on the thumb while dragging */
  showTooltip?: boolean;
}

/**
 * Accessible range slider with hover tooltip, visual fill, and optional description.
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
  description,
  showTooltip = true,
}: SliderProps) {
  const id = useId();
  const percent = ((value - min) / (max - min)) * 100;
  const [hovering, setHovering] = useState(false);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const displayValue = formatValue ? formatValue(value) : String(value);
  const showTip = hovering || dragging;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    const onUp = () => {
      setDragging(false);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointerup", onUp);
  }, []);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(label || showTooltip) && (
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={id} className="text-[13px] font-medium text-foreground">
            {label}
          </label>
          <Tooltip content={displayValue} side="top">
            <span
              className={cn(
                "min-w-[32px] rounded px-1.5 py-0.5 text-xs tabular-nums transition-colors",
                showTip
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground"
              )}
              aria-live="polite"
            >
              {displayValue}
            </span>
          </Tooltip>
        </div>
      )}

      <div
        ref={trackRef}
        className="relative h-5 flex items-center"
        onPointerEnter={() => setHovering(true)}
        onPointerLeave={() => setHovering(false)}
      >
        {/* Custom track background */}
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-secondary">
          {/* Fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary/80 transition-[width] duration-75"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Native input (invisible, for accessibility) */}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerDown={handlePointerDown}
          className={cn(
            "relative z-10 h-5 w-full cursor-pointer appearance-none bg-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
            "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary",
            "[&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-background",
            "[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150",
            "[&::-webkit-slider-thumb]:hover:scale-110",
            "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4",
            "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary",
            "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-sm",
            "[&::-moz-range-thumb]:ring-2 [&::-moz-range-thumb]:ring-background",
          )}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
      </div>

      {description && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
      )}
    </div>
  );
}
