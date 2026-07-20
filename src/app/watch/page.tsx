"use client";

import { useMemo } from "react";
import { useAlertsStore } from "@/lib/stores/alerts-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { useSnapshotsStore } from "@/lib/stores/snapshots-store";
import { useBciStore } from "@/lib/stores/bci-store";
import { SEED_EVENTS } from "@/lib/seed/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency, formatPct } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

export default function WatchPage() {
  const bciMode = useBciStore((s) => s.bciMode);
  const playFeedback = useBciStore((s) => s.playFeedback);
  const catalog = useCollectionStore((s) => s.catalog);
  const refreshMarketPrices = useCollectionStore((s) => s.refreshMarketPrices);
  const marketRefreshedAt = useCollectionStore((s) => s.marketRefreshedAt);
  const getItems = useCollectionStore((s) => s.getItems);
  const userCards = useCollectionStore((s) => s.userCards);

  const alerts = useAlertsStore((s) => s.alerts);
  const watchlist = useAlertsStore((s) => s.watchlist);
  const addAlert = useAlertsStore((s) => s.addAlert);
  const removeAlert = useAlertsStore((s) => s.removeAlert);
  const toggleAlert = useAlertsStore((s) => s.toggleAlert);
  const evaluateAlerts = useAlertsStore((s) => s.evaluateAlerts);
  const removeWatch = useAlertsStore((s) => s.removeWatch);
  const addWatch = useAlertsStore((s) => s.addWatch);

  const [alertName, setAlertName] = useState("Iono");
  const [alertPrice, setAlertPrice] = useState("100");

  const items = useMemo(() => getItems(), [getItems, userCards]);

  const spikes = useMemo(() => {
    return items
      .filter((i) => i.totalCost > 0)
      .map((i) => ({
        item: i,
        pct: (i.unrealizedGain / i.totalCost) * 100,
      }))
      .filter((x) => Math.abs(x.pct) >= 15)
      .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
      .slice(0, 8);
  }, [items]);

  const addSnapshot = useSnapshotsStore((s) => s.addSnapshot);
  const getPortfolio = useCollectionStore((s) => s.getPortfolio);

  const refresh = () => {
    refreshMarketPrices();
    const triggered = evaluateAlerts(useCollectionStore.getState().catalog);
    const p = getPortfolio();
    addSnapshot({
      totalValue: p.totalValue,
      totalCost: p.totalCost,
      cardCount: p.cardCount,
      uniqueCount: p.uniqueCount,
      source: "market_refresh",
    });
    playFeedback(triggered.length ? "success" : "select");
    toast.message(
      triggered.length
        ? `${triggered.length} alert(s) triggered`
        : "Market refreshed + portfolio snapshot"
    );
  };

  const createAlert = () => {
    const card = catalog.find((c) =>
      c.name.toLowerCase().includes(alertName.toLowerCase())
    );
    if (!card) {
      toast.error("Card not found in catalog");
      return;
    }
    addAlert({
      cardId: card.id,
      cardName: card.name,
      direction: "below",
      targetPrice: parseFloat(alertPrice) || 0,
    });
    addWatch(card.id, "From alert");
    toast.success(`Watching ${card.name} below $${alertPrice}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className={cn(
              "font-bold tracking-tight",
              bciMode ? "text-3xl" : "text-2xl"
            )}
          >
            Watch & intel
          </h1>
          <p className="text-sm text-muted-foreground">
            Local price alerts, watchlist, and seed market notes
            {marketRefreshedAt && (
              <> · last refresh {new Date(marketRefreshedAt).toLocaleTimeString()}</>
            )}
          </p>
        </div>
        <Button size={bciMode ? "bci" : "default"} onClick={refresh}>
          Refresh mock market
        </Button>
      </div>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle>New “watch for drop” alert</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Card name
            </label>
            <Input
              bci={bciMode}
              value={alertName}
              onChange={(e) => setAlertName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Below $
            </label>
            <Input
              bci={bciMode}
              type="number"
              value={alertPrice}
              onChange={(e) => setAlertPrice(e.target.value)}
            />
          </div>
          <Button size={bciMode ? "bci" : "default"} onClick={createAlert}>
            Create alert
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={cn(bciMode && "border-2")}>
          <CardHeader>
            <CardTitle>Active alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((a) => {
              const price = catalog.find((c) => c.id === a.cardId)?.marketPrice;
              return (
                <div
                  key={a.id}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3",
                    bciMode ? "py-3" : "py-2",
                    a.triggeredAt && "border-success/50 bg-success/5"
                  )}
                >
                  <div>
                    <p className="font-medium">{a.cardName}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.direction} {formatCurrency(a.targetPrice)} · now{" "}
                      {formatCurrency(a.lastPrice ?? price)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAlert(a.id)}
                    >
                      {a.active ? "Pause" : "Resume"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeAlert(a.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className={cn(bciMode && "border-2")}>
          <CardHeader>
            <CardTitle>Watchlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {watchlist.map((w) => {
              const card = catalog.find((c) => c.id === w.cardId);
              return (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-xl border border-border px-3 py-2"
                >
                  <div>
                    <p className="font-medium">{card?.name ?? w.cardId}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(card?.marketPrice)} · {w.note}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeWatch(w.id)}
                  >
                    Remove
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle>Movers vs your cost basis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {spikes.length === 0 && (
            <p className="text-sm text-muted-foreground">No big movers yet.</p>
          )}
          {spikes.map(({ item, pct }) => (
            <div
              key={item.id}
              className="flex justify-between rounded-xl border border-border px-3 py-2 text-sm"
            >
              <span>{item.card.name}</span>
              <span
                className={
                  pct >= 0 ? "text-success tabular-nums" : "text-destructive tabular-nums"
                }
              >
                {formatPct(pct)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle>Market notes (seed)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {SEED_EVENTS.map((ev) => (
            <article
              key={ev.id}
              className="rounded-xl border border-border p-3"
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{ev.kind}</Badge>
                <span className="text-xs text-muted-foreground">{ev.date}</span>
              </div>
              <h3 className="font-medium">{ev.title}</h3>
              <p className="text-sm text-muted-foreground">{ev.body}</p>
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
