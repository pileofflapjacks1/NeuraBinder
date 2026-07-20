"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { RecentAction } from "@/lib/types/features";

interface ActivityState {
  recent: RecentAction[];
  log: (label: string, opts?: { href?: string; intent?: string }) => void;
  topPredicted: () => RecentAction[];
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      recent: [
        {
          id: "r1",
          label: "Open collection",
          href: "/collection",
          intent: "find",
          at: new Date().toISOString(),
        },
        {
          id: "r2",
          label: "Scan card",
          href: "/scan",
          intent: "add",
          at: new Date().toISOString(),
        },
        {
          id: "r3",
          label: "Portfolio value",
          href: "/portfolio",
          intent: "worth",
          at: new Date().toISOString(),
        },
      ],

      log: (label, opts) => {
        const entry: RecentAction = {
          id: nanoid(),
          label,
          href: opts?.href,
          intent: opts?.intent,
          at: new Date().toISOString(),
        };
        set((s) => ({
          recent: [entry, ...s.recent.filter((r) => r.label !== label)].slice(
            0,
            30
          ),
        }));
      },

      topPredicted: () => {
        const counts = new Map<string, { action: RecentAction; n: number }>();
        for (const r of get().recent) {
          const key = r.href ?? r.label;
          const cur = counts.get(key);
          if (cur) cur.n++;
          else counts.set(key, { action: r, n: 1 });
        }
        return [...counts.values()]
          .sort((a, b) => b.n - a.n)
          .slice(0, 5)
          .map((x) => x.action);
      },
    }),
    { name: "neurabinder-activity" }
  )
);
