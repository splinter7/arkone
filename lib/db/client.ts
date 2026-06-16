import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import {
  ensureDataDirectory,
  resolveDatabaseAuthToken,
  resolveDatabaseUrl,
} from "./config";
import { runMigrations } from "./migrate";
import * as schema from "./schema";

type Database = LibSQLDatabase<typeof schema>;

let dbInstance: Database | null = null;
let clientInstance: Client | null = null;
let migratePromise: Promise<void> | null = null;
let testDb: Database | null = null;
let testClient: Client | null = null;

function createDatabaseClient(): Client {
  return createClient({
    url: resolveDatabaseUrl(),
    authToken: resolveDatabaseAuthToken(),
  });
}

async function initializeDatabase(): Promise<Database> {
  await ensureDataDirectory();
  clientInstance = createDatabaseClient();
  const db = drizzle(clientInstance, { schema });
  migratePromise ??= runMigrations(db);
  await migratePromise;
  dbInstance = db;
  return db;
}

export async function getDb(): Promise<Database> {
  if (testDb) {
    return testDb;
  }

  if (!dbInstance) {
    return initializeDatabase();
  }

  return dbInstance;
}

export function setDbForTests(db: Database, client?: Client): void {
  testDb = db;
  testClient = client ?? null;
}

export function resetDbForTests(): void {
  testDb = null;
  if (testClient) {
    testClient.close();
    testClient = null;
  }
}

export async function createInMemoryDatabase(): Promise<{
  db: Database;
  client: Client;
}> {
  const client = createClient({ url: ":memory:" });
  const db = drizzle(client, { schema });
  await runMigrations(db);
  return { db, client };
}

export { resolveDatabaseUrl, resolveDatabaseAuthToken } from "./config";
