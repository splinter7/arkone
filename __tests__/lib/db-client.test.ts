import { afterEach, describe, expect, it } from "vitest";
import {
  createInMemoryDatabase,
  resetDbForTests,
  resolveDatabaseAuthToken,
  resolveDatabaseUrl,
} from "@/lib/db/client";
import { assetsTable } from "@/lib/db/schema";

describe("db client", () => {
  const originalTursoUrl = process.env.TURSO_DATABASE_URL;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalTursoToken = process.env.TURSO_AUTH_TOKEN;
  const originalDatabaseToken = process.env.DATABASE_AUTH_TOKEN;

  afterEach(() => {
    if (originalTursoUrl === undefined) {
      delete process.env.TURSO_DATABASE_URL;
    } else {
      process.env.TURSO_DATABASE_URL = originalTursoUrl;
    }

    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }

    if (originalTursoToken === undefined) {
      delete process.env.TURSO_AUTH_TOKEN;
    } else {
      process.env.TURSO_AUTH_TOKEN = originalTursoToken;
    }

    if (originalDatabaseToken === undefined) {
      delete process.env.DATABASE_AUTH_TOKEN;
    } else {
      process.env.DATABASE_AUTH_TOKEN = originalDatabaseToken;
    }

    resetDbForTests();
  });

  it("defaults to a local file database url when env is unset", () => {
    delete process.env.TURSO_DATABASE_URL;
    delete process.env.DATABASE_URL;

    expect(resolveDatabaseUrl()).toMatch(/^file:.*local\.db$/);
  });

  it("prefers TURSO_DATABASE_URL over DATABASE_URL", () => {
    process.env.TURSO_DATABASE_URL = "libsql://example.turso.io";
    process.env.DATABASE_URL = "file:./ignored.db";

    expect(resolveDatabaseUrl()).toBe("libsql://example.turso.io");
  });

  it("resolves auth token from TURSO_AUTH_TOKEN or DATABASE_AUTH_TOKEN", () => {
    delete process.env.TURSO_AUTH_TOKEN;
    process.env.DATABASE_AUTH_TOKEN = "db-token";
    expect(resolveDatabaseAuthToken()).toBe("db-token");

    process.env.TURSO_AUTH_TOKEN = "turso-token";
    expect(resolveDatabaseAuthToken()).toBe("turso-token");
  });

  it("runs migrations and creates the assets table", async () => {
    const { db, client } = await createInMemoryDatabase();

    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'assets'",
    );

    expect(tables.rows).toHaveLength(1);

    await db.insert(assetsTable).values({
      cid: "bafytest",
      name: "photo.jpg",
      mimeType: "image/jpeg",
      category: "image",
      uploadedAt: "2026-01-01T00:00:00.000Z",
    });

    const rows = await db.select().from(assetsTable);
    expect(rows).toHaveLength(1);

    client.close();
  });
});
