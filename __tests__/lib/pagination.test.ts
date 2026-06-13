import { describe, expect, it } from "vitest";
import {
  clampPage,
  getPageRange,
  getTotalPages,
  paginateItems,
} from "@/lib/pagination";

describe("pagination", () => {
  const items = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"];

  it("paginates items", () => {
    expect(paginateItems(items, 1, 5)).toEqual(["a", "b", "c", "d", "e"]);
    expect(paginateItems(items, 2, 5)).toEqual(["f", "g", "h", "i", "j"]);
    expect(paginateItems(items, 3, 5)).toEqual(["k"]);
  });

  it("returns at least one total page", () => {
    expect(getTotalPages(0)).toBe(1);
    expect(getTotalPages(5, 10)).toBe(1);
    expect(getTotalPages(11, 10)).toBe(2);
  });

  it("clamps page within bounds", () => {
    expect(clampPage(0, 3)).toBe(1);
    expect(clampPage(2, 3)).toBe(2);
    expect(clampPage(5, 3)).toBe(3);
  });

  it("returns page range", () => {
    expect(getPageRange(1, 10, 25)).toEqual({ start: 1, end: 10 });
    expect(getPageRange(3, 10, 25)).toEqual({ start: 21, end: 25 });
    expect(getPageRange(1, 10, 0)).toEqual({ start: 0, end: 0 });
  });
});
