import type { CSSProperties } from "react";

export function staggerDelay(index: number, stepMs = 60): CSSProperties {
  return { animationDelay: `${index * stepMs}ms` };
}
