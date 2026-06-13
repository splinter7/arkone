import { spawn } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import sharp from "sharp";
import { updateAssetByCid } from "./assets";
import type { MediaCategory } from "./media-types";
import { createSignedPlaybackUrl, getPinata } from "./pinata";
import type { Asset } from "./types";

export const THUMBNAIL_MAX_WIDTH = 320;
export const THUMBNAIL_MIME_TYPE = "image/webp";

function getFfmpegPath(): string {
  return process.env.FFMPEG_PATH ?? "ffmpeg";
}

export async function generateImageThumbnail(source: Buffer): Promise<Buffer> {
  return sharp(source)
    .rotate()
    .resize(THUMBNAIL_MAX_WIDTH, THUMBNAIL_MAX_WIDTH, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();
}

async function generateAudioPlaceholder(): Promise<Buffer> {
  return sharp({
    create: {
      width: THUMBNAIL_MAX_WIDTH,
      height: THUMBNAIL_MAX_WIDTH,
      channels: 3,
      background: { r: 38, g: 38, b: 38 },
    },
  })
    .webp({ quality: 80 })
    .toBuffer();
}

async function generateVideoPlaceholder(): Promise<Buffer> {
  return sharp({
    create: {
      width: THUMBNAIL_MAX_WIDTH,
      height: Math.round((THUMBNAIL_MAX_WIDTH * 9) / 16),
      channels: 3,
      background: { r: 23, g: 23, b: 23 },
    },
  })
    .webp({ quality: 80 })
    .toBuffer();
}

async function extractVideoFrame(source: Buffer): Promise<Buffer | null> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const inputPath = path.join(os.tmpdir(), `arkone-video-${id}`);
  const outputPath = path.join(os.tmpdir(), `arkone-frame-${id}.jpg`);

  try {
    await fs.writeFile(inputPath, source);

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(getFfmpegPath(), [
        "-i",
        inputPath,
        "-ss",
        "1",
        "-vframes",
        "1",
        "-q:v",
        "2",
        "-y",
        outputPath,
      ]);

      proc.on("error", reject);
      proc.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffmpeg exited with code ${code}`));
        }
      });
    });

    const frame = await fs.readFile(outputPath);
    return generateImageThumbnail(frame);
  } catch {
    return null;
  } finally {
    await fs.unlink(inputPath).catch(() => undefined);
    await fs.unlink(outputPath).catch(() => undefined);
  }
}

export async function generateThumbnailBuffer(
  source: Buffer,
  category: MediaCategory,
): Promise<Buffer | null> {
  if (category === "image") {
    return generateImageThumbnail(source);
  }

  if (category === "audio") {
    return generateAudioPlaceholder();
  }

  const frame = await extractVideoFrame(source);
  return frame ?? generateVideoPlaceholder();
}

export async function uploadThumbnailToPinata(
  buffer: Buffer,
  sourceName: string,
): Promise<{ cid: string; id: string }> {
  const pinata = getPinata();
  const baseName = sourceName.replace(/\.[^.]+$/, "") || "asset";
  const fileName = `thumb-${baseName}.webp`;
  const file = new File([new Uint8Array(buffer)], fileName, {
    type: THUMBNAIL_MIME_TYPE,
  });
  const upload = await pinata.upload.public.file(file);
  return { cid: upload.cid, id: upload.id };
}

export async function fetchAssetBuffer(cid: string): Promise<Buffer> {
  const url = await createSignedPlaybackUrl(cid);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch asset ${cid}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export interface ThumbnailResult {
  thumbnailCid: string;
  thumbnailPinataFileId: string;
}

export async function generateThumbnailFromBuffer(
  source: Buffer,
  asset: Pick<Asset, "cid" | "name" | "category">,
): Promise<ThumbnailResult | null> {
  const thumbnailBuffer = await generateThumbnailBuffer(source, asset.category);
  if (!thumbnailBuffer) {
    return null;
  }

  const upload = await uploadThumbnailToPinata(thumbnailBuffer, asset.name);
  await updateAssetByCid(asset.cid, {
    thumbnailCid: upload.cid,
    thumbnailPinataFileId: upload.id,
  });

  return {
    thumbnailCid: upload.cid,
    thumbnailPinataFileId: upload.id,
  };
}

export async function generateThumbnailForAsset(
  asset: Asset,
  options?: { force?: boolean },
): Promise<ThumbnailResult | null> {
  if (asset.thumbnailCid && !options?.force) {
    return {
      thumbnailCid: asset.thumbnailCid,
      thumbnailPinataFileId: asset.thumbnailPinataFileId ?? "",
    };
  }

  if (asset.category === "audio") {
    const thumbnailBuffer = await generateAudioPlaceholder();
    const upload = await uploadThumbnailToPinata(thumbnailBuffer, asset.name);
    await updateAssetByCid(asset.cid, {
      thumbnailCid: upload.cid,
      thumbnailPinataFileId: upload.id,
    });
    return {
      thumbnailCid: upload.cid,
      thumbnailPinataFileId: upload.id,
    };
  }

  const source = await fetchAssetBuffer(asset.cid);
  return generateThumbnailFromBuffer(source, asset);
}
