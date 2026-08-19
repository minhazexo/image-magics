"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useImageStore } from "@/lib/store/useImageStore";
import type { ThemeMode } from "@/lib/store/useImageStore";

const icons: Record<ThemeMode, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };

interface ThemeToggleProps {
  /** Hide tooltip on mobile to avoid tap-to-show behavior */
  hideTooltip?: boolean;
}

export function ThemeToggle({ hideTooltip }: ThemeToggleProps) {
  const theme = useImageStore((s) => s.preferences.theme);
  const setTheme = useImageStore((s) => s.setTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const cycles: ThemeMode[] = ["system", "light", "dark"];
  const nextTheme = cycles[(cycles.indexOf(theme) + 1) % cycles.length];
  const Icon = icons[theme];

  if (!mounted) return <Button variant="ghost" size="icon" aria-label="Toggle theme" disabled />;

  const button = (
    <Button
      variant="ghost"
      size="icon"
      className="hover:bg-transparent hover:text-foreground active:bg-transparent lg:hover:bg-accent lg:hover:text-accent-foreground lg:active:bg-accent/80"
      aria-label={`Toggle theme. Current: ${theme}. Click to switch to ${nextTheme}.`}
      onClick={() => setTheme(nextTheme)}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  if (hideTooltip) return button;

  return (
    <Tooltip content={`Theme: ${theme} → ${nextTheme}`} side="bottom">
      {button}
    </Tooltip>
  );
}
