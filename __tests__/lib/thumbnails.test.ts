import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addAsset,
  updateAssetByCid,
} from "@/lib/assets";
import {
  setupTestDatabase,
  teardownTestDatabase,
} from "@/lib/db/test-utils";
import { generateImageThumbnail } from "@/lib/thumbnails";

describe("thumbnails", () => {
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
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  it("updates thumbnail fields", async () => {
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
