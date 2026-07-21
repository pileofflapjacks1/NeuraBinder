/**
 * Record / replay generic intent streams for talks and tests.
 * Fully local — no network.
 */

import {
  genericIntentBus,
  type GenericIntentEvent,
} from "@/lib/bci/generic-intent";

export interface RecordedIntent {
  /** ms from recording start */
  t: number;
  event: GenericIntentEvent;
}

export interface IntentTape {
  id: string;
  name: string;
  createdAt: string;
  durationMs: number;
  events: RecordedIntent[];
}

type Status = "idle" | "recording" | "playing";

type Listener = (s: {
  status: Status;
  events: RecordedIntent[];
  playIndex: number;
  durationMs: number;
}) => void;

const MAX_EVENTS = 500;
const MAX_MS = 120_000;

class IntentRecorder {
  private status: Status = "idle";
  private events: RecordedIntent[] = [];
  private startAt = 0;
  private unsub: (() => void) | null = null;
  private playTimers: ReturnType<typeof setTimeout>[] = [];
  private playIndex = 0;
  private listeners = new Set<Listener>();
  private tapes: IntentTape[] = [];

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn(this.snapshot());
    return () => {
      this.listeners.delete(fn);
    };
  }

  private snapshot() {
    return {
      status: this.status,
      events: this.events,
      playIndex: this.playIndex,
      durationMs:
        this.events.length > 0
          ? this.events[this.events.length - 1].t
          : 0,
    };
  }

  private emit() {
    const s = this.snapshot();
    this.listeners.forEach((l) => l(s));
  }

  getTapes() {
    return this.tapes;
  }

  startRecording() {
    this.stopPlayback();
    if (this.unsub) this.unsub();
    this.events = [];
    this.startAt = performance.now();
    this.status = "recording";
    this.unsub = genericIntentBus.subscribe((ev) => {
      if (this.status !== "recording") return;
      const t = Math.round(performance.now() - this.startAt);
      if (t > MAX_MS) {
        this.stopRecording();
        return;
      }
      this.events.push({ t, event: { ...ev, ts: Date.now() } });
      if (this.events.length >= MAX_EVENTS) this.stopRecording();
      this.emit();
    });
    this.emit();
  }

  stopRecording(): IntentTape | null {
    if (this.unsub) {
      this.unsub();
      this.unsub = null;
    }
    if (this.status !== "recording") {
      this.status = "idle";
      this.emit();
      return null;
    }
    this.status = "idle";
    const durationMs =
      this.events.length > 0 ? this.events[this.events.length - 1].t : 0;
    const tape: IntentTape = {
      id: `tape-${Date.now()}`,
      name: `Session ${new Date().toLocaleTimeString()}`,
      createdAt: new Date().toISOString(),
      durationMs,
      events: [...this.events],
    };
    if (tape.events.length) {
      this.tapes = [tape, ...this.tapes].slice(0, 10);
      this.persistTapes();
    }
    this.emit();
    return tape.events.length ? tape : null;
  }

  clearBuffer() {
    this.events = [];
    this.playIndex = 0;
    this.emit();
  }

  play(events?: RecordedIntent[]) {
    const list = events ?? this.events;
    if (!list.length) return;
    this.stopPlayback();
    this.status = "playing";
    this.playIndex = 0;
    this.emit();

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const timer = setTimeout(() => {
        // republish without re-recording
        genericIntentBus.publish({
          ...item.event,
          source: item.event.source ?? "synthetic",
          ts: Date.now(),
        });
        this.playIndex = i + 1;
        this.emit();
        if (i === list.length - 1) {
          this.status = "idle";
          this.emit();
        }
      }, item.t);
      this.playTimers.push(timer);
    }
  }

  playTape(id: string) {
    const tape = this.tapes.find((t) => t.id === id);
    if (tape) this.play(tape.events);
  }

  stopPlayback() {
    this.playTimers.forEach(clearTimeout);
    this.playTimers = [];
    if (this.status === "playing") {
      this.status = "idle";
      this.emit();
    }
  }

  exportJson(): string {
    return JSON.stringify(
      {
        v: 1,
        app: "neurabinder",
        events: this.events,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }

  importJson(text: string): number {
    const data = JSON.parse(text) as { events?: RecordedIntent[] };
    if (!Array.isArray(data.events)) throw new Error("Invalid tape JSON");
    this.events = data.events;
    this.status = "idle";
    this.emit();
    return this.events.length;
  }

  loadPresetDemo() {
    // Short scripted talk tape (~8s)
    this.events = [
      {
        t: 0,
        event: {
          kind: "class_label",
          label: "search",
          source: "synthetic",
          ts: 0,
          confidence: 1,
        },
      },
      {
        t: 1200,
        event: {
          kind: "class_label",
          label: "next",
          source: "synthetic",
          ts: 0,
        },
      },
      {
        t: 2000,
        event: {
          kind: "class_label",
          label: "next",
          source: "synthetic",
          ts: 0,
        },
      },
      {
        t: 2800,
        event: {
          kind: "class_label",
          label: "select",
          source: "synthetic",
          ts: 0,
        },
      },
      {
        t: 4000,
        event: {
          kind: "class_label",
          label: "cancel",
          source: "synthetic",
          ts: 0,
        },
      },
      {
        t: 5200,
        event: {
          kind: "switch_binary",
          pressed: true,
          source: "synthetic",
          ts: 0,
        },
      },
      {
        t: 5300,
        event: {
          kind: "switch_binary",
          pressed: false,
          source: "synthetic",
          ts: 0,
        },
      },
    ];
    this.emit();
  }

  private persistTapes() {
    try {
      localStorage.setItem(
        "neurabinder-intent-tapes",
        JSON.stringify(this.tapes)
      );
    } catch {
      /* ignore */
    }
  }

  hydrateTapes() {
    try {
      const raw = localStorage.getItem("neurabinder-intent-tapes");
      if (raw) this.tapes = JSON.parse(raw) as IntentTape[];
    } catch {
      this.tapes = [];
    }
  }
}

let singleton: IntentRecorder | null = null;

export function getIntentRecorder() {
  if (!singleton) {
    singleton = new IntentRecorder();
    if (typeof window !== "undefined") singleton.hydrateTapes();
  }
  return singleton;
}
