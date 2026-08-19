"use client";

import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [actualSide, setActualSide] = useState(side);

  const checkBounds = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const pad = 12;

    // Check if preferred side would go off-screen, flip if needed
    if (side === "top" && rect.top < pad + 32) {
      setActualSide("bottom");
    } else if (side === "bottom" && rect.bottom > window.innerHeight - pad - 32) {
      setActualSide("top");
    } else if (side === "left" && rect.left < pad + 100) {
      setActualSide("right");
    } else if (side === "right" && rect.right > window.innerWidth - pad - 100) {
      setActualSide("left");
    } else {
      setActualSide(side);
    }
  }, [side]);

  const position = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[actualSide];

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={() => {
        checkBounds();
        setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => {
        checkBounds();
        setOpen(true);
      }}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-lg animate-fade-in",
            position,
            className
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
