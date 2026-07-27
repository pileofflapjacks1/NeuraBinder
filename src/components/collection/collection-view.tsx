"use client";

import { useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CollectionView() {
  const bciMode = useBciStore((s) => s.bciMode);
  const focusIndex = useBciStore((s) => s.focusIndex);
  const setFocusIndex = useBciStore((s) => s.setFocusIndex);
  const moveFocus = useBciStore((s) => s.moveFocus);
  const profile = useBciStore((s) => s.profile);
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

  const cols = bciMode ? 2 : 4;
  const rowCount = Math.ceil(items.length / cols);
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (bciMode ? 280 : 240),
    overscan: 3,
  });

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

  // Scroll virtual row into view when focus changes
  useEffect(() => {
    if (!bciMode || !items.length) return;
    const row = Math.floor(focusIndex / cols);
    rowVirtualizer.scrollToIndex(row, { align: "auto" });
  }, [focusIndex, bciMode, cols, items.length, rowVirtualizer]);

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
              ref={parentRef}
              className="h-[min(70vh,900px)] overflow-auto rounded-2xl border border-border"
              role="listbox"
              aria-label="Collection cards"
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const start = virtualRow.index * cols;
                  const rowItems = items.slice(start, start + cols);
                  return (
                    <div
                      key={virtualRow.key}
                      className={cn(
                        "absolute left-0 top-0 grid w-full gap-3 p-3",
                        bciMode
                          ? "grid-cols-1 sm:grid-cols-2 gap-4"
                          : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
                      )}
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {rowItems.map((item, colIdx) => {
                        const index = start + colIdx;
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
                            className="relative"
                          >
                            {bulkMode && (
                              <input
                                type="checkbox"
                                className="absolute left-3 top-3 z-10 h-5 w-5"
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
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {selected && !bulkMode && (
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
