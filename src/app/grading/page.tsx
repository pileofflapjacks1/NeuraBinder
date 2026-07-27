"use client";

import { useEffect, useMemo, useState } from "react";
import { useGradingStore, GRADE_STAGES, type GradeStage } from "@/lib/stores/grading-store";
import { useProfileStore } from "@/lib/stores/profile-store";
import { useCollectionStore } from "@/lib/stores/collection-store";
import { useBciStore } from "@/lib/stores/bci-store";
import { useShowcaseStore } from "@/lib/stores/showcase-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { GradeCompany } from "@/lib/types";

export default function GradingPage() {
  const bciMode = useBciStore((s) => s.bciMode);
  const showcase = useShowcaseStore((s) => s.enabled);
  const activeId = useProfileStore((s) => s.activeId);
  const activeName = useProfileStore((s) => s.activeProfile().name);
  const jobs = useGradingStore((s) => s.jobs);
  const addJob = useGradingStore((s) => s.addJob);
  const moveJob = useGradingStore((s) => s.moveJob);
  const removeJob = useGradingStore((s) => s.removeJob);
  const updateJob = useGradingStore((s) => s.updateJob);
  const seedDemoIfEmpty = useGradingStore((s) => s.seedDemoIfEmpty);
  const userCards = useCollectionStore((s) => s.userCards);
  const getItems = useCollectionStore((s) => s.getItems);
  const items = useMemo(() => getItems(), [getItems, userCards]);

  const [name, setName] = useState("");
  const [fee, setFee] = useState("25");

  useEffect(() => {
    seedDemoIfEmpty(activeId);
  }, [activeId, seedDemoIfEmpty]);

  const mine = useMemo(
    () => jobs.filter((j) => j.profileId === activeId),
    [jobs, activeId]
  );

  const byStage = (stage: GradeStage) =>
    mine.filter((j) => j.stage === stage);

  const totalFees = mine.reduce(
    (s, j) => s + (j.fee ?? 0) + (j.shipping ?? 0),
    0
  );

  const addFromCollection = (userCardId: string) => {
    if (showcase) {
      toast.error("Exit showcase to edit grading pipeline");
      return;
    }
    const item = items.find((i) => i.id === userCardId);
    if (!item) return;
    addJob({
      profileId: activeId,
      userCardId: item.id,
      cardId: item.cardId,
      cardName: item.card.name,
      setCode: item.card.setCode,
      company: item.gradeCompany ?? "PSA",
      fee: parseFloat(fee) || 25,
      notes: item.notes,
    });
    toast.success(`Added ${item.card.name} as candidate`);
  };

  const addManual = () => {
    if (!name.trim()) return;
    if (showcase) {
      toast.error("Exit showcase to edit grading pipeline");
      return;
    }
    addJob({
      profileId: activeId,
      cardId: `manual-${Date.now()}`,
      cardName: name.trim(),
      company: "PSA",
      fee: parseFloat(fee) || 25,
    });
    setName("");
    toast.success("Candidate added");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className={cn(
              "font-bold tracking-tight",
              bciMode ? "text-3xl" : "text-2xl"
            )}
          >
            Grading tracker
          </h1>
          <p className="text-sm text-muted-foreground">
            Follow cards {activeName} is sending out for grading
          </p>
        </div>
        <Badge variant="secondary">
          {mine.length} cards · fees ~{formatCurrency(totalFees)}
        </Badge>
      </div>

      <Card className={cn(bciMode && "border-2")}>
        <CardHeader>
          <CardTitle className="text-base">Add a card</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input
              bci={bciMode}
              placeholder="Card name (manual)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-xs"
            />
            <Input
              bci={bciMode}
              type="number"
              placeholder="Fee $"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="w-28"
            />
            <Button size={bciMode ? "bci" : "default"} onClick={addManual}>
              Add candidate
            </Button>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              From collection (ungraded)
            </p>
            <ul className="flex max-h-32 flex-wrap gap-2 overflow-auto">
              {items
                .filter((i) => !i.isGraded)
                .slice(0, 12)
                .map((i) => (
                  <li key={i.id}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addFromCollection(i.id)}
                    >
                      + {i.card.name}
                    </Button>
                  </li>
                ))}
              {items.filter((i) => !i.isGraded).length === 0 && (
                <li className="text-sm text-muted-foreground">
                  No ungraded cards in this profile
                </li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {GRADE_STAGES.map((col) => {
          const list = byStage(col.id);
          return (
            <section
              key={col.id}
              className={cn(
                "w-[260px] shrink-0 rounded-2xl border border-border bg-card",
                bciMode && "border-2 w-[280px]"
              )}
              aria-label={col.label}
            >
              <header className="flex items-center justify-between border-b border-border px-3 py-2">
                <h2 className="text-sm font-semibold">{col.label}</h2>
                <Badge variant="outline">{list.length}</Badge>
              </header>
              <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto p-2">
                {list.map((job) => (
                  <li
                    key={job.id}
                    className={cn(
                      "rounded-xl border border-border bg-background p-3 text-sm",
                      bciMode && "p-4"
                    )}
                  >
                    <p className="font-semibold leading-snug">{job.cardName}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.setCode} · {job.company ?? "—"}
                      {job.grade ? ` ${job.grade}` : ""}
                    </p>
                    {(job.fee != null || job.shipping != null) && (
                      <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                        fees {formatCurrency((job.fee ?? 0) + (job.shipping ?? 0))}
                      </p>
                    )}
                    {job.certNumber && (
                      <p className="text-xs font-mono">#{job.certNumber}</p>
                    )}
                    {job.notes && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {job.notes}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {GRADE_STAGES.filter((s) => s.id !== job.stage).map(
                        (s) => (
                          <Button
                            key={s.id}
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-[10px]"
                            onClick={() => {
                              if (showcase) {
                                toast.error("Exit showcase to edit");
                                return;
                              }
                              moveJob(job.id, s.id);
                            }}
                          >
                            → {s.label}
                          </Button>
                        )
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[10px] text-destructive"
                        onClick={() => {
                          if (showcase) return;
                          removeJob(job.id);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    {job.stage === "returned" && !job.grade && (
                      <div className="mt-2 flex gap-1">
                        <Input
                          className="h-8 text-xs"
                          placeholder="Grade e.g. 10"
                          onBlur={(e) => {
                            if (e.target.value)
                              updateJob(job.id, {
                                grade: e.target.value,
                                company: (job.company ?? "PSA") as GradeCompany,
                              });
                          }}
                        />
                      </div>
                    )}
                  </li>
                ))}
                {list.length === 0 && (
                  <li className="px-2 py-6 text-center text-xs text-muted-foreground">
                    Empty
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
