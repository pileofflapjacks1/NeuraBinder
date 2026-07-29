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

interface CardTileProps {
  item: CollectionItem;
  index: number;
  selected?: boolean;
  focused?: boolean;
  onSelect: (id: string) => void;
}

/**
 * Compact portrait tile — dense grid like Collectr / TCGPlayer apps.
 * Art is ~5:7; captions stay one line under the card.
 */
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
        "group flex w-full flex-col rounded-xl border bg-card text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected || focused
          ? "border-primary ring-2 ring-primary/40"
          : "border-border/80 hover:border-primary/40 hover:shadow-md",
        bciMode && "border-2"
      )}
      aria-label={`${item.card.name}, ${item.card.setName} ${item.card.number}, quantity ${item.quantity}, ${formatCurrency(item.totalValue)}`}
      aria-pressed={selected}
    >
      {/* TCG portrait face */}
      <div className="relative w-full overflow-hidden rounded-t-[0.65rem] bg-muted/40 aspect-[5/7]">
        {item.card.imageUrl ? (
          <Image
            src={item.card.imageUrl}
            alt=""
            fill
            className="object-contain p-1 transition-transform group-hover:scale-[1.02] sm:p-1.5"
            sizes="(max-width:640px) 33vw, (max-width:1024px) 20vw, 140px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent p-2 text-center">
            <span
              className={cn(
                "font-semibold leading-tight",
                bciMode ? "text-sm" : "text-xs"
              )}
            >
              {item.card.name}
            </span>
          </div>
        )}
        {item.quantity > 1 && (
          <span className="absolute right-1 top-1 rounded-md bg-background/95 px-1.5 py-0.5 text-[10px] font-bold shadow-sm">
            ×{item.quantity}
          </span>
        )}
        {item.isGraded && (
          <span className="absolute left-1 top-1 max-w-[70%] truncate rounded-md bg-amber-500/95 px-1.5 py-0.5 text-[10px] font-bold text-black shadow-sm">
            {item.gradeCompany} {item.grade}
          </span>
        )}
      </div>

      {/* Compact caption */}
      <div
        className={cn(
          "flex min-w-0 flex-col gap-0.5 border-t border-border/60",
          bciMode ? "px-2 py-2" : "px-1.5 py-1.5"
        )}
      >
        <div className="flex min-w-0 items-baseline justify-between gap-1">
          <h3
            className={cn(
              "min-w-0 truncate font-semibold leading-tight",
              bciMode ? "text-sm" : "text-xs"
            )}
          >
            {item.card.name}
          </h3>
          <span
            className={cn(
              "shrink-0 tabular-nums font-semibold text-primary",
              bciMode ? "text-sm" : "text-xs"
            )}
          >
            {formatCurrency(item.totalValue)}
          </span>
        </div>
        <p
          className={cn(
            "truncate text-muted-foreground",
            bciMode ? "text-xs" : "text-[10px]"
          )}
        >
          {item.card.setCode} · #{item.card.number}
          {item.condition !== "NM" ? ` · ${item.condition}` : ""}
        </p>
        {(item.variant !== "normal" ||
          item.card.rarity === "illustration_rare" ||
          item.card.rarity === "special_illustration_rare" ||
          item.card.rarity === "enchanted" ||
          item.totalCost > 0) && (
          <div className="flex min-w-0 items-center gap-1 overflow-hidden">
            {(item.card.rarity === "illustration_rare" ||
              item.card.rarity === "special_illustration_rare" ||
              item.card.rarity === "enchanted" ||
              item.card.rarity === "double_rare") && (
              <span className="truncate text-[10px] text-muted-foreground">
                {rarityLabel(item.card.rarity)}
              </span>
            )}
            {item.variant !== "normal" && (
              <span className="truncate text-[10px] text-muted-foreground">
                {variantLabel(item.variant)}
              </span>
            )}
            {item.totalCost > 0 && (
              <span
                className={cn(
                  "ml-auto shrink-0 text-[10px] font-medium tabular-nums",
                  item.unrealizedGain >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {formatPct(gainPct)}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
