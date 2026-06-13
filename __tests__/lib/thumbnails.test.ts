import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import {
  addAsset,
  clearAssetsFilePath,
  setAssetsFilePath,
  updateAssetByCid,
} from "@/lib/assets";
import { generateImageThumbnail } from "@/lib/thumbnails";

describe("thumbnails", () => {
  let tempDir: string;

  afterEach(async () => {
    clearAssetsFilePath();
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("generates a webp thumbnail from a png buffer", async () => {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );

    const thumbnail = await generateImageThumbnail(png);

    expect(thumbnail.length).toBeGreaterThan(0);
    expect(thumbnail.subarray(0, 4).toString("hex")).toBe("52494646");
  });
});

describe("assets updateAssetByCid", () => {
  let tempDir: string;

  afterEach(async () => {
    clearAssetsFilePath();
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("updates thumbnail fields", async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "arkone-assets-"));
    setAssetsFilePath(path.join(tempDir, "assets.json"));

    await addAsset({
      cid: "bafytest",
      name: "photo.jpg",
      mimeType: "image/jpeg",
      category: "image",
      uploadedAt: "2026-01-01T00:00:00.000Z",
    });

    const updated = await updateAssetByCid("bafytest", {
      thumbnailCid: "bafythumb",
      thumbnailPinataFileId: "thumb-id",
    });

    expect(updated?.thumbnailCid).toBe("bafythumb");
    expect(updated?.thumbnailPinataFileId).toBe("thumb-id");
  });
});
