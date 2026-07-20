/**
 * Database client (optional for local demo).
 * When DATABASE_URL is unset, the app uses the in-memory/local seed layer.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    return null;
  }
  const client = postgres(url, { prepare: false, max: 10 });
  _db = drizzle(client, { schema });
  return _db;
}

export type NeuraBinderDb = NonNullable<ReturnType<typeof getDb>>;
export { schema };
