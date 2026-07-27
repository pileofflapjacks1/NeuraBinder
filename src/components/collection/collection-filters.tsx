"use client";

import { useState } from "react";
import { useBciStore } from "@/lib/stores/bci-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { CardCondition, CollectionSortField, Rarity, TcgGame } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

const CONDITIONS: CardCondition[] = ["NM", "LP", "MP", "HP", "DMG"];
const RARITIES: { value: Rarity; label: string }[] = [
  { value: "illustration_rare", label: "IR" },
  { value: "special_illustration_rare", label: "SIR" },
  { value: "double_rare", label: "ex" },
  { value: "enchanted", label: "Enchanted" },
  { value: "common", label: "Common" },
];

const SORTS: { field: CollectionSortField; label: string }[] = [
  { field: "value", label: "Value" },
  { field: "name", label: "Name" },
  { field: "set", label: "Set" },
  { field: "gain", label: "Gain" },
];

const QUICK = [
  { label: "All", filters: { game: "all" as const } },
  { label: "Pokémon", filters: { game: "pokemon" as TcgGame } },
  { label: "Lorcana", filters: { game: "lorcana" as TcgGame } },
  { label: "Graded", filters: { gradedOnly: true } },
  { label: "Under $40", filters: { maxValue: 40 } },
];

export function CollectionFilters() {
  const bciMode = useBciStore((s) => s.bciMode);
  const filters = useCollectionStore((s) => s.filters);
  const sort = useCollectionStore((s) => s.sort);
  const setFilters = useCollectionStore((s) => s.setFilters);
  const resetFilters = useCollectionStore((s) => s.resetFilters);
  const setSort = useCollectionStore((s) => s.setSort);
  const catalog = useCollectionStore((s) => s.catalog);
  const getSets = useCollectionStore((s) => s.getSets);
  const sets = getSets();
  void catalog;
  const lists = useCollectionStore((s) => s.lists);
  const [advanced, setAdvanced] = useState(false);

  const toggleCondition = (c: CardCondition) => {
    const cur = filters.conditions ?? [];
    const next = cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c];
    setFilters({ conditions: next.length ? next : undefined });
  };

  const toggleRarity = (r: Rarity) => {
    const cur = filters.rarities ?? [];
    const next = cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r];
    setFilters({ rarities: next.length ? next : undefined });
  };

  return (
    <aside
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-card p-4",
        bciMode && "gap-5 p-5"
      )}
      aria-label="Find cards"
    >
      <div>
        <label
          htmlFor="filter-search"
          className="mb-2 block text-sm font-medium"
        >
          Search
        </label>
        <Input
          id="filter-search"
          bci={bciMode}
          placeholder="Type a card name…"
          value={filters.query ?? ""}
          onChange={(e) =>
            setFilters({ query: e.target.value || undefined })
          }
          autoComplete="off"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Quick filters</p>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((v) => (
            <Button
              key={v.label}
              variant="outline"
              size={bciMode ? "default" : "sm"}
              onClick={() => {
                resetFilters();
                setFilters(v.filters);
              }}
            >
              {v.label}
            </Button>
          ))}
          <Button
            variant="ghost"
            size={bciMode ? "default" : "sm"}
            onClick={resetFilters}
          >
            Clear
          </Button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Sort by</p>
        <div className="flex flex-wrap gap-2">
          {SORTS.map((s) => {
            const on = sort.field === s.field;
            return (
              <Button
                key={s.field}
                variant={on ? "default" : "outline"}
                size={bciMode ? "default" : "sm"}
                onClick={() =>
                  setSort({
                    field: s.field,
                    direction:
                      on && sort.direction === "desc" ? "asc" : "desc",
                  })
                }
              >
                {s.label}
                {on ? (sort.direction === "desc" ? " ↓" : " ↑") : ""}
              </Button>
            );
          })}
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="justify-between"
        onClick={() => setAdvanced((v) => !v)}
        aria-expanded={advanced}
      >
        More filters
        {advanced ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {advanced && (
        <div className="space-y-4 border-t border-border pt-4">
          <div>
            <label
              htmlFor="filter-set"
              className="mb-2 block text-xs font-medium text-muted-foreground"
            >
              Set
            </label>
            <select
              id="filter-set"
              className={cn(
                "w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                bciMode ? "h-14 text-base" : "h-10"
              )}
              value={filters.setIds?.[0] ?? ""}
              onChange={(e) =>
                setFilters({
                  setIds: e.target.value ? [e.target.value] : undefined,
                })
              }
            >
              <option value="">All sets</option>
              {sets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-list"
              className="mb-2 block text-xs font-medium text-muted-foreground"
            >
              List
            </label>
            <select
              id="filter-list"
              className={cn(
                "w-full rounded-xl border border-input bg-background px-3 text-sm",
                bciMode ? "h-14 text-base" : "h-10"
              )}
              value={filters.listId ?? ""}
              onChange={(e) =>
                setFilters({ listId: e.target.value || undefined })
              }
            >
              <option value="">All lists</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Condition
            </p>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((c) => {
                const on = filters.conditions?.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCondition(c)}
                    className={cn(
                      "rounded-xl border px-3 font-medium",
                      bciMode ? "h-12 min-w-[3rem]" : "h-9 text-sm",
                      on
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border hover:bg-accent"
                    )}
                    aria-pressed={on}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Rarity
            </p>
            <div className="flex flex-wrap gap-2">
              {RARITIES.map((r) => {
                const on = filters.rarities?.includes(r.value);
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => toggleRarity(r.value)}
                    className={cn(
                      "rounded-xl border px-3 font-medium",
                      bciMode ? "h-12" : "h-9 text-sm",
                      on
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border hover:bg-accent"
                    )}
                    aria-pressed={on}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="filter-location"
              className="mb-2 block text-xs text-muted-foreground"
            >
              Location
            </label>
            <Input
              id="filter-location"
              bci={bciMode}
              placeholder="e.g. Binder 2"
              value={filters.location ?? ""}
              onChange={(e) =>
                setFilters({ location: e.target.value || undefined })
              }
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {filters.game && filters.game !== "all" && (
          <Badge>{filters.game}</Badge>
        )}
        {filters.gradedOnly && <Badge>graded</Badge>}
        {filters.maxValue != null && <Badge>≤ ${filters.maxValue}</Badge>}
      </div>
    </aside>
  );
}
