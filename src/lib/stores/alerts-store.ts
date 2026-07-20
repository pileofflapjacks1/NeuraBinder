"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { PriceAlert, WatchItem } from "@/lib/types/features";
import type { Card } from "@/lib/types";

interface AlertsState {
  alerts: PriceAlert[];
  watchlist: WatchItem[];
  lastEvaluatedAt?: string;

  addAlert: (input: Omit<PriceAlert, "id" | "createdAt" | "active"> & { active?: boolean }) => string;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  evaluateAlerts: (catalog: Card[]) => PriceAlert[];

  addWatch: (cardId: string, note?: string) => void;
  removeWatch: (id: string) => void;
  isWatched: (cardId: string) => boolean;
}

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set, get) => ({
      alerts: [
        {
          id: "alert-demo",
          cardId: "sv4pt5-227",
          cardName: "Iono",
          direction: "below",
          targetPrice: 100,
          active: true,
          createdAt: new Date().toISOString(),
        },
      ],
      watchlist: [
        {
          id: "watch-1",
          cardId: "sv8pt5-100",
          note: "Chase — watch for dips",
          createdAt: new Date().toISOString(),
        },
      ],
      lastEvaluatedAt: undefined,

      addAlert: (input) => {
        const id = nanoid();
        const alert: PriceAlert = {
          ...input,
          id,
          active: input.active ?? true,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ alerts: [...s.alerts, alert] }));
        return id;
      },

      removeAlert: (id) =>
        set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),

      toggleAlert: (id) =>
        set((s) => ({
          alerts: s.alerts.map((a) =>
            a.id === id ? { ...a, active: !a.active } : a
          ),
        })),

      evaluateAlerts: (catalog) => {
        const priceMap = new Map(catalog.map((c) => [c.id, c.marketPrice ?? 0]));
        const now = new Date().toISOString();
        const triggered: PriceAlert[] = [];
        set((s) => ({
          lastEvaluatedAt: now,
          alerts: s.alerts.map((a) => {
            if (!a.active) return a;
            const price = priceMap.get(a.cardId);
            if (price == null) return a;
            const hit =
              a.direction === "below"
                ? price <= a.targetPrice
                : price >= a.targetPrice;
            const next = {
              ...a,
              lastPrice: price,
              triggeredAt: hit ? now : a.triggeredAt,
            };
            if (hit) triggered.push(next);
            return next;
          }),
        }));
        return triggered;
      },

      addWatch: (cardId, note) => {
        if (get().watchlist.some((w) => w.cardId === cardId)) return;
        set((s) => ({
          watchlist: [
            ...s.watchlist,
            {
              id: nanoid(),
              cardId,
              note,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      removeWatch: (id) =>
        set((s) => ({
          watchlist: s.watchlist.filter((w) => w.id !== id),
        })),

      isWatched: (cardId) => get().watchlist.some((w) => w.cardId === cardId),
    }),
    { name: "neurabinder-alerts" }
  )
);
