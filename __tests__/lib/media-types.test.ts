import { describe, expect, it } from "vitest";
import {
  getCopyUrlLabel,
  getCopyUrlToast,
  getMediaCategory,
  isAllowedMimeType,
  shouldUsePresignedUpload,
} from "@/lib/media-types";

describe("media-types", () => {
  it("maps mime types to categories", () => {
    expect(getMediaCategory("image/jpeg")).toBe("image");
    expect(getMediaCategory("video/mp4")).toBe("video");
    expect(getMediaCategory("audio/mpeg")).toBe("audio");
    expect(getMediaCategory("text/plain")).toBeNull();
  });

  it("validates allowed mime types", () => {
    expect(isAllowedMimeType("image/png")).toBe(true);
    expect(isAllowedMimeType("application/pdf")).toBe(false);
  });

  it("routes large or video files to presigned upload", () => {
    expect(shouldUsePresignedUpload("image/png", 1024)).toBe(false);
    expect(shouldUsePresignedUpload("video/mp4", 1024)).toBe(true);
    expect(shouldUsePresignedUpload("image/png", 5 * 1024 * 1024)).toBe(true);
  });

  it("returns contextual copy URL labels and toasts", () => {
    expect(getCopyUrlLabel("image")).toBe("Copy image URL");
    expect(getCopyUrlLabel("video")).toBe("Copy video URL");
    expect(getCopyUrlLabel("audio")).toBe("Copy audio URL");
    expect(getCopyUrlToast("image")).toBe("Image URL copied");
    expect(getCopyUrlToast("video")).toBe("Video URL copied");
    expect(getCopyUrlToast("audio")).toBe("Audio URL copied");
  });
});
