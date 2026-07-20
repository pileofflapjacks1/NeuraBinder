"use client";

import Image from "next/image";
import { Minus, Plus, Trash2, X } from "lucide-react";
import type { CollectionItem } from "@/lib/types";
import { useBciStore } from "@/lib/stores/bci-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  conditionLabel,
  formatCurrency,
  formatPct,
  rarityLabel,
  variantLabel,
  cn,
} from "@/lib/utils";
import { shouldIGrade, valueBreakdown } from "@/lib/market/pricing";
import { useLotsStore } from "@/lib/stores/lots-store";
import { useAlertsStore } from "@/lib/stores/alerts-store";
import { toast } from "sonner";

interface CardDetailPanelProps {
  item: CollectionItem;
  onClose: () => void;
}

export function CardDetailPanel({ item, onClose }: CardDetailPanelProps) {
  const bciMode = useBciStore((s) => s.bciMode);
  const adjustQuantity = useCollectionStore((s) => s.adjustQuantity);
  const removeCard = useCollectionStore((s) => s.removeCard);
  const updateCard = useCollectionStore((s) => s.updateCard);
  const lists = useCollectionStore((s) => s.lists);
  const addToList = useCollectionStore((s) => s.addToList);
  const removeFromList = useCollectionStore((s) => s.removeFromList);
  const lotsForCard = useLotsStore((s) => s.lotsForCard);
  const addWatch = useAlertsStore((s) => s.addWatch);
  const addAlert = useAlertsStore((s) => s.addAlert);

  const gainPct =
    item.totalCost > 0 ? (item.unrealizedGain / item.totalCost) * 100 : 0;
  const gradeAdvice = shouldIGrade(item);
  const breakdown = valueBreakdown(
    item.card.marketPrice ?? 0,
    item.condition,
    item.isGraded,
    item.gradeCompany,
    item.grade
  );
  const lots = lotsForCard(item.id);

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border border-border bg-card shadow-lg",
        bciMode && "border-2"
      )}
      role="dialog"
      aria-label={`Details for ${item.card.name}`}
    >
      <div className="flex items-start justify-between gap-2 border-b border-border p-4">
        <div>
          <h2 className={cn("font-semibold", bciMode ? "text-xl" : "text-lg")}>
            {item.card.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {item.card.setName} · #{item.card.number}
          </p>
        </div>
        <Button
          variant="ghost"
          size={bciMode ? "icon-bci" : "icon"}
          onClick={onClose}
          aria-label="Close details"
        >
          <X />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="relative mx-auto mb-4 aspect-[3/4] w-full max-w-[220px] overflow-hidden rounded-xl bg-muted">
          {item.card.imageUrl ? (
            <Image
              src={item.card.imageUrl}
              alt={item.card.name}
              fill
              className="object-contain"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center font-medium">
              {item.card.name}
            </div>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Value</dt>
            <dd className="text-lg font-semibold text-primary">
              {formatCurrency(item.totalValue)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Cost basis</dt>
            <dd className="font-medium">{formatCurrency(item.totalCost)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Gain / loss</dt>
            <dd
              className={
                item.unrealizedGain >= 0 ? "text-success" : "text-destructive"
              }
            >
              {formatCurrency(item.unrealizedGain)} ({formatPct(gainPct)})
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Condition</dt>
            <dd>{conditionLabel(item.condition)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Variant</dt>
            <dd>{variantLabel(item.variant)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Rarity</dt>
            <dd>{rarityLabel(item.card.rarity)}</dd>
          </div>
          {item.isGraded && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">Grade</dt>
              <dd>
                <Badge variant="warning">
                  {item.gradeCompany} {item.grade}
                  {item.certNumber ? ` · ${item.certNumber}` : ""}
                </Badge>
              </dd>
            </div>
          )}
          {item.notes && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">Notes</dt>
              <dd className="rounded-lg bg-muted/50 p-2">{item.notes}</dd>
            </div>
          )}
          <div className="col-span-2 rounded-xl border border-border bg-muted/30 p-3">
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              Price breakdown
            </p>
            <p className="text-sm">
              NM market {formatCurrency(breakdown.marketNm)} × condition{" "}
              {breakdown.conditionMult.toFixed(2)} × grade{" "}
              {breakdown.gradeMult.toFixed(2)} ={" "}
              <strong>{formatCurrency(breakdown.unitValue)}</strong>
            </p>
          </div>
          <div className="col-span-2 rounded-xl border border-border p-3">
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              Should I grade?
            </p>
            <Badge variant={gradeAdvice.recommend ? "success" : "secondary"}>
              {gradeAdvice.recommend ? "Consider grading" : "Probably hold raw"}
            </Badge>
            <p className="mt-2 text-sm text-muted-foreground">
              {gradeAdvice.reason}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PSA10 est {formatCurrency(gradeAdvice.projectedPsa10)} · fees ~
              {formatCurrency(gradeAdvice.estimatedFee)} · net if 10{" "}
              {formatCurrency(gradeAdvice.netIfTen)}
            </p>
          </div>
          {lots.length > 0 && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">Tax lots</dt>
              <dd className="mt-1 space-y-1 text-sm">
                {lots.map((l) => (
                  <div
                    key={l.id}
                    className="flex justify-between rounded-lg bg-muted/40 px-2 py-1"
                  >
                    <span>
                      {l.remaining}× @ {formatCurrency(l.unitCost)} + fees{" "}
                      {formatCurrency(l.fees)}
                    </span>
                    <span className="text-muted-foreground">{l.purchasedAt}</span>
                  </div>
                ))}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size={bciMode ? "default" : "sm"}
            variant="outline"
            onClick={() => {
              addWatch(item.cardId, "From collection");
              addAlert({
                cardId: item.cardId,
                cardName: item.card.name,
                direction: "below",
                targetPrice: Math.round((item.estimatedValue ?? 0) * 0.9),
              });
              toast.success("Watch + drop alert created");
            }}
          >
            Watch for drop
          </Button>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Lists
          </p>
          <div className="flex flex-wrap gap-2">
            {lists.map((list) => {
              const on = item.listIds.includes(list.id);
              return (
                <Button
                  key={list.id}
                  size={bciMode ? "default" : "sm"}
                  variant={on ? "default" : "outline"}
                  onClick={() => {
                    if (on) removeFromList(item.id, list.id);
                    else addToList(item.id, list.id);
                  }}
                >
                  {list.name}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center gap-2 border-t border-border p-4",
          bciMode && "gap-3 p-5"
        )}
      >
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size={bciMode ? "icon-bci" : "icon"}
            onClick={() => adjustQuantity(item.id, -1)}
            aria-label="Decrease quantity"
          >
            <Minus />
          </Button>
          <span
            className={cn(
              "min-w-[2.5rem] text-center font-semibold tabular-nums",
              bciMode && "text-lg"
            )}
          >
            {item.quantity}
          </span>
          <Button
            variant="outline"
            size={bciMode ? "icon-bci" : "icon"}
            onClick={() => adjustQuantity(item.id, 1)}
            aria-label="Increase quantity"
          >
            <Plus />
          </Button>
        </div>

        <Button
          variant="outline"
          size={bciMode ? "bci" : "default"}
          onClick={() => {
            const next =
              item.condition === "NM"
                ? "LP"
                : item.condition === "LP"
                  ? "MP"
                  : item.condition === "MP"
                    ? "HP"
                    : item.condition === "HP"
                      ? "DMG"
                      : "NM";
            updateCard(item.id, { condition: next });
            toast.message(`Condition → ${next}`);
          }}
        >
          Cycle condition
        </Button>

        <Button
          variant="destructive"
          size={bciMode ? "bci" : "default"}
          className="ml-auto"
          onClick={() => {
            removeCard(item.id);
            onClose();
            toast.success("Removed from collection");
          }}
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </Button>
      </div>
    </div>
  );
}
