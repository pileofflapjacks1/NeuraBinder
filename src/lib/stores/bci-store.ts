"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DensityMode = "comfortable" | "bci" | "compact";

interface BciState {
  /** Enlarged targets, reduced density, predictive ranking */
  bciMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  density: DensityMode;
  /** Index of currently focused item for discrete next/prev navigation */
  focusIndex: number;
  /** Whether command bar should steal focus (intent: search) */
  commandBarOpen: boolean;
  /** Voice input enabled as secondary modality */
  voiceEnabled: boolean;

  setBciMode: (on: boolean) => void;
  toggleBciMode: () => void;
  setHighContrast: (on: boolean) => void;
  setReducedMotion: (on: boolean) => void;
  setDensity: (d: DensityMode) => void;
  setFocusIndex: (i: number) => void;
  moveFocus: (delta: number, max: number) => void;
  setCommandBarOpen: (open: boolean) => void;
  setVoiceEnabled: (on: boolean) => void;
}

export const useBciStore = create<BciState>()(
  persist(
    (set, get) => ({
      bciMode: false,
      highContrast: false,
      reducedMotion: false,
      density: "comfortable",
      focusIndex: 0,
      commandBarOpen: false,
      voiceEnabled: false,

      setBciMode: (on) =>
        set({
          bciMode: on,
          density: on ? "bci" : "comfortable",
        }),
      toggleBciMode: () => {
        const next = !get().bciMode;
        set({
          bciMode: next,
          density: next ? "bci" : "comfortable",
        });
      },
      setHighContrast: (on) => set({ highContrast: on }),
      setReducedMotion: (on) => set({ reducedMotion: on }),
      setDensity: (d) => set({ density: d, bciMode: d === "bci" }),
      setFocusIndex: (i) => set({ focusIndex: Math.max(0, i) }),
      moveFocus: (delta, max) => {
        if (max <= 0) return;
        const cur = get().focusIndex;
        const next = ((cur + delta) % max + max) % max;
        set({ focusIndex: next });
      },
      setCommandBarOpen: (open) => set({ commandBarOpen: open }),
      setVoiceEnabled: (on) => set({ voiceEnabled: on }),
    }),
    {
      name: "neurabinder-bci",
      partialize: (s) => ({
        bciMode: s.bciMode,
        highContrast: s.highContrast,
        reducedMotion: s.reducedMotion,
        density: s.density,
        voiceEnabled: s.voiceEnabled,
      }),
    }
  )
);
