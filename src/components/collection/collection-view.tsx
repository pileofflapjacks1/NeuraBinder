"use client";

import { useEffect, useMemo, useRef } from "react";
import { useBciStore } from "@/lib/stores/bci-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { CollectionFilters } from "@/components/collection/collection-filters";
import { CardTile } from "@/components/collection/card-tile";
import { CardDetailPanel } from "@/components/collection/card-detail-panel";
import { SetProgressBar } from "@/components/collection/set-progress";
import { formatCurrency, cn } from "@/lib/utils";
import { getBciAdapter } from "@/lib/bci/adapter";
import { Badge } from "@/components/ui/badge";

export function CollectionView() {
  const bciMode = useBciStore((s) => s.bciMode);
  const focusIndex = useBciStore((s) => s.focusIndex);
  const setFocusIndex = useBciStore((s) => s.setFocusIndex);
  const moveFocus = useBciStore((s) => s.moveFocus);

  const filters = useCollectionStore((s) => s.filters);
  const selectedId = useCollectionStore((s) => s.selectedId);
  const selectItem = useCollectionStore((s) => s.selectItem);
  const getFiltered = useCollectionStore((s) => s.getFiltered);
  const getItems = useCollectionStore((s) => s.getItems);
  const getMissingForSet = useCollectionStore((s) => s.getMissingForSet);
  const catalog = useCollectionStore((s) => s.catalog);
  const userCards = useCollectionStore((s) => s.userCards);

  // Re-subscribe when underlying data changes
  const items = useMemo(
    () => getFiltered(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getFiltered, userCards, filters, catalog]
  );

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return getItems().find((i) => i.id === selectedId) ?? null;
  }, [selectedId, getItems, userCards]);

  const missing =
    filters.missingForMasterSet
      ? getMissingForSet(filters.missingForMasterSet)
      : [];

  const totalValue = items.reduce((s, i) => s + i.totalValue, 0);
  const gridRef = useRef<HTMLDivElement>(null);

  // BCI discrete navigation within collection grid
  useEffect(() => {
    if (!bciMode) return;
    const adapter = getBciAdapter();
    return adapter.onIntent((intent) => {
      if (intent === "next") moveFocus(1, items.length || 1);
      if (intent === "prev") moveFocus(-1, items.length || 1);
      if (intent === "select" || intent === "confirm") {
        const item = items[focusIndex];
        if (item) selectItem(item.id);
      }
      if (intent === "back" || intent === "cancel") {
        selectItem(null);
      }
    });
  }, [bciMode, items, focusIndex, moveFocus, selectItem]);

  // Keep focused tile in view
  useEffect(() => {
    if (!bciMode) return;
    const el = gridRef.current?.querySelector(
      `[data-index="${focusIndex}"]`
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusIndex, bciMode]);

  // Clamp focus
  useEffect(() => {
    if (focusIndex >= items.length && items.length > 0) {
      setFocusIndex(items.length - 1);
    }
  }, [items.length, focusIndex, setFocusIndex]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className={cn(
              "font-bold tracking-tight",
              bciMode ? "text-3xl" : "text-2xl"
            )}
          >
            Collection
          </h1>
          <p className="text-sm text-muted-foreground">
            {items.length} shown · {formatCurrency(totalValue)} filtered value
          </p>
        </div>
        {filters.missingForMasterSet && (
          <Badge variant="warning" className="text-sm">
            Master set mode · {missing.length} missing in catalog sample
          </Badge>
        )}
      </div>

      {filters.setIds?.[0] && (
        <SetProgressBar setId={filters.setIds[0]} />
      )}
      {filters.missingForMasterSet && !filters.setIds?.[0] && (
        <SetProgressBar setId={filters.missingForMasterSet} />
      )}

      <div
        className={cn(
          "grid gap-4",
          selected
            ? "lg:grid-cols-[240px_1fr_320px] xl:grid-cols-[260px_1fr_360px]"
            : "lg:grid-cols-[240px_1fr] xl:grid-cols-[280px_1fr]"
        )}
      >
        <div className="lg:sticky lg:top-36 lg:self-start">
          <CollectionFilters />
        </div>

        <div>
          {missing.length > 0 && filters.missingForMasterSet && (
            <section
              className="mb-4 rounded-2xl border border-warning/40 bg-warning/5 p-4"
              aria-label="Missing cards"
            >
              <h2 className="mb-2 font-semibold">Missing for master set</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {missing.map((c) => (
                  <li
                    key={c.id}
                    className={cn(
                      "rounded-xl border border-border bg-card px-3",
                      bciMode ? "py-3 text-base" : "py-2 text-sm"
                    )}
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · #{c.number} · {formatCurrency(c.marketPrice)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {items.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-lg font-medium">No cards match</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Reset filters or try a natural language query in the command bar.
              </p>
            </div>
          ) : (
            <div
              ref={gridRef}
              className={cn(
                "grid gap-3",
                // BCI: fewer columns, larger targets, consistent spatial grid
                bciMode
                  ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                  : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
              )}
              role="listbox"
              aria-label="Collection cards"
              aria-activedescendant={
                items[focusIndex] ? `card-${items[focusIndex].id}` : undefined
              }
            >
              {items.map((item, index) => (
                <div key={item.id} id={`card-${item.id}`} role="option" aria-selected={selectedId === item.id}>
                  <CardTile
                    item={item}
                    index={index}
                    selected={selectedId === item.id}
                    focused={bciMode && focusIndex === index}
                    onSelect={(id) => {
                      setFocusIndex(index);
                      selectItem(id);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="lg:sticky lg:top-36 lg:self-start lg:max-h-[calc(100vh-10rem)]">
            <CardDetailPanel
              item={selected}
              onClose={() => selectItem(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
