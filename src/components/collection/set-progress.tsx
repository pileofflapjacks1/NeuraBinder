"use client";

import { useCollectionStore } from "@/lib/stores/collection-store";
import { useBciStore } from "@/lib/stores/bci-store";
import { formatCurrency, cn } from "@/lib/utils";

export function SetProgressBar({ setId }: { setId: string }) {
  const bciMode = useBciStore((s) => s.bciMode);
  const getSetProgress = useCollectionStore((s) => s.getSetProgress);
  const userCards = useCollectionStore((s) => s.userCards);
  // recompute when collection changes
  const progress = getSetProgress(setId);
  void userCards;

  if (!progress) return null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4",
        bciMode && "p-5"
      )}
      role="region"
      aria-label={`${progress.setName} set progress`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className={cn("font-semibold", bciMode ? "text-lg" : "text-base")}>
            {progress.setName}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {progress.setCode}
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">
            {progress.ownedUnique} / {progress.totalCards} unique ·{" "}
            {formatCurrency(progress.valueOwned)} owned
          </p>
        </div>
        <span
          className={cn(
            "font-mono font-bold tabular-nums text-primary",
            bciMode ? "text-2xl" : "text-xl"
          )}
        >
          {progress.percentComplete.toFixed(0)}%
        </span>
      </div>
      <div
        className={cn(
          "overflow-hidden rounded-full bg-muted",
          bciMode ? "h-4" : "h-2.5"
        )}
        role="progressbar"
        aria-valuenow={Math.round(progress.percentComplete)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Set completion"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all duration-500"
          style={{ width: `${Math.min(100, progress.percentComplete)}%` }}
        />
      </div>
    </div>
  );
}
