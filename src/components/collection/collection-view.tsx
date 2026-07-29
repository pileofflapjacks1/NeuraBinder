"use client";

import { useEffect, useMemo, useState } from "react";
import { useBciStore } from "@/lib/stores/bci-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { CollectionFilters } from "@/components/collection/collection-filters";
import { CardTile } from "@/components/collection/card-tile";
import { CardDetailPanel } from "@/components/collection/card-detail-panel";
import { SetProgressBar } from "@/components/collection/set-progress";
import { BulkBar } from "@/components/collection/bulk-bar";
import { HistoryControls } from "@/components/collection/history-controls";
import { SavedViewsPanel } from "@/components/collection/saved-views";
import { DwellTarget } from "@/components/bci/dwell-target";
import { SwitchScanController } from "@/components/bci/switch-scan";
import { formatCurrency, cn } from "@/lib/utils";
import { getBciAdapter } from "@/lib/bci/adapter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Responsive column counts for a Collectr-style dense grid.
 * Easy mode uses fewer columns (larger targets).
 */
function useGridCols(bciMode: boolean, detailOpen: boolean): number {
  const [width, setWidth] = useState(1024);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Detail panel eats horizontal space on large screens
  const effective = detailOpen && width >= 1024 ? width - 320 : width;

  if (bciMode) {
    if (effective < 480) return 2;
    if (effective < 768) return 3;
    if (effective < 1100) return 3;
    return 4;
  }
  if (effective < 420) return 3;
  if (effective < 640) return 3;
  if (effective < 900) return 4;
  if (effective < 1200) return 5;
  return 6;
}

export function CollectionView() {
  const bciMode = useBciStore((s) => s.bciMode);
  const focusIndex = useBciStore((s) => s.focusIndex);
  const setFocusIndex = useBciStore((s) => s.setFocusIndex);
  const moveFocus = useBciStore((s) => s.moveFocus);
  const [showTools, setShowTools] = useState(false);

  const filters = useCollectionStore((s) => s.filters);
  const selectedId = useCollectionStore((s) => s.selectedId);
  const selectItem = useCollectionStore((s) => s.selectItem);
  const getFiltered = useCollectionStore((s) => s.getFiltered);
  const getItems = useCollectionStore((s) => s.getItems);
  const getMissingForSet = useCollectionStore((s) => s.getMissingForSet);
  const catalog = useCollectionStore((s) => s.catalog);
  const userCards = useCollectionStore((s) => s.userCards);
  const bulkMode = useCollectionStore((s) => s.bulkMode);
  const selectedIds = useCollectionStore((s) => s.selectedIds);
  const toggleBulkId = useCollectionStore((s) => s.toggleBulkId);

  const items = useMemo(
    () => getFiltered(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getFiltered, userCards, filters, catalog]
  );

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return getItems().find((i) => i.id === selectedId) ?? null;
  }, [selectedId, getItems, userCards]);

  const missing = filters.missingForMasterSet
    ? getMissingForSet(filters.missingForMasterSet)
    : [];

  const totalValue = items.reduce((s, i) => s + i.totalValue, 0);
  const cols = useGridCols(bciMode, Boolean(selected && !bulkMode));

  useEffect(() => {
    if (!bciMode) return;
    const adapter = getBciAdapter();
    return adapter.onIntent((intent) => {
      if (intent === "next") moveFocus(1, items.length || 1);
      if (intent === "prev") moveFocus(-1, items.length || 1);
      if (intent === "select" || intent === "confirm") {
        const item = items[focusIndex];
        if (!item) return;
        if (bulkMode) toggleBulkId(item.id);
        else selectItem(item.id);
      }
      if (intent === "back" || intent === "cancel") {
        selectItem(null);
      }
    });
  }, [
    bciMode,
    items,
    focusIndex,
    moveFocus,
    selectItem,
    bulkMode,
    toggleBulkId,
  ]);

  useEffect(() => {
    if (focusIndex >= items.length && items.length > 0) {
      setFocusIndex(items.length - 1);
    }
  }, [items.length, focusIndex, setFocusIndex]);

  // Keep focused card in view (no virtualizer — plain scroll)
  useEffect(() => {
    if (!bciMode || !items.length) return;
    const el = document.getElementById(`card-${items[focusIndex]?.id}`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusIndex, bciMode, items]);

  return (
    <div className="flex flex-col gap-4">
      <SwitchScanController itemCount={items.length} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className={cn(
              "font-bold tracking-tight",
              bciMode ? "text-3xl" : "text-2xl"
            )}
          >
            My cards
          </h1>
          <p className="text-sm text-muted-foreground">
            {items.length === 0
              ? "No cards match — try Clear filters"
              : `${items.length} cards · ${formatCurrency(totalValue)}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size={bciMode ? "default" : "sm"} variant="secondary">
            <Link href="/import">Import</Link>
          </Button>
          <Button asChild size={bciMode ? "default" : "sm"} variant="outline">
            <Link href="/scan">Add photo</Link>
          </Button>
          <Button
            size={bciMode ? "default" : "sm"}
            variant="ghost"
            onClick={() => setShowTools((v) => !v)}
          >
            {showTools ? "Hide tools" : "Edit tools"}
          </Button>
        </div>
      </div>

      {showTools && (
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <HistoryControls />
            <BulkBar />
          </div>
          <SavedViewsPanel />
        </div>
      )}

      {filters.setIds?.[0] && <SetProgressBar setId={filters.setIds[0]} />}
      {filters.missingForMasterSet && !filters.setIds?.[0] && (
        <SetProgressBar setId={filters.missingForMasterSet} />
      )}
      {filters.missingForMasterSet && (
        <Badge variant="warning" className="w-fit text-sm">
          Showing gaps · {missing.length} missing from this set
        </Badge>
      )}

      <div
        className={cn(
          "grid gap-4",
          selected
            ? "lg:grid-cols-[220px_1fr_300px] xl:grid-cols-[240px_1fr_320px]"
            : "lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr]"
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
              <h2 className="mb-2 font-semibold">Still need these</h2>
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
                Tap Clear filters, or search by a card name.
              </p>
            </div>
          ) : (
            <div
              className="max-h-[min(75vh,960px)] overflow-auto rounded-2xl border border-border bg-background/50 p-2 sm:p-3"
              role="listbox"
              aria-label="Collection cards"
            >
              <div
                className="grid gap-2 sm:gap-2.5"
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                }}
              >
                {items.map((item, index) => {
                  const onSelect = () => {
                    setFocusIndex(index);
                    if (bulkMode) toggleBulkId(item.id);
                    else selectItem(item.id);
                  };
                  return (
                    <div
                      key={item.id}
                      id={`card-${item.id}`}
                      role="option"
                      aria-selected={
                        bulkMode
                          ? selectedIds.includes(item.id)
                          : selectedId === item.id
                      }
                      className="relative min-w-0"
                    >
                      {bulkMode && (
                        <input
                          type="checkbox"
                          className="absolute left-1.5 top-1.5 z-10 h-4 w-4"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleBulkId(item.id)}
                          aria-label={`Select ${item.card.name}`}
                        />
                      )}
                      <DwellTarget onActivate={onSelect}>
                        <CardTile
                          item={item}
                          index={index}
                          selected={
                            bulkMode
                              ? selectedIds.includes(item.id)
                              : selectedId === item.id
                          }
                          focused={bciMode && focusIndex === index}
                          onSelect={onSelect}
                        />
                      </DwellTarget>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {selected && !bulkMode && (
          <div className="lg:sticky lg:top-36 lg:max-h-[calc(100vh-10rem)] lg:self-start">
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
