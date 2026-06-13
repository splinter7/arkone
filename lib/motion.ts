import type { CSSProperties } from "react";

export function staggerDelay(index: number, stepMs = 60): CSSProperties {
  return { animationDelay: `${index * stepMs}ms` };
}

export function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToTop(): void {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}
