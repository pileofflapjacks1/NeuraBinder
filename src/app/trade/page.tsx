"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { useBciStore } from "@/lib/stores/bci-store";
import {
  buildTradeProposal,
  computeTradeMatches,
} from "@/lib/trade/match";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { TradeMatch } from "@/lib/types/features";

export default function TradePage() {
  const bciMode = useBciStore((s) => s.bciMode);
  const catalog = useCollectionStore((s) => s.catalog);
  const wantCardIds = useCollectionStore((s) => s.wantCardIds);
  const userCards = useCollectionStore((s) => s.userCards);
  const getItems = useCollectionStore((s) => s.getItems);
  const lists = useCollectionStore((s) => s.lists);

  const items = useMemo(() => getItems(), [getItems, userCards]);
  const matches = useMemo(
    () => computeTradeMatches(items, wantCardIds, catalog),
    [items, wantCardIds, catalog]
  );

  const [selected, setSelected] = useState<TradeMatch | null>(null);
  const shareList = lists.find((l) => l.shareSlug);

  const copyProposal = (m: TradeMatch) => {
    const text = buildTradeProposal(m);
    void navigator.clipboard.writeText(text);
    toast.success("Trade proposal copied");
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
          Trade match
        </h1>
        <p className="text-sm text-muted-foreground">
          Local peer matching (demo collectors). Global network needs auth later.
        </p>
        <Button asChild size={bciMode ? "bci" : "default"} className="mt-3" variant="outline">
          <Link href="/trade/calculator">Open package calculator</Link>
        </Button>
      </div>

      {shareList && (
        <Card className={cn(bciMode && "border-2")}>
          <CardHeader>
            <CardTitle>Share link preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Public list: <Badge variant="success">{shareList.name}</Badge>
            </p>
            <code className="block rounded-xl bg-muted px-3 py-2 text-xs">
              {typeof window !== "undefined"
                ? `${window.location.origin}/s/${shareList.shareSlug}`
                : `/s/${shareList.shareSlug}`}
            </code>
            <p className="text-muted-foreground">
              Local-only preview — hosting a live share page requires deploy +
              backend.
            </p>
            <Button
              size={bciMode ? "bci" : "sm"}
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(
                  `${window.location.origin}/s/${shareList.shareSlug}`
                );
                toast.success("Share URL copied");
              }}
            >
              Copy share URL
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {matches.length === 0 && (
          <p className="text-muted-foreground">
            No overlaps with demo peers. Add wants or trade-listed cards.
          </p>
        )}
        {matches.map((m) => (
          <Card
            key={m.peer.id}
            className={cn(
              bciMode && "border-2",
              selected?.peer.id === m.peer.id && "ring-2 ring-primary"
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>{m.peer.displayName}</span>
                <Badge>score {m.score.toFixed(1)}</Badge>
              </CardTitle>
              {m.peer.bio && (
                <p className="text-sm text-muted-foreground">{m.peer.bio}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  They want from you
                </p>
                <ul className="space-y-1 text-sm">
                  {m.theyWantFromMe.length === 0 && (
                    <li className="text-muted-foreground">—</li>
                  )}
                  {m.theyWantFromMe.map((c) => (
                    <li key={c.cardId} className="flex justify-between">
                      <span>{c.name}</span>
                      <span className="tabular-nums text-primary">
                        {formatCurrency(c.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  You want from them
                </p>
                <ul className="space-y-1 text-sm">
                  {m.iWantFromThem.length === 0 && (
                    <li className="text-muted-foreground">—</li>
                  )}
                  {m.iWantFromThem.map((c) => (
                    <li key={c.cardId} className="flex justify-between">
                      <span>{c.name}</span>
                      <span className="tabular-nums">
                        {formatCurrency(c.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size={bciMode ? "bci" : "default"}
                  onClick={() => copyProposal(m)}
                >
                  Copy trade proposal
                </Button>
                <Button
                  size={bciMode ? "bci" : "default"}
                  variant="outline"
                  onClick={() => setSelected(m)}
                >
                  Focus
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
