"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { InventoryLot } from "@/lib/types/features";
import { SEED_USER_CARDS } from "@/lib/seed/cards";

function seedLots(): InventoryLot[] {
  return SEED_USER_CARDS.filter((uc) => uc.purchasePrice != null)
    .slice(0, 8)
    .map((uc) => ({
      id: `lot-${uc.id}`,
      userCardId: uc.id,
      quantity: uc.quantity,
      remaining: uc.quantity,
      unitCost: uc.purchasePrice ?? 0,
      fees: uc.purchasePrice && uc.purchasePrice > 50 ? 5 : 0,
      purchasedAt: uc.purchaseDate ?? "2024-01-01",
      notes: uc.notes,
    }));
}

interface LotsState {
  lots: InventoryLot[];
  addLot: (input: Omit<InventoryLot, "id" | "remaining"> & { remaining?: number }) => string;
  removeLot: (id: string) => void;
  lotsForCard: (userCardId: string) => InventoryLot[];
  costBasisForCard: (userCardId: string) => number;
  totalLotCost: () => number;
}

export const useLotsStore = create<LotsState>()(
  persist(
    (set, get) => ({
      lots: seedLots(),

      addLot: (input) => {
        const id = nanoid();
        const lot: InventoryLot = {
          ...input,
          id,
          remaining: input.remaining ?? input.quantity,
        };
        set((s) => ({ lots: [...s.lots, lot] }));
        return id;
      },

      removeLot: (id) =>
        set((s) => ({ lots: s.lots.filter((l) => l.id !== id) })),

      lotsForCard: (userCardId) =>
        get().lots.filter((l) => l.userCardId === userCardId),

      costBasisForCard: (userCardId) =>
        get()
          .lots.filter((l) => l.userCardId === userCardId)
          .reduce((s, l) => s + l.remaining * l.unitCost + l.fees, 0),

      totalLotCost: () =>
        get().lots.reduce(
          (s, l) => s + l.remaining * l.unitCost + l.fees,
          0
        ),
    }),
    { name: "neurabinder-lots" }
  )
);
