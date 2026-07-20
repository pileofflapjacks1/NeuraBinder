"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { PortfolioSnapshot } from "@/lib/types/features";

interface SnapshotsState {
  snapshots: PortfolioSnapshot[];
  addSnapshot: (
    data: Omit<PortfolioSnapshot, "id" | "at"> & { at?: string }
  ) => string;
  clear: () => void;
  setAll: (s: PortfolioSnapshot[]) => void;
}

export const useSnapshotsStore = create<SnapshotsState>()(
  persist(
    (set) => ({
      snapshots: [],

      addSnapshot: (data) => {
        const id = nanoid();
        const snap: PortfolioSnapshot = {
          id,
          at: data.at ?? new Date().toISOString(),
          totalValue: data.totalValue,
          totalCost: data.totalCost,
          cardCount: data.cardCount,
          uniqueCount: data.uniqueCount,
          source: data.source,
        };
        set((s) => {
          // Dedupe same-minute snapshots
          const key = snap.at.slice(0, 16);
          const filtered = s.snapshots.filter((x) => x.at.slice(0, 16) !== key);
          return {
            snapshots: [...filtered, snap]
              .sort((a, b) => a.at.localeCompare(b.at))
              .slice(-120),
          };
        });
        return id;
      },

      clear: () => set({ snapshots: [] }),
      setAll: (snapshots) => set({ snapshots }),
    }),
    { name: "neurabinder-snapshots" }
  )
);
