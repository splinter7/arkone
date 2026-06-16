import path from "path";
import { migrate } from "drizzle-orm/libsql/migrator";
import type { LibSQLDatabase } from "drizzle-orm/libsql";

const MIGRATIONS_FOLDER = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "drizzle",
);

export async function runMigrations(
  db: LibSQLDatabase<Record<string, unknown>>,
): Promise<void> {
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}
