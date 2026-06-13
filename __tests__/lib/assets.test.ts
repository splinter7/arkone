import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import {
  addAsset,
  clearAssetsFilePath,
  findAssetByCid,
  readAssets,
  removeAssetByCid,
  setAssetsFilePath,
} from "@/lib/assets";

describe("assets", () => {
  let tempDir: string;

  afterEach(async () => {
    clearAssetsFilePath();
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("reads empty store", async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "arkone-assets-"));
    setAssetsFilePath(path.join(tempDir, "assets.json"));

    const assets = await readAssets();
    expect(assets).toEqual([]);
  });

  it("adds and finds assets", async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "arkone-assets-"));
    const filePath = path.join(tempDir, "assets.json");
    setAssetsFilePath(filePath);

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

    const raw = await fs.readFile(filePath, "utf-8");
    expect(raw).toContain("bafytest");
  });

  it("removes assets by cid", async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "arkone-assets-"));
    setAssetsFilePath(path.join(tempDir, "assets.json"));

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
});
