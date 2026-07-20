/**
 * BCI / Neuralink integration surface for NeuraBinder.
 *
 * ROADMAP — Neuralink SDK integration points:
 * 1. Replace KeyboardBciAdapter with NeuralinkWebBridge when SDK ships.
 * 2. Map discrete neural intents → BciIntent (select, confirm, cancel, back, search).
 * 3. Optional continuous cursor deltas via onCursorDelta for high-bandwidth control.
 * 4. Future sensory feedback via sendFeedback (haptic / neural stimulation hooks).
 * 5. WebHID/WebUSB bridge placeholder for interim research hardware.
 *
 * Design principle: the app never blocks on BCI. Keyboard, mouse, touch, and
 * screen readers remain first-class. BCI Mode only changes density, ranking,
 * and target size — not availability of features.
 */

import type { BciAdapter, BciIntent } from "@/lib/types";

type IntentHandler = (intent: BciIntent) => void;

/**
 * Keyboard-emulated BCI adapter for development and accessibility.
 * Key bindings (when BCI Mode focus is active):
 *   Enter / Space → select/confirm
 *   Escape → cancel
 *   Backspace → back
 *   / → search
 *   n / ArrowRight → next
 *   p / ArrowLeft → prev
 *   a → add
 *   r → remove
 */
export class KeyboardBciAdapter implements BciAdapter {
  isConnected = true;
  private handlers = new Set<IntentHandler>();
  private listening = false;

  private onKeyDown = (e: KeyboardEvent) => {
    // Don't steal typing from inputs unless meta command
    const target = e.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    const isTyping =
      tag === "input" ||
      tag === "textarea" ||
      target?.isContentEditable;

    if (isTyping && e.key !== "Escape") return;

    let intent: BciIntent | null = null;
    switch (e.key) {
      case "Enter":
        intent = e.shiftKey ? "confirm" : "select";
        break;
      case " ":
        if (!isTyping) intent = "select";
        break;
      case "Escape":
        intent = "cancel";
        break;
      case "Backspace":
        if (!isTyping) intent = "back";
        break;
      case "/":
        if (!isTyping) {
          e.preventDefault();
          intent = "search";
        }
        break;
      case "n":
      case "ArrowRight":
        if (!isTyping) intent = "next";
        break;
      case "p":
      case "ArrowLeft":
        if (!isTyping) intent = "prev";
        break;
      case "a":
        if (!isTyping) intent = "add";
        break;
      case "r":
        if (!isTyping) intent = "remove";
        break;
      default:
        break;
    }

    if (intent) {
      this.handlers.forEach((h) => h(intent!));
    }
  };

  start() {
    if (this.listening || typeof window === "undefined") return;
    window.addEventListener("keydown", this.onKeyDown);
    this.listening = true;
  }

  stop() {
    if (!this.listening || typeof window === "undefined") return;
    window.removeEventListener("keydown", this.onKeyDown);
    this.listening = false;
  }

  onIntent(handler: IntentHandler): () => void {
    this.handlers.add(handler);
    this.start();
    return () => {
      this.handlers.delete(handler);
      if (this.handlers.size === 0) this.stop();
    };
  }
}

/** Stub for future Neuralink hardware bridge */
export class NeuralinkBridgeAdapter implements BciAdapter {
  isConnected = false;

  onIntent(_handler: IntentHandler): () => void {
    // ROADMAP: subscribe to Neuralink intent stream
    console.info(
      "[NeuraBinder BCI] NeuralinkBridgeAdapter not yet connected — using fallback"
    );
    return () => {};
  }

  onCursorDelta(_handler: (dx: number, dy: number) => void): () => void {
    // ROADMAP: high-bandwidth cursor
    return () => {};
  }

  sendFeedback(_payload: { type: string; intensity?: number }): void {
    // ROADMAP: sensory feedback
  }
}

let sharedAdapter: KeyboardBciAdapter | null = null;

export function getBciAdapter(): BciAdapter {
  if (typeof window === "undefined") {
    return new NeuralinkBridgeAdapter();
  }
  if (!sharedAdapter) {
    sharedAdapter = new KeyboardBciAdapter();
  }
  return sharedAdapter;
}
