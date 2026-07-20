"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, Sparkles, X } from "lucide-react";
import { useBciStore } from "@/lib/stores/bci-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { runLocalAiQuery } from "@/lib/ai/query-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AiQueryResult } from "@/lib/types";
import { toast } from "sonner";

const EXAMPLES = [
  "Show me all Illustration Rares I own under $40",
  "What am I missing for a master set of Scarlet & Violet 151?",
  "Cards that have risen more than 30% in the last 90 days",
  "How much is my entire graded Pokémon collection worth right now?",
  "Suggest trades from my trade binder",
];

interface CommandBarProps {
  compact?: boolean;
}

export function CommandBar({ compact }: CommandBarProps) {
  const bciMode = useBciStore((s) => s.bciMode);
  const open = useBciStore((s) => s.commandBarOpen);
  const setOpen = useBciStore((s) => s.setCommandBarOpen);
  const voiceEnabled = useBciStore((s) => s.voiceEnabled);

  const setFilters = useCollectionStore((s) => s.setFilters);
  const setSort = useCollectionStore((s) => s.setSort);
  const getItems = useCollectionStore((s) => s.getItems);
  const catalog = useCollectionStore((s) => s.catalog);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiQueryResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const runQuery = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (!q) return;
      setLoading(true);
      try {
        // Prefer local privacy-first engine; optionally enhance via API
        let res = runLocalAiQuery(q, getItems(), catalog);

        if (process.env.NEXT_PUBLIC_ENABLE_CLOUD_AI === "true") {
          try {
            const apiRes = await fetch("/api/ai/query", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query: q }),
            });
            if (apiRes.ok) {
              const data = (await apiRes.json()) as AiQueryResult;
              if (data.answer) res = { ...res, ...data };
            }
          } catch {
            /* keep local */
          }
        }

        setResult(res);
        if (res.filters) setFilters(res.filters);
        if (res.sort) setSort(res.sort);
        toast.success("Query applied to collection");
      } finally {
        setLoading(false);
      }
    },
    [catalog, getItems, setFilters, setSort]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runQuery(query);
  };

  const startVoice = () => {
    // Secondary modality — Web Speech API when available
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

  return (
    <div className="relative w-full">
      <form
        onSubmit={onSubmit}
        className={cn("flex w-full items-center gap-2", bciMode && "gap-3")}
        role="search"
        aria-label="Natural language collection query"
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
            placeholder={
              bciMode
                ? "Think it: “Illustration Rares under $40”…"
                : "Ask your collection… e.g. Illustration Rares under $40"
            }
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
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Go"
          )}
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

      {open && !compact && (
        <div
          id="nl-command-results"
          className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-border bg-card p-3 shadow-xl"
          role="region"
          aria-live="polite"
        >
          {result?.answer && (
            <div className="mb-3 rounded-xl bg-primary/10 p-3 text-sm leading-relaxed">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                {result.interpretation}
              </p>
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: result.answer
                    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\n/g, "<br/>"),
                }}
              />
            </div>
          )}
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Try
          </p>
          <ul className="flex flex-col gap-1">
            {EXAMPLES.map((ex) => (
              <li key={ex}>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-xl px-3 text-left text-sm text-foreground hover:bg-accent",
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
      )}

      {/* Compact expanded panel under header bar */}
      {open && compact && (result || query.length === 0) && (
        <div
          id="nl-command-results"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[50vh] overflow-auto rounded-2xl border border-border bg-card p-3 shadow-xl"
          role="region"
          aria-live="polite"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Command results
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
          {result?.answer ? (
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
              {result.items && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Applied filters · {result.items.length} matches in view
                </p>
              )}
            </div>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
}

// Minimal SpeechRecognition types for TS
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
