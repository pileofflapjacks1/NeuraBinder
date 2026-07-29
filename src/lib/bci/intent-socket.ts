/**
 * Intent socket — Neurabridge-compatible ingress for NeuraBinder.
 *
 * Transports (computer-side / simulation only):
 * 1. window.postMessage  — parent iframe / Neurabeach embed
 * 2. BroadcastChannel    — multi-tab local loopback
 * 3. WebSocket client    — only when user connects OR NEXT_PUBLIC_INTENT_WS_URL is set
 *
 * Never auto-connects to ws://127.0.0.1 on deployed HTTPS hosts.
 */

import {
  genericIntentBus,
  type GenericIntentEvent,
  type IntentSource,
} from "@/lib/bci/generic-intent";

export const INTENT_MESSAGE_TYPE = "neurabinder.intent";
export const INTENT_MESSAGE_TYPE_ALT = "neurabridge.intent";
export const INTENT_CHANNEL = "neurabinder-intent";

/** Suggested local URL for `pnpm intent:ws` — not auto-connected in production */
export const LOCAL_DEV_WS_URL = "ws://127.0.0.1:7843";

export function defaultWsUrlForUi(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_INTENT_WS_URL) {
    return process.env.NEXT_PUBLIC_INTENT_WS_URL;
  }
  return LOCAL_DEV_WS_URL;
}

/** Alias kept for UI imports */
export const DEFAULT_WS_URL = defaultWsUrlForUi();

export type IntentSocketStatus =
  | "idle"
  | "connecting"
  | "open"
  | "closed"
  | "error";

export interface IntentSocketState {
  status: IntentSocketStatus;
  lastError?: string;
  lastEventAt?: number;
  transport: "none" | "postMessage" | "broadcast" | "websocket";
  wsUrl: string;
  received: number;
}

