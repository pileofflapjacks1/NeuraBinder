"use client";

/**
 * BCI-optimized camera scan flow.
 * Priority: confirmation UX with ranked candidates + ≤2–3 intentional signals.
 *
 * ROADMAP:
 * - Wire MediaStream + on-device / edge vision model
 * - Third-party card recognition API fallback
 * - Slab OCR for PSA/BGS/CGC labels
 * - Neural confirmation: look → propose → intent confirm
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, RefreshCw, X } from "lucide-react";
import { useBciStore } from "@/lib/stores/bci-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Card as TcgCard, CardCondition, ScanCandidate, VariantType } from "@/lib/types";
import { cn, formatCurrency, rarityLabel } from "@/lib/utils";
import { getBciAdapter } from "@/lib/bci/adapter";
import { toast } from "sonner";

type Phase = "idle" | "preview" | "candidates" | "confirmed";

function mockIdentify(catalog: TcgCard[]): ScanCandidate[] {
  // Simulate vision model: pick 3 ranked cards biased toward mid/high value
  const shuffled = [...catalog].sort(() => Math.random() - 0.5);
  const top = shuffled.slice(0, 3);
  return top.map((card, i) => ({
    cardId: card.id,
    card,
    confidence: Math.round((0.92 - i * 0.12 + Math.random() * 0.05) * 100) / 100,
    suggestedCondition: (["NM", "NM", "LP", "MP"] as CardCondition[])[
      Math.floor(Math.random() * 4)
    ],
    suggestedVariant: (card.rarity.includes("illustration")
      ? card.rarity
      : card.rarity === "enchanted"
        ? "enchanted"
        : "normal") as VariantType,
  }));
}

export function ScanFlow() {
  const bciMode = useBciStore((s) => s.bciMode);
  const catalog = useCollectionStore((s) => s.catalog);
  const addCard = useCollectionStore((s) => s.addCard);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [candidates, setCandidates] = useState<ScanCandidate[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase("preview");
    } catch {
      setCameraError(
        "Camera unavailable — you can still run a simulated scan for demo."
      );
      setPhase("preview");
    }
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  const captureAndIdentify = () => {
    setBusy(true);
    // Near-real-time placeholder: short delay then ranked candidates
    window.setTimeout(() => {
      const result = mockIdentify(catalog);
      setCandidates(result);
      setSelectedIdx(0);
      setPhase("candidates");
      setBusy(false);
      toast.message("Candidates ready — confirm top match or pick another");
    }, 450);
  };

  const confirmAdd = (listId = "list-collection") => {
    const c = candidates[selectedIdx];
    if (!c) return;
    addCard({
      cardId: c.cardId,
      quantity: 1,
      condition: c.suggestedCondition ?? "NM",
      language: "en",
      variant: c.suggestedVariant ?? "normal",
      isGraded: false,
      listIds: [listId],
      notes: `Added via scan (${Math.round(c.confidence * 100)}% confidence)`,
    });
    setPhase("confirmed");
    toast.success(`Added ${c.card.name}`);
  };

  // BCI intents for scan confirmation (≤2–3 signals)
  useEffect(() => {
    if (!bciMode || phase !== "candidates") return;
    const adapter = getBciAdapter();
    return adapter.onIntent((intent) => {
      if (intent === "next")
        setSelectedIdx((i) => (i + 1) % Math.max(candidates.length, 1));
      if (intent === "prev")
        setSelectedIdx(
          (i) =>
            (i - 1 + candidates.length) % Math.max(candidates.length, 1)
        );
      if (intent === "confirm" || intent === "select" || intent === "add") {
        confirmAdd();
      }
      if (intent === "cancel" || intent === "back") {
        setPhase("preview");
        setCandidates([]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bciMode, phase, candidates, selectedIdx]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1
          className={cn(
            "font-bold tracking-tight",
            bciMode ? "text-3xl" : "text-2xl"
          )}
        >
          Scan
        </h1>
        <p className="mt-1 text-muted-foreground">
          Look at a card → system proposes identity & condition → confirm with one
          action. Optimized for Neuralink discrete intents.
        </p>
      </div>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Camera + neural confirmation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(phase === "idle" || phase === "preview") && (
            <>
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-black/90">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  playsInline
                  muted
                  aria-label="Camera preview"
                />
                {phase === "idle" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                    <Camera className="h-12 w-12 opacity-60" />
                    <p className="text-sm opacity-80">Camera off</p>
                  </div>
                )}
                {/* Viewfinder guides — large for BCI spatial memory */}
                <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-white/40" />
              </div>

              {cameraError && (
                <p className="text-sm text-warning" role="alert">
                  {cameraError}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {phase === "idle" ? (
                  <Button
                    size={bciMode ? "bci" : "lg"}
                    onClick={() => void startCamera()}
                  >
                    <Camera className="h-4 w-4" />
                    Start camera
                  </Button>
                ) : (
                  <>
                    <Button
                      size={bciMode ? "bci" : "lg"}
                      onClick={captureAndIdentify}
                      disabled={busy}
                    >
                      {busy ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Identify card
                    </Button>
                    <Button
                      variant="outline"
                      size={bciMode ? "bci" : "lg"}
                      onClick={captureAndIdentify}
                    >
                      Simulate scan
                    </Button>
                    <Button
                      variant="ghost"
                      size={bciMode ? "bci" : "default"}
                      onClick={() => {
                        stopCamera();
                        setPhase("idle");
                      }}
                    >
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </>
          )}

          {phase === "candidates" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Top candidates with confidence.{" "}
                {bciMode && (
                  <span className="text-primary">
                    Enter to confirm · ←/→ to switch · Esc to cancel
                  </span>
                )}
              </p>
              <ul className="space-y-2" role="listbox" aria-label="Scan candidates">
                {candidates.map((c, i) => {
                  const selected = i === selectedIdx;
                  return (
                    <li key={c.cardId}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => setSelectedIdx(i)}
                        className={cn(
                          "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          bciMode && "min-h-[5rem] p-5",
                          selected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                            : "border-border hover:bg-accent/50"
                        )}
                      >
                        <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold">
                          #{i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "font-semibold",
                              bciMode ? "text-lg" : "text-base"
                            )}
                          >
                            {c.card.name}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {c.card.setName} · #{c.card.number} ·{" "}
                            {rarityLabel(c.card.rarity)}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <Badge>
                              {Math.round(c.confidence * 100)}% conf
                            </Badge>
                            <Badge variant="secondary">
                              {c.suggestedCondition}
                            </Badge>
                            <Badge variant="outline">
                              {c.suggestedVariant}
                            </Badge>
                          </div>
                        </div>
                        <span className="font-mono font-semibold text-primary">
                          {formatCurrency(c.card.marketPrice)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="flex flex-wrap gap-2">
                <Button
                  size={bciMode ? "bci" : "lg"}
                  onClick={() => confirmAdd()}
                >
                  <Check className="h-4 w-4" />
                  Confirm & add
                </Button>
                <Button
                  variant="outline"
                  size={bciMode ? "bci" : "lg"}
                  onClick={() => confirmAdd("list-trade")}
                >
                  Add to trade binder
                </Button>
                <Button
                  variant="ghost"
                  size={bciMode ? "bci" : "default"}
                  onClick={() => {
                    setPhase("preview");
                    setCandidates([]);
                  }}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          )}

          {phase === "confirmed" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success">
                <Check className="h-8 w-8" />
              </div>
              <p className={cn("font-semibold", bciMode ? "text-xl" : "text-lg")}>
                Added to collection
              </p>
              <div className="flex gap-2">
                <Button
                  size={bciMode ? "bci" : "default"}
                  onClick={() => {
                    setPhase("preview");
                    setCandidates([]);
                  }}
                >
                  Scan another
                </Button>
                <Button
                  variant="outline"
                  size={bciMode ? "bci" : "default"}
                  onClick={() => {
                    stopCamera();
                    setPhase("idle");
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
