"use client";

/**
 * Undo/redo for collection snapshots.
 * Stores deep-cloned userCards (+ want ids) stacks.
 */

import { create } from "zustand";
import type { UserCard } from "@/lib/types";

const MAX = 40;

export interface HistorySnapshot {
  label: string;
  userCards: UserCard[];
  wantCardIds: string[];
  at: string;
}

interface HistoryState {
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  /** Push current state BEFORE a mutation */
  push: (snap: Omit<HistorySnapshot, "at">) => void;
  undo: () => HistorySnapshot | null;
  redo: () => HistorySnapshot | null;
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

function cloneCards(cards: UserCard[]): UserCard[] {
  return JSON.parse(JSON.stringify(cards)) as UserCard[];
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  past: [],
  future: [],

  push: (snap) => {
    set((s) => ({
      past: [
        ...s.past,
        {
          ...snap,
          userCards: cloneCards(snap.userCards),
          wantCardIds: [...snap.wantCardIds],
          at: new Date().toISOString(),
        },
      ].slice(-MAX),
      future: [],
    }));
  },

  undo: () => {
    const { past } = get();
    if (!past.length) return null;
    const prev = past[past.length - 1];
    set((s) => ({
      past: s.past.slice(0, -1),
    }));
    return prev;
  },

  redo: () => {
    const { future } = get();
    if (!future.length) return null;
    const next = future[future.length - 1];
    set((s) => ({
      future: s.future.slice(0, -1),
    }));
    return next;
  },

  clear: () => set({ past: [], future: [] }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));

/** Call before mutating collection: capture state for undo */
export function captureHistory(
  label: string,
  getState: () => { userCards: UserCard[]; wantCardIds: string[] }
) {
  const s = getState();
  useHistoryStore.getState().push({
    label,
    userCards: s.userCards,
    wantCardIds: s.wantCardIds,
  });
}
