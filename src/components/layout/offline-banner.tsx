"use client";

import { useEffect } from "react";
import { useBciStore } from "@/lib/stores/bci-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import {
  flushQueue,
  isBrowserOffline,
  listQueuedOps,
} from "@/lib/offline/queue";
import { Badge } from "@/components/ui/badge";
import type { CardCondition, VariantType } from "@/lib/types";

export function OfflineBanner() {
  const online = useBciStore((s) => s.online);
  const queuedOps = useBciStore((s) => s.queuedOps);
  const setOnline = useBciStore((s) => s.setOnline);
  const setQueuedOps = useBciStore((s) => s.setQueuedOps);
  const addCard = useCollectionStore((s) => s.addCard);
  const updateCard = useCollectionStore((s) => s.updateCard);
  const removeCard = useCollectionStore((s) => s.removeCard);
  const adjustQuantity = useCollectionStore((s) => s.adjustQuantity);
  const addToList = useCollectionStore((s) => s.addToList);
  const removeFromList = useCollectionStore((s) => s.removeFromList);

  useEffect(() => {
    const sync = () => setOnline(!isBrowserOffline());
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, [setOnline]);

  useEffect(() => {
    const tick = async () => {
      const ops = await listQueuedOps();
      setQueuedOps(ops.length);
      if (!isBrowserOffline() && ops.length) {
        await flushQueue({
          add_card: (p) => {
            addCard({
              cardId: String(p.cardId),
              quantity: Number(p.quantity ?? 1),
              condition: (p.condition as CardCondition) ?? "NM",
              language: String(p.language ?? "en"),
              variant: (p.variant as VariantType) ?? "normal",
              isGraded: Boolean(p.isGraded),
              listIds: (p.listIds as string[]) ?? ["list-collection"],
            });
          },
          update_card: (p) => {
            if (p.id) updateCard(String(p.id), p as never);
          },
          remove_card: (p) => {
            if (p.id) removeCard(String(p.id));
          },
          adjust_qty: (p) => {
            if (p.id) adjustQuantity(String(p.id), Number(p.delta ?? 0));
          },
          add_to_list: (p) => {
            if (p.userCardId && p.listId)
              addToList(String(p.userCardId), String(p.listId));
          },
          remove_from_list: (p) => {
            if (p.userCardId && p.listId)
              removeFromList(String(p.userCardId), String(p.listId));
          },
        });
        const left = await listQueuedOps();
        setQueuedOps(left.length);
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 8000);
    return () => window.clearInterval(id);
  }, [
    addCard,
    updateCard,
    removeCard,
    adjustQuantity,
    addToList,
    removeFromList,
    setQueuedOps,
    online,
  ]);

  if (online && queuedOps === 0) return null;

  return (
    <div
      className="border-b border-border bg-warning/10 px-4 py-1.5 text-center text-xs"
      role="status"
    >
      {!online ? (
        <span>
          You&apos;re offline — viewing and local edits still work.{" "}
          {queuedOps > 0 && (
            <Badge variant="warning">{queuedOps} queued</Badge>
          )}
        </span>
      ) : (
        <span>
          Online — flushing <Badge variant="secondary">{queuedOps}</Badge> queued
          ops…
        </span>
      )}
    </div>
  );
}
