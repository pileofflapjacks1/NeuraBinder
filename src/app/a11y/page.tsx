"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useBciStore } from "@/lib/stores/bci-store";
import { useShowcaseStore } from "@/lib/stores/showcase-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Check, Circle, Keyboard, Eye, MousePointer2 } from "lucide-react";

function Row({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail: string;
}) {
  return (
    <li className="flex gap-3 rounded-xl border border-border px-3 py-2">
      {ok ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
      ) : (
        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}

export default function A11yPage() {
  const bciMode = useBciStore((s) => s.bciMode);
  const setBciMode = useBciStore((s) => s.setBciMode);
  const highContrast = useBciStore((s) => s.highContrast);
  const setHighContrast = useBciStore((s) => s.setHighContrast);
  const reducedMotion = useBciStore((s) => s.reducedMotion);
  const setReducedMotion = useBciStore((s) => s.setReducedMotion);
  const voiceEnabled = useBciStore((s) => s.voiceEnabled);
  const switchScan = useBciStore((s) => s.switchScanEnabled);
  const setSwitchScan = useBciStore((s) => s.setSwitchScanEnabled);
  const profile = useBciStore((s) => s.profile);
  const updateProfile = useBciStore((s) => s.updateProfile);
  const showcase = useShowcaseStore((s) => s.enabled);

  const [prefersReduced, setPrefersReduced] = useState(false);
  const [prefersContrast, setPrefersContrast] = useState(false);

  useEffect(() => {
    setPrefersReduced(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
    setPrefersContrast(
      window.matchMedia("(prefers-contrast: more)").matches
    );
  }, []);

  const checks = [
    {
      ok: true,
      label: "Keyboard navigation",
      detail: "⌘K palette · / command · Enter select · Esc cancel · ←/→ next/prev · ⌘Z undo",
    },
    {
      ok: true,
      label: "Skip link",
      detail: "Skip to main content present in app shell",
    },
    {
      ok: true,
      label: "ARIA on grids & dialogs",
      detail: "listbox/option on collection; dialog roles on detail & palette",
    },
    {
      ok: bciMode,
      label: "BCI Mode density",
      detail: bciMode
        ? "Large targets, reduced columns, focus rings"
        : "Off — enable for high-bandwidth / motor-friendly UI",
    },
    {
      ok: highContrast || prefersContrast,
      label: "High contrast",
      detail: highContrast ? "App high-contrast on" : "System or toggle available",
    },
    {
      ok: reducedMotion || prefersReduced,
      label: "Reduced motion",
      detail: reducedMotion ? "App reduced-motion on" : "Respects preference when enabled",
    },
    {
      ok: switchScan || profile.intentOnlyMode,
      label: "Switch / intent-only path",
      detail: switchScan
        ? "Single-switch scan enabled"
        : "Enable switch-scan or intent-only in Settings",
    },
    {
      ok: profile.useDwell,
      label: "Dwell-to-select",
      detail: profile.useDwell
        ? `Dwell ${profile.dwellMs}ms on collection tiles`
        : "Optional via calibration wizard",
    },
    {
      ok: voiceEnabled,
      label: "Voice command bar",
      detail: voiceEnabled ? "Web Speech enabled" : "Optional secondary modality",
    },
    {
      ok: showcase,
      label: "Showcase lock",
      detail: showcase
        ? "Destructive resets blocked for demos"
        : "Optional — /demo enables showcase",
    },
    {
      ok: true,
      label: "Screen-reader binder tour",
      detail: "Speech synthesis path on /binder",
    },
    {
      ok: true,
      label: "No implant dependency",
      detail: "Computer-side / synthetic intents only — not medical software",
    },
  ];

  const score = Math.round(
    (checks.filter((c) => c.ok).length / checks.length) * 100
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1
          className={cn(
            "font-bold tracking-tight",
            bciMode ? "text-3xl" : "text-2xl"
          )}
        >
          Accessibility
        </h1>
        <p className="mt-1 text-muted-foreground">
          Keyboard, Easy mode, and high-contrast options so anyone can use the
          app comfortably.
        </p>
      </div>

      <Card className={cn(bciMode && "border-2")}>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div>
            <p className="text-sm text-muted-foreground">Current score</p>
            <p
              className={cn(
                "font-bold tabular-nums text-primary",
                bciMode ? "text-4xl" : "text-3xl"
              )}
            >
              {score}%
            </p>
            <p className="text-xs text-muted-foreground">
              {checks.filter((c) => c.ok).length}/{checks.length} checks active
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size={bciMode ? "bci" : "default"}
              variant={bciMode ? "default" : "outline"}
              onClick={() => setBciMode(true)}
            >
              Enable BCI Mode
            </Button>
            <Button asChild size={bciMode ? "bci" : "default"} variant="secondary">
              <Link href="/settings/calibrate">Calibration</Link>
            </Button>
            <Button asChild size={bciMode ? "bci" : "default"} variant="outline">
              <Link href="/demo">Demo</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MousePointer2 className="h-4 w-4" />
            Quick toggles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(
            [
              ["BCI Mode", bciMode, setBciMode],
              ["High contrast", highContrast, setHighContrast],
              ["Reduced motion", reducedMotion, setReducedMotion],
              ["Switch scan", switchScan, setSwitchScan],
              [
                "Dwell select",
                profile.useDwell,
                (v: boolean) => updateProfile({ useDwell: v }),
              ],
              [
                "Intent-only",
                profile.intentOnlyMode,
                (v: boolean) => updateProfile({ intentOnlyMode: v }),
              ],
            ] as const
          ).map(([label, on, set]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
            >
              <span className="text-sm font-medium">{label}</span>
              <Switch
                checked={on}
                onCheckedChange={set}
                aria-label={label}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Keyboard className="h-4 w-4" />
            Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2" aria-label="Accessibility checks">
            {checks.map((c) => (
              <Row key={c.label} ok={c.ok} label={c.label} detail={c.detail} />
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4" />
            Keyboard map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              ["⌘K / Ctrl+K", "Intent palette"],
              ["/", "Command / NL bar"],
              ["Enter / Space", "Select"],
              ["Shift+Enter", "Confirm (where used)"],
              ["Esc", "Cancel / close"],
              ["← → or n p", "Prev / next focus"],
              ["⌘Z / ⌘⇧Z", "Undo / redo"],
              ["?", "Cheatsheet (when overlay added)"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between gap-2 rounded-lg border border-border px-3 py-2"
              >
                <dt>
                  <kbd className="rounded border bg-muted px-1.5 text-xs">{k}</kbd>
                </dt>
                <dd className="text-muted-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Not a WCAG certification. For accessibility prototyping and suite demos.
        Not affiliated with Neuralink. Not medical device software.
      </p>
    </div>
  );
}
