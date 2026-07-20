"use client";

/**
 * Single-switch scanning: auto-advances focus; Space/Enter selects.
 * Useful for motor impairment and intent-only BCI profiles.
 */

import { useEffect } from "react";
import { useBciStore } from "@/lib/stores/bci-store";
import { getBciAdapter } from "@/lib/bci/adapter";

export function SwitchScanController({ itemCount }: { itemCount: number }) {
  const enabled = useBciStore((s) => s.switchScanEnabled);
  const profile = useBciStore((s) => s.profile);
  const moveFocus = useBciStore((s) => s.moveFocus);
  const intentOnly = profile.intentOnlyMode;

  useEffect(() => {
    if (!enabled && !intentOnly) return;
    if (itemCount <= 0) return;
    const ms = profile.switchScanMs || 1200;
    const id = window.setInterval(() => {
      moveFocus(1, itemCount);
    }, ms);
    return () => window.clearInterval(id);
  }, [enabled, intentOnly, itemCount, moveFocus, profile.switchScanMs]);

  useEffect(() => {
    if (!enabled && !intentOnly) return;
    const adapter = getBciAdapter();
    return adapter.onIntent(() => {
      // select handled by page listeners; feedback only
    });
  }, [enabled, intentOnly]);

  return null;
}
