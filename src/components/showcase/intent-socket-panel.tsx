"use client";

import { useEffect, useState } from "react";
import {
  LOCAL_DEV_WS_URL,
  defaultWsUrlForUi,
  envelopeIntent,
  getIntentSocket,
  isWsUrlAllowed,
  type IntentSocketState,
} from "@/lib/bci/intent-socket";
import { genericIntentBus } from "@/lib/bci/generic-intent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBciStore } from "@/lib/stores/bci-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function IntentSocketPanel() {
  const bciMode = useBciStore((s) => s.bciMode);
  const [state, setState] = useState<IntentSocketState | null>(null);
  const [wsUrl, setWsUrl] = useState(() => defaultWsUrlForUi());
  const [label, setLabel] = useState("select");
  const [onDeployedHost, setOnDeployedHost] = useState(false);

  useEffect(() => {
    const h = window.location.hostname;
    setOnDeployedHost(h !== "localhost" && h !== "127.0.0.1");
    const sock = getIntentSocket();
    // Listeners only — never open localhost WS from production
    sock.start({ connectWs: false });
    sock.disconnectWebSocket();
    return sock.subscribe(setState);
  }, []);

  const connect = () => {
    if (!isWsUrlAllowed(wsUrl)) {
      toast.error(
        "Local WebSocket only works with `pnpm dev` on your machine. On Vercel, use synthetic buttons / postMessage."
      );
      return;
    }
    getIntentSocket().connectWebSocket(wsUrl);
    toast.message(`Connecting ${wsUrl}`);
  };

  const sendLoopback = () => {
    const event = {
      kind: "class_label" as const,
      label,
      source: "synthetic" as const,
      ts: Date.now(),
      confidence: 1,
    };
    genericIntentBus.publish(event);
    getIntentSocket().broadcast(event);
    getIntentSocket().postToParent(event);
    toast.success(`Emitted ${label}`);
  };

  const copySnippet = () => {
    const sample = JSON.stringify(
      envelopeIntent({
        kind: "class_label",
        label: "select",
        source: "websocket_intent",
        ts: Date.now(),
        confidence: 0.98,
      }),
      null,
      2
    );
    void navigator.clipboard.writeText(sample);
    toast.success("Sample envelope copied");
  };

  return (
    <Card className={cn(bciMode && "border-2")}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          Intent socket
          {state && (
            <Badge
              variant={
                state.status === "open"
                  ? "success"
                  : state.status === "error"
                    ? "destructive"
                    : "secondary"
              }
            >
              {state.transport} · {statusLabel(state)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Always on:{" "}
          <code className="rounded bg-muted px-1">postMessage</code> +{" "}
          <code className="rounded bg-muted px-1">BroadcastChannel</code>.
          WebSocket is <strong>optional</strong> and only for local{" "}
          <code className="rounded bg-muted px-1">pnpm intent:ws</code>.
        </p>

        {onDeployedHost && (
          <p className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
            You are on the deployed site. Connections to{" "}
            <code className="rounded bg-muted px-1">{LOCAL_DEV_WS_URL}</code>{" "}
            are blocked (that server only runs on your laptop). Use the intent
            buttons above — the red console spam should stop after this deploy.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Input
            bci={bciMode}
            value={wsUrl}
            onChange={(e) => setWsUrl(e.target.value)}
            className="min-w-[220px] flex-1 font-mono text-xs"
            aria-label="WebSocket URL"
            disabled={onDeployedHost}
          />
          <Button
            size={bciMode ? "bci" : "default"}
            onClick={connect}
            disabled={onDeployedHost}
          >
            Connect WS
          </Button>
          <Button
            size={bciMode ? "bci" : "default"}
            variant="outline"
            onClick={() => getIntentSocket().disconnectWebSocket()}
          >
            Disconnect
          </Button>
        </div>
        {state?.lastError && (
          <p className="text-xs text-destructive">{state.lastError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Local only: <code className="rounded bg-muted px-1">pnpm intent:ws</code>{" "}
          then Connect · events received: {state?.received ?? 0}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            bci={bciMode}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-36"
            aria-label="Class label"
          />
          <Button size={bciMode ? "bci" : "default"} onClick={sendLoopback}>
            Emit loopback
          </Button>
          <Button
            size={bciMode ? "bci" : "default"}
            variant="secondary"
            onClick={copySnippet}
          >
            Copy JSON envelope
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function statusLabel(s: IntentSocketState) {
  return s.status;
}
