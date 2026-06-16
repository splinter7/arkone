import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addAsset,
  findAssetByCid,
  readAssets,
  removeAssetByCid,
  updateAssetByCid,
} from "@/lib/assets";
import {
  setupTestDatabase,
  teardownTestDatabase,
} from "@/lib/db/test-utils";

describe("assets", () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  it("reads empty store", async () => {
    const assets = await readAssets();
    expect(assets).toEqual([]);
  });

  it("adds and finds assets", async () => {
    const asset = await addAsset({
      cid: "bafytest",
      name: "photo.jpg",
      mimeType: "image/jpeg",
      category: "image",
      uploadedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(asset.cid).toBe("bafytest");

    const listed = await readAssets();
    expect(listed).toHaveLength(1);

    const found = await findAssetByCid("bafytest");
    expect(found?.name).toBe("photo.jpg");
  });

  it("removes assets by cid", async () => {
    await addAsset({
      cid: "bafytest",
      name: "photo.jpg",
      mimeType: "image/jpeg",
      category: "image",
      uploadedAt: "2026-01-01T00:00:00.000Z",
    });

    const removed = await removeAssetByCid("bafytest");
    expect(removed).toBe(true);
    expect(await readAssets()).toEqual([]);

    const missing = await removeAssetByCid("bafytest");
    expect(missing).toBe(false);
  });

  it("merges optional fields on duplicate cid without overwriting existing values", async () => {
    await addAsset({
      cid: "bafytest",
      name: "photo.jpg",
      mimeType: "image/jpeg",
      category: "image",
      uploadedAt: "2026-01-01T00:00:00.000Z",
      pinataFileId: "existing-file-id",
      thumbnailCid: "existing-thumb",
      thumbnailPinataFileId: "existing-thumb-id",
    });

    const merged = await addAsset({
      cid: "bafytest",
      name: "photo-renamed.jpg",
      mimeType: "image/jpeg",
      category: "image",
      uploadedAt: "2026-01-02T00:00:00.000Z",
    });

    expect(merged.name).toBe("photo-renamed.jpg");
    expect(merged.pinataFileId).toBe("existing-file-id");
    expect(merged.thumbnailCid).toBe("existing-thumb");
    expect(merged.thumbnailPinataFileId).toBe("existing-thumb-id");
    expect(await readAssets()).toHaveLength(1);
  });

  it("is a no-op when upsert data is unchanged", async () => {
    const original = await addAsset({
      cid: "bafytest",
      name: "photo.jpg",
      mimeType: "image/jpeg",
      category: "image",
      uploadedAt: "2026-01-01T00:00:00.000Z",
      pinataFileId: "file-id",
    });

    const again = await addAsset({
      cid: "bafytest",
      name: "photo.jpg",
      mimeType: "image/jpeg",
      category: "image",
      uploadedAt: "2026-01-01T00:00:00.000Z",
      pinataFileId: "file-id",
    });

    expect(again).toEqual(original);
    expect(await readAssets()).toHaveLength(1);
  });

  it("returns stable insertion order by uploadedAt", async () => {
    await addAsset({
      cid: "bafy-second",
      name: "second.jpg",
      mimeType: "image/jpeg",
      category: "image",
      uploadedAt: "2026-01-02T00:00:00.000Z",
    });
    await addAsset({
      cid: "bafy-first",
      name: "first.jpg",
      mimeType: "image/jpeg",
      category: "image",
      uploadedAt: "2026-01-01T00:00:00.000Z",
    });

    const listed = await readAssets();
    expect(listed.map((asset) => asset.cid)).toEqual([
      "bafy-first",
      "bafy-second",
    ]);
  });

  it("returns null when updating unknown cid", async () => {
    const updated = await updateAssetByCid("missing", {
      thumbnailCid: "bafythumb",
    });
    expect(updated).toBeNull();
  });
});
