"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mic, Sparkles, X } from "lucide-react";
import { useBciStore } from "@/lib/stores/bci-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { useAlertsStore } from "@/lib/stores/alerts-store";
import { runLocalAiWithActions } from "@/lib/ai/actions";
import type { AiResultWithActions } from "@/lib/ai/actions";
import type { AiAction } from "@/lib/types/features";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CollectionFilters, CollectionSort } from "@/lib/types";
import { toast } from "sonner";
import { useActivityStore } from "@/lib/stores/activity-store";

const EXAMPLES = [
  "Pikachu",
  "Cards under $40",
  "How much is my collection worth?",
  "Show graded cards",
];

interface CommandBarProps {
  compact?: boolean;
}

export function CommandBar({ compact }: CommandBarProps) {
  const bciMode = useBciStore((s) => s.bciMode);
  const open = useBciStore((s) => s.commandBarOpen);
  const setOpen = useBciStore((s) => s.setCommandBarOpen);
  const voiceEnabled = useBciStore((s) => s.voiceEnabled);
  const playFeedback = useBciStore((s) => s.playFeedback);

  const setFilters = useCollectionStore((s) => s.setFilters);
  const setSort = useCollectionStore((s) => s.setSort);
  const getItems = useCollectionStore((s) => s.getItems);
  const catalog = useCollectionStore((s) => s.catalog);
  const addCard = useCollectionStore((s) => s.addCard);
  const addWantCard = useCollectionStore((s) => s.addWantCard);
  const addToList = useCollectionStore((s) => s.addToList);
  const adjustQuantity = useCollectionStore((s) => s.adjustQuantity);
  const addAlert = useAlertsStore((s) => s.addAlert);
  const log = useActivityStore((s) => s.log);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResultWithActions | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const executeAction = useCallback(
    (action: AiAction) => {
      switch (action.type) {
        case "set_filters": {
          const f = action.payload.filters as CollectionFilters | undefined;
          const s = action.payload.sort as CollectionSort | undefined;
          if (f) setFilters(f);
          if (s) setSort(s);
          router.push("/collection");
          break;
        }
        case "add_card":
          addCard(action.payload as never);
          break;
        case "add_to_want":
          addWantCard(String(action.payload.cardId));
          break;
        case "move_to_list":
          addToList(
            String(action.payload.userCardId),
            String(action.payload.listId)
          );
          break;
        case "adjust_quantity":
          adjustQuantity(
            String(action.payload.userCardId),
            Number(action.payload.delta ?? 1)
          );
          break;
        case "create_alert":
          addAlert({
            cardId: String(action.payload.cardId),
            cardName: String(action.payload.cardName),
            direction: action.payload.direction as "below" | "above",
            targetPrice: Number(action.payload.targetPrice),
          });
          break;
        case "navigate":
          router.push(String(action.payload.href));
          break;
        default:
          break;
      }
      playFeedback("success");
      log(action.label, {
        href:
          action.type === "navigate"
            ? String(action.payload.href)
            : "/collection",
        intent: "find",
      });
      toast.success(action.label);
    },
    [
      setFilters,
      setSort,
      addCard,
      addWantCard,
      addToList,
      adjustQuantity,
      addAlert,
      router,
      playFeedback,
      log,
    ]
  );

  const runQuery = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (!q) return;
      setLoading(true);
      try {
        const res = runLocalAiWithActions(q, getItems(), catalog);
        setResult(res);
        if (res.filters) setFilters(res.filters);
        if (res.sort) setSort(res.sort);
        playFeedback("select");
        toast.success("Found results — tap a step below if you need one");
      } finally {
        setLoading(false);
      }
    },
    [catalog, getItems, setFilters, setSort, playFeedback]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runQuery(query);
  };

  const startVoice = () => {
    const SR =
      typeof window !== "undefined"
        ? (
            window as unknown as {
              SpeechRecognition?: new () => SpeechRecognition;
              webkitSpeechRecognition?: new () => SpeechRecognition;
            }
          ).SpeechRecognition ||
          (
            window as unknown as {
              webkitSpeechRecognition?: new () => SpeechRecognition;
            }
          ).webkitSpeechRecognition
        : undefined;
    if (!SR) {
      toast.error("Voice input not supported in this browser");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      const text = ev.results[0]?.[0]?.transcript ?? "";
      setQuery(text);
      void runQuery(text);
    };
    rec.onerror = () => toast.error("Voice recognition error");
    rec.start();
    toast.message("Listening…");
  };

  const resultsPanel = (
    <div
      id="nl-command-results"
      className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[55vh] overflow-auto rounded-2xl border border-border bg-card p-3 shadow-xl"
      role="region"
      aria-live="polite"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Results
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
      {result?.answer && (
        <div className="mb-3 rounded-xl bg-primary/10 p-3 text-sm leading-relaxed">
          <p className="mb-1 text-xs font-semibold text-primary">
            {result.interpretation}
          </p>
          <p
            dangerouslySetInnerHTML={{
              __html: result.answer.replace(
                /\*\*(.+?)\*\*/g,
                "<strong>$1</strong>"
              ),
            }}
          />
        </div>
      )}
      {result?.actions && result.actions.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Suggested next steps
          </p>
          <div className="flex flex-col gap-1">
            {result.actions.map((a, i) => (
              <Button
                key={`${a.type}-${i}`}
                variant={i === 0 ? "default" : "outline"}
                size={bciMode ? "bci" : "default"}
                className="justify-start"
                onClick={() => executeAction(a)}
              >
                {a.label}
              </Button>
            ))}
          </div>
        </div>
      )}
      <p className="mb-2 text-xs font-medium text-muted-foreground">Try</p>
      <ul className="flex flex-col gap-1">
        {EXAMPLES.map((ex) => (
          <li key={ex}>
            <button
              type="button"
              className={cn(
                "w-full rounded-xl px-3 text-left text-sm hover:bg-accent",
                bciMode ? "py-3" : "py-2"
              )}
              onClick={() => {
                setQuery(ex);
                void runQuery(ex);
              }}
            >
              {ex}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="relative w-full">
      <form
        onSubmit={onSubmit}
        className={cn("flex w-full items-center gap-2", bciMode && "gap-3")}
        role="search"
        aria-label="Search your collection"
      >
        <div className="relative flex-1">
          <Sparkles
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary"
            aria-hidden
          />
          <Input
            id="nl-command-input"
            ref={inputRef}
            bci={bciMode}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Card name or “how much is my collection?”"
            className="pl-10 pr-10"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="nl-command-results"
          />
          {query && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setQuery("");
                setResult(null);
              }}
              aria-label="Clear query"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          size={bciMode ? "bci" : "default"}
          disabled={loading}
          aria-label="Run query"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go"}
        </Button>
        {(voiceEnabled || bciMode) && (
          <Button
            type="button"
            variant="outline"
            size={bciMode ? "icon-bci" : "icon"}
            onClick={startVoice}
            aria-label="Voice input"
          >
            <Mic className="h-4 w-4" />
          </Button>
        )}
      </form>

      {open && (compact || !compact) && resultsPanel}
    </div>
  );
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  start: () => void;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
}
interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
