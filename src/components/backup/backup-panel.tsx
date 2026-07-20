"use client";

import { useRef } from "react";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { useLotsStore } from "@/lib/stores/lots-store";
import { useAlertsStore } from "@/lib/stores/alerts-store";
import { useViewsStore } from "@/lib/stores/views-store";
import { useSnapshotsStore } from "@/lib/stores/snapshots-store";
import { useBciStore } from "@/lib/stores/bci-store";
import { buildBackup, downloadBackup, parseBackupFile } from "@/lib/backup/io";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function BackupPanel() {
  const bciMode = useBciStore((s) => s.bciMode);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportBackup = () => {
    const col = useCollectionStore.getState();
    const backup = buildBackup({
      userCards: col.userCards,
      lists: col.lists,
      wantCardIds: col.wantCardIds,
      filters: col.filters,
      sort: col.sort,
      lots: useLotsStore.getState().lots,
      alerts: useAlertsStore.getState().alerts,
      watchlist: useAlertsStore.getState().watchlist,
      savedViews: useViewsStore.getState().views,
      snapshots: useSnapshotsStore.getState().snapshots,
      bci: {
        bciMode: useBciStore.getState().bciMode,
        profile: useBciStore.getState().profile,
      },
    });
    downloadBackup(backup);
    toast.success("Backup downloaded");
  };

  const onFile = async (file: File | null) => {
    if (!file) return;
    try {
      const backup = await parseBackupFile(file);
      useCollectionStore.getState().restoreFromBackup(backup);
      if (backup.lots) useLotsStore.setState({ lots: backup.lots });
      if (backup.alerts) useAlertsStore.setState({ alerts: backup.alerts });
      if (backup.watchlist)
        useAlertsStore.setState({ watchlist: backup.watchlist });
      if (backup.savedViews) useViewsStore.getState().setAll(backup.savedViews);
      if (backup.snapshots)
        useSnapshotsStore.getState().setAll(backup.snapshots);
      toast.success("Backup restored");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Restore failed");
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button size={bciMode ? "bci" : "default"} variant="outline" onClick={exportBackup}>
        Download JSON backup
      </Button>
      <Button
        size={bciMode ? "bci" : "default"}
        variant="secondary"
        onClick={() => fileRef.current?.click()}
      >
        Restore backup…
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
