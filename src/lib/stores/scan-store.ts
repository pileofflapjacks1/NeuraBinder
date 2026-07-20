"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Card, ScanCandidate } from "@/lib/types";
import type { PendingScanItem } from "@/lib/types/features";

function mockCandidates(catalog: Card[], aggressive: boolean): ScanCandidate[] {
  const pool = [...catalog].sort(() => Math.random() - 0.5).slice(0, 5);
  const top = pool.slice(0, 3);
  return top.map((card, i) => ({
    cardId: card.id,
    card,
    confidence: Math.round((0.94 - i * (aggressive ? 0.08 : 0.12)) * 100) / 100,
    suggestedCondition: i === 0 ? "NM" : "LP",
    suggestedVariant: card.rarity.includes("illustration")
      ? (card.rarity as ScanCandidate["suggestedVariant"])
      : card.rarity === "enchanted"
        ? "enchanted"
        : "normal",
  }));
}

interface ScanState {
  queue: PendingScanItem[];
  activeId: string | null;

  enqueueSimulated: (catalog: Card[], aggressive?: boolean) => string;
  setActive: (id: string | null) => void;
  selectCandidate: (id: string, index: number) => void;
  confirm: (id: string) => PendingScanItem | null;
  reject: (id: string) => void;
  clearDone: () => void;
  pendingCount: () => number;
}

export const useScanStore = create<ScanState>()(
  persist(
    (set, get) => ({
      queue: [],
      activeId: null,

      enqueueSimulated: (catalog, aggressive = true) => {
        const id = nanoid();
        const item: PendingScanItem = {
          id,
          createdAt: new Date().toISOString(),
          status: "pending",
          candidates: mockCandidates(catalog, aggressive),
          selectedIndex: 0,
        };
        set((s) => ({
          queue: [item, ...s.queue].slice(0, 40),
          activeId: s.activeId ?? id,
        }));
        return id;
      },

      setActive: (id) => set({ activeId: id }),

      selectCandidate: (id, index) =>
        set((s) => ({
          queue: s.queue.map((q) =>
            q.id === id ? { ...q, selectedIndex: index } : q
          ),
        })),

      confirm: (id) => {
        let found: PendingScanItem | null = null;
        set((s) => {
          const queue = s.queue.map((q) => {
            if (q.id !== id) return q;
            found = { ...q, status: "confirmed" as const };
            return found;
          });
          const nextPending = queue.find((q) => q.status === "pending");
          return {
            queue,
            activeId: nextPending?.id ?? null,
          };
        });
        return found;
      },

      reject: (id) =>
        set((s) => {
          const queue = s.queue.map((q) =>
            q.id === id ? { ...q, status: "rejected" as const } : q
          );
          const nextPending = queue.find((q) => q.status === "pending");
          return {
            queue,
            activeId: nextPending?.id ?? null,
          };
        }),

      clearDone: () =>
        set((s) => ({
          queue: s.queue.filter((q) => q.status === "pending"),
        })),

      pendingCount: () =>
        get().queue.filter((q) => q.status === "pending").length,
    }),
    {
      name: "neurabinder-scans",
      partialize: (s) => ({ queue: s.queue.slice(0, 20) }),
    }
  )
);
