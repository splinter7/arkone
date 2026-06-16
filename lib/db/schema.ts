import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { Asset } from "../types";

export const assetsTable = sqliteTable("assets", {
  cid: text("cid").primaryKey(),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  category: text("category").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
  pinataFileId: text("pinata_file_id"),
  thumbnailCid: text("thumbnail_cid"),
  thumbnailPinataFileId: text("thumbnail_pinata_file_id"),
});

export type AssetRow = typeof assetsTable.$inferSelect;
export type NewAssetRow = typeof assetsTable.$inferInsert;

export function rowToAsset(row: AssetRow): Asset {
  return {
    cid: row.cid,
    name: row.name,
    mimeType: row.mimeType,
    category: row.category as Asset["category"],
    uploadedAt: row.uploadedAt,
    ...(row.pinataFileId ? { pinataFileId: row.pinataFileId } : {}),
    ...(row.thumbnailCid ? { thumbnailCid: row.thumbnailCid } : {}),
    ...(row.thumbnailPinataFileId
      ? { thumbnailPinataFileId: row.thumbnailPinataFileId }
      : {}),
  };
}

export function assetToRow(asset: Asset): NewAssetRow {
  return {
    cid: asset.cid,
    name: asset.name,
    mimeType: asset.mimeType,
    category: asset.category,
    uploadedAt: asset.uploadedAt,
    pinataFileId: asset.pinataFileId ?? null,
    thumbnailCid: asset.thumbnailCid ?? null,
    thumbnailPinataFileId: asset.thumbnailPinataFileId ?? null,
  };
}
