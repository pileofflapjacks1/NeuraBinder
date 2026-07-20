/**
 * JSON backup / restore for local-first NeuraBinder data.
 */

import type { NeuraBinderBackup } from "@/lib/types/features";

export function buildBackup(parts: {
  userCards: NeuraBinderBackup["collection"]["userCards"];
  lists: NeuraBinderBackup["collection"]["lists"];
  wantCardIds: string[];
  filters?: NeuraBinderBackup["collection"]["filters"];
  sort?: NeuraBinderBackup["collection"]["sort"];
  lots?: NeuraBinderBackup["lots"];
  alerts?: NeuraBinderBackup["alerts"];
  watchlist?: NeuraBinderBackup["watchlist"];
  savedViews?: NeuraBinderBackup["savedViews"];
  snapshots?: NeuraBinderBackup["snapshots"];
  bci?: Record<string, unknown>;
}): NeuraBinderBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    collection: {
      userCards: parts.userCards,
      lists: parts.lists,
      wantCardIds: parts.wantCardIds,
      filters: parts.filters,
      sort: parts.sort,
    },
    lots: parts.lots,
    alerts: parts.alerts,
    watchlist: parts.watchlist,
    savedViews: parts.savedViews,
    snapshots: parts.snapshots,
    bci: parts.bci,
  };
}

export function downloadBackup(backup: NeuraBinderBackup, filename?: string) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ??
    `neurabinder-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function parseBackupFile(file: File): Promise<NeuraBinderBackup> {
  const text = await file.text();
  const data = JSON.parse(text) as NeuraBinderBackup;
  if (!data || data.version !== 1 || !data.collection?.userCards) {
    throw new Error("Invalid NeuraBinder backup (expected version 1)");
  }
  return data;
}
