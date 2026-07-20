"use client";

import { useState } from "react";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { useBciStore } from "@/lib/stores/bci-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CardCondition } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useShowcaseStore } from "@/lib/stores/showcase-store";

const CONDITIONS: CardCondition[] = ["NM", "LP", "MP", "HP", "DMG"];

export function BulkBar() {
  const bciMode = useBciStore((s) => s.bciMode);
  const showcaseLock = useShowcaseStore((s) => s.enabled && s.lockData);
  const bulkMode = useCollectionStore((s) => s.bulkMode);
  const selectedIds = useCollectionStore((s) => s.selectedIds);
  const setBulkMode = useCollectionStore((s) => s.setBulkMode);
  const selectAllFiltered = useCollectionStore((s) => s.selectAllFiltered);
  const clearBulk = useCollectionStore((s) => s.clearBulk);
  const bulkUpdate = useCollectionStore((s) => s.bulkUpdate);
  const bulkRemove = useCollectionStore((s) => s.bulkRemove);
  const bulkAdjustQty = useCollectionStore((s) => s.bulkAdjustQty);
  const lists = useCollectionStore((s) => s.lists);
  const [tag, setTag] = useState("");
  const [location, setLocation] = useState("");

  if (!bulkMode && selectedIds.length === 0) {
    return (
      <Button
        size={bciMode ? "default" : "sm"}
        variant="outline"
        onClick={() => setBulkMode(true)}
        data-tour="bulk"
      >
        Bulk select
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border border-primary/40 bg-primary/5 p-3",
        bciMode && "gap-3 p-4"
      )}
      role="toolbar"
      aria-label="Bulk actions"
    >
      <span className="text-sm font-semibold">
        {selectedIds.length} selected
      </span>
      <Button size="sm" variant="outline" onClick={selectAllFiltered}>
        Select all shown
      </Button>
      <Button size="sm" variant="ghost" onClick={clearBulk}>
        Clear
      </Button>

      <div className="mx-1 h-6 w-px bg-border" />

      {CONDITIONS.map((c) => (
        <Button
          key={c}
          size="sm"
          variant="outline"
          disabled={!selectedIds.length}
          onClick={() => {
            bulkUpdate(selectedIds, { condition: c });
            toast.success(`Set condition ${c}`);
          }}
        >
          {c}
        </Button>
      ))}

      <Button
        size="sm"
        variant="outline"
        disabled={!selectedIds.length}
        onClick={() => bulkAdjustQty(selectedIds, 1)}
      >
        +1 qty
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!selectedIds.length}
        onClick={() => bulkAdjustQty(selectedIds, -1)}
      >
        −1 qty
      </Button>

      <select
        className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
        defaultValue=""
        disabled={!selectedIds.length}
        onChange={(e) => {
          if (!e.target.value) return;
          bulkUpdate(selectedIds, { addListId: e.target.value });
          toast.success("Added to list");
          e.target.value = "";
        }}
        aria-label="Add to list"
      >
        <option value="">+ List…</option>
        {lists.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>

      <Input
        className="h-8 w-28"
        placeholder="Tag"
        value={tag}
        onChange={(e) => setTag(e.target.value)}
      />
      <Button
        size="sm"
        variant="outline"
        disabled={!selectedIds.length || !tag.trim()}
        onClick={() => {
          bulkUpdate(selectedIds, { addTag: tag.trim() });
          setTag("");
          toast.success("Tag added");
        }}
      >
        Tag
      </Button>

      <Input
        className="h-8 w-32"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <Button
        size="sm"
        variant="outline"
        disabled={!selectedIds.length || !location.trim()}
        onClick={() => {
          bulkUpdate(selectedIds, { location: location.trim() });
          setLocation("");
          toast.success("Location set");
        }}
      >
        Locate
      </Button>

      <Button
        size="sm"
        variant="destructive"
        disabled={!selectedIds.length || showcaseLock}
        title={showcaseLock ? "Disabled in showcase mode" : undefined}
        onClick={() => {
          if (showcaseLock) {
            toast.error("Exit showcase to delete");
            return;
          }
          if (confirm(`Remove ${selectedIds.length} cards?`)) {
            bulkRemove(selectedIds);
            toast.success("Removed");
          }
        }}
      >
        Delete
      </Button>
    </div>
  );
}
