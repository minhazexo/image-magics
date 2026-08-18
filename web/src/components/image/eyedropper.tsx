"use client";

import { useEffect, useRef } from "react";
import { Pipette } from "lucide-react";

interface EyedropperImageProps {
  src: string;
  onPickColor: (color: { r: number; g: number; b: number }) => void;
  className?: string;
}

/**
 * Renders an image; clicking anywhere on it samples the pixel color
 * under the cursor and reports it via onPickColor.
 */
export function EyedropperImage({ src, onPickColor, className }: EyedropperImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 640 / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = src;
  }, [src]);

  const sample = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);
    const data = ctx.getImageData(Math.max(0, Math.min(canvas.width - 1, x)), Math.max(0, Math.min(canvas.height - 1, y)), 1, 1).data;
    onPickColor({ r: data[0], g: data[1], b: data[2] });
  };

  return (
    <div className={className}>
      <p className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Pipette className="h-4 w-4" aria-hidden />
        Click anywhere on the image to pick a color
      </p>
      <canvas
        ref={canvasRef}
        onClick={sample}
        className="mx-auto block max-h-72 w-auto cursor-crosshair rounded-lg border border-border"
        aria-label="Image color picker"
      />
    </div>
  );
}