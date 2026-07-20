"use client";

import Link from "next/link";
import {
  Brain,
  Camera,
  Library,
  LineChart,
  List,
  Sparkles,
  Zap,
} from "lucide-react";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { useBciStore } from "@/lib/stores/bci-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatPct } from "@/lib/utils";
import { useMemo } from "react";

const LINKS = [
  {
    href: "/collection",
    title: "Collection",
    desc: "Browse, filter, and manage cards with BCI-sized targets",
    icon: Library,
  },
  {
    href: "/scan",
    title: "Scan",
    desc: "Batch queue → ranked candidates → one-intent confirm",
    icon: Camera,
  },
  {
    href: "/portfolio",
    title: "Portfolio",
    desc: "Value, cost basis, tax lots, allocation, CSV export",
    icon: LineChart,
  },
  {
    href: "/lists",
    title: "Lists",
    desc: "Want, trade binder, for sale, investment holds",
    icon: List,
  },
  {
    href: "/binder",
    title: "Visual binder",
    desc: "3×3 pages + cheapest path to complete a set",
    icon: Library,
  },
  {
    href: "/import",
    title: "Import CSV",
    desc: "TCGPlayer / Collectr / NeuraBinder — local match & merge",
    icon: Sparkles,
  },
  {
    href: "/trade",
    title: "Trade match",
    desc: "Local want/have peers + one-tap proposal",
    icon: List,
  },
  {
    href: "/watch",
    title: "Watch & intel",
    desc: "Price alerts, watchlist, seed market notes",
    icon: LineChart,
  },
];

export default function HomePage() {
  const bciMode = useBciStore((s) => s.bciMode);
  const toggleBciMode = useBciStore((s) => s.toggleBciMode);
  const setCommandBarOpen = useBciStore((s) => s.setCommandBarOpen);
  const userCards = useCollectionStore((s) => s.userCards);
  const getPortfolio = useCollectionStore((s) => s.getPortfolio);
  const portfolio = useMemo(() => getPortfolio(), [getPortfolio, userCards]);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-card to-cyan-500/10 p-6 md:p-10">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className="text-sm">Neuralink-ready PWA</Badge>
            <Badge variant="secondary">Pokémon TCG · Disney Lorcana</Badge>
          </div>
          <h1
            className={cn(
              "font-bold tracking-tight",
              bciMode ? "text-4xl md:text-5xl" : "text-3xl md:text-4xl"
            )}
          >
            Manage your TCG collection at the speed of thought
          </h1>
          <p
            className={cn(
              "mt-3 text-muted-foreground",
              bciMode ? "text-lg" : "text-base"
            )}
          >
            NeuraBinder is the first collection tracker designed from the ground
            up for high-bandwidth BCIs. Predictive ranking, low clutter, large
            targets — and fully excellent with keyboard, mouse, touch, and
            screen readers.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size={bciMode ? "bci" : "lg"}>
              <Link href="/collection">
                <Library className="h-4 w-4" />
                Open collection
              </Link>
            </Button>
            <Button
              variant="outline"
              size={bciMode ? "bci" : "lg"}
              onClick={() => setCommandBarOpen(true)}
            >
              <Sparkles className="h-4 w-4" />
              Ask your collection
            </Button>
            <Button
              variant={bciMode ? "default" : "secondary"}
              size={bciMode ? "bci" : "lg"}
              onClick={toggleBciMode}
            >
              <Brain className="h-4 w-4" />
              {bciMode ? "BCI Mode on" : "Enable BCI Mode"}
            </Button>
          </div>
        </div>
        <Brain
          className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 text-primary/10 md:h-64 md:w-64"
          aria-hidden
        />
      </section>

      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Portfolio snapshot"
      >
        <Card className={cn(bciMode && "border-2")}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Portfolio value</p>
            <p
              className={cn(
                "mt-1 font-bold tabular-nums",
                bciMode ? "text-3xl" : "text-2xl"
              )}
            >
              {formatCurrency(portfolio.totalValue)}
            </p>
          </CardContent>
        </Card>
        <Card className={cn(bciMode && "border-2")}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Unrealized P/L</p>
            <p
              className={cn(
                "mt-1 font-bold tabular-nums",
                bciMode ? "text-3xl" : "text-2xl",
                portfolio.unrealizedGain >= 0
                  ? "text-success"
                  : "text-destructive"
              )}
            >
              {formatCurrency(portfolio.unrealizedGain)}{" "}
              <span className="text-base font-medium">
                ({formatPct(portfolio.unrealizedGainPct)})
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className={cn(bciMode && "border-2")}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Cards owned</p>
            <p
              className={cn(
                "mt-1 font-bold tabular-nums",
                bciMode ? "text-3xl" : "text-2xl"
              )}
            >
              {portfolio.cardCount}
            </p>
            <p className="text-xs text-muted-foreground">
              {portfolio.uniqueCount} unique entries
            </p>
          </CardContent>
        </Card>
        <Card className={cn(bciMode && "border-2")}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Graded</p>
            <p
              className={cn(
                "mt-1 font-bold tabular-nums",
                bciMode ? "text-3xl" : "text-2xl"
              )}
            >
              {portfolio.gradedCount}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group">
              <Card
                className={cn(
                  "h-full transition-colors group-hover:border-primary/50 group-hover:bg-accent/30",
                  bciMode && "border-2 min-h-[7rem]"
                )}
              >
                <CardHeader className="flex-row items-start gap-3 space-y-0">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <CardTitle className={bciMode ? "text-xl" : "text-lg"}>
                      {item.title}
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">BCI principles baked in</h2>
        </div>
        <ul
          className={cn(
            "grid gap-2 text-muted-foreground md:grid-cols-2",
            bciMode ? "text-base" : "text-sm"
          )}
        >
          <li>· Minimize required selections — predictive, ranked UI</li>
          <li>· Continuous cursor + discrete intents (confirm / cancel / search)</li>
          <li>· Low clutter, high-contrast, stable spatial layout</li>
          <li>· Always-on natural language bar prioritizes your collection</li>
          <li>· Scan: look → propose → single confirmation signal</li>
          <li>· ≤2–3 intentional signals for power-user major actions</li>
        </ul>
      </section>
    </div>
  );
}
