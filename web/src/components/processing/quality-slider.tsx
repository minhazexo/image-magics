"use client";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils/cn";
import { estimateQualityLabel } from "@/lib/utils/format";

export interface QualityPreset {
  label: string;
  value: number;
}

const DEFAULT_PRESETS: QualityPreset[] = [
  { label: "Max compression", value: 40 },
  { label: "Balanced", value: 70 },
  { label: "High quality", value: 82 },
  { label: "Maximum", value: 95 },
];

interface QualitySliderProps {
  value: number;
  onChange: (value: number) => void;
  presets?: QualityPreset[];
  disabled?: boolean;
  className?: string;
  formatValue?: (v: number) => string;
}

export function QualitySlider({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  disabled,
  className,
  formatValue = (v) => `${v} · ${estimateQualityLabel(v)}`,
}: QualitySliderProps) {
  const activePreset = presets.find((p) => p.value === value);

  return (
    <div className={cn("space-y-3", className)}>
      <Slider label="Quality" value={value} min={1} max={100} step={1} onChange={onChange} disabled={disabled} formatValue={formatValue} />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quality presets">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={disabled}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              activePreset?.value === preset.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
            )}
            onClick={() => onChange(preset.value)}
            aria-pressed={activePreset?.value === preset.value}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}