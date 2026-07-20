"use client";

import { useMemo, useState } from "react";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { useBciStore } from "@/lib/stores/bci-store";
import { fuzzySearchCatalog } from "@/lib/search/fuse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import type { TradePackageLine } from "@/lib/types/features";
import { toast } from "sonner";

export default function TradeCalculatorPage() {
  const bciMode = useBciStore((s) => s.bciMode);
  const catalog = useCollectionStore((s) => s.catalog);
  const userCards = useCollectionStore((s) => s.userCards);
  const getItems = useCollectionStore((s) => s.getItems);
  const items = useMemo(() => getItems(), [getItems, userCards]);

  const [offer, setOffer] = useState<TradePackageLine[]>([]);
  const [want, setWant] = useState<TradePackageLine[]>([]);
  const [qOffer, setQOffer] = useState("");
  const [qWant, setQWant] = useState("");

  const offerTotal = offer.reduce((s, l) => s + l.unitValue * l.quantity, 0);
  const wantTotal = want.reduce((s, l) => s + l.unitValue * l.quantity, 0);
  const delta = offerTotal - wantTotal;

  const myHits = useMemo(() => {
    if (!qOffer.trim()) return items.slice(0, 8);
    return items
      .filter(
        (i) =>
          i.card.name.toLowerCase().includes(qOffer.toLowerCase()) ||
          i.card.searchText.includes(qOffer.toLowerCase())
      )
      .slice(0, 8);
  }, [items, qOffer]);

  const wantHits = useMemo(
    () => fuzzySearchCatalog(catalog, qWant, 8),
    [catalog, qWant]
  );

  const copySummary = () => {
    const text = `Trade package (NeuraBinder)

I offer (${formatCurrency(offerTotal)}):
${offer.map((l) => `• ${l.quantity}× ${l.name} @ ${formatCurrency(l.unitValue)}`).join("\n") || "• —"}

I want (${formatCurrency(wantTotal)}):
${want.map((l) => `• ${l.quantity}× ${l.name} @ ${formatCurrency(l.unitValue)}`).join("\n") || "• —"}

Delta: ${formatCurrency(delta)} (positive = I overpay)
`;
    void navigator.clipboard.writeText(text);
    toast.success("Package copied");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1
          className={cn(
            "font-bold tracking-tight",
            bciMode ? "text-3xl" : "text-2xl"
          )}
        >
          Trade package calculator
        </h1>
        <p className="text-sm text-muted-foreground">
          Balance offer vs want without a network — pure local math
        </p>
      </div>

      <div
        className={cn(
          "grid gap-3 sm:grid-cols-3",
          bciMode && "gap-4"
        )}
      >
        <Card className={cn(bciMode && "border-2")}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">You offer</p>
            <p className="text-2xl font-bold tabular-nums text-primary">
              {formatCurrency(offerTotal)}
            </p>
          </CardContent>
        </Card>
        <Card className={cn(bciMode && "border-2")}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">You want</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(wantTotal)}
            </p>
          </CardContent>
        </Card>
        <Card className={cn(bciMode && "border-2")}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Delta (offer − want)</p>
            <p
              className={cn(
                "text-2xl font-bold tabular-nums",
                delta >= 0 ? "text-warning" : "text-success"
              )}
            >
              {formatCurrency(delta)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={cn(bciMode && "border-2")}>
          <CardHeader>
            <CardTitle>I offer (from my collection)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              bci={bciMode}
              placeholder="Search my cards…"
              value={qOffer}
              onChange={(e) => setQOffer(e.target.value)}
            />
            <ul className="max-h-40 space-y-1 overflow-auto">
              {myHits.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    className="flex w-full justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() =>
                      setOffer((o) => [
                        ...o,
                        {
                          userCardId: i.id,
                          cardId: i.cardId,
                          name: i.card.name,
                          quantity: 1,
                          unitValue: i.estimatedValue ?? i.card.marketPrice ?? 0,
                          side: "offer",
                        },
                      ])
                    }
                  >
                    <span>{i.card.name}</span>
                    <span className="tabular-nums text-primary">
                      {formatCurrency(i.estimatedValue)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <PackageList lines={offer} onChange={setOffer} bci={bciMode} />
          </CardContent>
        </Card>

        <Card className={cn(bciMode && "border-2")}>
          <CardHeader>
            <CardTitle>I want (catalog)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              bci={bciMode}
              placeholder="Fuzzy search catalog…"
              value={qWant}
              onChange={(e) => setQWant(e.target.value)}
            />
            <ul className="max-h-40 space-y-1 overflow-auto">
              {wantHits.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="flex w-full justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() =>
                      setWant((w) => [
                        ...w,
                        {
                          cardId: c.id,
                          name: c.name,
                          quantity: 1,
                          unitValue: c.marketPrice ?? 0,
                          side: "want",
                        },
                      ])
                    }
                  >
                    <span>{c.name}</span>
                    <span className="tabular-nums">
                      {formatCurrency(c.marketPrice)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <PackageList lines={want} onChange={setWant} bci={bciMode} />
          </CardContent>
        </Card>
      </div>

      <Button size={bciMode ? "bci" : "default"} onClick={copySummary}>
        Copy package summary
      </Button>
    </div>
  );
}

function PackageList({
  lines,
  onChange,
  bci,
}: {
  lines: TradePackageLine[];
  onChange: (l: TradePackageLine[]) => void;
  bci: boolean;
}) {
  if (!lines.length) {
    return (
      <p className="text-sm text-muted-foreground">No lines yet — add above.</p>
    );
  }
  return (
    <ul className="space-y-2 border-t border-border pt-3">
      {lines.map((l, idx) => (
        <li
          key={`${l.cardId}-${idx}`}
          className={cn(
            "flex items-center justify-between gap-2 text-sm",
            bci && "py-1"
          )}
        >
          <span className="min-w-0 truncate font-medium">{l.name}</span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onChange(
                  lines.map((x, i) =>
                    i === idx
                      ? { ...x, quantity: Math.max(1, x.quantity - 1) }
                      : x
                  )
                )
              }
            >
              −
            </Button>
            <span className="w-6 text-center tabular-nums">{l.quantity}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onChange(
                  lines.map((x, i) =>
                    i === idx ? { ...x, quantity: x.quantity + 1 } : x
                  )
                )
              }
            >
              +
            </Button>
            <span className="w-16 text-right tabular-nums text-muted-foreground">
              {formatCurrency(l.unitValue * l.quantity)}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onChange(lines.filter((_, i) => i !== idx))}
            >
              ×
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
