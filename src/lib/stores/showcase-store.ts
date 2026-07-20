"use client";

/**
 * Showcase mode — Neurabeach / talk demos.
 * Forces BCI-friendly UI, freezes collection mutations that destroy the story,
 * and enables intent socket auto-connect.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ShowcaseState {
  enabled: boolean;
  /** When true, reset-to-seed / restore backup / bulk delete blocked */
  lockData: boolean;
  /** Auto-open guided tour once per enable */
  autoTour: boolean;
  /** Connect intent socket on load */
  autoIntentSocket: boolean;
  /** Label shown in chrome */
  bannerLabel: string;

  enable: (opts?: Partial<Pick<ShowcaseState, "lockData" | "autoTour" | "autoIntentSocket" | "bannerLabel">>) => void;
  disable: () => void;
  setEnabled: (on: boolean) => void;
}

const DEFAULT_BANNER = "Showcase mode · seed data · synthetic intents";

export const useShowcaseStore = create<ShowcaseState>()(
  persist(
    (set) => ({
      enabled: false,
      lockData: true,
      autoTour: true,
      autoIntentSocket: true,
      bannerLabel: DEFAULT_BANNER,

      enable: (opts) =>
        set({
          enabled: true,
          lockData: opts?.lockData ?? true,
          autoTour: opts?.autoTour ?? true,
          autoIntentSocket: opts?.autoIntentSocket ?? true,
          bannerLabel: opts?.bannerLabel ?? DEFAULT_BANNER,
        }),

      disable: () =>
        set({
          enabled: false,
        }),

      setEnabled: (on) =>
        set((s) =>
          on
            ? {
                enabled: true,
                lockData: s.lockData,
                autoTour: s.autoTour,
                autoIntentSocket: s.autoIntentSocket,
              }
            : { enabled: false }
        ),
    }),
    {
      name: "neurabinder-showcase",
      partialize: (s) => ({
        enabled: s.enabled,
        lockData: s.lockData,
        autoTour: s.autoTour,
        autoIntentSocket: s.autoIntentSocket,
        bannerLabel: s.bannerLabel,
      }),
    }
  )
);

/** Query helpers for URL: ?showcase=1 */
export function parseShowcaseQuery(search: string): boolean {
  const q = new URLSearchParams(search);
  const v = q.get("showcase") ?? q.get("demo");
  return v === "1" || v === "true" || v === "on";
}
