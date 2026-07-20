"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBciStore } from "@/lib/stores/bci-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "Welcome to NeuraBinder",
    body: "A BCI-native TCG binder. This short tour stays fully local — no account needed.",
    action: null as string | null,
  },
  {
    title: "Enable BCI Mode",
    body: "Larger targets, lower density, discrete intents (Enter, ←/→, /, Esc). Toggle anytime in the header.",
    action: "bci",
  },
  {
    title: "Intent palette (⌘K)",
    body: "Jump to Find, Scan, Trade, Worth, Missing in one or two signals. Predicted actions rank first.",
    action: "intents",
  },
  {
    title: "Scan confirm loop",
    body: "Batch-scan cards, then confirm the top candidate with one intent.",
    action: "/scan",
  },
  {
    title: "Visual binder",
    body: "Stable 3×3 pages for spatial memory and cheapest path to complete a set.",
    action: "/binder",
  },
  {
    title: "Ask your collection",
    body: "Use the command bar: filters, portfolio questions, or actions like “Add Gengar to want list”.",
    action: "command",
  },
];

const STORAGE_KEY = "neurabinder-tour-done";

export function GuidedTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const setBciMode = useBciStore((s) => s.setBciMode);
  const setIntentPaletteOpen = useBciStore((s) => s.setIntentPaletteOpen);
  const setCommandBarOpen = useBciStore((s) => s.setCommandBarOpen);
  const bciMode = useBciStore((s) => s.bciMode);
  const router = useRouter();

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  // Allow re-open from settings via custom event
  useEffect(() => {
    const reopen = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener("neurabinder:tour", reopen);
    return () => window.removeEventListener("neurabinder:tour", reopen);
  }, []);

  if (!open) return null;

  const current = STEPS[step];

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const next = () => {
    const a = current.action;
    if (a === "bci") setBciMode(true);
    if (a === "intents") setIntentPaletteOpen(true);
    if (a === "command") setCommandBarOpen(true);
    if (a?.startsWith("/")) router.push(a);

    if (step >= STEPS.length - 1) finish();
    else setStep((s) => s + 1);
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Guided tour"
    >
      <div
        className={cn(
          "w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl",
          bciMode && "border-2 p-8"
        )}
      >
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
          Tour {step + 1}/{STEPS.length}
        </p>
        <h2 className={cn("font-bold", bciMode ? "text-2xl" : "text-xl")}>
          {current.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{current.body}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button size={bciMode ? "bci" : "default"} onClick={next}>
            {step >= STEPS.length - 1 ? "Finish" : "Next"}
          </Button>
          <Button
            size={bciMode ? "bci" : "default"}
            variant="ghost"
            onClick={finish}
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}

export function startGuidedTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("neurabinder:tour"));
  }
}
