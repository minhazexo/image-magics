import { describe, it, expect } from "vitest";
import { TOOLS, getTool, HOMEPAGE_TOOLS, categoryIcon } from "@/lib/tools";

describe("tools registry", () => {
  it("has a non-empty tool list", () => {
    expect(TOOLS.length).toBeGreaterThan(0);
  });

  it("has unique slugs", () => {
    const slugs = TOOLS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has valid route-ready slugs", () => {
    for (const tool of TOOLS) {
      expect(tool.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("covers all six categories", () => {
    const categories = new Set(TOOLS.map((t) => t.category));
    for (const expected of ["Optimize", "Edit", "Convert", "Background", "Privacy", "Batch"] as const) {
      expect(categories.has(expected)).toBe(true);
    }
  });

  it("looks tools up by slug", () => {
    expect(getTool("optimizer")?.name).toBeTruthy();
    expect(getTool("does-not-exist")).toBeUndefined();
  });

  it("only references homepage slugs that exist", () => {
    const slugs = new Set(TOOLS.map((t) => t.slug));
    for (const slug of HOMEPAGE_TOOLS) {
      expect(slugs.has(slug)).toBe(true);
    }
  });

  it("provides icons for every category", () => {
    for (const category of ["Optimize", "Edit", "Convert", "Background", "Privacy", "Batch"] as const) {
      expect(categoryIcon(category)).toBeTruthy();
    }
  });
});