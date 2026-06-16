import { asc, eq } from "drizzle-orm";
import { getDb } from "./db/client";
import { assetToRow, assetsTable, rowToAsset } from "./db/schema";
import type { Asset } from "./types";

export async function readAssets(): Promise<Asset[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(assetsTable)
    .orderBy(asc(assetsTable.uploadedAt));

  return rows.map(rowToAsset);
}

function mergeAsset(existing: Asset, incoming: Asset): Asset {
  return {
    ...existing,
    ...incoming,
    pinataFileId: incoming.pinataFileId ?? existing.pinataFileId,
    thumbnailCid: incoming.thumbnailCid ?? existing.thumbnailCid,
    thumbnailPinataFileId:
      incoming.thumbnailPinataFileId ?? existing.thumbnailPinataFileId,
  };
}

function assetsEqual(left: Asset, right: Asset): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export async function addAsset(asset: Asset): Promise<Asset> {
  const db = await getDb();
  const existing = await findAssetByCid(asset.cid);

  if (existing) {
    const merged = mergeAsset(existing, asset);

    if (!assetsEqual(merged, existing)) {
      await db
        .update(assetsTable)
        .set(assetToRow(merged))
        .where(eq(assetsTable.cid, asset.cid));
    }

    return merged;
  }

  await db.insert(assetsTable).values(assetToRow(asset));
  return asset;
}

export async function removeAssetByCid(cid: string): Promise<boolean> {
  const db = await getDb();
  const deleted = await db
    .delete(assetsTable)
    .where(eq(assetsTable.cid, cid))
    .returning({ cid: assetsTable.cid });

  return deleted.length > 0;
}

export async function findAssetByCid(cid: string): Promise<Asset | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(assetsTable)
    .where(eq(assetsTable.cid, cid))
    .limit(1);

  return rows[0] ? rowToAsset(rows[0]) : null;
}

export async function updateAssetByCid(
  cid: string,
  updates: Partial<
    Pick<Asset, "thumbnailCid" | "thumbnailPinataFileId" | "pinataFileId">
  >,
): Promise<Asset | null> {
  const existing = await findAssetByCid(cid);

  if (!existing) {
    return null;
  }

  const db = await getDb();
  const updated = { ...existing, ...updates };
  const rows = await db
    .update(assetsTable)
    .set(assetToRow(updated))
    .where(eq(assetsTable.cid, cid))
    .returning();

  return rows[0] ? rowToAsset(rows[0]) : null;
}
