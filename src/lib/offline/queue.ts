/**
 * IndexedDB offline mutation queue.
 * Queues writes when offline; flushes when back online.
 */

import { openDB, type IDBPDatabase } from "idb";
import { nanoid } from "nanoid";
import type { OfflineOp, OfflineOpType } from "@/lib/types/features";

const DB_NAME = "neurabinder-offline";
const STORE = "ops";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (typeof window === "undefined") {
    return null;
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function enqueueOp(
  type: OfflineOpType,
  payload: Record<string, unknown>
): Promise<OfflineOp> {
  const op: OfflineOp = {
    id: nanoid(),
    type,
    payload,
    createdAt: new Date().toISOString(),
    status: "queued",
  };
  const db = await getDb();
  if (db) await db.put(STORE, op);
  return op;
}

export async function listQueuedOps(): Promise<OfflineOp[]> {
  const db = await getDb();
  if (!db) return [];
  const all = (await db.getAll(STORE)) as OfflineOp[];
  return all
    .filter((o) => o.status === "queued")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function markFlushed(id: string) {
  const db = await getDb();
  if (!db) return;
  const op = (await db.get(STORE, id)) as OfflineOp | undefined;
  if (!op) return;
  await db.put(STORE, { ...op, status: "flushed" });
}

export async function clearFlushed() {
  const db = await getDb();
  if (!db) return;
  const all = (await db.getAll(STORE)) as OfflineOp[];
  for (const op of all) {
    if (op.status === "flushed") await db.delete(STORE, op.id);
  }
}

export function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * Flush handler applies ops via provided callbacks (wired to collection store).
 */
export async function flushQueue(handlers: {
  add_card?: (p: Record<string, unknown>) => void;
  update_card?: (p: Record<string, unknown>) => void;
  remove_card?: (p: Record<string, unknown>) => void;
  adjust_qty?: (p: Record<string, unknown>) => void;
  add_to_list?: (p: Record<string, unknown>) => void;
  remove_from_list?: (p: Record<string, unknown>) => void;
}): Promise<number> {
  if (isBrowserOffline()) return 0;
  const ops = await listQueuedOps();
  let n = 0;
  for (const op of ops) {
    try {
      const fn = handlers[op.type];
      fn?.(op.payload);
      await markFlushed(op.id);
      n++;
    } catch (e) {
      const db = await getDb();
      if (db) {
        await db.put(STORE, {
          ...op,
          status: "failed",
          error: e instanceof Error ? e.message : "fail",
        });
      }
    }
  }
  await clearFlushed();
  return n;
}
