"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CircleDollarSign,
  Command,
  Library,
  ListPlus,
  Puzzle,
  Search,
  Upload,
  BookOpen,
  ArrowLeftRight,
  Eye,
  Sparkles,
} from "lucide-react";
import { useBciStore } from "@/lib/stores/bci-store";
import { useActivityStore } from "@/lib/stores/activity-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ACTIONS = [
  {
    id: "find",
    label: "Find in collection",
    hint: "Open collection + search",
    href: "/collection",
    icon: Search,
    intent: "find",
  },
  {
    id: "add",
    label: "Add / Scan",
    hint: "Camera batch scan",
    href: "/scan",
    icon: Camera,
    intent: "add",
  },
  {
    id: "import",
    label: "Import CSV",
    hint: "TCGPlayer / Collectr / NeuraBinder",
    href: "/import",
    icon: Upload,
    intent: "add",
  },
  {
    id: "worth",
    label: "Portfolio worth",
    hint: "Value & P/L",
    href: "/portfolio",
    icon: CircleDollarSign,
    intent: "worth",
  },
  {
    id: "missing",
    label: "Master set gaps",
    hint: "Binder + cheapest path",
    href: "/binder",
    icon: Puzzle,
    intent: "missing",
  },
  {
    id: "trade",
    label: "Trade match",
    hint: "Want / have local peers",
    href: "/trade",
    icon: ArrowLeftRight,
    intent: "trade",
  },
  {
    id: "trade-calc",
    label: "Trade calculator",
    hint: "Balance offer vs want packages",
    href: "/trade/calculator",
    icon: CircleDollarSign,
    intent: "trade",
  },
  {
    id: "lists",
    label: "Lists",
    hint: "Want, trade, investment",
    href: "/lists",
    icon: ListPlus,
    intent: "find",
  },
  {
    id: "watch",
    label: "Watchlist & intel",
    hint: "Alerts + market notes",
    href: "/watch",
    icon: Eye,
    intent: "worth",
  },
  {
    id: "binder",
    label: "Visual binder",
    hint: "3×3 spatial pages",
    href: "/binder",
    icon: BookOpen,
    intent: "missing",
  },
  {
    id: "collection",
    label: "Collection grid",
    hint: "Full inventory",
    href: "/collection",
    icon: Library,
    intent: "find",
  },
  {
    id: "demo",
    label: "Public demo",
    hint: "Neurabeach showcase · synthetic intents",
    href: "/demo",
    icon: Sparkles,
    intent: "find",
  },
  {
    id: "a11y",
    label: "Accessibility scorecard",
    hint: "Keyboard, BCI, switch, contrast checks",
    href: "/a11y",
    icon: Sparkles,
    intent: "find",
  },
] as const;

export function IntentPalette() {
  const open = useBciStore((s) => s.intentPaletteOpen);
  const setOpen = useBciStore((s) => s.setIntentPaletteOpen);
  const bciMode = useBciStore((s) => s.bciMode);
  const setCommandBarOpen = useBciStore((s) => s.setCommandBarOpen);
  const playFeedback = useBciStore((s) => s.playFeedback);
  const log = useActivityStore((s) => s.log);
  const topPredicted = useActivityStore((s) => s.topPredicted);
  const setFilters = useCollectionStore((s) => s.setFilters);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);

  const predicted = topPredicted();

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    if (!needle) return [...ACTIONS];
    return ACTIONS.filter(
      (a) =>
        a.label.toLowerCase().includes(needle) ||
        a.hint.toLowerCase().includes(needle) ||
        a.id.includes(needle)
    );
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    setIdx(0);
  }, [q, open]);

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
        if (a) run(a.href, a.label, a.intent);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, idx]);

  const run = (href: string, label: string, intent?: string) => {
    log(label, { href, intent });
    playFeedback("select");
    if (intent === "missing") {
      setFilters({ setIds: ["sv3pt5"], missingForMasterSet: "sv3pt5" });
    }
    setOpen(false);
    setQ("");
    router.push(href);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Intent palette"
      onClick={() => setOpen(false)}
    >
      <div
        className={cn(
          "w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl",
          bciMode && "border-2"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Command className="h-4 w-4 text-primary" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Intent: find, add, trade, worth, missing…"
            className={cn(
              "flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground",
              bciMode && "h-12 text-base"
            )}
            aria-label="Filter intents"
          />
          <kbd className="rounded border border-border px-1.5 text-[10px] text-muted-foreground">
            esc
          </kbd>
        </div>

        {predicted.length > 0 && !q && (
          <div className="border-b border-border px-3 py-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Predicted for you
            </p>
            <div className="flex flex-wrap gap-2">
              {predicted.map((p) => (
                <Button
                  key={p.id}
                  size={bciMode ? "default" : "sm"}
                  variant="secondary"
                  onClick={() =>
                    p.href && run(p.href, p.label, p.intent)
                  }
                >
                  {p.label}
                </Button>
              ))}
              <Button
                size={bciMode ? "default" : "sm"}
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setCommandBarOpen(true);
                }}
              >
                Ask AI…
              </Button>
            </div>
          </div>
        )}

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
                    "flex w-full items-center gap-3 rounded-xl px-3 text-left transition-colors",
                    bciMode ? "py-4" : "py-2.5",
                    active ? "bg-primary/15 text-foreground" : "hover:bg-accent"
                  )}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => run(a.href, a.label, a.intent)}
                >
                  <Icon className="h-5 w-5 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{a.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {a.hint}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matching intents
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
