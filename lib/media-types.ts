export type MediaCategory = "image" | "video" | "audio";

export function getMediaCategory(mimeType: string): MediaCategory | null {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return null;
}

export function isAllowedMimeType(mimeType: string): boolean {
  return getMediaCategory(mimeType) !== null;
}

export const LARGE_FILE_BYTES = 4 * 1024 * 1024;

export function shouldUsePresignedUpload(
  mimeType: string,
  sizeBytes: number,
): boolean {
  return mimeType.startsWith("video/") || sizeBytes > LARGE_FILE_BYTES;
}

const COPY_URL_LABELS: Record<MediaCategory, string> = {
  image: "Copy image URL",
  video: "Copy video URL",
  audio: "Copy audio URL",
};

const COPY_URL_TOASTS: Record<MediaCategory, string> = {
  image: "Image URL copied",
  video: "Video URL copied",
  audio: "Audio URL copied",
};

export function getCopyUrlLabel(category: MediaCategory): string {
  return COPY_URL_LABELS[category];
}

export function getCopyUrlToast(category: MediaCategory): string {
  return COPY_URL_TOASTS[category];
}
