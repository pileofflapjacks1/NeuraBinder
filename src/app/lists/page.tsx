"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { useBciStore } from "@/lib/stores/bci-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function ListsPage() {
  const bciMode = useBciStore((s) => s.bciMode);
  const lists = useCollectionStore((s) => s.lists);
  const wantCardIds = useCollectionStore((s) => s.wantCardIds);
  const catalog = useCollectionStore((s) => s.catalog);
  const userCards = useCollectionStore((s) => s.userCards);
  const getItems = useCollectionStore((s) => s.getItems);
  const setFilters = useCollectionStore((s) => s.setFilters);
  const createList = useCollectionStore((s) => s.createList);

  const items = useMemo(() => getItems(), [getItems, userCards]);

  const listStats = lists.map((list) => {
    const members = items.filter((i) => i.listIds.includes(list.id));
    return {
      ...list,
      count: members.length,
      value: members.reduce((s, i) => s + i.totalValue, 0),
    };
  });

  const wantCards = wantCardIds
    .map((id) => catalog.find((c) => c.id === id))
    .filter(Boolean);

  const generateTradeMessage = () => {
    const trade = items.filter((i) => i.listIds.includes("list-trade"));
    const msg = `Hey! Here's what I have available to trade from NeuraBinder:\n\n${trade
      .map(
        (i) =>
          `• ${i.card.name} (${i.card.setCode} #${i.card.number}) — ${i.condition}${
            i.isGraded ? ` ${i.gradeCompany} ${i.grade}` : ""
          } — ~$${i.totalValue.toFixed(2)}`
      )
      .join("\n")}\n\nOpen to offers of equal value. Thanks!`;
    void navigator.clipboard.writeText(msg);
    toast.success("Trade proposal copied to clipboard");
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
            Want & trade lists
          </h1>
          <p className="text-sm text-muted-foreground">
            Cards you want, extras to trade, and sale lists
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size={bciMode ? "bci" : "default"}
            variant="outline"
            onClick={generateTradeMessage}
          >
            Copy trade proposal
          </Button>
          <Button
            size={bciMode ? "bci" : "default"}
            onClick={() => {
              createList("Custom list", "custom");
              toast.success("List created");
            }}
          >
            New list
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {listStats.map((list) => (
          <Card key={list.id} className={cn(bciMode && "border-2")}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className={bciMode ? "text-xl" : undefined}>
                  {list.name}
                </CardTitle>
                <Badge variant={list.isPublic ? "success" : "secondary"}>
                  {list.isPublic ? "Public" : "Private"}
                </Badge>
              </div>
              {list.description && (
                <p className="text-sm text-muted-foreground">
                  {list.description}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="font-semibold">{list.count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Value</span>
                <span className="font-semibold text-primary">
                  {formatCurrency(list.value)}
                </span>
              </div>
              {list.shareSlug && (
                <p className="truncate text-xs text-muted-foreground">
                  Share: /s/{list.shareSlug}
                </p>
              )}
              <Button
                asChild
                variant="outline"
                size={bciMode ? "bci" : "default"}
                className="w-full"
              >
                <Link
                  href="/collection"
                  onClick={() => setFilters({ listId: list.id, game: "all" })}
                >
                  Open in collection
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle>Want list (catalog)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {wantCards.map((c) =>
              c ? (
                <li
                  key={c.id}
                  className={cn(
                    "flex items-center justify-between gap-3",
                    bciMode ? "py-4" : "py-3"
                  )}
                >
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.setName} · #{c.number}
                    </p>
                  </div>
                  <span className="font-mono text-primary">
                    {formatCurrency(c.marketPrice)}
                  </span>
                </li>
              ) : null
            )}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Phase 2: public/private share links, global have/want matching with
            privacy controls.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
