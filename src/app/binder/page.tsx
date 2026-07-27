"use client";

import { useMemo, useState } from "react";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { useBciStore } from "@/lib/stores/bci-store";
import { useProfileStore } from "@/lib/stores/profile-store";
import {
  buildBinderPages,
  cheapestPathToComplete,
} from "@/lib/collection/binder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { SetProgressBar } from "@/components/collection/set-progress";
import { SwitchScanController } from "@/components/bci/switch-scan";
import { useActivityStore } from "@/lib/stores/activity-store";
import { Printer } from "lucide-react";

export default function BinderPage() {
  const bciMode = useBciStore((s) => s.bciMode);
  const focusIndex = useBciStore((s) => s.focusIndex);
  const setFocusIndex = useBciStore((s) => s.setFocusIndex);
  const catalog = useCollectionStore((s) => s.catalog);
  const userCards = useCollectionStore((s) => s.userCards);
  const getItems = useCollectionStore((s) => s.getItems);
  const getSets = useCollectionStore((s) => s.getSets);
  const addWantCard = useCollectionStore((s) => s.addWantCard);
  const log = useActivityStore((s) => s.log);
  const profileName = useProfileStore((s) => s.activeProfile().name);

  const sets = getSets();
  const [setId, setSetId] = useState(
    sets.find((s) => s.id === "sv3pt5")?.id ?? sets[0]?.id ?? ""
  );
  const [page, setPage] = useState(1);

  const items = useMemo(() => getItems(), [getItems, userCards]);
  const setCards = useMemo(
    () => catalog.filter((c) => c.setId === setId),
    [catalog, setId]
  );
  const pages = useMemo(
    () => buildBinderPages(setCards, items),
    [setCards, items]
  );
  const current = pages[page - 1];
  const path = useMemo(
    () => cheapestPathToComplete(catalog, items, setId),
    [catalog, items, setId]
  );

  const locationFor = (cardId: string) => {
    const hit = items.find((i) => i.cardId === cardId && i.location);
    return hit?.location;
  };

  const announceTour = () => {
    const progress = useCollectionStore.getState().getSetProgress(setId);
    const text = progress
      ? `${progress.setName}: ${progress.ownedUnique} of ${progress.totalCards}, ${progress.percentComplete.toFixed(0)} percent complete. Cheapest path to finish is ${formatCurrency(path.total)} across ${path.items.length} missing cards.`
      : "No set selected.";
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
    log("Binder tour", { href: "/binder", intent: "missing" });
  };

  return (
    <div className="space-y-6">
      <SwitchScanController itemCount={current?.slots.filter((s) => s.card).length ?? 0} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className={cn(
              "font-bold tracking-tight",
              bciMode ? "text-3xl" : "text-2xl"
            )}
          >
            Binder
          </h1>
          <p className="text-sm text-muted-foreground">
            {profileName}&apos;s set pages · see what you own and what&apos;s missing
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <select
            className={cn(
              "rounded-xl border border-input bg-background px-3 text-sm",
              bciMode ? "h-14 text-base" : "h-10"
            )}
            value={setId}
            onChange={(e) => {
              setSetId(e.target.value);
              setPage(1);
            }}
            aria-label="Set"
          >
            {sets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <Button
            size={bciMode ? "bci" : "default"}
            variant="outline"
            onClick={announceTour}
          >
            Read aloud
          </Button>
          <Button
            size={bciMode ? "bci" : "default"}
            variant="secondary"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print page
          </Button>
        </div>
      </div>

      {setId && <SetProgressBar setId={setId} />}

      <Card className={cn("print:shadow-none print:border", bciMode && "border-2")}>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>
            Page {page} / {Math.max(pages.length, 1)}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {sets.find((s) => s.id === setId)?.name}
            </span>
          </CardTitle>
          <div className="flex gap-2 print:hidden">
            <Button
              size={bciMode ? "bci" : "sm"}
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <Button
              size={bciMode ? "bci" : "sm"}
              variant="outline"
              disabled={page >= pages.length}
              onClick={() => setPage((p) => Math.min(pages.length, p + 1))}
            >
              Next
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "grid grid-cols-3 gap-3",
              bciMode && "gap-4"
            )}
            role="list"
            aria-label="Binder page slots"
          >
            {(current?.slots ?? Array.from({ length: 9 })).map((slot, i) => {
              if (!slot || !("card" in slot)) {
                return (
                  <div
                    key={i}
                    className="aspect-[3/4] rounded-2xl border border-dashed border-border"
                  />
                );
              }
              const focused = focusIndex === i;
              const loc = slot.card ? locationFor(slot.card.id) : undefined;
              return (
                <button
                  key={i}
                  type="button"
                  role="listitem"
                  onClick={() => setFocusIndex(i)}
                  className={cn(
                    "flex aspect-[3/4] flex-col items-center justify-center rounded-2xl border p-2 text-center transition-colors",
                    bciMode && "border-2 p-3",
                    slot.owned
                      ? "border-primary/40 bg-primary/10"
                      : "border-border bg-muted/30",
                    focused && "ring-2 ring-ring"
                  )}
                >
                  {slot.card ? (
                    <>
                      <span
                        className={cn(
                          "font-semibold leading-tight",
                          bciMode ? "text-base" : "text-sm"
                        )}
                      >
                        {slot.card.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        #{slot.card.number}
                      </span>
                      {slot.owned ? (
                        <Badge className="mt-2" variant="success">
                          ×{slot.quantity}
                        </Badge>
                      ) : (
                        <Badge className="mt-2" variant="outline">
                          missing
                        </Badge>
                      )}
                      {loc && (
                        <span className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">
                          {loc}
                        </span>
                      )}
                      {!slot.owned && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-1 print:hidden"
                          onClick={(e) => {
                            e.stopPropagation();
                            addWantCard(slot.card!.id);
                          }}
                        >
                          + want
                        </Button>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle>
            Cheapest path to complete · {formatCurrency(path.total)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {path.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No missing cards in the demo catalog for this set — or set complete!
            </p>
          ) : (
            <ol className="space-y-2">
              {path.items.map((p, i) => (
                <li
                  key={p.card.id}
                  className={cn(
                    "flex items-center justify-between rounded-xl border border-border px-3",
                    bciMode ? "py-3" : "py-2"
                  )}
                >
                  <span>
                    <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                    {p.card.name}{" "}
                    <span className="text-muted-foreground">
                      #{p.card.number}
                    </span>
                  </span>
                  <span className="tabular-nums text-sm">
                    {formatCurrency(p.marketPrice)}{" "}
                    <span className="text-muted-foreground">
                      (cum {formatCurrency(p.cumulative)})
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
