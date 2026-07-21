"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import { Toaster } from "sonner";
import { useBciStore } from "@/lib/stores/bci-store";
import { getBciAdapter } from "@/lib/bci/adapter";
import { onInjectedIntent } from "@/lib/bci/generic-intent";
import type { BciIntent } from "@/lib/types";
import { registerServiceWorker } from "@/lib/pwa/register-sw";
import { GuidedTour } from "@/components/tour/guided-tour";
import { ShowcaseController } from "@/components/showcase/showcase-controller";
import { ProfileBootstrap } from "@/components/profile/profile-switcher";

function routeIntent(
  intent: BciIntent,
  deps: {
    setCommandBarOpen: (v: boolean) => void;
    setIntentPaletteOpen: (v: boolean) => void;
    moveFocus: (d: number, max: number) => void;
  }
) {
  if (intent === "search") {
    deps.setCommandBarOpen(true);
    requestAnimationFrame(() => {
      document.getElementById("nl-command-input")?.focus();
    });
    return;
  }
  if (intent === "next") {
    deps.moveFocus(1, 9999);
    return;
  }
  if (intent === "prev") {
    deps.moveFocus(-1, 9999);
    return;
  }
  if (intent === "cancel") {
    deps.setCommandBarOpen(false);
    deps.setIntentPaletteOpen(false);
    (document.activeElement as HTMLElement | null)?.blur?.();
    return;
  }
  if (intent === "back") {
    deps.setCommandBarOpen(false);
    deps.setIntentPaletteOpen(false);
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    }
    return;
  }
  // select / confirm → activate focused control (mouse-equivalent)
  if (intent === "select" || intent === "confirm") {
    const el = document.activeElement as HTMLElement | null;
    if (el && typeof el.click === "function") {
      // Prefer explicit buttons / links / dwell targets
      const tag = el.tagName?.toLowerCase();
      if (
        tag === "button" ||
        tag === "a" ||
        el.getAttribute("role") === "button" ||
        el.dataset?.nbTarget != null ||
        el.classList?.contains("dwell-target")
      ) {
        el.click();
      } else {
        // Try nearest button in focus trap
        const btn = el.closest?.("button, a[href], [role='button']") as
          | HTMLElement
          | null;
        btn?.click?.();
      }
    }
  }
}

function BciEffects() {
  const bciMode = useBciStore((s) => s.bciMode);
  const highContrast = useBciStore((s) => s.highContrast);
  const reducedMotion = useBciStore((s) => s.reducedMotion);
  const setCommandBarOpen = useBciStore((s) => s.setCommandBarOpen);
  const setIntentPaletteOpen = useBciStore((s) => s.setIntentPaletteOpen);
  const moveFocus = useBciStore((s) => s.moveFocus);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("bci-mode", bciMode);
    root.classList.toggle("high-contrast", highContrast);
    root.classList.toggle("reduced-motion", reducedMotion);
    root.dataset.density = bciMode ? "bci" : "comfortable";
  }, [bciMode, highContrast, reducedMotion]);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    const deps = { setCommandBarOpen, setIntentPaletteOpen, moveFocus };
    const unsubAdapter = getBciAdapter().onIntent((intent) =>
      routeIntent(intent, deps)
    );
    const unsubInject = onInjectedIntent((intent) => routeIntent(intent, deps));
    const onCustom = (e: Event) => {
      const intent = (e as CustomEvent<{ intent: BciIntent }>).detail?.intent;
      if (intent) routeIntent(intent, deps);
    };
    window.addEventListener("neurabinder:intent", onCustom);
    return () => {
      unsubAdapter();
      unsubInject();
      window.removeEventListener("neurabinder:intent", onCustom);
    };
  }, [setCommandBarOpen, setIntentPaletteOpen, moveFocus]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={client}>
        <BciEffects />
        <ProfileBootstrap />
        <Suspense fallback={null}>
          <ShowcaseController />
        </Suspense>
        <GuidedTour />
        {children}
        <Toaster
          theme="system"
          position="bottom-right"
          toastOptions={{
            className: "bci-mode:text-base bci-mode:py-4",
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
