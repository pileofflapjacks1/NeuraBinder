"use client";

import { useEffect, useState } from "react";
import {
  collectionToBlob,
  useProfileStore,
  type HouseholdProfile,
} from "@/lib/stores/profile-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { useBciStore } from "@/lib/stores/bci-store";
import { useShowcaseStore } from "@/lib/stores/showcase-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Users } from "lucide-react";

const ACCENT: Record<HouseholdProfile["accent"], string> = {
  violet: "bg-violet-500",
  cyan: "bg-cyan-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  emerald: "bg-emerald-500",
};

function applyBlobToCollection(blob: ReturnType<typeof collectionToBlob>) {
  useCollectionStore.setState({
    userCards: blob.userCards,
    lists: blob.lists,
    wantCardIds: blob.wantCardIds,
    catalog: blob.catalog?.length
      ? blob.catalog
      : useCollectionStore.getState().catalog,
    marketRefreshedAt: blob.marketRefreshedAt,
    selectedId: null,
    selectedIds: [],
    bulkMode: false,
  });
}

/** Migrate legacy single collection → active profile once; hydrate active blob */
export function ProfileBootstrap() {
  useEffect(() => {
    const t = window.setTimeout(() => {
      const ps = useProfileStore.getState();
      const col = useCollectionStore.getState();
      if (!ps.migrated) {
        ps.saveActiveFromCollection(collectionToBlob(col));
        useProfileStore.setState({ migrated: true });
        return;
      }
      applyBlobToCollection(ps.loadBlobForActive());
    }, 50);
    return () => window.clearTimeout(t);
  }, []);

  // Debounced autosave active profile binder
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = useCollectionStore.subscribe(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const ps = useProfileStore.getState();
        if (useShowcaseStore.getState().enabled) return;
        ps.saveActiveFromCollection(
          collectionToBlob(useCollectionStore.getState())
        );
      }, 400);
    });
    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return null;
}

export function ProfileSwitcher({ compact }: { compact?: boolean }) {
  const bciMode = useBciStore((s) => s.bciMode);
  const showcase = useShowcaseStore((s) => s.enabled);
  const profiles = useProfileStore((s) => s.profiles);
  const activeId = useProfileStore((s) => s.activeId);
  const setActiveId = useProfileStore((s) => s.setActiveId);
  const saveActiveFromCollection = useProfileStore(
    (s) => s.saveActiveFromCollection
  );
  const ensureSeedForProfile = useProfileStore((s) => s.ensureSeedForProfile);
  const [open, setOpen] = useState(false);

  const active = profiles.find((p) => p.id === activeId) ?? profiles[0];

  const switchTo = (id: string) => {
    if (id === activeId) {
      setOpen(false);
      return;
    }
    if (showcase) {
      toast.error("Exit showcase mode to switch household profiles");
      return;
    }
    // Persist current binder
    const col = useCollectionStore.getState();
    saveActiveFromCollection(collectionToBlob(col));
    setActiveId(id);
    const blob = ensureSeedForProfile(id);
    applyBlobToCollection(blob);
    setOpen(false);
    const name = useProfileStore.getState().profiles.find((p) => p.id === id)
      ?.name;
    toast.success(`Switched to ${name ?? "profile"}`);
  };

  if (compact) {
    return (
      <div className="relative">
        <Button
          variant="outline"
          size={bciMode ? "bci" : "sm"}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={`Profile: ${active?.name}`}
        >
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              ACCENT[active?.accent ?? "violet"]
            )}
          />
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline max-w-[6rem] truncate">
            {active?.name}
          </span>
        </Button>
        {open && (
          <ul
            className="absolute right-0 z-50 mt-1 min-w-[10rem] rounded-xl border border-border bg-card p-1 shadow-xl"
            role="listbox"
          >
            {profiles.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={p.id === activeId}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent",
                    p.id === activeId && "bg-accent"
                  )}
                  onClick={() => switchTo(p.id)}
                >
                  <span
                    className={cn("h-2.5 w-2.5 rounded-full", ACCENT[p.accent])}
                  />
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {profiles.map((p) => (
        <Button
          key={p.id}
          size={bciMode ? "bci" : "default"}
          variant={p.id === activeId ? "default" : "outline"}
          onClick={() => switchTo(p.id)}
        >
          <span className={cn("h-2.5 w-2.5 rounded-full", ACCENT[p.accent])} />
          {p.name}
        </Button>
      ))}
    </div>
  );
}
