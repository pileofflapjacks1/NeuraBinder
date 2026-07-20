"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BciProfile } from "@/lib/types/features";

export type DensityMode = "comfortable" | "bci" | "compact";

const defaultProfile: BciProfile = {
  targetSize: "large",
  dwellMs: 800,
  useDwell: false,
  confirmTimeoutMs: 2500,
  scanAutoRankAggressive: true,
  intentOnlyMode: false,
  switchScanMs: 1200,
  soundFeedback: false,
  calibrated: false,
};

interface BciState {
  bciMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  density: DensityMode;
  focusIndex: number;
  commandBarOpen: boolean;
  voiceEnabled: boolean;
  intentPaletteOpen: boolean;
  profile: BciProfile;
  switchScanEnabled: boolean;
  online: boolean;
  queuedOps: number;

  setBciMode: (on: boolean) => void;
  toggleBciMode: () => void;
  setHighContrast: (on: boolean) => void;
  setReducedMotion: (on: boolean) => void;
  setDensity: (d: DensityMode) => void;
  setFocusIndex: (i: number) => void;
  moveFocus: (delta: number, max: number) => void;
  setCommandBarOpen: (open: boolean) => void;
  setVoiceEnabled: (on: boolean) => void;
  setIntentPaletteOpen: (open: boolean) => void;
  updateProfile: (p: Partial<BciProfile>) => void;
  setSwitchScanEnabled: (on: boolean) => void;
  setOnline: (on: boolean) => void;
  setQueuedOps: (n: number) => void;
  playFeedback: (kind: "success" | "error" | "select") => void;
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
      intentPaletteOpen: false,
      profile: defaultProfile,
      switchScanEnabled: false,
      online: true,
      queuedOps: 0,

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
      setIntentPaletteOpen: (open) => set({ intentPaletteOpen: open }),
      updateProfile: (p) =>
        set((s) => ({ profile: { ...s.profile, ...p } })),
      setSwitchScanEnabled: (on) => set({ switchScanEnabled: on }),
      setOnline: (on) => set({ online: on }),
      setQueuedOps: (n) => set({ queuedOps: n }),

      playFeedback: (kind) => {
        const { profile } = get();
        if (!profile.soundFeedback || typeof window === "undefined") return;
        try {
          const ctx = new AudioContext();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value =
            kind === "success" ? 880 : kind === "error" ? 220 : 520;
          g.gain.value = 0.04;
          o.start();
          o.stop(ctx.currentTime + 0.08);
          // ROADMAP: NeuralinkBridgeAdapter.sendFeedback({ type: kind })
        } catch {
          /* ignore */
        }
      },
    }),
    {
      name: "neurabinder-bci",
      partialize: (s) => ({
        bciMode: s.bciMode,
        highContrast: s.highContrast,
        reducedMotion: s.reducedMotion,
        density: s.density,
        voiceEnabled: s.voiceEnabled,
        profile: s.profile,
        switchScanEnabled: s.switchScanEnabled,
      }),
    }
  )
);
