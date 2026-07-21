"use client";

import { useEffect, useState } from "react";
import { getIntentRecorder } from "@/lib/bci/intent-recorder";
import { useBciStore } from "@/lib/stores/bci-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function IntentRecordPanel() {
  const bciMode = useBciStore((s) => s.bciMode);
  const [status, setStatus] = useState<"idle" | "recording" | "playing">(
    "idle"
  );
  const [count, setCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playIndex, setPlayIndex] = useState(0);
  const [tapes, setTapes] = useState(getIntentRecorder().getTapes());

  useEffect(() => {
    return getIntentRecorder().subscribe((s) => {
      setStatus(s.status);
      setCount(s.events.length);
      setDuration(s.durationMs);
      setPlayIndex(s.playIndex);
      setTapes(getIntentRecorder().getTapes());
    });
  }, []);

  return (
    <Card className={cn(bciMode && "border-2")}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          Intent record / replay
          <Badge
            variant={
              status === "recording"
                ? "destructive"
                : status === "playing"
                  ? "warning"
                  : "secondary"
            }
          >
            {status}
          </Badge>
          <Badge variant="outline">
            {count} events · {(duration / 1000).toFixed(1)}s
            {status === "playing" ? ` · #${playIndex}` : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Capture class_label / switch streams for talks, then replay into the
          same bus the keyboard and intent socket use. Fully local.
        </p>
        <div className="flex flex-wrap gap-2">
          {status !== "recording" ? (
            <Button
              size={bciMode ? "bci" : "default"}
              variant="destructive"
              onClick={() => {
                getIntentRecorder().startRecording();
                toast.message("Recording intents…");
              }}
            >
              Record
            </Button>
          ) : (
            <Button
              size={bciMode ? "bci" : "default"}
              onClick={() => {
                const tape = getIntentRecorder().stopRecording();
                toast.success(
                  tape
                    ? `Saved ${tape.events.length} events`
                    : "Recording stopped (empty)"
                );
              }}
            >
              Stop & save
            </Button>
          )}
          <Button
            size={bciMode ? "bci" : "default"}
            variant="secondary"
            disabled={!count || status === "recording"}
            onClick={() => getIntentRecorder().play()}
          >
            Replay buffer
          </Button>
          <Button
            size={bciMode ? "bci" : "default"}
            variant="outline"
            onClick={() => {
              getIntentRecorder().loadPresetDemo();
              toast.message("Loaded preset talk tape");
            }}
          >
            Load preset tape
          </Button>
          <Button
            size={bciMode ? "bci" : "default"}
            variant="outline"
            onClick={() => getIntentRecorder().stopPlayback()}
          >
            Stop playback
          </Button>
          <Button
            size={bciMode ? "bci" : "default"}
            variant="ghost"
            onClick={() => {
              const json = getIntentRecorder().exportJson();
              void navigator.clipboard.writeText(json);
              toast.success("Tape JSON copied");
            }}
          >
            Copy JSON
          </Button>
          <Button
            size={bciMode ? "bci" : "default"}
            variant="ghost"
            onClick={() => getIntentRecorder().clearBuffer()}
          >
            Clear
          </Button>
        </div>
        {tapes.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Saved sessions
            </p>
            <ul className="flex flex-wrap gap-2">
              {tapes.map((t) => (
                <li key={t.id}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => getIntentRecorder().playTape(t.id)}
                  >
                    {t.name} ({t.events.length})
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
