"use client";

import { useEffect, useState } from "react";
import {
  getNeuralBridgeClient,
  type NeuralBridgeClientConfig,
  type NeuralBridgeClientState,
  type NeuralBridgeMode,
} from "@/lib/bci/neuralbridge-client";
import { useBciStore } from "@/lib/stores/bci-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STORAGE_KEY = "neurabinder.neuralbridge.config";

function loadStored(): Partial<NeuralBridgeClientConfig> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<NeuralBridgeClientConfig>) : {};
  } catch {
    return {};
  }
}

function saveStored(cfg: NeuralBridgeClientConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // ignore
  }
}

/**
 * Settings / showcase panel: connect NeuraBinder to NeuralBridge
 * (in-app simulator or multi-client service).
 */
export function NeuralBridgePanel() {
  const bciMode = useBciStore((s) => s.bciMode);
  const setBciMode = useBciStore((s) => s.setBciMode);
  const [state, setState] = useState<NeuralBridgeClientState | null>(null);
  const [mode, setMode] = useState<NeuralBridgeMode>("off");
  const [remoteUrl, setRemoteUrl] = useState("ws://127.0.0.1:7711");
  const [role, setRole] = useState<"controller" | "observer">("controller");
  const [token, setToken] = useState("");
  const [clientName, setClientName] = useState("neurabinder");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stored = loadStored();
    if (stored.mode) setMode(stored.mode);
    if (stored.remoteUrl) setRemoteUrl(stored.remoteUrl);
    if (stored.remoteRole) setRole(stored.remoteRole);
    if (stored.remoteToken) setToken(stored.remoteToken);
    if (stored.clientName) setClientName(stored.clientName);

    const client = getNeuralBridgeClient();
    return client.subscribe(setState);
  }, []);

  // Optional: auto-enable BCI mode when bridge connects
  useEffect(() => {
    const onEvt = (e: Event) => {
      const d = (e as CustomEvent<{ connected?: boolean }>).detail;
      if (d?.connected) setBciMode(true);
    };
    window.addEventListener("neurabinder:neuralbridge", onEvt);
    return () => window.removeEventListener("neurabinder:neuralbridge", onEvt);
  }, [setBciMode]);

  const apply = async (nextMode: NeuralBridgeMode) => {
    setBusy(true);
    const cfg: NeuralBridgeClientConfig = {
      mode: nextMode,
      remoteUrl,
      remoteRole: role,
      remoteToken: token || undefined,
      clientName,
      forceBciMode: true,
      scenario: "navigation",
    };
    saveStored(cfg);
    setMode(nextMode);
    try {
      await getNeuralBridgeClient().start(cfg);
      if (nextMode === "off") {
        toast.message("NeuralBridge disconnected");
      } else {
        toast.success(
          nextMode === "simulator"
            ? "NeuralBridge simulator connected"
            : `NeuralBridge remote (${role}) connecting…`,
        );
        setBciMode(true);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start NeuralBridge");
    } finally {
      setBusy(false);
    }
  };

  const connected = state?.connected ?? false;
  const statusLabel = state?.status?.connection.state ?? "—";

  return (
    <Card className={cn(bciMode && "border-2")}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">NeuralBridge</CardTitle>
        <div className="flex flex-wrap gap-1">
          <Badge variant={connected ? "default" : "secondary"}>
            {mode === "off" ? "off" : statusLabel}
          </Badge>
          {state?.lastLabel && (
            <Badge variant="outline">last: {state.lastLabel}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-muted-foreground">
          Suite intent middleware — simulator in-browser, or multi-client{" "}
          <code className="text-xs">neuralbridge serve</code> as controller /
          observer. Maps vocabulary (click→select, next, confirm, …) into
          NeuraBinder intents.
        </p>

        <div className="grid gap-2 sm:grid-cols-3">
          <label className="space-y-1 sm:col-span-1">
            <span className="text-xs text-muted-foreground">Mode</span>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={mode}
              onChange={(e) => setMode(e.target.value as NeuralBridgeMode)}
              disabled={busy}
            >
              <option value="off">Off</option>
              <option value="simulator">Simulator (in-app)</option>
              <option value="remote">Remote service</option>
            </select>
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs text-muted-foreground">Remote URL</span>
            <Input
              bci={bciMode}
              value={remoteUrl}
              onChange={(e) => setRemoteUrl(e.target.value)}
              placeholder="ws://127.0.0.1:7711"
              disabled={busy || mode !== "remote"}
            />
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Role</span>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "controller" | "observer")
              }
              disabled={busy || mode !== "remote"}
            >
              <option value="controller">controller</option>
              <option value="observer">observer</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Token</span>
            <Input
              bci={bciMode}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="optional"
              disabled={busy || mode !== "remote"}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Client name</span>
            <Input
              bci={bciMode}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              disabled={busy}
            />
          </label>
        </div>

        {state?.lastError && (
          <p className="text-sm text-destructive">{state.lastError}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            size={bciMode ? "bci" : "default"}
            disabled={busy}
            onClick={() => void apply(mode)}
          >
            {mode === "off" ? "Apply (disconnect)" : "Connect"}
          </Button>
          <Button
            size={bciMode ? "bci" : "default"}
            variant="outline"
            disabled={busy || mode === "off"}
            onClick={() => void apply("off")}
          >
            Disconnect
          </Button>
          <Button
            size={bciMode ? "bci" : "default"}
            variant="secondary"
            disabled={busy || !connected}
            onClick={() => {
              getNeuralBridgeClient().inject("click", 0.95);
              toast.message("Injected click → select");
            }}
          >
            Inject click
          </Button>
          <Button
            size={bciMode ? "bci" : "default"}
            variant="secondary"
            disabled={busy || !connected || mode !== "simulator"}
            onClick={() => {
              getNeuralBridgeClient().playScenario("navigation");
              toast.message("Playing navigation scenario");
            }}
          >
            Play navigation
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Terminal:{" "}
          <code>cd ~/Projects/neuralbridge && npm run service</code>
          {" · "}
          Dashboard:{" "}
          <a
            className="underline"
            href="http://127.0.0.1:7711/"
            target="_blank"
            rel="noreferrer"
          >
            http://127.0.0.1:7711/
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
