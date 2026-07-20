"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type {
  Card,
  CardList,
  CollectionFilters,
  CollectionItem,
  CollectionSort,
  PortfolioSummary,
  SetProgress,
  UserCard,
} from "@/lib/types";
import {
  DEMO_USER_ID,
  SEED_CARDS,
  SEED_LISTS,
  SEED_USER_CARDS,
  SEED_WANT_CARD_IDS,
} from "@/lib/seed/cards";
import {
  buildCollectionItems,
  computePortfolio,
  computeSetProgress,
  filterCollection,
  getMissingCards,
  sortCollection,
} from "@/lib/collection/query";
import { estimateUnitValue } from "@/lib/utils";

interface CollectionState {
  catalog: Card[];
  userCards: UserCard[];
  lists: CardList[];
  wantCardIds: string[];
  filters: CollectionFilters;
  sort: CollectionSort;
  selectedId: string | null;
  hydrated: boolean;

  // Derived helpers (recomputed on demand)
  getItems: () => CollectionItem[];
  getFiltered: () => CollectionItem[];
  getPortfolio: () => PortfolioSummary;
  getSetProgress: (setId: string) => SetProgress | null;
  getMissingForSet: (setId: string) => Card[];
  getSets: () => { id: string; name: string; code: string; game: string }[];

  setFilters: (f: Partial<CollectionFilters>) => void;
  resetFilters: () => void;
  setSort: (s: CollectionSort) => void;
  selectItem: (id: string | null) => void;

  addCard: (
    input: Omit<UserCard, "id" | "userId" | "createdAt" | "updatedAt">
  ) => string;
  updateCard: (id: string, patch: Partial<UserCard>) => void;
  removeCard: (id: string) => void;
  adjustQuantity: (id: string, delta: number) => void;

  createList: (name: string, type: CardList["type"]) => string;
  addToList: (userCardId: string, listId: string) => void;
  removeFromList: (userCardId: string, listId: string) => void;

  resetToSeed: () => void;
  markHydrated: () => void;
}

const defaultFilters: CollectionFilters = { game: "all" };
const defaultSort: CollectionSort = { field: "value", direction: "desc" };

function cardsMap(catalog: Card[]) {
  return new Map(catalog.map((c) => [c.id, c]));
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      catalog: SEED_CARDS,
      userCards: SEED_USER_CARDS,
      lists: SEED_LISTS,
      wantCardIds: SEED_WANT_CARD_IDS,
      filters: defaultFilters,
      sort: defaultSort,
      selectedId: null,
      hydrated: false,

      getItems: () => {
        const { userCards, catalog } = get();
        return buildCollectionItems(userCards, cardsMap(catalog));
      },

      getFiltered: () => {
        const { filters, sort, catalog } = get();
        const items = get().getItems();
        // Master set missing view: show catalog gaps as pseudo-items? Prefer empty + separate
        if (filters.missingForMasterSet) {
          // Show owned cards in set for context when filtering missing — actual missing via getMissing
          const ownedInSet = filterCollection(
            items,
            { ...filters, missingForMasterSet: undefined, setIds: [filters.missingForMasterSet] },
            catalog
          );
          return sortCollection(ownedInSet, sort);
        }
        return sortCollection(
          filterCollection(items, filters, catalog),
          sort
        );
      },

      getPortfolio: () => computePortfolio(get().getItems()),

      getSetProgress: (setId) =>
        computeSetProgress(get().catalog, get().getItems(), setId),

      getMissingForSet: (setId) =>
        getMissingCards(get().catalog, get().getItems(), setId),

      getSets: () => {
        const map = new Map<
          string,
          { id: string; name: string; code: string; game: string }
        >();
        for (const c of get().catalog) {
          if (!map.has(c.setId)) {
            map.set(c.setId, {
              id: c.setId,
              name: c.setName,
              code: c.setCode,
              game: c.game,
            });
          }
        }
        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
      },

      setFilters: (f) =>
        set((s) => ({ filters: { ...s.filters, ...f } })),

      resetFilters: () => set({ filters: defaultFilters }),

      setSort: (sort) => set({ sort }),

      selectItem: (id) => set({ selectedId: id }),

      addCard: (input) => {
        const id = nanoid();
        const card = get().catalog.find((c) => c.id === input.cardId);
        const estimatedValue = estimateUnitValue(
          card?.marketPrice,
          input.condition,
          input.isGraded,
          input.gradeCompany,
          input.grade
        );
        const entry: UserCard = {
          ...input,
          id,
          userId: DEMO_USER_ID,
          estimatedValue: input.estimatedValue ?? estimatedValue,
          listIds: input.listIds?.length ? input.listIds : ["list-collection"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ userCards: [...s.userCards, entry] }));
        return id;
      },

      updateCard: (id, patch) => {
        set((s) => ({
          userCards: s.userCards.map((uc) => {
            if (uc.id !== id) return uc;
            const next = {
              ...uc,
              ...patch,
              updatedAt: new Date().toISOString(),
            };
            const card = s.catalog.find((c) => c.id === next.cardId);
            next.estimatedValue = estimateUnitValue(
              card?.marketPrice,
              next.condition,
              next.isGraded,
              next.gradeCompany,
              next.grade
            );
            return next;
          }),
        }));
      },

      removeCard: (id) => {
        set((s) => ({
          userCards: s.userCards.filter((uc) => uc.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        }));
      },

      adjustQuantity: (id, delta) => {
        set((s) => ({
          userCards: s.userCards
            .map((uc) => {
              if (uc.id !== id) return uc;
              const quantity = Math.max(0, uc.quantity + delta);
              return {
                ...uc,
                quantity,
                updatedAt: new Date().toISOString(),
              };
            })
            .filter((uc) => uc.quantity > 0),
        }));
      },

      createList: (name, type) => {
        const id = nanoid();
        const list: CardList = {
          id,
          userId: DEMO_USER_ID,
          name,
          type,
          isPublic: false,
          itemCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ lists: [...s.lists, list] }));
        return id;
      },

      addToList: (userCardId, listId) => {
        set((s) => ({
          userCards: s.userCards.map((uc) =>
            uc.id === userCardId && !uc.listIds.includes(listId)
              ? {
                  ...uc,
                  listIds: [...uc.listIds, listId],
                  updatedAt: new Date().toISOString(),
                }
              : uc
          ),
        }));
      },

      removeFromList: (userCardId, listId) => {
        set((s) => ({
          userCards: s.userCards.map((uc) =>
            uc.id === userCardId
              ? {
                  ...uc,
                  listIds: uc.listIds.filter((l) => l !== listId),
                  updatedAt: new Date().toISOString(),
                }
              : uc
          ),
        }));
      },

      resetToSeed: () =>
        set({
          catalog: SEED_CARDS,
          userCards: SEED_USER_CARDS,
          lists: SEED_LISTS,
          wantCardIds: SEED_WANT_CARD_IDS,
          filters: defaultFilters,
          sort: defaultSort,
          selectedId: null,
        }),

      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "neurabinder-collection",
      partialize: (s) => ({
        userCards: s.userCards,
        lists: s.lists,
        wantCardIds: s.wantCardIds,
        filters: s.filters,
        sort: s.sort,
        // catalog is seed-backed; re-merge on load
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Always use latest seed catalog for demo
          state.catalog = SEED_CARDS;
          state.hydrated = true;
        }
      },
    }
  )
);
