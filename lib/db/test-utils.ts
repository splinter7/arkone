import {
  createInMemoryDatabase,
  resetDbForTests,
  setDbForTests,
} from "./client";

export async function setupTestDatabase(): Promise<void> {
  const { db, client } = await createInMemoryDatabase();
  setDbForTests(db, client);
}

export async function teardownTestDatabase(): Promise<void> {
  resetDbForTests();
}
