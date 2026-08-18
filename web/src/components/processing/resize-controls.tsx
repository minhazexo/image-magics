"use client";

import { useId, useState } from "react";
import { PERCENT_PRESETS, SOCIAL_PRESETS } from "@/lib/utils/dimensions";
import type { ResizeMode, ResizeOptions } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface ResizeControlsProps {
  originalWidth: number;
  originalHeight: number;
  value: ResizeOptions;
  onChange: (options: ResizeOptions) => void;
  disabled?: boolean;
  className?: string;
}

export function ResizeControls({ originalWidth, originalHeight, value, onChange, disabled, className }: ResizeControlsProps) {
  const id = useId();
  const [mode, setMode] = useState<ResizeMode>(value.mode ?? "pixels");
  const [width, setWidth] = useState(value.width ?? originalWidth);
  const [height, setHeight] = useState(value.height ?? originalHeight);
  const [percent, setPercent] = useState(value.percent ?? 100);

  const applyPreset = (w: number, h: number) => {
    setMode("pixels");
    setWidth(w);
    setHeight(h);
    onChange({
      ...value,
      mode: "pixels",
      width: w,
      height: h,
      percent: undefined,
      lockAspectRatio: false,
    });
  };

  const updateWidth = (w: number) => {
    setWidth(w);
    if (value.lockAspectRatio && originalHeight > 0) {
      const h = Math.max(1, Math.round((w / originalWidth) * originalHeight));
      setHeight(h);
      onChange({ ...value, mode, width: w, height: h });
    } else {
      onChange({ ...value, mode, width: w });
    }
  };

  const updateHeight = (h: number) => {
    setHeight(h);
    if (value.lockAspectRatio && originalWidth > 0) {
      const w = Math.max(1, Math.round((h / originalHeight) * originalWidth));
      setWidth(w);
      onChange({ ...value, mode, width: w, height: h });
    } else {
      onChange({ ...value, mode, height: h });
    }
  };

  const updatePercent = (p: number) => {
    setPercent(p);
    const w = Math.max(1, Math.round((originalWidth * p) / 100));
    const h = Math.max(1, Math.round((originalHeight * p) / 100));
    setWidth(w);
    setHeight(h);
    onChange({ ...value, mode: "percent", percent: p, width: w, height: h });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex gap-1.5" role="radiogroup" aria-label="Resize units">
        {(["pixels", "percent"] as ResizeMode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            disabled={disabled}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              mode === m
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-muted-foreground"
            )}
            onClick={() => setMode(m)}
          >
            {m === "pixels" ? "Pixels" : "Percentage"}
          </button>
        ))}
      </div>

      {mode === "pixels" ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-w`} className="text-sm font-medium">Width (px)</label>
            <input
              id={`${id}-w`}
              type="number"
              min={1}
              max={20000}
              value={width}
              disabled={disabled}
              onChange={(e) => updateWidth(Math.max(1, Number(e.target.value) || 1))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-h`} className="text-sm font-medium">Height (px)</label>
            <input
              id={`${id}-h`}
              type="number"
              min={1}
              max={20000}
              value={height}
              disabled={disabled}
              onChange={(e) => updateHeight(Math.max(1, Number(e.target.value) || 1))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.lockAspectRatio}
              disabled={disabled}
              onChange={(e) => {
                const lock = e.target.checked;
                if (lock) {
                  const h = Math.max(1, Math.round((width / Math.max(1, originalWidth)) * originalHeight));
                  setHeight(h);
                  onChange({ ...value, lockAspectRatio: lock, width, height: h });
                } else {
                  onChange({ ...value, lockAspectRatio: lock });
                }
              }}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            Lock aspect ratio
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-p`} className="text-sm font-medium">Scale</label>
          <input
            id={`${id}-p`}
            type="range"
            min={1}
            max={500}
            value={percent}
            disabled={disabled}
            onChange={(e) => updatePercent(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
          />
          <div className="flex flex-wrap gap-1.5">
            {PERCENT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={disabled}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  percent === p
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-muted-foreground"
                )}
                onClick={() => updatePercent(p)}
              >
                {p}%
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Result: {Math.max(1, Math.round((originalWidth * percent) / 100))} × {Math.max(1, Math.round((originalHeight * percent) / 100))} px
          </p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Social presets</span>
        <div className="flex flex-wrap gap-1.5">
          {SOCIAL_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              disabled={disabled}
              className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50"
              onClick={() => applyPreset(preset.width, preset.height)}
            >
              {preset.label} · {preset.width}×{preset.height}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}