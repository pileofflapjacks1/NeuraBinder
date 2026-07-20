"use client";

import { useEffect } from "react";
import { Redo2, Undo2 } from "lucide-react";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { useHistoryStore } from "@/lib/stores/history-store";
import { useBciStore } from "@/lib/stores/bci-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function HistoryControls() {
  const bciMode = useBciStore((s) => s.bciMode);
  const undo = useCollectionStore((s) => s.undo);
  const redo = useCollectionStore((s) => s.redo);
  const pastLen = useHistoryStore((s) => s.past.length);
  const futureLen = useHistoryStore((s) => s.future.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable)
        return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (undo()) toast.message("Undo");
      }
      if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        if (redo()) toast.message("Redo");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  return (
    <div className="flex items-center gap-1">
      <Button
        size={bciMode ? "icon-bci" : "icon"}
        variant="outline"
        disabled={pastLen === 0}
        onClick={() => {
          if (undo()) toast.message("Undo");
        }}
        aria-label="Undo"
        title="Undo (⌘Z)"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        size={bciMode ? "icon-bci" : "icon"}
        variant="outline"
        disabled={futureLen === 0}
        onClick={() => {
          if (redo()) toast.message("Redo");
        }}
        aria-label="Redo"
        title="Redo (⌘⇧Z)"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
