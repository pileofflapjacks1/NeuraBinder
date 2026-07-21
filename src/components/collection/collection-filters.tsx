"use client";

import { useBciStore } from "@/lib/stores/bci-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { CardCondition, CollectionSortField, Rarity, TcgGame } from "@/lib/types";
import { cn } from "@/lib/utils";

const CONDITIONS: CardCondition[] = ["NM", "LP", "MP", "HP", "DMG"];
const RARITIES: { value: Rarity; label: string }[] = [
  { value: "illustration_rare", label: "IR" },
  { value: "special_illustration_rare", label: "SIR" },
  { value: "double_rare", label: "ex/DR" },
  { value: "enchanted", label: "Enchanted" },
  { value: "legendary", label: "Legendary" },
  { value: "common", label: "Common" },
];

const SORTS: { field: CollectionSortField; label: string }[] = [
  { field: "value", label: "Value" },
  { field: "name", label: "Name" },
  { field: "set", label: "Set" },
  { field: "gain", label: "Gain" },
  { field: "updatedAt", label: "Recent" },
];

const QUICK_VIEWS = [
  { label: "All", filters: { game: "all" as const } },
  { label: "Pokémon", filters: { game: "pokemon" as TcgGame } },
  { label: "Lorcana", filters: { game: "lorcana" as TcgGame } },
  { label: "Graded", filters: { gradedOnly: true } },
  { label: "IRs", filters: { rarities: ["illustration_rare"] as Rarity[] } },
  {
    label: "SIRs",
    filters: { rarities: ["special_illustration_rare"] as Rarity[] },
  },
  { label: "Trade", filters: { listId: "list-trade" } },
  { label: "Under $40", filters: { maxValue: 40 } },
  {
    label: "151 progress",
    filters: { setIds: ["sv3pt5"], missingForMasterSet: "sv3pt5" },
  },
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
  // getSets() must not run inside the zustand selector (new array → infinite loop)
  const sets = getSets();
  void catalog;
  const lists = useCollectionStore((s) => s.lists);

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
      aria-label="Collection filters"
    >
      <div className="flex items-center justify-between">
        <h2 className={cn("font-semibold", bciMode ? "text-lg" : "text-sm")}>
          Filters
        </h2>
        <Button variant="ghost" size={bciMode ? "default" : "sm"} onClick={resetFilters}>
          Reset
        </Button>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-muted-foreground">
          Quick views
        </label>
        <div className="flex flex-wrap gap-2">
          {QUICK_VIEWS.map((v) => (
            <Button
              key={v.label}
              variant="outline"
              size={bciMode ? "bci" : "sm"}
              className={cn(bciMode && "h-12 px-4")}
              onClick={() => {
                resetFilters();
                setFilters(v.filters);
              }}
            >
              {v.label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="filter-search"
          className="mb-2 block text-xs font-medium text-muted-foreground"
        >
          Fuzzy search
        </label>
        <Input
          id="filter-search"
          bci={bciMode}
          placeholder="Name, set, tags, location…"
          value={filters.query ?? ""}
          onChange={(e) =>
            setFilters({ query: e.target.value || undefined })
          }
        />
      </div>

      <div>
        <label
          htmlFor="filter-location"
          className="mb-2 block text-xs font-medium text-muted-foreground"
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

      <div>
        <label
          htmlFor="filter-tag"
          className="mb-2 block text-xs font-medium text-muted-foreground"
        >
          Tag
        </label>
        <Input
          id="filter-tag"
          bci={bciMode}
          placeholder="e.g. grail"
          value={filters.tags?.[0] ?? ""}
          onChange={(e) =>
            setFilters({
              tags: e.target.value ? [e.target.value] : undefined,
            })
          }
        />
      </div>

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
              {s.name} ({s.code})
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
            "w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
                  "rounded-xl border px-3 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  bciMode ? "h-12 min-w-[3rem] text-base" : "h-9 text-sm",
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
                  "rounded-xl border px-3 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  bciMode ? "h-12 text-base" : "h-9 text-sm",
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

      <div className="flex items-center gap-3">
        <input
          id="graded-only"
          type="checkbox"
          className="h-5 w-5 rounded border-border"
          checked={!!filters.gradedOnly}
          onChange={(e) =>
            setFilters({ gradedOnly: e.target.checked || undefined })
          }
        />
        <label htmlFor="graded-only" className={cn(bciMode ? "text-base" : "text-sm")}>
          Graded only
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label
            htmlFor="min-val"
            className="mb-1 block text-xs text-muted-foreground"
          >
            Min $
          </label>
          <Input
            id="min-val"
            bci={bciMode}
            type="number"
            min={0}
            placeholder="0"
            value={filters.minValue ?? ""}
            onChange={(e) =>
              setFilters({
                minValue: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              })
            }
          />
        </div>
        <div>
          <label
            htmlFor="max-val"
            className="mb-1 block text-xs text-muted-foreground"
          >
            Max $
          </label>
          <Input
            id="max-val"
            bci={bciMode}
            type="number"
            min={0}
            placeholder="∞"
            value={filters.maxValue ?? ""}
            onChange={(e) =>
              setFilters({
                maxValue: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              })
            }
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Sort</p>
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

      {/* Active chips */}
      <div className="flex flex-wrap gap-1.5">
        {filters.game && filters.game !== "all" && (
          <Badge>{filters.game}</Badge>
        )}
        {filters.gradedOnly && <Badge>graded</Badge>}
        {filters.maxValue != null && <Badge>≤ ${filters.maxValue}</Badge>}
        {filters.missingForMasterSet && (
          <Badge variant="warning">master set gaps</Badge>
        )}
      </div>
    </aside>
  );
}
