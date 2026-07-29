/**
 * Neurabridge client for NeuraBinder — computer-side only.
 *
 * Modes:
 * - off: disabled
 * - simulator: in-browser Neurabridge simulator (no extra process)
 * - remote: multi-client `neurabridge serve` (ws://127.0.0.1:7711)
 *
 * Maps suite vocabulary → NeuraBinder BciIntent via injectBciIntent / generic bus.
 */

import {
  Neurabridge,
  mapIntentionToSuiteLabel,
  type NeurabridgeOptions,
  type BridgeStatus,
} from "neurabridge";
import { injectBciIntent } from "@/lib/bci/generic-intent";
import { genericIntentBus } from "@/lib/bci/generic-intent";
import type { BciIntent } from "@/lib/types";

export type NeurabridgeMode = "off" | "simulator" | "remote";

export interface NeurabridgeClientConfig {
  mode: NeurabridgeMode;
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

export interface NeurabridgeClientState {
  mode: NeurabridgeMode;
  status: BridgeStatus | null;
  lastLabel: string | null;
  lastError: string | null;
  connected: boolean;
}

const DEFAULT_CONFIG: NeurabridgeClientConfig = {
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
  // Neurabridge focus → treat as next for scanning UIs
  focus: "next",
  click: "select",
};

type StateListener = (s: NeurabridgeClientState) => void;

/**
 * Singleton Neurabridge host for the NeuraBinder shell.
 */
class NeurabridgeClient {
  private bridge: Neurabridge | null = null;
  private unsubs: Array<() => void> = [];
  private config: NeurabridgeClientConfig = { ...DEFAULT_CONFIG };
  private state: NeurabridgeClientState = {
    mode: "off",
    status: null,
    lastLabel: null,
    lastError: null,
    connected: false,
  };
  private listeners = new Set<StateListener>();

  getConfig(): NeurabridgeClientConfig {
    return { ...this.config };
  }

  getState(): NeurabridgeClientState {
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

  private setState(partial: Partial<NeurabridgeClientState>) {
    this.state = { ...this.state, ...partial };
    this.emit();
  }

  /**
   * Apply config and (re)connect when mode !== off.
   */
  async start(config: Partial<NeurabridgeClientConfig> = {}): Promise<void> {
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
    this.bridge = new Neurabridge(options);

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
          new CustomEvent("neurabinder:neurabridge", {
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

  /** Inject a synthetic intention through Neurabridge policies (tests / UI). */
  inject(type: string, confidence = 0.95): void {
    this.bridge?.injectIntention(type, confidence, { via: "neurabinder-ui" });
  }

  playScenario(id: string): void {
    this.bridge?.playScenario(id);
  }

  getBridge(): Neurabridge | null {
    return this.bridge;
  }

  private buildOptions(): NeurabridgeOptions {
    const base: NeurabridgeOptions = {
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

let shared: NeurabridgeClient | null = null;

export function getNeurabridgeClient(): NeurabridgeClient {
  if (!shared) shared = new NeurabridgeClient();
  return shared;
}

export { DEFAULT_CONFIG as NEURABRIDGE_DEFAULT_CONFIG };
