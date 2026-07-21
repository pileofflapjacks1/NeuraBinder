"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SHOWCASE_SCRIPT, type ShowcaseStep } from "@/lib/showcase/scripted-path";
import { useBciStore } from "@/lib/stores/bci-store";
import { useShowcaseStore } from "@/lib/stores/showcase-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ScriptedShowcase() {
  const bciMode = useBciStore((s) => s.bciMode);
  const setBciMode = useBciStore((s) => s.setBciMode);
  const setIntentPaletteOpen = useBciStore((s) => s.setIntentPaletteOpen);
  const setCommandBarOpen = useBciStore((s) => s.setCommandBarOpen);
  const enableShowcase = useShowcaseStore((s) => s.enable);
  const setFilters = useCollectionStore((s) => s.setFilters);
  const resetFilters = useCollectionStore((s) => s.resetFilters);
  const router = useRouter();

  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const stepStart = useRef(0);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    timerRef.current = null;
    rafRef.current = null;
  };

  const applyStep = useCallback(
    (step: ShowcaseStep) => {
      enableShowcase({
        lockData: true,
        autoTour: false,
        autoIntentSocket: true,
        bannerLabel: `Scripted path · ${step.title}`,
      });
      setBciMode(true);

      if (step.action === "bci_on") setBciMode(true);
      if (step.action === "open_palette") setIntentPaletteOpen(true);
      if (step.action === "open_command") setCommandBarOpen(true);
      if (step.action === "filter_ir") {
        resetFilters();
        setFilters({
          rarities: ["illustration_rare"],
          maxValue: 50,
          game: "pokemon",
        });
      }
      if (step.action === "snapshot_hint") {
        toast.message("Tip: Snapshot now on Portfolio to build history");
      }

      if (step.href) router.push(step.href);
    },
    [
      enableShowcase,
      setBciMode,
      setIntentPaletteOpen,
      setCommandBarOpen,
      resetFilters,
      setFilters,
      router,
    ]
  );

  const stop = useCallback(() => {
    clearTimers();
    setRunning(false);
    setProgress(0);
    toast.message("Showcase path stopped");
  }, []);

  const runFrom = useCallback(
    (startIndex: number) => {
      clearTimers();
      setRunning(true);
      setIndex(startIndex);

      const go = (i: number) => {
        if (i >= SHOWCASE_SCRIPT.length) {
          setRunning(false);
          setProgress(1);
          toast.success("Showcase path complete");
          router.push("/demo");
          return;
        }
        const step = SHOWCASE_SCRIPT[i];
        setIndex(i);
        applyStep(step);
        stepStart.current = performance.now();

        const tick = () => {
          const elapsed = performance.now() - stepStart.current;
          setProgress(Math.min(1, elapsed / step.dwellMs));
          if (elapsed < step.dwellMs) {
            rafRef.current = requestAnimationFrame(tick);
          }
        };
        rafRef.current = requestAnimationFrame(tick);

        timerRef.current = setTimeout(() => {
          setIntentPaletteOpen(false);
          go(i + 1);
        }, step.dwellMs);
      };

      go(startIndex);
    },
    [applyStep, router, setIntentPaletteOpen]
  );

  useEffect(() => () => clearTimers(), []);

  const step = SHOWCASE_SCRIPT[index];

  return (
    <Card className={cn(bciMode && "border-2")}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          Scripted showcase path
          {running && <Badge variant="warning">Running</Badge>}
          <Badge variant="outline">
            {index + 1}/{SHOWCASE_SCRIPT.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Auto-walk: demo → intents → IR collection → binder → portfolio → scan
          → a11y. Ideal for Neurabeach talks.
        </p>
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="font-semibold">{step?.title}</p>
          <p className="text-sm text-muted-foreground">{step?.body}</p>
          {step?.href && (
            <p className="mt-1 font-mono text-xs text-primary">{step.href}</p>
          )}
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-[width] duration-100"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!running ? (
            <Button
              size={bciMode ? "bci" : "default"}
              onClick={() => runFrom(0)}
            >
              Play full path
            </Button>
          ) : (
            <Button
              size={bciMode ? "bci" : "default"}
              variant="destructive"
              onClick={stop}
            >
              Stop
            </Button>
          )}
          <Button
            size={bciMode ? "bci" : "default"}
            variant="outline"
            disabled={running}
            onClick={() => runFrom(index)}
          >
            Resume from here
          </Button>
          <Button
            size={bciMode ? "bci" : "default"}
            variant="ghost"
            disabled={running || index >= SHOWCASE_SCRIPT.length - 1}
            onClick={() => {
              const next = Math.min(SHOWCASE_SCRIPT.length - 1, index + 1);
              setIndex(next);
              applyStep(SHOWCASE_SCRIPT[next]);
            }}
          >
            Next step
          </Button>
        </div>
        <ol className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
          {SHOWCASE_SCRIPT.map((s, i) => (
            <li
              key={s.id}
              className={cn(
                "rounded-lg border border-transparent px-2 py-1",
                i === index && "border-primary/40 bg-primary/10 text-foreground"
              )}
            >
              {i + 1}. {s.title}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
