"use client";

import Link from "next/link";
import {
  BookOpen,
  Camera,
  Library,
  LineChart,
  Upload,
  ChevronRight,
} from "lucide-react";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { useBciStore } from "@/lib/stores/bci-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { useMemo } from "react";

const MAIN = [
  {
    href: "/collection",
    title: "My cards",
    desc: "See and edit everything you own",
    icon: Library,
    primary: true,
  },
  {
    href: "/binder",
    title: "Set binder",
    desc: "Page through a set and fill gaps",
    icon: BookOpen,
  },
  {
    href: "/portfolio",
    title: "What it’s worth",
    desc: "Totals, gains, and charts",
    icon: LineChart,
  },
];

const MORE = [
  { href: "/scan", title: "Add with camera", icon: Camera },
  { href: "/import", title: "Import a spreadsheet", icon: Upload },
  { href: "/grading", title: "Track grading", icon: Library },
  { href: "/lists", title: "Want & trade lists", icon: Library },
];

export default function HomePage() {
  const bciMode = useBciStore((s) => s.bciMode);
  const userCards = useCollectionStore((s) => s.userCards);
  const getPortfolio = useCollectionStore((s) => s.getPortfolio);
  const portfolio = useMemo(() => getPortfolio(), [getPortfolio, userCards]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section className="space-y-3 text-center sm:text-left">
        <h1
          className={cn(
            "font-bold tracking-tight",
            bciMode ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
          )}
        >
          Your card collection
        </h1>
        <p className="text-muted-foreground">
          Track what you own, finish sets, and see value. No account needed.
        </p>
      </section>

      <Card
        className={cn(
          "overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 to-transparent",
          bciMode && "border-2"
        )}
      >
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Estimated value</p>
            <p
              className={cn(
                "font-bold tabular-nums tracking-tight",
                bciMode ? "text-4xl" : "text-3xl"
              )}
            >
              {formatCurrency(portfolio.totalValue)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {portfolio.cardCount} cards · {portfolio.uniqueCount} unique
            </p>
          </div>
          <Button asChild size={bciMode ? "bci" : "lg"}>
            <Link href="/collection">
              Open my cards
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-3" aria-label="Main things to do">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          What do you want to do?
        </h2>
        <ul className="space-y-2">
          {MAIN.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40",
                    bciMode && "min-h-[4.5rem] border-2 p-5",
                    item.primary && "border-primary/30 bg-primary/5"
                  )}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span
                      className={cn(
                        "block font-semibold",
                        bciMode ? "text-lg" : "text-base"
                      )}
                    >
                      {item.title}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {item.desc}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3" aria-label="More tools">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          More tools
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {MORE.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 text-sm font-medium hover:bg-accent/40",
                  bciMode && "min-h-[5rem] border-2 p-5 text-base"
                )}
              >
                <Icon className="h-5 w-5 text-primary" />
                {item.title}
              </Link>
            );
          })}
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Free · works offline · data stays on your device · not affiliated with
        Pokémon or Disney
      </p>
    </div>
  );
}
