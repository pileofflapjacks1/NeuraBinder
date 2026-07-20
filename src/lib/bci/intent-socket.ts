/**
 * Intent socket — NeuralBridge-compatible ingress for NeuraBinder.
 *
 * Transports (all computer-side / simulation):
 * 1. window.postMessage  — parent iframe / Neurabeach embed
 * 2. BroadcastChannel    — multi-tab local loopback
 * 3. WebSocket client    — NeuralBridge or `pnpm intent:ws`
 *
 * Wire format (JSON):
 * {
 *   "type": "neurabinder.intent" | "neuralbridge.intent",
 *   "event": {
 *     "kind": "class_label" | "switch_binary" | "velocity_2d" | "synthetic",
 *     ...fields
 *   }
 * }
 *
 * Not implant I/O. No medical claims.
 */

import {
  genericIntentBus,
  type GenericIntentEvent,
  type IntentSource,
} from "@/lib/bci/generic-intent";

export const INTENT_MESSAGE_TYPE = "neurabinder.intent";
export const INTENT_MESSAGE_TYPE_ALT = "neuralbridge.intent";
export const INTENT_CHANNEL = "neurabinder-intent";
export const DEFAULT_WS_URL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_INTENT_WS_URL
    ? process.env.NEXT_PUBLIC_INTENT_WS_URL
    : "ws://127.0.0.1:7843";

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

/** Normalize external payloads into GenericIntentEvent */
export function parseIntentPayload(
  raw: unknown,
  fallbackSource: IntentSource = "generic_intent"
): GenericIntentEvent | null {
  if (!isRecord(raw)) return null;

  // Envelope: { type, event } or { type, kind, ... }
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

  // Shorthand: { label: "select" }
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
    wsUrl: DEFAULT_WS_URL,
    received: 0,
  };
  private listeners = new Set<StatusListener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private wantWs = false;

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

  /** Start postMessage + BroadcastChannel (+ optional WS) */
  start(opts?: { wsUrl?: string; connectWs?: boolean }) {
    if (typeof window === "undefined") return;
    if (this.started) {
      if (opts?.connectWs) this.connectWebSocket(opts.wsUrl);
      return;
    }
    this.started = true;
    if (opts?.wsUrl) this.state.wsUrl = opts.wsUrl;

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

    if (opts?.connectWs !== false) {
      // Auto-connect when showcase wants it or env URL set
      const envOn = Boolean(process.env.NEXT_PUBLIC_INTENT_WS_URL);
      if (opts?.connectWs || envOn) {
        this.connectWebSocket(opts?.wsUrl);
      }
    }
  }

  stop() {
    if (typeof window === "undefined") return;
    window.removeEventListener("message", this.onWindowMessage);
    this.bc?.close();
    this.bc = null;
    this.wantWs = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.started = false;
    this.setState({ status: "closed", transport: "none" });
  }

  connectWebSocket(url?: string) {
    if (typeof window === "undefined") return;
    const wsUrl = url ?? this.state.wsUrl ?? DEFAULT_WS_URL;
    this.wantWs = true;
    this.setState({ wsUrl, status: "connecting", transport: "websocket" });

    try {
      this.ws?.close();
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        this.setState({
          status: "open",
          transport: "websocket",
          lastError: undefined,
        });
        // hello so bridges know we're a UI consumer
        ws.send(
          JSON.stringify({
            type: "neurabinder.hello",
            role: "ui",
            app: "neurabinder",
            v: 1,
          })
        );
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(String(ev.data));
          this.ingest(data, "websocket");
        } catch {
          // plain label string
          this.ingest(
            { kind: "class_label", label: String(ev.data), source: "websocket_intent" },
            "websocket"
          );
        }
      };

      ws.onerror = () => {
        this.setState({
          status: "error",
          lastError: "WebSocket error (is intent:ws running?)",
        });
      };

      ws.onclose = () => {
        this.ws = null;
        if (this.wantWs) {
          this.setState({ status: "closed", lastError: "WS closed — retrying…" });
          this.reconnectTimer = setTimeout(() => {
            if (this.wantWs) this.connectWebSocket(wsUrl);
          }, 2000);
        } else {
          this.setState({ status: "closed" });
        }
      };
    } catch (e) {
      this.setState({
        status: "error",
        lastError: e instanceof Error ? e.message : "WS failed",
      });
    }
  }

  disconnectWebSocket() {
    this.wantWs = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.setState({
      status: this.started ? "open" : "idle",
      transport: this.started ? "broadcast" : "none",
    });
  }

  /** Publish to BC + optional WS (for local tooling) */
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

  /** Send to parent frame (Neurabeach embed host) */
  postToParent(event: GenericIntentEvent) {
    if (typeof window === "undefined") return;
    window.parent?.postMessage(envelopeIntent(event), "*");
  }

  private onWindowMessage = (ev: MessageEvent) => {
    // Accept same-origin or any parent demo host (showcase embeds)
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
