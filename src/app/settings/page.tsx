"use client";

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
  const resetToSeed = useCollectionStore((s) => s.resetToSeed);

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
          Accessibility, BCI Mode, and local data
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
            "Larger targets, lower density, predictive ranking, discrete intent shortcuts",
            bciMode,
            setBciMode
          )}
          {row(
            "voice",
            "Voice input",
            "Secondary modality via Web Speech API on the command bar",
            voiceEnabled,
            setVoiceEnabled
          )}
          <p className="mt-4 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            ROADMAP: Neuralink SDK / WebHID bridge hooks live in{" "}
            <code className="rounded bg-muted px-1">src/lib/bci/adapter.ts</code>
            . Discrete intents map to select, confirm, cancel, back, search,
            next, prev, add, remove.
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
            "Maximum contrast palette for visibility",
            highContrast,
            setHighContrast
          )}
          {row(
            "reduced-motion",
            "Reduced motion",
            "Minimize animations and transitions",
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
              <p className="text-sm text-muted-foreground">
                Light, dark, or system
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
            Collection data is private by default and stored locally in this
            demo (Zustand + localStorage). Cloud sync via Supabase is optional
            when <code className="rounded bg-muted px-1">DATABASE_URL</code> and
            auth are configured. Analytics should remain privacy-respecting —
            no invasive tracking.
          </p>
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
        </CardContent>
      </Card>
    </div>
  );
}
