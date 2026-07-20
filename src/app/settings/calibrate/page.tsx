"use client";

import { useState } from "react";
import Link from "next/link";
import { useBciStore } from "@/lib/stores/bci-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = [
  {
    title: "Target size",
    body: "Pick the smallest target you can hit reliably with your cursor or intent.",
    key: "target" as const,
  },
  {
    title: "Confirm style",
    body: "Prefer instant confirm (Enter) or a short dwell before select?",
    key: "confirm" as const,
  },
  {
    title: "Scan ranking",
    body: "When identifying cards, should #1 candidate be strongly preferred?",
    key: "scan" as const,
  },
  {
    title: "Done",
    body: "Profile saved locally. You can re-run calibration anytime.",
    key: "done" as const,
  },
];

export default function CalibratePage() {
  const bciMode = useBciStore((s) => s.bciMode);
  const profile = useBciStore((s) => s.profile);
  const updateProfile = useBciStore((s) => s.updateProfile);
  const setBciMode = useBciStore((s) => s.setBciMode);
  const playFeedback = useBciStore((s) => s.playFeedback);
  const [step, setStep] = useState(0);

  const current = STEPS[step];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1
          className={cn(
            "font-bold tracking-tight",
            bciMode ? "text-3xl" : "text-2xl"
          )}
        >
          BCI calibration
        </h1>
        <p className="text-sm text-muted-foreground">
          Keyboard-simulated wizard — maps to future Neuralink setup
        </p>
      </div>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle>
            Step {step + 1}/{STEPS.length}: {current.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{current.body}</p>

          {current.key === "target" && (
            <div className="flex flex-wrap gap-2">
              {(["default", "large", "xl"] as const).map((size) => (
                <Button
                  key={size}
                  size={size === "xl" || bciMode ? "bci" : "default"}
                  variant={profile.targetSize === size ? "default" : "outline"}
                  onClick={() => {
                    updateProfile({ targetSize: size });
                    playFeedback("select");
                  }}
                >
                  {size}
                </Button>
              ))}
            </div>
          )}

          {current.key === "confirm" && (
            <div className="flex flex-wrap gap-2">
              <Button
                size={bciMode ? "bci" : "default"}
                variant={!profile.useDwell ? "default" : "outline"}
                onClick={() => updateProfile({ useDwell: false })}
              >
                Instant confirm
              </Button>
              <Button
                size={bciMode ? "bci" : "default"}
                variant={profile.useDwell ? "default" : "outline"}
                onClick={() => updateProfile({ useDwell: true, dwellMs: 800 })}
              >
                Dwell 800ms
              </Button>
            </div>
          )}

          {current.key === "scan" && (
            <div className="flex flex-wrap gap-2">
              <Button
                size={bciMode ? "bci" : "default"}
                variant={
                  profile.scanAutoRankAggressive ? "default" : "outline"
                }
                onClick={() =>
                  updateProfile({ scanAutoRankAggressive: true })
                }
              >
                Prefer top candidate
              </Button>
              <Button
                size={bciMode ? "bci" : "default"}
                variant={
                  !profile.scanAutoRankAggressive ? "default" : "outline"
                }
                onClick={() =>
                  updateProfile({ scanAutoRankAggressive: false })
                }
              >
                Show closer race
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {step > 0 && (
              <Button
                variant="outline"
                size={bciMode ? "bci" : "default"}
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button
                size={bciMode ? "bci" : "default"}
                onClick={() => {
                  setBciMode(true);
                  setStep((s) => s + 1);
                  playFeedback("select");
                }}
              >
                Next
              </Button>
            ) : (
              <Button
                size={bciMode ? "bci" : "default"}
                onClick={() => {
                  updateProfile({ calibrated: true });
                  setBciMode(true);
                  playFeedback("success");
                  toast.success("Calibration saved");
                }}
              >
                Finish
              </Button>
            )}
            <Button asChild variant="ghost" size={bciMode ? "bci" : "default"}>
              <Link href="/settings">Settings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
