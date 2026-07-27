"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBciStore } from "@/lib/stores/bci-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "Welcome to NeuraBinder",
    body: "Track the cards you own. No sign-up — everything stays on this device.",
    action: null as string | null,
  },
  {
    title: "Start with My cards",
    body: "That’s your collection. Tap a card to change quantity, condition, or notes.",
    action: "/collection",
  },
  {
    title: "Search anytime",
    body: "Use the Search button (top right) to find a card by name.",
    action: "command",
  },
];

const STORAGE_KEY = "neurabinder-tour-done-v2";

export function GuidedTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
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
    if (a === "command") setCommandBarOpen(true);
    if (a?.startsWith("/")) router.push(a);

    if (step >= STEPS.length - 1) {
      finish();
      router.push("/collection");
    } else setStep((s) => s + 1);
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Quick start"
    >
      <div
        className={cn(
          "w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl",
          bciMode && "border-2 p-8"
        )}
      >
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
          {step + 1} of {STEPS.length}
        </p>
        <h2 className={cn("font-bold", bciMode ? "text-2xl" : "text-xl")}>
          {current.title}
        </h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          {current.body}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button size={bciMode ? "bci" : "lg"} onClick={next} className="min-w-[8rem]">
            {step >= STEPS.length - 1 ? "Open my cards" : "Next"}
          </Button>
          <Button
            size={bciMode ? "bci" : "lg"}
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
