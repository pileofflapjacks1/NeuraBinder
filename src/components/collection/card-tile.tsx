"use client";

import Image from "next/image";
import type { CollectionItem } from "@/lib/types";
import { useBciStore } from "@/lib/stores/bci-store";
import {
  cn,
  formatCurrency,
  formatPct,
  rarityLabel,
  variantLabel,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CardTileProps {
  item: CollectionItem;
  index: number;
  selected?: boolean;
  focused?: boolean;
  onSelect: (id: string) => void;
}

export function CardTile({
  item,
  index,
  selected,
  focused,
  onSelect,
}: CardTileProps) {
  const bciMode = useBciStore((s) => s.bciMode);
  const gainPct =
    item.totalCost > 0 ? (item.unrealizedGain / item.totalCost) * 100 : 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      data-index={index}
      data-bci-target="card"
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        bciMode ? "min-h-[220px]" : "min-h-[180px]",
        selected || focused
          ? "border-primary ring-2 ring-primary/40"
          : "border-border hover:border-primary/40 hover:shadow-md",
        // Strong spatial memory: consistent card chrome
        "bci-mode:border-2"
      )}
      aria-label={`${item.card.name}, ${item.card.setName} ${item.card.number}, quantity ${item.quantity}, ${formatCurrency(item.totalValue)}`}
      aria-pressed={selected}
    >
      <div
        className={cn(
          "relative w-full bg-muted/50",
          bciMode ? "aspect-[3/2.6]" : "aspect-[3/2.4]"
        )}
      >
        {item.card.imageUrl ? (
          <Image
            src={item.card.imageUrl}
            alt=""
            fill
            className="object-contain p-2 transition-transform group-hover:scale-[1.02]"
            sizes="(max-width:768px) 50vw, 200px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent p-4 text-center">
            <span
              className={cn(
                "font-semibold leading-tight",
                bciMode ? "text-lg" : "text-sm"
              )}
            >
              {item.card.name}
            </span>
          </div>
        )}
        {item.quantity > 1 && (
          <span className="absolute right-2 top-2 rounded-lg bg-background/90 px-2 py-0.5 text-xs font-bold shadow">
            ×{item.quantity}
          </span>
        )}
        {item.isGraded && (
          <span className="absolute left-2 top-2 rounded-lg bg-amber-500/90 px-2 py-0.5 text-xs font-bold text-black shadow">
            {item.gradeCompany} {item.grade}
          </span>
        )}
      </div>

      <div className={cn("flex flex-1 flex-col gap-1 p-3", bciMode && "p-4")}>
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              "line-clamp-2 font-semibold leading-snug",
              bciMode ? "text-base" : "text-sm"
            )}
          >
            {item.card.name}
          </h3>
          <span
            className={cn(
              "shrink-0 font-mono font-semibold tabular-nums text-primary",
              bciMode ? "text-base" : "text-sm"
            )}
          >
            {formatCurrency(item.totalValue)}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {item.card.setCode} · #{item.card.number} · {item.condition}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-1 pt-1">
          <Badge variant="secondary" className="text-[10px]">
            {rarityLabel(item.card.rarity)}
          </Badge>
          {item.variant !== "normal" && (
            <Badge variant="outline" className="text-[10px]">
              {variantLabel(item.variant)}
            </Badge>
          )}
          {item.totalCost > 0 && (
            <span
              className={cn(
                "ml-auto text-[11px] font-medium tabular-nums",
                item.unrealizedGain >= 0 ? "text-success" : "text-destructive"
              )}
            >
              {formatPct(gainPct)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
