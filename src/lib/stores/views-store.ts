"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { CollectionFilters, CollectionSort } from "@/lib/types";
import type { SavedViewLocal } from "@/lib/types/features";

interface ViewsState {
  views: SavedViewLocal[];
  saveView: (
    name: string,
    filters: CollectionFilters,
    sort: CollectionSort
  ) => string;
  removeView: (id: string) => void;
  renameView: (id: string, name: string) => void;
  setAll: (views: SavedViewLocal[]) => void;
}

const SEED_VIEWS: SavedViewLocal[] = [
  {
    id: "view-irs-under-40",
    name: "IRs under $40",
    filters: {
      rarities: ["illustration_rare"],
      maxValue: 40,
      game: "all",
    },
    sort: { field: "value", direction: "desc" },
    createdAt: new Date().toISOString(),
  },
  {
    id: "view-graded",
    name: "Graded only",
    filters: { gradedOnly: true, game: "all" },
    sort: { field: "value", direction: "desc" },
    createdAt: new Date().toISOString(),
  },
  {
    id: "view-trade",
    name: "Trade binder",
    filters: { listId: "list-trade", game: "all" },
    sort: { field: "value", direction: "desc" },
    createdAt: new Date().toISOString(),
  },
  {
    id: "view-151",
    name: "151 progress",
    filters: {
      setIds: ["sv3pt5"],
      missingForMasterSet: "sv3pt5",
      game: "all",
    },
    sort: { field: "set", direction: "asc" },
    createdAt: new Date().toISOString(),
  },
];

export const useViewsStore = create<ViewsState>()(
  persist(
    (set) => ({
      views: SEED_VIEWS,

      saveView: (name, filters, sort) => {
        const id = nanoid();
        const view: SavedViewLocal = {
          id,
          name,
          filters: { ...filters },
          sort: { ...sort },
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ views: [...s.views, view] }));
        return id;
      },

      removeView: (id) =>
        set((s) => ({ views: s.views.filter((v) => v.id !== id) })),

      renameView: (id, name) =>
        set((s) => ({
          views: s.views.map((v) => (v.id === id ? { ...v, name } : v)),
        })),

      setAll: (views) => set({ views }),
    }),
    { name: "neurabinder-views" }
  )
);
