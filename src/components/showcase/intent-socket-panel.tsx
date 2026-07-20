"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_WS_URL,
  envelopeIntent,
  getIntentSocket,
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
  const [wsUrl, setWsUrl] = useState(DEFAULT_WS_URL);
  const [label, setLabel] = useState("select");

  useEffect(() => {
    const sock = getIntentSocket();
    sock.start({ connectWs: false });
    return sock.subscribe(setState);
  }, []);

  const connect = () => {
    getIntentSocket().start({ connectWs: true, wsUrl });
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
    // Local bus + broadcast to other tabs / WS peers
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
              {state.transport} · {state.status}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          NeuralBridge-compatible ingress:{" "}
          <code className="rounded bg-muted px-1">postMessage</code>,{" "}
          <code className="rounded bg-muted px-1">BroadcastChannel</code>,{" "}
          <code className="rounded bg-muted px-1">WebSocket</code>. Computer-side
          only.
        </p>
        <div className="flex flex-wrap gap-2">
          <Input
            bci={bciMode}
            value={wsUrl}
            onChange={(e) => setWsUrl(e.target.value)}
            className="min-w-[220px] flex-1 font-mono text-xs"
            aria-label="WebSocket URL"
          />
          <Button size={bciMode ? "bci" : "default"} onClick={connect}>
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
          Local server: <code className="rounded bg-muted px-1">pnpm intent:ws</code>{" "}
          → ws://127.0.0.1:7843 · received {state?.received ?? 0}
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
