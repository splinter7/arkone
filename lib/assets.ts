import { promises as fs } from "fs";
import path from "path";
import type { Asset } from "./types";

const DEFAULT_ASSETS_PATH = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "data",
  "assets.json",
);

function getAssetsPath(): string {
  return process.env.ASSETS_FILE_PATH ?? DEFAULT_ASSETS_PATH;
}

async function ensureAssetsFile(): Promise<void> {
  const filePath = getAssetsPath();
  const dir = path.dirname(filePath);

  await fs.mkdir(dir, { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "[]", "utf-8");
  }
}

export async function readAssets(): Promise<Asset[]> {
  await ensureAssetsFile();
  const raw = await fs.readFile(getAssetsPath(), "utf-8");
  const parsed = JSON.parse(raw) as Asset[];
  return Array.isArray(parsed) ? parsed : [];
}

export async function writeAssets(assets: Asset[]): Promise<void> {
  await ensureAssetsFile();
  await fs.writeFile(getAssetsPath(), JSON.stringify(assets, null, 2), "utf-8");
}

export async function addAsset(asset: Asset): Promise<Asset> {
  const assets = await readAssets();
  const existingIndex = assets.findIndex((item) => item.cid === asset.cid);

  if (existingIndex !== -1) {
    const existing = assets[existingIndex];
    const merged = {
      ...existing,
      ...asset,
      pinataFileId: asset.pinataFileId ?? existing.pinataFileId,
      thumbnailCid: asset.thumbnailCid ?? existing.thumbnailCid,
      thumbnailPinataFileId:
        asset.thumbnailPinataFileId ?? existing.thumbnailPinataFileId,
    };

    if (JSON.stringify(merged) !== JSON.stringify(existing)) {
      assets[existingIndex] = merged;
      await writeAssets(assets);
    }

    return assets[existingIndex];
  }

  assets.push(asset);
  await writeAssets(assets);
  return asset;
}

export async function removeAssetByCid(cid: string): Promise<boolean> {
  const assets = await readAssets();
  const nextAssets = assets.filter((item) => item.cid !== cid);

  if (nextAssets.length === assets.length) {
    return false;
  }

  await writeAssets(nextAssets);
  return true;
}

export async function findAssetByCid(cid: string): Promise<Asset | null> {
  const assets = await readAssets();
  return assets.find((item) => item.cid === cid) ?? null;
}

export async function updateAssetByCid(
  cid: string,
  updates: Partial<
    Pick<Asset, "thumbnailCid" | "thumbnailPinataFileId" | "pinataFileId">
  >,
): Promise<Asset | null> {
  const assets = await readAssets();
  const index = assets.findIndex((item) => item.cid === cid);

  if (index === -1) {
    return null;
  }

  assets[index] = { ...assets[index], ...updates };
  await writeAssets(assets);
  return assets[index];
}

export function setAssetsFilePath(filePath: string): void {
  process.env.ASSETS_FILE_PATH = filePath;
}

export function clearAssetsFilePath(): void {
  delete process.env.ASSETS_FILE_PATH;
}
