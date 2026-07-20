"use client";

import Link from "next/link";
import { useShowcaseStore } from "@/lib/stores/showcase-store";
import { useBciStore } from "@/lib/stores/bci-store";
import { getIntentSocket, type IntentSocketState } from "@/lib/bci/intent-socket";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

export function ShowcaseBanner() {
  const enabled = useShowcaseStore((s) => s.enabled);
  const disable = useShowcaseStore((s) => s.disable);
  const bannerLabel = useShowcaseStore((s) => s.bannerLabel);
  const lockData = useShowcaseStore((s) => s.lockData);
  const bciMode = useBciStore((s) => s.bciMode);
  const [sock, setSock] = useState<IntentSocketState | null>(null);

  useEffect(() => {
    if (!enabled) return;
    return getIntentSocket().subscribe(setSock);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      className="border-b border-primary/40 bg-primary/15 px-4 py-2 text-sm"
      role="status"
      data-showcase="banner"
    >
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2">
        <Badge variant="default">Showcase</Badge>
        {bciMode && <Badge variant="secondary">BCI Mode</Badge>}
        {lockData && <Badge variant="outline">Data locked</Badge>}
        {sock && (
          <Badge
            variant={
              sock.status === "open"
                ? "success"
                : sock.status === "error"
                  ? "destructive"
                  : "secondary"
            }
          >
            intent:{sock.transport}/{sock.status}
            {sock.received ? ` · ${sock.received} rx` : ""}
          </Badge>
        )}
        <span className="text-muted-foreground">{bannerLabel}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link href="/demo">Demo console</Link>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => disable()}>
            Exit showcase
          </Button>
        </div>
      </div>
    </div>
  );
}
