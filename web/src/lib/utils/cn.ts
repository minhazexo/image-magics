import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with conflict resolution.
 * Uses clsx for conditional classes and tailwind-merge for deduplication.
 *
 * Example: cn("px-4 py-2", isActive && "px-6", className)
 * → "py-2 px-6 {className}" (px-4 is correctly overridden by px-6)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
