"use client";

import { useCallback, useRef, useState } from "react";
import { useBciStore } from "@/lib/stores/bci-store";
import { cn } from "@/lib/utils";

interface DwellTargetProps {
  children: React.ReactNode;
  onActivate: () => void;
  className?: string;
  disabled?: boolean;
}

/**
 * When BCI profile has useDwell, focusing/hovering for dwellMs activates.
 */
export function DwellTarget({
  children,
  onActivate,
  className,
  disabled,
}: DwellTargetProps) {
  const profile = useBciStore((s) => s.profile);
  const bciMode = useBciStore((s) => s.bciMode);
  const playFeedback = useBciStore((s) => s.playFeedback);
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = useRef<number>(0);

  const clear = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setProgress(0);
  }, []);

  const begin = useCallback(() => {
    if (disabled || !profile.useDwell || !bciMode) return;
    clear();
    start.current = Date.now();
    const ms = profile.dwellMs || 800;
    timer.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - start.current) / ms);
      setProgress(p);
      if (p >= 1) {
        clear();
        playFeedback("select");
        onActivate();
      }
    }, 40);
  }, [
    disabled,
    profile.useDwell,
    profile.dwellMs,
    bciMode,
    clear,
    onActivate,
    playFeedback,
  ]);

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={begin}
      onMouseLeave={clear}
      onFocus={begin}
      onBlur={clear}
    >
      {children}
      {progress > 0 && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-2xl bg-muted"
          aria-hidden
        >
          <div
            className="h-full bg-primary transition-[width] duration-75"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
