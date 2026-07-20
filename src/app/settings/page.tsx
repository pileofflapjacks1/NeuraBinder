"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useBciStore } from "@/lib/stores/bci-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const bciMode = useBciStore((s) => s.bciMode);
  const setBciMode = useBciStore((s) => s.setBciMode);
  const highContrast = useBciStore((s) => s.highContrast);
  const setHighContrast = useBciStore((s) => s.setHighContrast);
  const reducedMotion = useBciStore((s) => s.reducedMotion);
  const setReducedMotion = useBciStore((s) => s.setReducedMotion);
  const voiceEnabled = useBciStore((s) => s.voiceEnabled);
  const setVoiceEnabled = useBciStore((s) => s.setVoiceEnabled);
  const profile = useBciStore((s) => s.profile);
  const updateProfile = useBciStore((s) => s.updateProfile);
  const switchScanEnabled = useBciStore((s) => s.switchScanEnabled);
  const setSwitchScanEnabled = useBciStore((s) => s.setSwitchScanEnabled);
  const resetToSeed = useCollectionStore((s) => s.resetToSeed);
  const refreshMarketPrices = useCollectionStore((s) => s.refreshMarketPrices);

  const row = (
    id: string,
    label: string,
    description: string,
    checked: boolean,
    onChange: (v: boolean) => void
  ) => (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-border last:border-0",
        bciMode ? "py-5" : "py-4"
      )}
    >
      <div className="min-w-0">
        <label
          htmlFor={id}
          className={cn("font-medium", bciMode ? "text-base" : "text-sm")}
        >
          {label}
        </label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        aria-label={label}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1
          className={cn(
            "font-bold tracking-tight",
            bciMode ? "text-3xl" : "text-2xl"
          )}
        >
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          BCI profile, accessibility, and local data
        </p>
      </div>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle>Neuralink / BCI</CardTitle>
        </CardHeader>
        <CardContent>
          {row(
            "bci-mode",
            "BCI Mode",
            "Larger targets, lower density, predictive ranking, discrete intents",
            bciMode,
            setBciMode
          )}
          {row(
            "intent-only",
            "Intent-only mode",
            "Assume no continuous cursor — pair with switch scanning",
            profile.intentOnlyMode,
            (v) => updateProfile({ intentOnlyMode: v })
          )}
          {row(
            "switch-scan",
            "Single-switch scan",
            "Auto-advance focus on a timer; Enter/Space selects",
            switchScanEnabled,
            setSwitchScanEnabled
          )}
          {row(
            "scan-aggressive",
            "Aggressive scan auto-rank",
            "Widen confidence gap for top candidate",
            profile.scanAutoRankAggressive,
            (v) => updateProfile({ scanAutoRankAggressive: v })
          )}
          {row(
            "sound",
            "Sound feedback",
            "Beep on select / success / error (sensory stub)",
            profile.soundFeedback,
            (v) => updateProfile({ soundFeedback: v })
          )}
          {row(
            "voice",
            "Voice input",
            "Web Speech API on the command bar",
            voiceEnabled,
            setVoiceEnabled
          )}

          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium">
              Target size
              <select
                className={cn(
                  "mt-1 w-full rounded-xl border border-input bg-background px-3",
                  bciMode ? "h-14" : "h-10"
                )}
                value={profile.targetSize}
                onChange={(e) =>
                  updateProfile({
                    targetSize: e.target.value as "default" | "large" | "xl",
                  })
                }
              >
                <option value="default">Default</option>
                <option value="large">Large</option>
                <option value="xl">XL</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Switch scan interval (ms)
              <input
                type="number"
                className={cn(
                  "mt-1 w-full rounded-xl border border-input bg-background px-3",
                  bciMode ? "h-14" : "h-10"
                )}
                value={profile.switchScanMs}
                onChange={(e) =>
                  updateProfile({
                    switchScanMs: parseInt(e.target.value, 10) || 1200,
                  })
                }
              />
            </label>
            <label className="block text-sm font-medium">
              Confirm timeout (ms)
              <input
                type="number"
                className={cn(
                  "mt-1 w-full rounded-xl border border-input bg-background px-3",
                  bciMode ? "h-14" : "h-10"
                )}
                value={profile.confirmTimeoutMs}
                onChange={(e) =>
                  updateProfile({
                    confirmTimeoutMs: parseInt(e.target.value, 10) || 2500,
                  })
                }
              />
            </label>
            <Button asChild size={bciMode ? "bci" : "default"} variant="outline">
              <Link href="/settings/calibrate">Open calibration wizard</Link>
            </Button>
            {profile.calibrated && (
              <p className="text-xs text-success">Profile marked calibrated</p>
            )}
          </div>

          <p className="mt-4 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            ROADMAP: Neuralink SDK hooks in{" "}
            <code className="rounded bg-muted px-1">src/lib/bci/adapter.ts</code>
          </p>
        </CardContent>
      </Card>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle>Accessibility</CardTitle>
        </CardHeader>
        <CardContent>
          {row(
            "high-contrast",
            "High contrast",
            "Maximum contrast palette",
            highContrast,
            setHighContrast
          )}
          {row(
            "reduced-motion",
            "Reduced motion",
            "Minimize animations",
            reducedMotion,
            setReducedMotion
          )}
          <div
            className={cn(
              "flex items-center justify-between gap-4 pt-4",
              bciMode && "pt-5"
            )}
          >
            <div>
              <p className={cn("font-medium", bciMode ? "text-base" : "text-sm")}>
                Theme
              </p>
            </div>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as const).map((t) => (
                <Button
                  key={t}
                  size={bciMode ? "default" : "sm"}
                  variant={theme === t ? "default" : "outline"}
                  onClick={() => setTheme(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle>Privacy & data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Local-first: Zustand + localStorage + IndexedDB queue. Cloud sync
            waits on Supabase/Clerk setup (see TODO.md).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size={bciMode ? "bci" : "default"}
              onClick={() => {
                refreshMarketPrices();
                toast.success("Mock market prices refreshed");
              }}
            >
              Refresh mock market
            </Button>
            <Button
              variant="destructive"
              size={bciMode ? "bci" : "default"}
              onClick={() => {
                resetToSeed();
                toast.success("Collection reset to demo seed");
              }}
            >
              Reset demo collection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
