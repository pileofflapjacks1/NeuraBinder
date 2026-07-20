"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { useLotsStore } from "@/lib/stores/lots-store";
import { useBciStore } from "@/lib/stores/bci-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatPct } from "@/lib/utils";

const COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#3b82f6",
];

export function PortfolioDashboard() {
  const bciMode = useBciStore((s) => s.bciMode);
  const userCards = useCollectionStore((s) => s.userCards);
  const getPortfolio = useCollectionStore((s) => s.getPortfolio);
  const getItems = useCollectionStore((s) => s.getItems);

  const portfolio = useMemo(() => getPortfolio(), [getPortfolio, userCards]);
  const items = useMemo(() => getItems(), [getItems, userCards]);
  const lots = useLotsStore((s) => s.lots);
  const totalLotCost = useLotsStore((s) => s.totalLotCost);

  const gameData = Object.entries(portfolio.byGame).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
  }));

  const setData = portfolio.bySet.slice(0, 6).map((s) => ({
    name: s.setName.slice(0, 14),
    value: Math.round(s.value * 100) / 100,
  }));

  const exportCsv = () => {
    const header = [
      "name",
      "set",
      "number",
      "qty",
      "condition",
      "variant",
      "graded",
      "cost",
      "value",
      "gain",
    ];
    const rows = items.map((i) =>
      [
        i.card.name,
        i.card.setName,
        i.card.number,
        i.quantity,
        i.condition,
        i.variant,
        i.isGraded ? `${i.gradeCompany} ${i.grade}` : "",
        i.totalCost.toFixed(2),
        i.totalValue.toFixed(2),
        i.unrealizedGain.toFixed(2),
      ].join(",")
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neurabinder-portfolio-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stat = (
    label: string,
    value: string,
    hint?: string,
    tone?: "default" | "up" | "down"
  ) => (
    <Card className={cn(bciMode && "border-2")}>
      <CardContent className={cn("pt-6", bciMode && "pt-8")}>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 font-bold tabular-nums tracking-tight",
            bciMode ? "text-3xl" : "text-2xl",
            tone === "up" && "text-success",
            tone === "down" && "text-destructive"
          )}
        >
          {value}
        </p>
        {hint && (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )}
      </CardContent>
    </Card>
  );

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
            Portfolio
          </h1>
          <p className="text-sm text-muted-foreground">
            Cost basis, market value, and allocation — privacy-first local demo
            prices
          </p>
        </div>
        <Button size={bciMode ? "bci" : "default"} variant="outline" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stat("Total value", formatCurrency(portfolio.totalValue))}
        {stat("Cost basis", formatCurrency(portfolio.totalCost))}
        {stat(
          "Unrealized P/L",
          `${formatCurrency(portfolio.unrealizedGain)} (${formatPct(portfolio.unrealizedGainPct)})`,
          undefined,
          portfolio.unrealizedGain >= 0 ? "up" : "down"
        )}
        {stat(
          "Cards",
          `${portfolio.cardCount}`,
          `${portfolio.uniqueCount} unique · ${portfolio.gradedCount} graded`
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={cn(bciMode && "border-2")}>
          <CardHeader>
            <CardTitle>Allocation by game</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gameData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={bciMode ? 50 : 45}
                  outerRadius={bciMode ? 90 : 80}
                  paddingAngle={3}
                >
                  {gameData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v))}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid hsl(var(--border))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className={cn(bciMode && "border-2")}>
          <CardHeader>
            <CardTitle>Value by set</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={setData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle>
            Tax lots · cost basis {formatCurrency(totalLotCost())}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="max-h-56 space-y-2 overflow-auto">
            {lots.slice(0, 12).map((l) => {
              const item = items.find((i) => i.id === l.userCardId);
              return (
                <li
                  key={l.id}
                  className="flex justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <span className="truncate">
                    {item?.card.name ?? l.userCardId} · {l.remaining} remaining
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatCurrency(l.remaining * l.unitCost + l.fees)}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Lot tracking is local. Realized gains on sale are Phase 2 with full
            disposition UI.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={cn(bciMode && "border-2")}>
          <CardHeader>
            <CardTitle>Top gainers</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {portfolio.topGainers.length === 0 && (
                <li className="text-sm text-muted-foreground">No gainers yet</li>
              )}
              {portfolio.topGainers.map((i) => (
                <li
                  key={i.id}
                  className={cn(
                    "flex items-center justify-between rounded-xl border border-border px-3",
                    bciMode ? "py-3" : "py-2"
                  )}
                >
                  <span className="font-medium">{i.card.name}</span>
                  <span className="tabular-nums text-success">
                    {formatCurrency(i.unrealizedGain)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className={cn(bciMode && "border-2")}>
          <CardHeader>
            <CardTitle>Top losers</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {portfolio.topLosers.length === 0 && (
                <li className="text-sm text-muted-foreground">No losers</li>
              )}
              {portfolio.topLosers.map((i) => (
                <li
                  key={i.id}
                  className={cn(
                    "flex items-center justify-between rounded-xl border border-border px-3",
                    bciMode ? "py-3" : "py-2"
                  )}
                >
                  <span className="font-medium">{i.card.name}</span>
                  <span className="tabular-nums text-destructive">
                    {formatCurrency(i.unrealizedGain)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
