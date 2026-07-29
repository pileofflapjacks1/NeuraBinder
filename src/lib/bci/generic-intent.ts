/**
 * Generic intent stream shapes for NeuraBinder.
 *
 * Compatible with future **Neurabridge** / suite middleware — not implant APIs.
 * Sources: synthetic (demo), keyboard, switch, velocity_2d (pointer/BCI cursor).
 *
 * safety_class: computer_side · simulation only today
 */

import type { BciIntent } from "@/lib/types";
import { getBciAdapter } from "@/lib/bci/adapter";

/** Stream kinds listed in neurabeach-manifest.json `inputs` */
export type IntentInputKind =
  | "class_label"
  | "switch_binary"
  | "velocity_2d"
  | "synthetic";

export type IntentSource =
  | "synthetic"
  | "keyboard"
  | "switch"
  | "pointer"
  | "generic_intent"
  | "websocket_intent"
  | "neuralink_sdk_future";

export interface ClassLabelEvent {
  kind: "class_label";
  label: BciIntent | string;
  confidence?: number;
  source: IntentSource;
  ts: number;
}

export interface SwitchBinaryEvent {
  kind: "switch_binary";
  pressed: boolean;
  source: IntentSource;
  ts: number;
}

export interface Velocity2dEvent {
  kind: "velocity_2d";
  dx: number;
  dy: number;
  source: IntentSource;
  ts: number;
}

export interface SyntheticEvent {
  kind: "synthetic";
  /** free-form demo payload */
  payload: Record<string, unknown>;
  source: IntentSource;
  ts: number;
}

export type GenericIntentEvent =
  | ClassLabelEvent
  | SwitchBinaryEvent
  | Velocity2dEvent
  | SyntheticEvent;

const CLASS_LABELS = new Set<BciIntent>([
  "select",
  "confirm",
  "cancel",
  "back",
  "search",
  "next",
  "prev",
  "add",
  "remove",
]);

type Listener = (ev: GenericIntentEvent) => void;

/**
 * In-process bus. Neurabridge can later publish here (or via WebSocket)
 * without NeuraBinder importing implant SDKs.
 */
class GenericIntentBus {
  private listeners = new Set<Listener>();
  private lastSwitch = false;

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  publish(ev: GenericIntentEvent) {
    this.listeners.forEach((l) => l(ev));
    this.routeToApp(ev);
  }

  /** Demo helper: fire a discrete class label (keyboard-equivalent) */
  emitClassLabel(
    label: BciIntent,
    source: IntentSource = "synthetic",
    confidence = 1
  ) {
    this.publish({
      kind: "class_label",
      label,
      confidence,
      source,
      ts: Date.now(),
    });
  }

  emitSwitch(pressed: boolean, source: IntentSource = "synthetic") {
    this.publish({
      kind: "switch_binary",
      pressed,
      source,
      ts: Date.now(),
    });
  }

  emitVelocity(dx: number, dy: number, source: IntentSource = "synthetic") {
    this.publish({
      kind: "velocity_2d",
      dx,
      dy,
      source,
      ts: Date.now(),
    });
  }

  private routeToApp(ev: GenericIntentEvent) {
    const adapter = getBciAdapter() as {
      isConnected: boolean;
      // Keyboard adapter has private handlers; use onIntent injection via synthetic keyboard path
      _inject?: (intent: BciIntent) => void;
    };

    // Prefer dispatching through a shared synthetic inject if present
    if (ev.kind === "class_label") {
      const label = String(ev.label);
      if (CLASS_LABELS.has(label as BciIntent)) {
        injectBciIntent(label as BciIntent);
      }
      return;
    }

    if (ev.kind === "switch_binary") {
      // rising edge → select (single-switch scanning pattern)
      if (ev.pressed && !this.lastSwitch) {
        injectBciIntent("select");
      }
      this.lastSwitch = ev.pressed;
      return;
    }

    if (ev.kind === "velocity_2d") {
      // Continuous cursor is OS/browser-owned; log for future Neurabridge cursor glue
      if (typeof window !== "undefined" && (window as unknown as { __nbVel?: unknown }).__nbVel) {
        // reserved
      }
      void adapter;
      return;
    }

    if (ev.kind === "synthetic" && typeof ev.payload.label === "string") {
      const label = ev.payload.label;
      if (CLASS_LABELS.has(label as BciIntent)) {
        injectBciIntent(label as BciIntent);
      }
    }
  }
}

/** Handlers registered by app shell for synthetic inject */
const injectHandlers = new Set<(intent: BciIntent) => void>();

export function onInjectedIntent(handler: (intent: BciIntent) => void) {
  injectHandlers.add(handler);
  return () => injectHandlers.delete(handler);
}

export function injectBciIntent(intent: BciIntent) {
  injectHandlers.forEach((h) => h(intent));
  // Also mirror to keyboard adapter subscribers via CustomEvent
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("neurabinder:intent", { detail: { intent } })
    );
  }
}

export const genericIntentBus = new GenericIntentBus();

export const DEMO_CLASS_LABELS: { label: BciIntent; hint: string }[] = [
  { label: "select", hint: "Enter / Space" },
  { label: "confirm", hint: "Shift+Enter" },
  { label: "cancel", hint: "Esc" },
  { label: "search", hint: "/" },
  { label: "next", hint: "→ / n" },
  { label: "prev", hint: "← / p" },
  { label: "add", hint: "a" },
  { label: "back", hint: "Backspace" },
  { label: "remove", hint: "r" },
];
