"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MoveHorizontal, ZoomIn, ZoomOut, Maximize, RotateCcw, Columns, Square } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

interface ImageComparisonProps {
  originalUrl: string;
  processedUrl: string;
  originalLabel?: string;
  processedLabel?: string;
  originalAlt?: string;
  processedAlt?: string;
  className?: string;
  /** Show checkerboard background (for transparent images) */
  showCheckerboard?: boolean;
}

type ViewMode = "slider" | "side-by-side";

/**
 * Professional before/after comparison with slider, zoom, and side-by-side modes.
 */
export function ImageComparison({
  originalUrl,
  processedUrl,
  originalLabel = "Original",
  processedLabel = "Processed",
  originalAlt = "Original image",
  processedAlt = "Processed image",
  className,
  showCheckerboard = false,
}: ImageComparisonProps) {
  const [position, setPosition] = useState(50);
  const [viewMode, setViewMode] = useState<ViewMode>("slider");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  const clampZoom = useCallback((z: number) => Math.max(1, Math.min(5, z)), []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, ratio)));
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (viewMode === "side-by-side" && zoom > 1) {
      // Pan mode
      draggingRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      return;
    }
    // Slider mode
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    if (viewMode === "side-by-side" && zoom > 1) {
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      return;
    }
    updateFromClientX(e.clientX);
  };

  const onPointerUp = () => {
    draggingRef.current = false;
  };

  // Use native listener with { passive: false } so we can preventDefault()
  // React's onWheel is passive by default and Chrome blocks preventDefault in it
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.25 : 0.25;
      setZoom((z) => clampZoom(z + delta));
    };
    node.addEventListener("wheel", handler, { passive: false });
    return () => node.removeEventListener("wheel", handler);
  }, [clampZoom]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPosition((p) => Math.max(0, p - 5));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPosition((p) => Math.min(100, p + 5));
    } else if (e.key === "Home") {
      e.preventDefault();
      setPosition(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setPosition(100);
    } else if (e.key === "+" || e.key === "=") {
      setZoom((z) => clampZoom(z + 0.25));
    } else if (e.key === "-") {
      setZoom((z) => clampZoom(z - 0.25));
    } else if (e.key === "0") {
      resetView();
    }
  };

  const checkerBg = showCheckerboard
    ? {
        backgroundImage:
          "repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%)",
        backgroundSize: "16px 16px",
      }
    : {};

  return (
    <div className={cn("space-y-2", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Tooltip content="Slider comparison">
            <Button
              variant={viewMode === "slider" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => { setViewMode("slider"); resetView(); }}
            >
              <MoveHorizontal className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
          <Tooltip content="Side by side">
            <Button
              variant={viewMode === "side-by-side" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => { setViewMode("side-by-side"); resetView(); }}
            >
              <Columns className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip content="Zoom in (+)">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom((z) => clampZoom(z + 0.25))}
              disabled={zoom >= 5}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
          <span className="min-w-[40px] text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Tooltip content="Zoom out (-)">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom((z) => clampZoom(z - 0.25))}
              disabled={zoom <= 1}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
          <Tooltip content="Fit to screen (0)">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={resetView}
              disabled={zoom === 1}
            >
              <Maximize className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Comparison viewport */}
      <div
        ref={containerRef}
        className={cn(
          "relative touch-none select-none overflow-hidden rounded-xl border border-border",
          viewMode === "slider" ? "cursor-ew-resize" : zoom > 1 ? "cursor-grab" : "cursor-default"
        )}
        style={{ aspectRatio: "16/10" }}
        role="slider"
        aria-label="Comparison slider between original and processed image"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}

      >
        {viewMode === "slider" ? (
          /* ── Slider Mode ──────────────────────────── */
          <>
            {/* Base layer: processed (right side) */}
            <div
              className="absolute inset-0 flex items-center justify-center bg-secondary"
              style={checkerBg}
            >
              <img
                src={processedUrl}
                alt={processedAlt}
                draggable={false}
                loading="lazy"
                decoding="async"
                className="pointer-events-none max-h-full max-w-full object-contain"
                style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
              />
            </div>

            {/* Top layer: original clipped to the left portion */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            >
              <img
                src={originalUrl}
                alt={originalAlt}
                draggable={false}
                loading="lazy"
                decoding="async"
                className="pointer-events-none max-h-full max-w-full object-contain"
                style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
              />
            </div>

            {/* Labels */}
            <span className="pointer-events-none absolute left-3 top-3 z-20 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {originalLabel}
            </span>
            <span className="pointer-events-none absolute right-3 top-3 z-20 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {processedLabel}
            </span>

            {/* Divider */}
            <div
              className="pointer-events-none absolute inset-y-0 z-10"
              style={{ left: `${position}%`, transform: "translateX(-50%)" }}
            >
              <div className="h-full w-0.5 bg-white/90 shadow-[0_0_6px_rgba(0,0,0,0.4)]" />
              <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-white/30">
                <MoveHorizontal className="h-4 w-4" aria-hidden />
              </span>
            </div>
          </>
        ) : (
          /* ── Side-by-Side Mode ────────────────────── */
          <div className="flex h-full w-full bg-secondary" style={checkerBg}>
            <div className="relative flex-1 overflow-hidden border-r border-border">
              <img
                src={originalUrl}
                alt={originalAlt}
                draggable={false}
                loading="lazy"
                decoding="async"
                className="pointer-events-none absolute inset-0 m-auto max-h-full max-w-full object-contain"
                style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
              />
              <span className="pointer-events-none absolute left-3 top-3 z-20 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {originalLabel}
              </span>
            </div>
            <div className="relative flex-1 overflow-hidden">
              <img
                src={processedUrl}
                alt={processedAlt}
                draggable={false}
                loading="lazy"
                decoding="async"
                className="pointer-events-none absolute inset-0 m-auto max-h-full max-w-full object-contain"
                style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
              />
              <span className="pointer-events-none absolute right-3 top-3 z-20 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {processedLabel}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
