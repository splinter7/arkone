import path from "path";
import { promises as fs } from "fs";

const DEFAULT_DATABASE_URL = `file:${path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "data",
  "local.db",
)}`;

export function resolveDatabaseUrl(): string {
  return (
    process.env.TURSO_DATABASE_URL ??
    process.env.DATABASE_URL ??
    DEFAULT_DATABASE_URL
  );
}

export function resolveDatabaseAuthToken(): string | undefined {
  return process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN;
}

export async function ensureDataDirectory(): Promise<void> {
  const url = resolveDatabaseUrl();
  if (!url.startsWith("file:")) {
    return;
  }

  const filePath = url.slice("file:".length);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}
