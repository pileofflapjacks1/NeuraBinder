"use client";

/**
 * Public showcase route for Neurabeach / suite demos.
 * No accounts. Keyboard + synthetic intent only.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Brain,
  Command,
  ExternalLink,
  Keyboard,
  Library,
  Sparkles,
  Zap,
} from "lucide-react";
import { useBciStore } from "@/lib/stores/bci-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import {
  DEMO_CLASS_LABELS,
  genericIntentBus,
  type GenericIntentEvent,
} from "@/lib/bci/generic-intent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import type { BciIntent } from "@/lib/types";

export default function DemoPage() {
  const bciMode = useBciStore((s) => s.bciMode);
  const setBciMode = useBciStore((s) => s.setBciMode);
  const setIntentPaletteOpen = useBciStore((s) => s.setIntentPaletteOpen);
  const setCommandBarOpen = useBciStore((s) => s.setCommandBarOpen);
  const updateProfile = useBciStore((s) => s.updateProfile);
  const playFeedback = useBciStore((s) => s.playFeedback);
  const portfolio = useCollectionStore((s) => s.getPortfolio());
  const userCards = useCollectionStore((s) => s.userCards);
  void userCards;

  const [log, setLog] = useState<string[]>([]);
  const [lastIntent, setLastIntent] = useState<string>("—");

  useEffect(() => {
    // Enable a demo-friendly BCI profile on first visit to /demo
    setBciMode(true);
    updateProfile({
      soundFeedback: true,
      scanAutoRankAggressive: true,
      targetSize: "large",
    });
  }, [setBciMode, updateProfile]);

  useEffect(() => {
    return genericIntentBus.subscribe((ev: GenericIntentEvent) => {
      const line =
        ev.kind === "class_label"
          ? `class_label → ${ev.label} (${ev.source})`
          : ev.kind === "switch_binary"
            ? `switch_binary → ${ev.pressed ? "down" : "up"}`
            : ev.kind === "velocity_2d"
              ? `velocity_2d → ${ev.dx.toFixed(2)}, ${ev.dy.toFixed(2)}`
              : `synthetic → ${JSON.stringify(ev.payload)}`;
      setLastIntent(line);
      setLog((prev) => [line, ...prev].slice(0, 12));
      if (ev.kind === "class_label") playFeedback("select");
    });
  }, [playFeedback]);

  const fire = (label: BciIntent) => {
    genericIntentBus.emitClassLabel(label, "synthetic", 0.99);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Neurabeach suite demo</Badge>
          <Badge variant="secondary">computer_side</Badge>
          <Badge variant="outline">runtime: web</Badge>
          <Badge variant={bciMode ? "success" : "secondary"}>
            BCI Mode {bciMode ? "ON" : "off"}
          </Badge>
        </div>
        <h1
          className={cn(
            "font-bold tracking-tight",
            bciMode ? "text-4xl" : "text-3xl"
          )}
        >
          NeuraBinder live demo
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          BCI / Neuralink-<strong>inspired</strong> TCG collection manager —
          Pokémon TCG & Disney Lorcana. This page is the{" "}
          <strong>hero path for Neurabeach</strong>: no hardware, no accounts,
          synthetic intents only.
        </p>
        <p className="text-xs text-muted-foreground">
          Not affiliated with Neuralink, The Pokémon Company, or Disney. Not
          implant software or medical device software. Accessibility prototyping
          and computer-side UI only.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card className={cn(bciMode && "border-2")}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Demo portfolio</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(portfolio.totalValue)}
            </p>
          </CardContent>
        </Card>
        <Card className={cn(bciMode && "border-2")}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Unique entries</p>
            <p className="text-2xl font-bold tabular-nums">
              {portfolio.uniqueCount}
            </p>
          </CardContent>
        </Card>
        <Card className={cn(bciMode && "border-2")}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Last intent</p>
            <p className="truncate font-mono text-sm">{lastIntent}</p>
          </CardContent>
        </Card>
      </section>

      <Card className={cn(bciMode && "border-2")} data-tour="demo-bci">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            1 · Enable BCI Mode (already on for this page)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            size={bciMode ? "bci" : "default"}
            variant={bciMode ? "default" : "outline"}
            onClick={() => setBciMode(true)}
          >
            <Brain className="h-4 w-4" />
            BCI Mode on
          </Button>
          <Button
            size={bciMode ? "bci" : "default"}
            variant="outline"
            onClick={() => setBciMode(false)}
          >
            BCI Mode off
          </Button>
          <Button asChild size={bciMode ? "bci" : "default"} variant="secondary">
            <Link href="/settings/calibrate">Calibration wizard</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            2 · Synthetic intent simulator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Emits generic <code className="rounded bg-muted px-1">class_label</code>{" "}
            events (NeuralBridge-compatible shape). Same path keyboard intents
            use — no implant API.
          </p>
          <div className="flex flex-wrap gap-2">
            {DEMO_CLASS_LABELS.map(({ label, hint }) => (
              <Button
                key={label}
                size={bciMode ? "bci" : "default"}
                variant="outline"
                onClick={() => fire(label)}
                className="flex-col gap-0 h-auto py-3"
              >
                <span>{label}</span>
                <span className="text-[10px] font-normal text-muted-foreground">
                  {hint}
                </span>
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size={bciMode ? "bci" : "default"}
              onClick={() => genericIntentBus.emitSwitch(true)}
            >
              switch_binary pulse
            </Button>
            <Button
              size={bciMode ? "bci" : "default"}
              variant="secondary"
              onClick={() => {
                setIntentPaletteOpen(true);
                fire("search");
              }}
            >
              <Command className="h-4 w-4" />
              Open intent palette (⌘K)
            </Button>
            <Button
              size={bciMode ? "bci" : "default"}
              variant="secondary"
              onClick={() => setCommandBarOpen(true)}
            >
              <Sparkles className="h-4 w-4" />
              Open command bar
            </Button>
          </div>
          {log.length > 0 && (
            <ul
              className="max-h-36 overflow-auto rounded-xl border border-border bg-muted/30 p-3 font-mono text-xs"
              aria-live="polite"
            >
              {log.map((l, i) => (
                <li key={`${l}-${i}`}>{l}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            3 · Keyboard cheatsheet (always works)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            <li>
              <kbd className="rounded border px-1.5">⌘K</kbd> Intent palette
            </li>
            <li>
              <kbd className="rounded border px-1.5">/</kbd> Command bar
            </li>
            <li>
              <kbd className="rounded border px-1.5">Enter</kbd> Select / confirm
            </li>
            <li>
              <kbd className="rounded border px-1.5">Esc</kbd> Cancel
            </li>
            <li>
              <kbd className="rounded border px-1.5">←</kbd>{" "}
              <kbd className="rounded border px-1.5">→</kbd> Navigate
            </li>
            <li>
              <kbd className="rounded border px-1.5">⌘Z</kbd> Undo collection
              edit
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Library className="h-5 w-5 text-primary" />
            4 · Jump into product surfaces
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {[
            { href: "/collection", label: "Collection + bulk + views" },
            { href: "/binder", label: "Visual binder (3×3)" },
            { href: "/scan", label: "Scan queue confirm" },
            { href: "/portfolio", label: "Portfolio + snapshots" },
            { href: "/trade/calculator", label: "Trade calculator" },
            { href: "/import", label: "CSV import" },
          ].map((l) => (
            <Button
              key={l.href}
              asChild
              size={bciMode ? "bci" : "default"}
              variant="outline"
              className="justify-start"
            >
              <Link href={l.href}>{l.label}</Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      <footer className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Suite & catalog</p>
        <ul className="mt-2 space-y-1">
          <li>
            Manifest:{" "}
            <code className="rounded bg-muted px-1">neurabeach-manifest.json</code>{" "}
            · safety_class <code className="rounded bg-muted px-1">computer_side</code>{" "}
            · inputs class_label, switch_binary, velocity_2d, synthetic
          </li>
          <li>
            Neurabeach listing slug:{" "}
            <code className="rounded bg-muted px-1">neurabinder</code>
          </li>
          <li>
            Source:{" "}
            <a
              className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
              href="https://github.com/pileofflapjacks1/NeuraBinder"
              target="_blank"
              rel="noreferrer"
            >
              GitHub <ExternalLink className="h-3 w-3" />
            </a>
          </li>
        </ul>
      </footer>
    </div>
  );
}
