"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders children only on the client side.
 * Server renders nothing, client renders children after mount.
 * This prevents all hydration mismatches from client-only state.
 */
export function ClientOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return fallback ?? null;

  return <>{children}</>;
}
