/**
 * NeuralBridge client for NeuraBinder — computer-side only.
 *
 * Modes:
 * - off: disabled
 * - simulator: in-browser NeuralBridge simulator (no extra process)
 * - remote: multi-client `neuralbridge serve` (ws://127.0.0.1:7711)
 *
 * Maps suite vocabulary → NeuraBinder BciIntent via injectBciIntent / generic bus.
 */

import {
  NeuralBridge,
  mapIntentionToSuiteLabel,
  type NeuralBridgeOptions,
  type BridgeStatus,
} from "neuralbridge";
import { injectBciIntent } from "@/lib/bci/generic-intent";
import { genericIntentBus } from "@/lib/bci/generic-intent";
import type { BciIntent } from "@/lib/types";

export type NeuralBridgeMode = "off" | "simulator" | "remote";

export interface NeuralBridgeClientConfig {
  mode: NeuralBridgeMode;
  /** Remote service URL when mode=remote */
  remoteUrl: string;
  remoteRole: "controller" | "observer";
  remoteToken?: string;
  clientName: string;
  /** Auto-enable BCI density when connected */
  forceBciMode?: boolean;
  /** Scenario pack when using simulator */
  scenario?: string;
}

export interface NeuralBridgeClientState {
  mode: NeuralBridgeMode;
  status: BridgeStatus | null;
  lastLabel: string | null;
  lastError: string | null;
  connected: boolean;
}

const DEFAULT_CONFIG: NeuralBridgeClientConfig = {
  mode: "off",
  remoteUrl: "ws://127.0.0.1:7711",
  remoteRole: "controller",
  clientName: "neurabinder",
  forceBciMode: true,
  scenario: "navigation",
};

const SUITE_TO_BCI: Record<string, BciIntent> = {
  select: "select",
  confirm: "confirm",
  cancel: "cancel",
  back: "back",
  prev: "prev",
  next: "next",
  search: "search",
  add: "add",
  remove: "remove",
  // NeuralBridge focus → treat as next for scanning UIs
  focus: "next",
  click: "select",
};

type StateListener = (s: NeuralBridgeClientState) => void;

/**
 * Singleton NeuralBridge host for the NeuraBinder shell.
 */
class NeuralBridgeClient {
  private bridge: NeuralBridge | null = null;
  private unsubs: Array<() => void> = [];
  private config: NeuralBridgeClientConfig = { ...DEFAULT_CONFIG };
  private state: NeuralBridgeClientState = {
    mode: "off",
    status: null,
    lastLabel: null,
    lastError: null,
    connected: false,
  };
  private listeners = new Set<StateListener>();

  getConfig(): NeuralBridgeClientConfig {
    return { ...this.config };
  }

  getState(): NeuralBridgeClientState {
    return { ...this.state };
  }

  subscribe(fn: StateListener): () => void {
    this.listeners.add(fn);
    fn(this.getState());
    return () => this.listeners.delete(fn);
  }

  private emit() {
    const snap = this.getState();
    this.listeners.forEach((l) => l(snap));
  }

  private setState(partial: Partial<NeuralBridgeClientState>) {
    this.state = { ...this.state, ...partial };
    this.emit();
  }

  /**
   * Apply config and (re)connect when mode !== off.
   */
  async start(config: Partial<NeuralBridgeClientConfig> = {}): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.stop();

    if (this.config.mode === "off") {
      this.setState({
        mode: "off",
        status: null,
        connected: false,
        lastError: null,
      });
      return;
    }

    if (typeof window === "undefined") return;

    const options = this.buildOptions();
    this.bridge = new NeuralBridge(options);

    this.unsubs.push(
      this.bridge.on("connectionChange", (s) => {
        this.setState({
          connected:
            s.state === "connected" || s.state === "degraded",
          status: this.bridge?.getStatus() ?? null,
          lastError:
            s.state === "error" ? s.message ?? "Connection error" : null,
        });
      }),
      this.bridge.on("intention", (ev) => {
        this.handleIntention(ev.type, ev.confidence, ev.source);
      }),
      this.bridge.on("error", (err) => {
        this.setState({ lastError: err.message });
      }),
    );

    this.setState({ mode: this.config.mode, lastError: null });

    try {
      await this.bridge.connect();
      this.setState({
        connected: true,
        status: this.bridge.getStatus(),
      });
      if (this.config.forceBciMode) {
        // Soft signal to app store without hard import cycle
        window.dispatchEvent(
          new CustomEvent("neurabinder:neuralbridge", {
            detail: { connected: true, mode: this.config.mode },
          }),
        );
      }
    } catch (e) {
      this.setState({
        connected: false,
        lastError: e instanceof Error ? e.message : String(e),
      });
    }
  }

  async stop(): Promise<void> {
    for (const u of this.unsubs) u();
    this.unsubs = [];
    if (this.bridge) {
      try {
        await this.bridge.disconnect();
      } catch {
        // ignore
      }
      this.bridge.dispose();
      this.bridge = null;
    }
    this.setState({
      connected: false,
      status: null,
      mode: this.config.mode === "off" ? "off" : this.config.mode,
    });
  }

  /** Inject a synthetic intention through NeuralBridge policies (tests / UI). */
  inject(type: string, confidence = 0.95): void {
    this.bridge?.injectIntention(type, confidence, { via: "neurabinder-ui" });
  }

  playScenario(id: string): void {
    this.bridge?.playScenario(id);
  }

  getBridge(): NeuralBridge | null {
    return this.bridge;
  }

  private buildOptions(): NeuralBridgeOptions {
    const base: NeuralBridgeOptions = {
      autoConnect: false,
      logLevel: "warn",
      enableFallbackToMouseKeyboard: false,
      policies: {
        intentions: {
          confidenceThreshold: 0.5,
          cooldownMs: 280,
        },
      },
    };

    if (this.config.mode === "simulator") {
      return {
        ...base,
        backend: "simulator",
        simulator: {
          enableInputMapping: true,
          debugOverlay: false,
          scenario: this.config.scenario || undefined,
          simulateSignalDegradation: false,
        },
      };
    }

    // remote multi-client service
    return {
      ...base,
      backend: "remote",
      remote: {
        url: this.config.remoteUrl,
        role: this.config.remoteRole,
        token: this.config.remoteToken,
        clientName: this.config.clientName,
        clientId: `neurabinder-${this.config.clientName}`,
        autoReconnect: true,
      },
    };
  }

  private handleIntention(
    type: string,
    confidence: number,
    source?: string,
  ): void {
    const suite =
      mapIntentionToSuiteLabel(type, { fallback: null }) ?? type;
    const bci = SUITE_TO_BCI[suite] ?? SUITE_TO_BCI[type];
    if (!bci) {
      // Allow direct BciIntent labels through
      const direct = [
        "select",
        "confirm",
        "cancel",
        "back",
        "search",
        "next",
        "prev",
        "add",
        "remove",
      ];
      if (!direct.includes(type)) {
        this.setState({ lastLabel: `${type}?` });
        return;
      }
    }
    const label = (bci ?? type) as BciIntent;
    this.setState({ lastLabel: label });

    genericIntentBus.publish({
      kind: "class_label",
      label,
      confidence,
      source: "generic_intent",
      ts: Date.now(),
    });
    injectBciIntent(label);

    void source;
  }
}

let shared: NeuralBridgeClient | null = null;

export function getNeuralBridgeClient(): NeuralBridgeClient {
  if (!shared) shared = new NeuralBridgeClient();
  return shared;
}

export { DEFAULT_CONFIG as NEURALBRIDGE_DEFAULT_CONFIG };
