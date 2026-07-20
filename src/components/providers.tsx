"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { useBciStore } from "@/lib/stores/bci-store";
import { getBciAdapter } from "@/lib/bci/adapter";
import { registerServiceWorker } from "@/lib/pwa/register-sw";
import { GuidedTour } from "@/components/tour/guided-tour";

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
    if (!bciMode) return;
    const adapter = getBciAdapter();
    return adapter.onIntent((intent) => {
      if (intent === "search") {
        setCommandBarOpen(true);
        requestAnimationFrame(() => {
          document.getElementById("nl-command-input")?.focus();
        });
      }
      if (intent === "next") moveFocus(1, 9999);
      if (intent === "prev") moveFocus(-1, 9999);
      if (intent === "cancel") {
        setCommandBarOpen(false);
        setIntentPaletteOpen(false);
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    });
  }, [bciMode, setCommandBarOpen, setIntentPaletteOpen, moveFocus]);

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
