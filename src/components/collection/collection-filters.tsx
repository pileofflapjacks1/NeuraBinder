"use client";

import { useState } from "react";
import { useBciStore } from "@/lib/stores/bci-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { CardCondition, CollectionSortField, Rarity, TcgGame } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";

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

/** Horizontal filter bar — Collectr-style, sits above the card grid */
export function CollectionFilters() {
  const bciMode = useBciStore((s) => s.bciMode);
  const filters = useCollectionStore((s) => s.filters);
  const sort = useCollectionStore((s) => s.sort);
  const setFilters = useCollectionStore((s) => s.setFilters);
  const resetFilters = useCollectionStore((s) => s.resetFilters);
  const setSort = useCollectionStore((s) => s.setSort);
  const getSets = useCollectionStore((s) => s.getSets);
  const sets = getSets();
  const lists = useCollectionStore((s) => s.lists);
  const [advanced, setAdvanced] = useState(false);

  const hasActive =
    Boolean(filters.query) ||
    (filters.game && filters.game !== "all") ||
    Boolean(filters.gradedOnly) ||
    filters.maxValue != null ||
    Boolean(filters.setIds?.length) ||
    Boolean(filters.listId) ||
    Boolean(filters.conditions?.length) ||
    Boolean(filters.rarities?.length) ||
    Boolean(filters.location);

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
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card/80 p-3 backdrop-blur sm:p-3.5",
        bciMode && "p-4"
      )}
      aria-label="Find cards"
    >
      {/* Search */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id="filter-search"
          bci={bciMode}
          placeholder="Search your cards…"
          value={filters.query ?? ""}
          onChange={(e) => setFilters({ query: e.target.value || undefined })}
          autoComplete="off"
          className="pl-9 pr-9"
          aria-label="Search cards"
        />
        {filters.query && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={() => setFilters({ query: undefined })}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick filters + sort — one wrap row */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {QUICK.map((v) => {
          const active =
            v.label === "All"
              ? !hasActive ||
                (filters.game === "all" &&
                  !filters.gradedOnly &&
                  filters.maxValue == null &&
                  !filters.query)
              : v.label === "Pokémon"
                ? filters.game === "pokemon"
                : v.label === "Lorcana"
                  ? filters.game === "lorcana"
                  : v.label === "Graded"
                    ? Boolean(filters.gradedOnly)
                    : v.label === "Under $40"
                      ? filters.maxValue === 40
                      : false;
          return (
            <Button
              key={v.label}
              variant={active ? "default" : "outline"}
              size={bciMode ? "default" : "sm"}
              className={cn(!bciMode && "h-8 px-2.5 text-xs")}
              onClick={() => {
                if (v.label === "All") {
                  resetFilters();
                  return;
                }
                resetFilters();
                setFilters(v.filters);
              }}
            >
              {v.label}
            </Button>
          );
        })}

        <span className="mx-1 hidden h-5 w-px bg-border sm:inline-block" aria-hidden />

        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Sort
        </span>
        {SORTS.map((s) => {
          const on = sort.field === s.field;
          return (
            <Button
              key={s.field}
              variant={on ? "secondary" : "ghost"}
              size={bciMode ? "default" : "sm"}
              className={cn(!bciMode && "h-8 px-2.5 text-xs")}
              onClick={() =>
                setSort({
                  field: s.field,
                  direction: on && sort.direction === "desc" ? "asc" : "desc",
                })
              }
            >
              {s.label}
              {on ? (sort.direction === "desc" ? " ↓" : " ↑") : ""}
            </Button>
          );
        })}

        <Button
          variant="ghost"
          size={bciMode ? "default" : "sm"}
          className={cn("ml-auto gap-1", !bciMode && "h-8 text-xs")}
          onClick={() => setAdvanced((v) => !v)}
          aria-expanded={advanced}
        >
          More
          {advanced ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>

        {hasActive && (
          <Button
            variant="ghost"
            size={bciMode ? "default" : "sm"}
            className={cn("text-muted-foreground", !bciMode && "h-8 text-xs")}
            onClick={resetFilters}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Active chips */}
      {hasActive && (
        <div className="mt-2 flex flex-wrap gap-1">
          {filters.query && (
            <Badge variant="secondary" className="text-[10px]">
              “{filters.query}”
            </Badge>
          )}
          {filters.game && filters.game !== "all" && (
            <Badge variant="secondary" className="text-[10px]">
              {filters.game}
            </Badge>
          )}
          {filters.gradedOnly && (
            <Badge variant="secondary" className="text-[10px]">
              graded
            </Badge>
          )}
          {filters.maxValue != null && (
            <Badge variant="secondary" className="text-[10px]">
              ≤ ${filters.maxValue}
            </Badge>
          )}
          {filters.setIds?.[0] && (
            <Badge variant="secondary" className="text-[10px]">
              set
            </Badge>
          )}
        </div>
      )}

      {advanced && (
        <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="filter-set"
              className="mb-1 block text-[11px] font-medium text-muted-foreground"
            >
              Set
            </label>
            <select
              id="filter-set"
              className={cn(
                "w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                bciMode ? "h-12 text-base" : "h-9"
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
              className="mb-1 block text-[11px] font-medium text-muted-foreground"
            >
              List
            </label>
            <select
              id="filter-list"
              className={cn(
                "w-full rounded-xl border border-input bg-background px-3 text-sm",
                bciMode ? "h-12 text-base" : "h-9"
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
            <p className="mb-1 text-[11px] font-medium text-muted-foreground">
              Condition
            </p>
            <div className="flex flex-wrap gap-1">
              {CONDITIONS.map((c) => {
                const on = filters.conditions?.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCondition(c)}
                    className={cn(
                      "rounded-lg border px-2 font-medium",
                      bciMode ? "h-10 min-w-[2.5rem] text-sm" : "h-8 text-xs",
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
            <p className="mb-1 text-[11px] font-medium text-muted-foreground">
              Rarity
            </p>
            <div className="flex flex-wrap gap-1">
              {RARITIES.map((r) => {
                const on = filters.rarities?.includes(r.value);
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => toggleRarity(r.value)}
                    className={cn(
                      "rounded-lg border px-2 font-medium",
                      bciMode ? "h-10 text-sm" : "h-8 text-xs",
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

          <div className="sm:col-span-2 lg:col-span-4">
            <label
              htmlFor="filter-location"
              className="mb-1 block text-[11px] font-medium text-muted-foreground"
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
              className="max-w-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
