"use client";

/**
 * Household multi-profile — separate local binders without accounts.
 * Each profile has its own collection/lists/wants blob in localStorage.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import {
  SEED_LISTS,
  SEED_USER_CARDS,
  SEED_WANT_CARD_IDS,
  SEED_CARDS,
} from "@/lib/seed/cards";
import type { Card, CardList, UserCard } from "@/lib/types";

export interface HouseholdProfile {
  id: string;
  name: string;
  /** Tailwind-ish accent label for UI */
  accent: "violet" | "cyan" | "amber" | "rose" | "emerald";
  createdAt: string;
}

export interface ProfileDataBlob {
  userCards: UserCard[];
  lists: CardList[];
  wantCardIds: string[];
  catalog?: Card[];
  marketRefreshedAt?: string;
}

const DATA_KEY = (id: string) => `neurabinder-profile-data-${id}`;

const DEFAULT_PROFILES: HouseholdProfile[] = [
  {
    id: "profile-you",
    name: "You",
    accent: "violet",
    createdAt: new Date().toISOString(),
  },
  {
    id: "profile-partner",
    name: "Partner",
    accent: "cyan",
    createdAt: new Date().toISOString(),
  },
];

function loadBlob(id: string): ProfileDataBlob | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DATA_KEY(id));
    if (!raw) return null;
    return JSON.parse(raw) as ProfileDataBlob;
  } catch {
    return null;
  }
}

function saveBlob(id: string, data: ProfileDataBlob) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DATA_KEY(id), JSON.stringify(data));
  } catch {
    /* quota */
  }
}

function emptyBlob(): ProfileDataBlob {
  return {
    userCards: [],
    lists: [
      {
        id: "list-collection",
        userId: "local",
        name: "Main Collection",
        type: "collection",
        isPublic: false,
        itemCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    wantCardIds: [],
    catalog: SEED_CARDS,
  };
}

function seedBlob(): ProfileDataBlob {
  return {
    userCards: SEED_USER_CARDS,
    lists: SEED_LISTS,
    wantCardIds: SEED_WANT_CARD_IDS,
    catalog: SEED_CARDS,
  };
}

interface ProfileState {
  profiles: HouseholdProfile[];
  activeId: string;
  /** one-shot flag so first load migrates existing collection store */
  migrated: boolean;

  activeProfile: () => HouseholdProfile;
  createProfile: (name: string, accent?: HouseholdProfile["accent"]) => string;
  renameProfile: (id: string, name: string) => void;
  deleteProfile: (id: string) => boolean;
  setActiveId: (id: string) => void;

  saveActiveFromCollection: (blob: ProfileDataBlob) => void;
  loadBlobForActive: () => ProfileDataBlob;
  ensureSeedForProfile: (id: string) => ProfileDataBlob;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: DEFAULT_PROFILES,
      activeId: "profile-you",
      migrated: false,

      activeProfile: () => {
        const s = get();
        return (
          s.profiles.find((p) => p.id === s.activeId) ?? s.profiles[0]
        );
      },

      createProfile: (name, accent = "amber") => {
        const id = `profile-${nanoid(6)}`;
        const profile: HouseholdProfile = {
          id,
          name: name.trim() || "New profile",
          accent,
          createdAt: new Date().toISOString(),
        };
        saveBlob(id, emptyBlob());
        set((s) => ({ profiles: [...s.profiles, profile] }));
        return id;
      },

      renameProfile: (id, name) => {
        set((s) => ({
          profiles: s.profiles.map((p) =>
            p.id === id ? { ...p, name: name.trim() || p.name } : p
          ),
        }));
      },

      deleteProfile: (id) => {
        const s = get();
        if (s.profiles.length <= 1) return false;
        if (id === "profile-you") return false; // keep primary
        const next = s.profiles.filter((p) => p.id !== id);
        try {
          localStorage.removeItem(DATA_KEY(id));
        } catch {
          /* ignore */
        }
        set({
          profiles: next,
          activeId: s.activeId === id ? next[0].id : s.activeId,
        });
        return true;
      },

      setActiveId: (id) => {
        if (!get().profiles.some((p) => p.id === id)) return;
        set({ activeId: id });
      },

      saveActiveFromCollection: (blob) => {
        saveBlob(get().activeId, blob);
      },

      loadBlobForActive: () => {
        const id = get().activeId;
        return get().ensureSeedForProfile(id);
      },

      ensureSeedForProfile: (id) => {
        const existing = loadBlob(id);
        if (existing) {
          return {
            ...existing,
            catalog: existing.catalog?.length ? existing.catalog : SEED_CARDS,
          };
        }
        // Primary profile gets demo seed; others start empty
        const blob = id === "profile-you" ? seedBlob() : emptyBlob();
        saveBlob(id, blob);
        return blob;
      },
    }),
    {
      name: "neurabinder-profiles",
      partialize: (s) => ({
        profiles: s.profiles,
        activeId: s.activeId,
        migrated: s.migrated,
      }),
    }
  )
);

/** Snapshot collection store → profile blob */
export function collectionToBlob(state: {
  userCards: UserCard[];
  lists: CardList[];
  wantCardIds: string[];
  catalog: Card[];
  marketRefreshedAt?: string;
}): ProfileDataBlob {
  return {
    userCards: state.userCards,
    lists: state.lists,
    wantCardIds: state.wantCardIds,
    catalog: state.catalog,
    marketRefreshedAt: state.marketRefreshedAt,
  };
}
