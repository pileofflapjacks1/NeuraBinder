"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useShowcaseStore, parseShowcaseQuery } from "@/lib/stores/showcase-store";
import { useBciStore } from "@/lib/stores/bci-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { getIntentSocket } from "@/lib/bci/intent-socket";
import { startGuidedTour } from "@/components/tour/guided-tour";
import { SEED_CARDS, SEED_LISTS, SEED_USER_CARDS, SEED_WANT_CARD_IDS } from "@/lib/seed/cards";

/**
 * Activates showcase from ?showcase=1, forces BCI profile, seed data,
 * and intent socket listeners.
 */
export function ShowcaseController() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const enabled = useShowcaseStore((s) => s.enabled);
  const enable = useShowcaseStore((s) => s.enable);
  const lockData = useShowcaseStore((s) => s.lockData);
  const autoTour = useShowcaseStore((s) => s.autoTour);
  const autoIntentSocket = useShowcaseStore((s) => s.autoIntentSocket);
  const setBciMode = useBciStore((s) => s.setBciMode);
  const updateProfile = useBciStore((s) => s.updateProfile);
  const tourOnce = useRef(false);

  // URL → enable
  useEffect(() => {
    const q = searchParams?.toString() ?? "";
    if (parseShowcaseQuery(q) || pathname === "/demo") {
      enable({
        lockData: true,
        autoTour: pathname === "/demo" ? false : true,
        autoIntentSocket: true,
      });
    }
  }, [searchParams, pathname, enable]);

  // Apply showcase side-effects
  useEffect(() => {
    if (!enabled) return;

    setBciMode(true);
    updateProfile({
      targetSize: "large",
      soundFeedback: true,
      scanAutoRankAggressive: true,
      intentOnlyMode: false,
      calibrated: true,
    });

    if (lockData) {
      // Re-seed so demos always look the same
      useCollectionStore.setState({
        catalog: SEED_CARDS,
        userCards: SEED_USER_CARDS,
        lists: SEED_LISTS,
        wantCardIds: SEED_WANT_CARD_IDS,
        selectedId: null,
        selectedIds: [],
        bulkMode: false,
      });
    }

    // postMessage + BroadcastChannel only. Never open localhost WS on Vercel.
    // Optional remote WS: set NEXT_PUBLIC_INTENT_WS_URL to a wss:// host.
    const socket = getIntentSocket();
    socket.start({ connectWs: false });
    void autoIntentSocket;

    if (autoTour && !tourOnce.current && pathname !== "/demo") {
      tourOnce.current = true;
      const t = window.setTimeout(() => startGuidedTour(), 600);
      return () => {
        window.clearTimeout(t);
      };
    }

    return () => {
      // keep socket alive while showcase remains; stop only if disabled later
    };
  }, [
    enabled,
    lockData,
    autoTour,
    autoIntentSocket,
    setBciMode,
    updateProfile,
    pathname,
  ]);

  // Stop WS when leaving showcase entirely
  useEffect(() => {
    if (enabled) return;
    // leave postMessage/BC running lightly is fine; disconnect WS to free port
    getIntentSocket().disconnectWebSocket();
  }, [enabled]);

  return null;
}
