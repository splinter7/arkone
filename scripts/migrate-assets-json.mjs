import { createClient } from "@libsql/client";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const assetsJsonPath = path.join(rootDir, "data", "assets.json");
const migrationsFolder = path.join(rootDir, "drizzle");

const assetsTable = sqliteTable("assets", {
  cid: text("cid").primaryKey(),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  category: text("category").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
  pinataFileId: text("pinata_file_id"),
  thumbnailCid: text("thumbnail_cid"),
  thumbnailPinataFileId: text("thumbnail_pinata_file_id"),
});

function resolveDatabaseUrl() {
  return (
    process.env.TURSO_DATABASE_URL ??
    process.env.DATABASE_URL ??
    `file:${path.join(rootDir, "data", "local.db")}`
  );
}

function resolveDatabaseAuthToken() {
  return process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN;
}

function assetToRow(asset) {
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

async function main() {
  const raw = await readFile(assetsJsonPath, "utf-8");
  const assets = JSON.parse(raw);

  if (!Array.isArray(assets)) {
    throw new Error("assets.json must contain an array");
  }

  const client = createClient({
    url: resolveDatabaseUrl(),
    authToken: resolveDatabaseAuthToken(),
  });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder });

  for (const asset of assets) {
    const row = assetToRow(asset);
    await db
      .insert(assetsTable)
      .values(row)
      .onConflictDoUpdate({
        target: assetsTable.cid,
        set: row,
      });
  }

  console.log(`Imported ${assets.length} asset(s) into ${resolveDatabaseUrl()}`);
  client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
