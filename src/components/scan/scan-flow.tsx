"use client";

/**
 * BCI-optimized camera + batch scan queue.
 * Mock identification locally; vision API is a later plug-in.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, Layers, RefreshCw, X } from "lucide-react";
import { useBciStore } from "@/lib/stores/bci-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { useScanStore } from "@/lib/stores/scan-store";
import { useLotsStore } from "@/lib/stores/lots-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency, rarityLabel } from "@/lib/utils";
import { getBciAdapter } from "@/lib/bci/adapter";
import { toast } from "sonner";
import { useActivityStore } from "@/lib/stores/activity-store";

export function ScanFlow() {
  const bciMode = useBciStore((s) => s.bciMode);
  const profile = useBciStore((s) => s.profile);
  const playFeedback = useBciStore((s) => s.playFeedback);
  const catalog = useCollectionStore((s) => s.catalog);
  const addCard = useCollectionStore((s) => s.addCard);
  const addLot = useLotsStore((s) => s.addLot);
  const log = useActivityStore((s) => s.log);

  const queue = useScanStore((s) => s.queue);
  const activeId = useScanStore((s) => s.activeId);
  const enqueueSimulated = useScanStore((s) => s.enqueueSimulated);
  const setActive = useScanStore((s) => s.setActive);
  const selectCandidate = useScanStore((s) => s.selectCandidate);
  const confirm = useScanStore((s) => s.confirm);
  const reject = useScanStore((s) => s.reject);
  const clearDone = useScanStore((s) => s.clearDone);
  const pendingCount = useScanStore((s) => s.pendingCount);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const active = queue.find((q) => q.id === activeId) ??
    queue.find((q) => q.status === "pending");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
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
      setCameraOn(true);
    } catch {
      setCameraError("Camera unavailable — try “Try sample” below instead.");
      setCameraOn(false);
    }
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  const captureToQueue = () => {
    setBusy(true);
    window.setTimeout(() => {
      enqueueSimulated(catalog, profile.scanAutoRankAggressive);
      setBusy(false);
      playFeedback("select");
      toast.message("Scan added to queue");
      log("Scan card", { href: "/scan", intent: "add" });
    }, 350);
  };

  const batchSimulate = (n: number) => {
    for (let i = 0; i < n; i++) {
      enqueueSimulated(catalog, profile.scanAutoRankAggressive);
    }
    toast.success(`Queued ${n} simulated scans`);
  };

  const confirmActive = (listId = "list-collection") => {
    if (!active || active.status !== "pending") return;
    const c = active.candidates[active.selectedIndex];
    if (!c) return;
    const id = addCard({
      cardId: c.cardId,
      quantity: 1,
      condition: c.suggestedCondition ?? "NM",
      language: "en",
      variant: c.suggestedVariant ?? "normal",
      isGraded: false,
      listIds: [listId],
      notes: `Scan ${Math.round(c.confidence * 100)}% conf`,
      purchasePrice: c.card.marketPrice,
      purchaseDate: new Date().toISOString().slice(0, 10),
    });
    addLot({
      userCardId: id,
      quantity: 1,
      unitCost: c.card.marketPrice ?? 0,
      fees: 0,
      purchasedAt: new Date().toISOString().slice(0, 10),
      notes: "From scan",
    });
    confirm(active.id);
    playFeedback("success");
    toast.success(`Added ${c.card.name}`);
  };

  useEffect(() => {
    if (!bciMode || !active || active.status !== "pending") return;
    const adapter = getBciAdapter();
    return adapter.onIntent((intent) => {
      if (intent === "next")
        selectCandidate(
          active.id,
          (active.selectedIndex + 1) % active.candidates.length
        );
      if (intent === "prev")
        selectCandidate(
          active.id,
          (active.selectedIndex - 1 + active.candidates.length) %
            active.candidates.length
        );
      if (intent === "confirm" || intent === "select" || intent === "add") {
        confirmActive();
      }
      if (intent === "cancel") reject(active.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bciMode, active]);

  const pending = queue.filter((q) => q.status === "pending");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1
          className={cn(
            "font-bold tracking-tight",
            bciMode ? "text-3xl" : "text-2xl"
          )}
        >
          Add by photo
        </h1>
        <p className="mt-1 text-muted-foreground">
          Take a photo (or try a sample), pick the right card, confirm.{" "}
          <Badge variant="secondary">{pendingCount()} waiting</Badge>
        </p>
      </div>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Capture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-black/90">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
              aria-label="Camera preview"
            />
            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                <Camera className="h-12 w-12 opacity-60" />
                <p className="text-sm opacity-80">Camera off</p>
              </div>
            )}
            <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-white/40" />
          </div>
          {cameraError && (
            <p className="text-sm text-warning" role="alert">
              {cameraError}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {!cameraOn ? (
              <Button size={bciMode ? "bci" : "lg"} onClick={() => void startCamera()}>
                <Camera className="h-4 w-4" />
                Start camera
              </Button>
            ) : (
              <Button
                size={bciMode ? "bci" : "lg"}
                onClick={captureToQueue}
                disabled={busy}
              >
                {busy ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Capture → queue
              </Button>
            )}
            <Button
              variant="outline"
              size={bciMode ? "bci" : "lg"}
              onClick={captureToQueue}
            >
              Try sample
            </Button>
            <Button
              variant="secondary"
              size={bciMode ? "bci" : "lg"}
              onClick={() => batchSimulate(5)}
            >
              <Layers className="h-4 w-4" />
              Try 5 samples
            </Button>
            {cameraOn && (
              <Button variant="ghost" size={bciMode ? "bci" : "default"} onClick={stopCamera}>
                Stop
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {active && active.status === "pending" && (
        <Card className={cn(bciMode && "border-2")}>
          <CardHeader>
            <CardTitle>Confirm top match</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {bciMode &&
                "Enter confirm · ←/→ cycle · Esc reject · auto-rank prefers #1"}
            </p>
            <ul className="space-y-2" role="listbox">
              {active.candidates.map((c, i) => {
                const selected = i === active.selectedIndex;
                return (
                  <li key={c.cardId}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => selectCandidate(active.id, i)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-2xl border p-4 text-left",
                        bciMode && "min-h-[5rem] p-5",
                        selected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                          : "border-border hover:bg-accent/50"
                      )}
                    >
                      <div className="flex h-12 w-10 items-center justify-center rounded-lg bg-muted text-xs font-bold">
                        #{i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("font-semibold", bciMode && "text-lg")}>
                          {c.card.name}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {c.card.setName} · #{c.card.number} ·{" "}
                          {rarityLabel(c.card.rarity)}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge>{Math.round(c.confidence * 100)}%</Badge>
                          <Badge variant="secondary">
                            {c.suggestedCondition}
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
              <Button size={bciMode ? "bci" : "lg"} onClick={() => confirmActive()}>
                <Check className="h-4 w-4" />
                Confirm & add
              </Button>
              <Button
                variant="outline"
                size={bciMode ? "bci" : "lg"}
                onClick={() => confirmActive("list-trade")}
              >
                Add to trade
              </Button>
              <Button
                variant="ghost"
                size={bciMode ? "bci" : "default"}
                onClick={() => {
                  reject(active.id);
                  playFeedback("error");
                }}
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Queue ({pending.length} pending)</CardTitle>
          <Button size="sm" variant="ghost" onClick={clearDone}>
            Clear done
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {queue.length === 0 && (
            <p className="text-sm text-muted-foreground">Queue empty.</p>
          )}
          {queue.map((q) => {
            const top = q.candidates[0];
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setActive(q.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-3 text-left text-sm",
                  bciMode ? "py-3" : "py-2",
                  q.id === active?.id
                    ? "border-primary bg-primary/10"
                    : "border-border"
                )}
              >
                <span>
                  {top?.card.name ?? "Scan"}{" "}
                  <Badge variant="outline" className="ml-1">
                    {q.status}
                  </Badge>
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(q.createdAt).toLocaleTimeString()}
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
