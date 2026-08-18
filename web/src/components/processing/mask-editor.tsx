"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Brush, Eraser, Undo2, Redo2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils/cn";

interface MaskEditorProps {
  source: HTMLCanvasElement;
  onApply: (imageData: ImageData) => void;
  onCancel: () => void;
}

type Tool = "erase" | "restore";

const MAX_HISTORY = 20;

/**
 * Manual mask editor: paints onto the alpha channel (not the image pixels).
 * Erase -> 0 alpha, Restore -> the original alpha, with undo/redo + zoom.
 */
export function MaskEditor({ source, onApply, onCancel }: MaskEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [tool, setTool] = useState<Tool>("erase");
  const [brushSize, setBrushSize] = useState(24);
  const [zoom, setZoom] = useState(1);

  const workingRef = useRef<ImageData | null>(null);
  const originalAlphaRef = useRef<Uint8ClampedArray | null>(null);
  const historyRef = useRef<Uint8ClampedArray[]>([]);
  const redoRef = useRef<Uint8ClampedArray[]>([]);
  const paintingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const [historyDepth, setHistoryDepth] = useState(0);
  const [redoDepth, setRedoDepth] = useState(0);

  const snapshotAlpha = useCallback(() => {
    const w = workingRef.current;
    if (!w) return new Uint8ClampedArray(0);
    const out = new Uint8ClampedArray(w.width * w.height);
    for (let i = 0, j = 3; i < out.length; i++, j += 4) out[i] = w.data[j];
    return out;
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const working = workingRef.current;
    if (!canvas || !working) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(working, 0, 0);
  }, []);

  const pushHistory = useCallback(() => {
    // Merge consecutive states while dragging: pushed once at stroke start.
    if (!paintingRef.current) return;
    const alpha = snapshotAlpha();
    historyRef.current = [...historyRef.current.slice(-(MAX_HISTORY - 1)), alpha];
    redoRef.current = [];
    setHistoryDepth(historyRef.current.length);
    setRedoDepth(0);
  }, [snapshotAlpha]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0);
    const working = ctx.getImageData(0, 0, canvas.width, canvas.height);
    workingRef.current = working;
    originalAlphaRef.current = snapshotAlpha();
    historyRef.current = [];
    redoRef.current = [];
    setHistoryDepth(0);
    setRedoDepth(0);
    pushHistory();
    render();
  }, [source, snapshotAlpha, pushHistory, render]);

  const stamp = useCallback(
    (px: number, py: number) => {
      const working = workingRef.current;
      const original = originalAlphaRef.current;
      if (!working || !original) return;
      const w = working.width;
      const h = working.height;
      const r = brushSize / 2;
      const x0 = Math.max(0, Math.floor(px - r));
      const x1 = Math.min(w - 1, Math.ceil(px + r));
      const y0 = Math.max(0, Math.floor(py - r));
      const y1 = Math.min(h - 1, Math.ceil(py + r));
      const r2 = r * r;
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const dx = x - px;
          const dy = y - py;
          if (dx * dx + dy * dy > r2) continue;
          const i = (y * w + x) * 4;
          working.data[i + 3] = tool === "erase" ? 0 : original[i + 3];
        }
      }
      render();
    },
    [brushSize, tool, render]
  );

  const toPixel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    paintingRef.current = true;
    lastRef.current = null;
    pushHistory();
    const p = toPixel(e);
    if (p) {
      stamp(p.x, p.y);
      lastRef.current = p;
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!paintingRef.current) return;
    const p = toPixel(e);
    if (!p) return;
    const last = lastRef.current;
    if (last) {
      // Stamp along the line segment so fast strokes don't skip.
      const dx = p.x - last.x;
      const dy = p.y - last.y;
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / Math.max(1, brushSize / 4)));
      for (let s = 1; s <= steps; s++) {
        stamp(last.x + (dx * s) / steps, last.y + (dy * s) / steps);
      }
    } else {
      stamp(p.x, p.y);
    }
    lastRef.current = p;
  };

  const endPainting = () => {
    if (!paintingRef.current) return;
    paintingRef.current = false;
    lastRef.current = null;
  };

  const undo = useCallback(() => {
    if (!historyRef.current.length) return;
    const working = workingRef.current;
    if (!working) return;
    const current = snapshotAlpha();
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    redoRef.current = [...redoRef.current, current];
    for (let i = 0; i < prev.length; i++) working.data[i * 4 + 3] = prev[i];
    render();
    setHistoryDepth(historyRef.current.length);
    setRedoDepth(redoRef.current.length);
  }, [snapshotAlpha, render]);

  const redo = useCallback(() => {
    if (!redoRef.current.length) return;
    const working = workingRef.current;
    if (!working) return;
    const current = snapshotAlpha();
    const next = redoRef.current[redoRef.current.length - 1];
    redoRef.current = redoRef.current.slice(0, -1);
    historyRef.current = [...historyRef.current, current];
    for (let i = 0; i < next.length; i++) working.data[i * 4 + 3] = next[i];
    render();
    setHistoryDepth(historyRef.current.length);
    setRedoDepth(redoRef.current.length);
  }, [snapshotAlpha, render]);

  const resetToOriginal = useCallback(() => {
    const working = workingRef.current;
    const original = originalAlphaRef.current;
    if (!working || !original) return;
    pushHistory();
    paintingRef.current = true;
    for (let i = 0; i < original.length; i++) working.data[i * 4 + 3] = original[i];
    paintingRef.current = false;
    render();
  }, [pushHistory, render]);

  const displayWidth = useMemo(() => source.width * zoom, [source.width, zoom]);

  const apply = () => {
    if (!workingRef.current) return;
    onApply(workingRef.current);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-md border border-border p-0.5" role="radiogroup" aria-label="Mask tool">
          <button
            type="button"
            role="radio"
            aria-checked={tool === "erase"}
            onClick={() => setTool("erase")}
            className={cn(
              "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors",
              tool === "erase" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            )}
          >
            <Eraser className="h-4 w-4" aria-hidden /> Erase
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={tool === "restore"}
            onClick={() => setTool("restore")}
            className={cn(
              "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors",
              tool === "restore" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            )}
          >
            <Brush className="h-4 w-4" aria-hidden /> Restore
          </button>
        </div>

        <Slider label="Brush size" value={brushSize} min={2} max={120} onChange={setBrushSize} formatValue={(v) => `${v}px`} className="w-56" />
        <Slider label="Zoom" value={zoom} min={1} max={8} step={0.25} onChange={setZoom} formatValue={(v) => `${Math.round(v * 100)}%`} className="w-40" />

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={undo} disabled={!historyDepth} icon={<Undo2 className="h-4 w-4" aria-hidden />}>
            Undo
          </Button>
          <Button variant="outline" size="sm" onClick={redo} disabled={!redoDepth} icon={<Redo2 className="h-4 w-4" aria-hidden />}>
            Redo
          </Button>
          <Button variant="outline" size="sm" onClick={resetToOriginal} icon={<RotateCcw className="h-4 w-4" aria-hidden />}>
            Reset
          </Button>
        </div>
      </div>

      <div className="overflow-auto rounded-xl border border-border bg-[repeating-conic-gradient(hsl(var(--secondary))_0%_25%,hsl(var(--background))_0%_50%)] bg-[length:20px_20px] p-4">
        <canvas
          ref={canvasRef}
          className="mx-auto touch-none rounded-sm shadow-sm"
          style={{ width: `${displayWidth}px`, cursor: "crosshair" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPainting}
          onPointerCancel={endPainting}
          onPointerLeave={endPainting}
          aria-label="Edit transparency mask"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={apply}>Use mask</Button>
      </div>
    </div>
  );
}