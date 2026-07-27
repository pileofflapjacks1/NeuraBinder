"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useBciStore } from "@/lib/stores/bci-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { useSnapshotsStore } from "@/lib/stores/snapshots-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { BackupPanel } from "@/components/backup/backup-panel";
import { startGuidedTour } from "@/components/tour/guided-tour";
import { useShowcaseStore } from "@/lib/stores/showcase-store";
import { IntentSocketPanel } from "@/components/showcase/intent-socket-panel";
import { NeuralBridgePanel } from "@/components/bci/neuralbridge-panel";
import { unregisterServiceWorkers } from "@/lib/pwa/register-sw";
import { ProfileSwitcher } from "@/components/profile/profile-switcher";
import { useProfileStore } from "@/lib/stores/profile-store";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp } from "lucide-react";

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
  const resetToSeed = useCollectionStore((s) => s.resetToSeed);
  const refreshMarketPrices = useCollectionStore((s) => s.refreshMarketPrices);
  const getPortfolio = useCollectionStore((s) => s.getPortfolio);
  const addSnapshot = useSnapshotsStore((s) => s.addSnapshot);
  const showcase = useShowcaseStore((s) => s.enabled);
  const lockData = useShowcaseStore((s) => s.lockData);
  const enableShowcase = useShowcaseStore((s) => s.enable);
  const disableShowcase = useShowcaseStore((s) => s.disable);
  const createProfile = useProfileStore((s) => s.createProfile);
  const renameProfile = useProfileStore((s) => s.renameProfile);
  const deleteProfile = useProfileStore((s) => s.deleteProfile);
  const activeId = useProfileStore((s) => s.activeId);
  const profiles = useProfileStore((s) => s.profiles);
  const [newName, setNewName] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDanger, setShowDanger] = useState(false);

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
          Profiles, display, and backup. Everything stays on this device.
        </p>
      </div>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle>Who is using this device?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Switch between family members. Each person has their own cards.
          </p>
          <ProfileSwitcher />
          <div className="flex flex-wrap gap-2">
            <Input
              bci={bciMode}
              placeholder="Name (e.g. Alex)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="max-w-xs"
            />
            <Button
              size={bciMode ? "bci" : "default"}
              onClick={() => {
                if (!newName.trim()) return;
                createProfile(newName.trim());
                setNewName("");
                toast.success("Profile added");
              }}
            >
              Add person
            </Button>
          </div>
          <ul className="space-y-2 text-sm">
            {profiles.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-3 py-2"
              >
                <span className="min-w-[5rem] font-medium">{p.name}</span>
                {p.id === activeId && <Badge variant="secondary">active</Badge>}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const n = window.prompt("Rename", p.name);
                    if (n) {
                      renameProfile(p.id, n);
                      toast.success("Renamed");
                    }
                  }}
                >
                  Rename
                </Button>
                {p.id !== "profile-you" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete “${p.name}” and their cards on this device?`
                        )
                      ) {
                        if (deleteProfile(p.id)) toast.success("Deleted");
                        else toast.error("Could not delete");
                      }
                    }}
                  >
                    Delete
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle>Display & comfort</CardTitle>
        </CardHeader>
        <CardContent>
          {row(
            "bci-mode",
            "Easy mode",
            "Bigger buttons — recommended for everyone",
            bciMode,
            setBciMode
          )}
          {row(
            "high-contrast",
            "High contrast",
            "Stronger colors for easier reading",
            highContrast,
            setHighContrast
          )}
          {row(
            "reduced-motion",
            "Reduce motion",
            "Less animation",
            reducedMotion,
            setReducedMotion
          )}
          {row(
            "voice",
            "Voice search",
            "Speak into Search (if your browser supports it)",
            voiceEnabled,
            setVoiceEnabled
          )}
          {row(
            "sound",
            "Soft sounds",
            "Quiet beeps when you confirm actions",
            profile.soundFeedback,
            (v) => updateProfile({ soundFeedback: v })
          )}
          <div
            className={cn(
              "mt-2 flex items-center justify-between gap-4 border-t border-border pt-4",
              bciMode && "pt-5"
            )}
          >
            <p className={cn("font-medium", bciMode ? "text-base" : "text-sm")}>
              Theme
            </p>
            <div className="flex gap-2">
              {(
                [
                  { id: "light", label: "Light" },
                  { id: "dark", label: "Dark" },
                  { id: "system", label: "Auto" },
                ] as const
              ).map((t) => (
                <Button
                  key={t.id}
                  size={bciMode ? "default" : "sm"}
                  variant={theme === t.id ? "default" : "outline"}
                  onClick={() => setTheme(t.id)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle>Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your collection is saved in this browser. Export a file so you can
            restore it later or move to another device.
          </p>
          <BackupPanel />
          <Button
            variant="secondary"
            size={bciMode ? "bci" : "default"}
            onClick={() => startGuidedTour()}
          >
            Replay quick start
          </Button>
        </CardContent>
      </Card>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader className="pb-2">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left"
            onClick={() => setShowDanger((v) => !v)}
            aria-expanded={showDanger}
          >
            <CardTitle>Reset & repair</CardTitle>
            {showDanger ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        {showDanger && (
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Only if something looks wrong. Export a backup first.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size={bciMode ? "bci" : "default"}
                onClick={() => {
                  refreshMarketPrices();
                  const p = getPortfolio();
                  addSnapshot({
                    totalValue: p.totalValue,
                    totalCost: p.totalCost,
                    cardCount: p.cardCount,
                    uniqueCount: p.uniqueCount,
                    source: "market_refresh",
                  });
                  toast.success("Demo prices refreshed");
                }}
              >
                Refresh demo prices
              </Button>
              <Button
                variant="outline"
                size={bciMode ? "bci" : "default"}
                onClick={async () => {
                  await unregisterServiceWorkers();
                  toast.success("Cache cleared — reloading…");
                  window.setTimeout(() => window.location.reload(), 400);
                }}
              >
                Fix loading issues
              </Button>
              <Button
                variant="destructive"
                size={bciMode ? "bci" : "default"}
                disabled={showcase && lockData}
                onClick={() => {
                  if (showcase && lockData) {
                    toast.error("Turn off demo mode first");
                    return;
                  }
                  if (
                    !window.confirm(
                      "Replace your collection with the sample demo cards?"
                    )
                  )
                    return;
                  resetToSeed();
                  toast.success("Restored sample collection");
                }}
              >
                Reset to sample cards
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader className="pb-2">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
          >
            <div>
              <CardTitle>Advanced</CardTitle>
              <p className="mt-1 text-sm font-normal text-muted-foreground">
                Demo mode and accessibility bridges — most people can skip this
              </p>
            </div>
            {showAdvanced ? (
              <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        {showAdvanced && (
          <CardContent className="space-y-6">
            {row(
              "showcase",
              "Demo / showcase mode",
              "Locks sample data and turns on live-demo helpers",
              showcase,
              (v) => (v ? enableShowcase() : disableShowcase())
            )}
            <IntentSocketPanel />
            <NeuralBridgePanel />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
