"use client";

import { useState } from "react";
import { useViewsStore } from "@/lib/stores/views-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { useBciStore } from "@/lib/stores/bci-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function SavedViewsPanel() {
  const bciMode = useBciStore((s) => s.bciMode);
  const views = useViewsStore((s) => s.views);
  const saveView = useViewsStore((s) => s.saveView);
  const removeView = useViewsStore((s) => s.removeView);
  const filters = useCollectionStore((s) => s.filters);
  const sort = useCollectionStore((s) => s.sort);
  const setFilters = useCollectionStore((s) => s.setFilters);
  const resetFilters = useCollectionStore((s) => s.resetFilters);
  const setSort = useCollectionStore((s) => s.setSort);
  const [name, setName] = useState("");

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Saved views</p>
      <div className="flex flex-wrap gap-2">
        {views.map((v) => (
          <div key={v.id} className="flex items-center gap-1">
            <Button
              size={bciMode ? "default" : "sm"}
              variant="secondary"
              onClick={() => {
                resetFilters();
                setFilters(v.filters);
                setSort(v.sort);
                toast.message(`View: ${v.name}`);
              }}
            >
              {v.name}
            </Button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-destructive"
              aria-label={`Delete view ${v.name}`}
              onClick={() => removeView(v.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          bci={bciMode}
          placeholder="Name this view…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={cn(!bciMode && "h-8 text-sm")}
        />
        <Button
          size={bciMode ? "default" : "sm"}
          disabled={!name.trim()}
          onClick={() => {
            saveView(name.trim(), filters, sort);
            setName("");
            toast.success("View saved");
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
