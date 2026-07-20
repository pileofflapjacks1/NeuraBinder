/**
 * Fuzzy search over collection items and catalog (Fuse.js).
 */

import Fuse from "fuse.js";
import type { Card, CollectionItem } from "@/lib/types";

export function fuzzyFilterItems(
  items: CollectionItem[],
  query: string
): CollectionItem[] {
  const q = query.trim();
  if (!q) return items;
  // Short exact-ish token path for speed
  if (q.length < 2) {
    const lower = q.toLowerCase();
    return items.filter((i) => i.card.name.toLowerCase().includes(lower));
  }

  const fuse = new Fuse(items, {
    keys: [
      { name: "card.name", weight: 0.4 },
      { name: "card.searchText", weight: 0.25 },
      { name: "card.setName", weight: 0.1 },
      { name: "notes", weight: 0.08 },
      { name: "location", weight: 0.07 },
      { name: "tags", weight: 0.05 },
      { name: "condition", weight: 0.025 },
      { name: "variant", weight: 0.025 },
    ],
    threshold: 0.38,
    ignoreLocation: true,
    includeScore: true,
  });

  return fuse.search(q).map((r) => r.item);
}

export function fuzzySearchCatalog(catalog: Card[], query: string, limit = 20): Card[] {
  const q = query.trim();
  if (!q) return catalog.slice(0, limit);
  const fuse = new Fuse(catalog, {
    keys: [
      { name: "name", weight: 0.5 },
      { name: "searchText", weight: 0.3 },
      { name: "setName", weight: 0.1 },
      { name: "number", weight: 0.1 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
  });
  return fuse.search(q).slice(0, limit).map((r) => r.item);
}
