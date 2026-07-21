"use client";

/**
 * Grading pipeline — local Kanban for slab submissions (no PSA API).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { GradeCompany } from "@/lib/types";

export type GradeStage =
  | "candidate"
  | "submitted"
  | "at_lab"
  | "returned"
  | "sold";

export const GRADE_STAGES: { id: GradeStage; label: string }[] = [
  { id: "candidate", label: "Candidate" },
  { id: "submitted", label: "Submitted" },
  { id: "at_lab", label: "At lab" },
  { id: "returned", label: "Returned" },
  { id: "sold", label: "Sold / closed" },
];

export interface GradeJob {
  id: string;
  profileId: string;
  userCardId?: string;
  cardId: string;
  cardName: string;
  setCode?: string;
  stage: GradeStage;
  company?: GradeCompany;
  submittedAt?: string;
  returnedAt?: string;
  fee?: number;
  shipping?: number;
  certNumber?: string;
  grade?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface GradingState {
  jobs: GradeJob[];
  addJob: (
    input: Omit<GradeJob, "id" | "createdAt" | "updatedAt" | "stage"> & {
      stage?: GradeStage;
    }
  ) => string;
  updateJob: (id: string, patch: Partial<GradeJob>) => void;
  moveJob: (id: string, stage: GradeStage) => void;
  removeJob: (id: string) => void;
  jobsForProfile: (profileId: string) => GradeJob[];
  seedDemoIfEmpty: (profileId: string) => void;
}

export const useGradingStore = create<GradingState>()(
  persist(
    (set, get) => ({
      jobs: [],

      addJob: (input) => {
        const id = nanoid();
        const now = new Date().toISOString();
        const job: GradeJob = {
          ...input,
          id,
          stage: input.stage ?? "candidate",
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ jobs: [job, ...s.jobs] }));
        return id;
      },

      updateJob: (id, patch) => {
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === id
              ? { ...j, ...patch, updatedAt: new Date().toISOString() }
              : j
          ),
        }));
      },

      moveJob: (id, stage) => {
        const now = new Date().toISOString();
        set((s) => ({
          jobs: s.jobs.map((j) => {
            if (j.id !== id) return j;
            const next: GradeJob = {
              ...j,
              stage,
              updatedAt: now,
            };
            if (stage === "submitted" && !j.submittedAt) {
              next.submittedAt = now.slice(0, 10);
            }
            if (stage === "returned" && !j.returnedAt) {
              next.returnedAt = now.slice(0, 10);
            }
            return next;
          }),
        }));
      },

      removeJob: (id) =>
        set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) })),

      jobsForProfile: (profileId) =>
        get().jobs.filter((j) => j.profileId === profileId),

      seedDemoIfEmpty: (profileId) => {
        const existing = get().jobsForProfile(profileId);
        if (existing.length) return;
        const now = new Date().toISOString();
        set((s) => ({
          jobs: [
            {
              id: nanoid(),
              profileId,
              cardId: "sv3pt5-193",
              cardName: "Mew ex (SIR)",
              setCode: "MEW",
              userCardId: "uc-2",
              stage: "returned",
              company: "PSA",
              grade: "10",
              certNumber: "12345678",
              fee: 25,
              shipping: 15,
              submittedAt: "2024-07-01",
              returnedAt: "2024-08-01",
              notes: "Demo returned slab",
              createdAt: now,
              updatedAt: now,
            },
            {
              id: nanoid(),
              profileId,
              cardId: "sv8pt5-100",
              cardName: "Umbreon ex",
              setCode: "PRE",
              stage: "candidate",
              company: "PSA",
              fee: 50,
              notes: "Consider if true NM",
              createdAt: now,
              updatedAt: now,
            },
            {
              id: nanoid(),
              profileId,
              cardId: "lorcana-tfc-204",
              cardName: "Elsa - Snow Queen (Enchanted)",
              setCode: "TFC",
              stage: "at_lab",
              company: "CGC",
              submittedAt: "2025-01-10",
              fee: 30,
              shipping: 12,
              createdAt: now,
              updatedAt: now,
            },
            ...s.jobs,
          ],
        }));
      },
    }),
    { name: "neurabinder-grading" }
  )
);
