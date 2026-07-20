/**
 * Visual binder layout + cheapest path to complete a set.
 */

import type { Card, CollectionItem } from "@/lib/types";
import type { CheapestPathItem } from "@/lib/types/features";
import { getMissingCards } from "./query";

export const BINDER_PAGE_SIZE = 9; // 3×3 pocket page — stable spatial memory

export interface BinderSlot {
  index: number; // 0..pageSize-1
  card?: Card;
  owned: boolean;
  quantity: number;
  value: number;
}

export interface BinderPage {
  page: number; // 1-based
  slots: BinderSlot[];
}

export function buildBinderPages(
  setCards: Card[],
  items: CollectionItem[],
  pageSize = BINDER_PAGE_SIZE
): BinderPage[] {
  const owned = new Map<string, CollectionItem[]>();
  for (const i of items) {
    const list = owned.get(i.cardId) ?? [];
    list.push(i);
    owned.set(i.cardId, list);
  }

  const sorted = [...setCards].sort((a, b) =>
    a.number.localeCompare(b.number, undefined, { numeric: true })
  );

  const pages: BinderPage[] = [];
  for (let i = 0; i < sorted.length; i += pageSize) {
    const slice = sorted.slice(i, i + pageSize);
    const slots: BinderSlot[] = [];
    for (let s = 0; s < pageSize; s++) {
      const card = slice[s];
      if (!card) {
        slots.push({ index: s, owned: false, quantity: 0, value: 0 });
        continue;
      }
      const hits = owned.get(card.id) ?? [];
      const quantity = hits.reduce((n, h) => n + h.quantity, 0);
      const value = hits.reduce((n, h) => n + h.totalValue, 0);
      slots.push({
        index: s,
        card,
        owned: quantity > 0,
        quantity,
        value,
      });
    }
    pages.push({ page: pages.length + 1, slots });
  }
  return pages;
}

export function cheapestPathToComplete(
  catalog: Card[],
  items: CollectionItem[],
  setId: string
): { items: CheapestPathItem[]; total: number } {
  const missing = getMissingCards(catalog, items, setId);
  const sorted = [...missing].sort(
    (a, b) => (a.marketPrice ?? 0) - (b.marketPrice ?? 0)
  );
  let cumulative = 0;
  const path: CheapestPathItem[] = sorted.map((card) => {
    const marketPrice = card.marketPrice ?? 0;
    cumulative += marketPrice;
    return { card, marketPrice, cumulative };
  });
  return { items: path, total: cumulative };
}