type StatusListener = (s: IntentSocketState) => void;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isLocalhostPage(): boolean {
  if (typeof window === "undefined") return true;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

/** Block accidental production → localhost WS (mixed content + connection refused spam) */
export function isWsUrlAllowed(url: string): boolean {
  try {
    const u = new URL(url);
    const targetLocal =
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname === "[::1]";
    if (targetLocal && typeof window !== "undefined" && !isLocalhostPage()) {
      return false;
    }
    // HTTPS page cannot use plain ws:// except to localhost on same machine
    if (
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      u.protocol === "ws:" &&
      !targetLocal
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function parseIntentPayload(
  raw: unknown,
  fallbackSource: IntentSource = "generic_intent"
): GenericIntentEvent | null {
  if (!isRecord(raw)) return null;

  let body: Record<string, unknown> = raw;
  if (
    (raw.type === INTENT_MESSAGE_TYPE ||
      raw.type === INTENT_MESSAGE_TYPE_ALT ||
      raw.type === "intent") &&
    isRecord(raw.event)
  ) {
    body = raw.event;
  }

  const kind = String(body.kind ?? body.type ?? "");
  const source = (body.source as IntentSource) || fallbackSource;
  const ts = typeof body.ts === "number" ? body.ts : Date.now();

  if (kind === "class_label" || kind === "label") {
    const label = body.label ?? body.class_label ?? body.value;
    if (label == null) return null;
    return {
      kind: "class_label",
      label: String(label),
      confidence:
        typeof body.confidence === "number" ? body.confidence : undefined,
      source,
      ts,
    };
  }

  if (kind === "switch_binary" || kind === "switch") {
    return {
      kind: "switch_binary",
      pressed: Boolean(body.pressed ?? body.value ?? body.down),
      source,
      ts,
    };
  }

  if (kind === "velocity_2d" || kind === "velocity") {
    return {
      kind: "velocity_2d",
      dx: Number(body.dx ?? body.x ?? 0),
      dy: Number(body.dy ?? body.y ?? 0),
      source,
      ts,
    };
  }

  if (kind === "synthetic") {
    return {
      kind: "synthetic",
      payload: isRecord(body.payload) ? body.payload : body,
      source,
      ts,
    };
  }

  if (body.label != null && !kind) {
    return {
      kind: "class_label",
      label: String(body.label),
      confidence:
        typeof body.confidence === "number" ? body.confidence : undefined,
      source,
      ts,
    };
  }

  return null;
}

export function envelopeIntent(event: GenericIntentEvent) {
  return {
    type: INTENT_MESSAGE_TYPE,
    event,
    v: 1,
  };
}

class IntentSocketClient {
  private ws: WebSocket | null = null;
  private bc: BroadcastChannel | null = null;
  private started = false;
  private state: IntentSocketState = {
    status: "idle",
    transport: "none",
    wsUrl: "",
    received: 0,
  };
  private listeners = new Set<StatusListener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private wantWs = false;
  private reconnectAttempts = 0;
  private readonly maxReconnects = 3;

  getState() {
    return this.state;
  }

  subscribe(fn: StatusListener) {
    this.listeners.add(fn);
    fn(this.state);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private setState(patch: Partial<IntentSocketState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }

  /** Start postMessage + BroadcastChannel. WebSocket is never automatic to localhost. */
  start(opts?: { wsUrl?: string; connectWs?: boolean }) {
    if (typeof window === "undefined") return;

    if (!this.started) {
      this.started = true;
      window.addEventListener("message", this.onWindowMessage);
      try {
        this.bc = new BroadcastChannel(INTENT_CHANNEL);
        this.bc.onmessage = (ev) => this.ingest(ev.data, "broadcast");
      } catch {
        /* Safari private etc. */
      }
      this.setState({
        status: "open",
        transport: "broadcast",
        lastError: undefined,
      });
    }

    const envUrl = process.env.NEXT_PUBLIC_INTENT_WS_URL?.trim();
    const explicit = opts?.wsUrl?.trim();

    // Auto-connect only when env URL is set AND allowed on this host
    if (envUrl && isWsUrlAllowed(envUrl)) {
      this.connectWebSocket(envUrl);
      return;
    }

    // Manual connect path requires a real URL + connectWs flag
    if (opts?.connectWs && explicit && isWsUrlAllowed(explicit)) {
      this.connectWebSocket(explicit);
      return;
    }

    if (opts?.connectWs && explicit && !isWsUrlAllowed(explicit)) {
      this.setState({
        status: "error",
        lastError:
          "Local WebSocket (127.0.0.1) is only available when running the app on localhost. Use postMessage/BroadcastChannel on Vercel, or set NEXT_PUBLIC_INTENT_WS_URL to a wss:// host.",
      });
    }
  }

  stop() {
    if (typeof window === "undefined") return;
    window.removeEventListener("message", this.onWindowMessage);
    this.bc?.close();
    this.bc = null;
    this.disconnectWebSocket();
    this.started = false;
    this.setState({ status: "closed", transport: "none" });
  }

  connectWebSocket(url?: string) {
    if (typeof window === "undefined") return;

    const wsUrl = (url ?? this.state.wsUrl ?? "").trim();
    if (!wsUrl) {
      this.setState({
        status: "error",
        lastError: "No WebSocket URL provided",
      });
      return;
    }

    if (!isWsUrlAllowed(wsUrl)) {
      this.wantWs = false;
      this.setState({
        status: "error",
        wsUrl,
        lastError:
          "Blocked: cannot open local ws://127.0.0.1 from the deployed site. Run `pnpm intent:ws` only with local `pnpm dev`.",
      });
      return;
    }

    this.wantWs = true;
    this.setState({ wsUrl, status: "connecting", transport: "websocket" });

    try {
      this.ws?.close();
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setState({
          status: "open",
          transport: "websocket",
          lastError: undefined,
        });
        try {
          ws.send(
            JSON.stringify({
              type: "neurabinder.hello",
              role: "ui",
              app: "neurabinder",
              v: 1,
            })
          );
        } catch {
          /* ignore */
        }
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(String(ev.data));
          this.ingest(data, "websocket");
        } catch {
          this.ingest(
            {
              kind: "class_label",
              label: String(ev.data),
              source: "websocket_intent",
            },
            "websocket"
          );
        }
      };

      ws.onerror = () => {
        // onclose will handle retry / final error
        this.setState({
          status: "error",
          lastError: "WebSocket error",
        });
      };

      ws.onclose = () => {
        this.ws = null;
        if (!this.wantWs) {
          this.setState({ status: this.started ? "open" : "closed" });
          return;
        }

        // Limited reconnect — never spam forever
        if (this.reconnectAttempts < this.maxReconnects) {
          this.reconnectAttempts += 1;
          const delay = 1500 * this.reconnectAttempts;
          this.setState({
            status: "closed",
            lastError: `WS closed — retry ${this.reconnectAttempts}/${this.maxReconnects}…`,
          });
          this.reconnectTimer = setTimeout(() => {
            if (this.wantWs) this.connectWebSocket(wsUrl);
          }, delay);
        } else {
          this.wantWs = false;
          this.setState({
            status: "error",
            lastError:
              "WebSocket unavailable (stopped retrying). Intent buttons, keyboard, and postMessage still work.",
          });
        }
      };
    } catch (e) {
      this.wantWs = false;
      this.setState({
        status: "error",
        lastError: e instanceof Error ? e.message : "WS failed",
      });
    }
  }

  disconnectWebSocket() {
    this.wantWs = false;
    this.reconnectAttempts = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    this.ws = null;
    this.setState({
      status: this.started ? "open" : "idle",
      transport: this.started ? "broadcast" : "none",
      lastError: undefined,
    });
  }

  broadcast(event: GenericIntentEvent) {
    const msg = envelopeIntent(event);
    try {
      this.bc?.postMessage(msg);
    } catch {
      /* ignore */
    }
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  postToParent(event: GenericIntentEvent) {
    if (typeof window === "undefined") return;
    window.parent?.postMessage(envelopeIntent(event), "*");
  }

  private onWindowMessage = (ev: MessageEvent) => {
    this.ingest(ev.data, "postMessage");
  };

  private ingest(
    data: unknown,
    transport: IntentSocketState["transport"]
  ) {
    const source: IntentSource =
      transport === "websocket"
        ? "websocket_intent"
        : transport === "postMessage"
          ? "generic_intent"
          : "synthetic";

    const event = parseIntentPayload(data, source);
    if (!event) return;

    genericIntentBus.publish(event);
    this.setState({
      lastEventAt: Date.now(),
      received: this.state.received + 1,
      transport,
      status: "open",
    });
  }
}

let singleton: IntentSocketClient | null = null;

export function getIntentSocket(): IntentSocketClient {
  if (!singleton) singleton = new IntentSocketClient();
  return singleton;
}
