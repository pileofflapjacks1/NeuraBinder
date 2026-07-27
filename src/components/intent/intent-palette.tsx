"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Camera,
  Library,
  LineChart,
  Search,
  Settings,
  Upload,
  Award,
  List,
} from "lucide-react";
import { useBciStore } from "@/lib/stores/bci-store";
import { useActivityStore } from "@/lib/stores/activity-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ACTIONS = [
  {
    id: "cards",
    label: "My cards",
    hint: "Browse your collection",
    href: "/collection",
    icon: Library,
  },
  {
    id: "search",
    label: "Search",
    hint: "Find a card by name",
    href: "/collection",
    icon: Search,
    openSearch: true,
  },
  {
    id: "binder",
    label: "Set binder",
    hint: "See set pages and missing cards",
    href: "/binder",
    icon: BookOpen,
  },
  {
    id: "value",
    label: "What it’s worth",
    hint: "Portfolio totals",
    href: "/portfolio",
    icon: LineChart,
  },
  {
    id: "scan",
    label: "Add with camera",
    hint: "Photo → confirm card",
    href: "/scan",
    icon: Camera,
  },
  {
    id: "import",
    label: "Import spreadsheet",
    hint: "CSV from TCG apps",
    href: "/import",
    icon: Upload,
  },
  {
    id: "lists",
    label: "Want & trade lists",
    href: "/lists",
    icon: List,
  },
  {
    id: "grading",
    label: "Grading tracker",
    href: "/grading",
    icon: Award,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
] as const;

export function IntentPalette() {
  const open = useBciStore((s) => s.intentPaletteOpen);
  const setOpen = useBciStore((s) => s.setIntentPaletteOpen);
  const bciMode = useBciStore((s) => s.bciMode);
  const setCommandBarOpen = useBciStore((s) => s.setCommandBarOpen);
  const log = useActivityStore((s) => s.log);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    if (!needle) return [...ACTIONS];
    return ACTIONS.filter(
      (a) =>
        a.label.toLowerCase().includes(needle) ||
        ("hint" in a && a.hint?.toLowerCase().includes(needle))
    );
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => setIdx(0), [q, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIdx((i) => Math.min(filtered.length - 1, i + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setIdx((i) => Math.max(0, i - 1));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const a = filtered[idx];
        if (a) run(a);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, idx]);

  const run = (a: (typeof ACTIONS)[number]) => {
    log(a.label, { href: a.href });
    setOpen(false);
    setQ("");
    if ("openSearch" in a && a.openSearch) {
      setCommandBarOpen(true);
    }
    router.push(a.href);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Go to"
      onClick={() => setOpen(false)}
    >
      <div
        className={cn(
          "w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl",
          bciMode && "border-2"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-3 py-2">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Where do you want to go?"
            className={cn(
              "w-full bg-transparent text-base outline-none placeholder:text-muted-foreground",
              bciMode ? "h-12" : "h-10"
            )}
            aria-label="Filter destinations"
          />
        </div>
        <ul className="max-h-[50vh] overflow-auto p-2" role="listbox">
          {filtered.map((a, i) => {
            const Icon = a.icon;
            const active = i === idx;
            return (
              <li key={a.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 text-left",
                    bciMode ? "py-4" : "py-3",
                    active ? "bg-primary/15" : "hover:bg-accent"
                  )}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => run(a)}
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <span>
                    <span className="block font-medium">{a.label}</span>
                    {"hint" in a && a.hint && (
                      <span className="block text-xs text-muted-foreground">
                        {a.hint}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="border-t border-border px-3 py-2 text-center text-xs text-muted-foreground">
          Tip: press ⌘K anytime
        </p>
      </div>
    </div>
  );
}
