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
  CardCondition,
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
import type { ImportRow, NeuraBinderBackup } from "@/lib/types/features";
import { driftCatalogPrices } from "@/lib/market/pricing";
import { captureHistory, useHistoryStore } from "@/lib/stores/history-store";
import { fuzzyFilterItems } from "@/lib/search/fuse";

interface CollectionState {
  catalog: Card[];
  userCards: UserCard[];
  lists: CardList[];
  wantCardIds: string[];
  filters: CollectionFilters;
  sort: CollectionSort;
  selectedId: string | null;
  /** Bulk selection */
  selectedIds: string[];
  bulkMode: boolean;
  hydrated: boolean;
  marketRefreshedAt?: string;

  getItems: () => CollectionItem[];
  getFiltered: () => CollectionItem[];
  getPortfolio: () => PortfolioSummary;
  getSetProgress: (setId: string) => SetProgress | null;
  getMissingForSet: (setId: string) => Card[];
  getSets: () => { id: string; name: string; code: string; game: string }[];
  getLocations: () => string[];
  getAllTags: () => string[];

  setFilters: (f: Partial<CollectionFilters>) => void;
  resetFilters: () => void;
  setSort: (s: CollectionSort) => void;
  selectItem: (id: string | null) => void;
  setBulkMode: (on: boolean) => void;
  toggleBulkId: (id: string) => void;
  selectAllFiltered: () => void;
  clearBulk: () => void;

  addCard: (
    input: Omit<UserCard, "id" | "userId" | "createdAt" | "updatedAt">,
    opts?: { mergeDuplicates?: boolean; skipHistory?: boolean }
  ) => string;
  updateCard: (
    id: string,
    patch: Partial<UserCard>,
    opts?: { skipHistory?: boolean }
  ) => void;
  removeCard: (id: string, opts?: { skipHistory?: boolean }) => void;
  adjustQuantity: (
    id: string,
    delta: number,
    opts?: { skipHistory?: boolean }
  ) => void;

  bulkUpdate: (
    ids: string[],
    patch: Partial<
      Pick<UserCard, "condition" | "location" | "listIds" | "tags" | "notes">
    > & { addTag?: string; addListId?: string; removeListId?: string }
  ) => void;
  bulkRemove: (ids: string[]) => void;
  bulkAdjustQty: (ids: string[], delta: number) => void;

  createList: (name: string, type: CardList["type"]) => string;
  addToList: (userCardId: string, listId: string) => void;
  removeFromList: (userCardId: string, listId: string) => void;

  importRows: (
    rows: ImportRow[],
    mergeDuplicates?: boolean
  ) => { added: number; merged: number; skipped: number };
  addWantCard: (cardId: string) => void;
  removeWantCard: (cardId: string) => void;
  refreshMarketPrices: () => void;
  revalueUserCards: () => void;

  restoreFromBackup: (backup: NeuraBinderBackup) => void;
  replaceUserCards: (userCards: UserCard[], wantCardIds?: string[]) => void;
  undo: () => boolean;
  redo: () => boolean;

  resetToSeed: () => void;
  markHydrated: () => void;
}

const defaultFilters: CollectionFilters = { game: "all" };
const defaultSort: CollectionSort = { field: "value", direction: "desc" };

function cardsMap(catalog: Card[]) {
  return new Map(catalog.map((c) => [c.id, c]));
}

function withHistory(label: string, get: () => CollectionState) {
  captureHistory(label, () => ({
    userCards: get().userCards,
    wantCardIds: get().wantCardIds,
  }));
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
      selectedIds: [],
      bulkMode: false,
      hydrated: false,

      getItems: () => {
        const { userCards, catalog } = get();
        return buildCollectionItems(userCards, cardsMap(catalog));
      },

      getFiltered: () => {
        const { filters, sort, catalog } = get();
        const items = get().getItems();
        let base = items;
        if (filters.missingForMasterSet) {
          base = filterCollection(
            items,
            {
              ...filters,
              missingForMasterSet: undefined,
              setIds: [filters.missingForMasterSet],
            },
            catalog
          );
        } else {
          const { query, ...rest } = filters;
          base = filterCollection(items, { ...rest, query: undefined }, catalog);
          if (query?.trim()) {
            base = fuzzyFilterItems(base, query);
          }
        }
        return sortCollection(base, sort);
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

      getLocations: () => {
        const setLoc = new Set<string>();
        for (const uc of get().userCards) {
          if (uc.location) setLoc.add(uc.location);
        }
        return [...setLoc].sort();
      },

      getAllTags: () => {
        const tags = new Set<string>();
        for (const uc of get().userCards) {
          for (const t of uc.tags ?? []) tags.add(t);
        }
        return [...tags].sort();
      },

      setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
      resetFilters: () => set({ filters: defaultFilters }),
      setSort: (sort) => set({ sort }),
      selectItem: (id) => set({ selectedId: id }),

      setBulkMode: (on) =>
        set({ bulkMode: on, selectedIds: on ? get().selectedIds : [] }),

      toggleBulkId: (id) =>
        set((s) => ({
          selectedIds: s.selectedIds.includes(id)
            ? s.selectedIds.filter((x) => x !== id)
            : [...s.selectedIds, id],
        })),

      selectAllFiltered: () => {
        const ids = get().getFiltered().map((i) => i.id);
        set({ selectedIds: ids, bulkMode: true });
      },

      clearBulk: () => set({ selectedIds: [], bulkMode: false }),

      addCard: (input, opts) => {
        const merge = opts?.mergeDuplicates !== false;
        if (merge) {
          const existing = get().userCards.find(
            (uc) =>
              uc.cardId === input.cardId &&
              uc.condition === input.condition &&
              uc.variant === input.variant &&
              uc.isGraded === input.isGraded &&
              uc.grade === input.grade &&
              uc.gradeCompany === input.gradeCompany
          );
          if (existing) {
            get().adjustQuantity(existing.id, input.quantity, {
              skipHistory: opts?.skipHistory,
            });
            return existing.id;
          }
        }
        if (!opts?.skipHistory) withHistory("Add card", get);
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
          tags: input.tags ?? [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ userCards: [...s.userCards, entry] }));
        return id;
      },

      updateCard: (id, patch, opts) => {
        if (!opts?.skipHistory) withHistory("Update card", get);
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

      removeCard: (id, opts) => {
        if (!opts?.skipHistory) withHistory("Remove card", get);
        set((s) => ({
          userCards: s.userCards.filter((uc) => uc.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
          selectedIds: s.selectedIds.filter((x) => x !== id),
        }));
      },

      adjustQuantity: (id, delta, opts) => {
        if (!opts?.skipHistory) withHistory("Adjust quantity", get);
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

      bulkUpdate: (ids, patch) => {
        if (!ids.length) return;
        withHistory(`Bulk update (${ids.length})`, get);
        const idSet = new Set(ids);
        set((s) => ({
          userCards: s.userCards.map((uc) => {
            if (!idSet.has(uc.id)) return uc;
            let next: UserCard = {
              ...uc,
              ...("condition" in patch && patch.condition
                ? { condition: patch.condition as CardCondition }
                : {}),
              ...("location" in patch ? { location: patch.location } : {}),
              ...("notes" in patch ? { notes: patch.notes } : {}),
              updatedAt: new Date().toISOString(),
            };
            if (patch.addTag) {
              const tags = new Set(next.tags ?? []);
              tags.add(patch.addTag);
              next = { ...next, tags: [...tags] };
            }
            if (patch.tags) next = { ...next, tags: patch.tags };
            if (patch.addListId && !next.listIds.includes(patch.addListId)) {
              next = { ...next, listIds: [...next.listIds, patch.addListId] };
            }
            if (patch.removeListId) {
              next = {
                ...next,
                listIds: next.listIds.filter((l) => l !== patch.removeListId),
              };
            }
            if (patch.listIds) next = { ...next, listIds: patch.listIds };
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

      bulkRemove: (ids) => {
        if (!ids.length) return;
        withHistory(`Bulk remove (${ids.length})`, get);
        const idSet = new Set(ids);
        set((s) => ({
          userCards: s.userCards.filter((uc) => !idSet.has(uc.id)),
          selectedIds: [],
          selectedId: s.selectedId && idSet.has(s.selectedId) ? null : s.selectedId,
        }));
      },

      bulkAdjustQty: (ids, delta) => {
        if (!ids.length) return;
        withHistory(`Bulk qty ${delta > 0 ? "+" : ""}${delta}`, get);
        const idSet = new Set(ids);
        set((s) => ({
          userCards: s.userCards
            .map((uc) => {
              if (!idSet.has(uc.id)) return uc;
              return {
                ...uc,
                quantity: Math.max(0, uc.quantity + delta),
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
        withHistory("Add to list", get);
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
        withHistory("Remove from list", get);
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

      importRows: (rows, mergeDuplicates = true) => {
        withHistory("Import CSV", get);
        let added = 0;
        let merged = 0;
        let skipped = 0;
        for (const row of rows) {
          if (!row.matchedCardId) {
            skipped++;
            continue;
          }
          const existing = get().userCards.find(
            (uc) =>
              uc.cardId === row.matchedCardId &&
              uc.condition === row.condition &&
              uc.variant === row.variant &&
              !!uc.isGraded === !!row.isGraded
          );
          const before = get().userCards.length;
          get().addCard(
            {
              cardId: row.matchedCardId,
              quantity: row.quantity,
              condition: row.condition,
              language: row.language,
              variant: row.variant,
              isGraded: row.isGraded,
              gradeCompany: row.gradeCompany,
              grade: row.grade,
              purchasePrice: row.purchasePrice,
              purchaseDate: row.purchaseDate,
              notes: row.notes,
              listIds: ["list-collection"],
            },
            { mergeDuplicates, skipHistory: true }
          );
          if (existing && mergeDuplicates) merged++;
          else if (get().userCards.length > before) added++;
          else merged++;
        }
        get().revalueUserCards();
        return { added, merged, skipped };
      },

      addWantCard: (cardId) => {
        withHistory("Add want", get);
        set((s) =>
          s.wantCardIds.includes(cardId)
            ? s
            : { wantCardIds: [...s.wantCardIds, cardId] }
        );
      },

      removeWantCard: (cardId) => {
        withHistory("Remove want", get);
        set((s) => ({
          wantCardIds: s.wantCardIds.filter((id) => id !== cardId),
        }));
      },

      refreshMarketPrices: () => {
        set((s) => ({
          catalog: driftCatalogPrices(s.catalog),
          marketRefreshedAt: new Date().toISOString(),
        }));
        get().revalueUserCards();
      },

      revalueUserCards: () => {
        set((s) => ({
          userCards: s.userCards.map((uc) => {
            const card = s.catalog.find((c) => c.id === uc.cardId);
            return {
              ...uc,
              estimatedValue: estimateUnitValue(
                card?.marketPrice,
                uc.condition,
                uc.isGraded,
                uc.gradeCompany,
                uc.grade
              ),
            };
          }),
        }));
      },

      restoreFromBackup: (backup) => {
        withHistory("Restore backup", get);
        set({
          userCards: backup.collection.userCards,
          lists: backup.collection.lists?.length
            ? backup.collection.lists
            : get().lists,
          wantCardIds: backup.collection.wantCardIds ?? [],
          filters: backup.collection.filters ?? defaultFilters,
          sort: backup.collection.sort ?? defaultSort,
          selectedId: null,
          selectedIds: [],
        });
        get().revalueUserCards();
      },

      replaceUserCards: (userCards, wantCardIds) => {
        set((s) => ({
          userCards,
          wantCardIds: wantCardIds ?? s.wantCardIds,
        }));
      },

      undo: () => {
        const hist = useHistoryStore.getState();
        const prev = hist.undo();
        if (!prev) return false;
        // push current into future
        const cur = get();
        useHistoryStore.setState((s) => ({
          future: [
            ...s.future,
            {
              label: "redo-point",
              userCards: JSON.parse(JSON.stringify(cur.userCards)),
              wantCardIds: [...cur.wantCardIds],
              at: new Date().toISOString(),
            },
          ].slice(-40),
        }));
        set({
          userCards: prev.userCards,
          wantCardIds: prev.wantCardIds,
          selectedIds: [],
        });
        return true;
      },

      redo: () => {
        const hist = useHistoryStore.getState();
        const next = hist.redo();
        if (!next) return false;
        const cur = get();
        useHistoryStore.setState((s) => ({
          past: [
            ...s.past,
            {
              label: "undo-point",
              userCards: JSON.parse(JSON.stringify(cur.userCards)),
              wantCardIds: [...cur.wantCardIds],
              at: new Date().toISOString(),
            },
          ].slice(-40),
        }));
        set({
          userCards: next.userCards,
          wantCardIds: next.wantCardIds,
          selectedIds: [],
        });
        return true;
      },

      resetToSeed: () => {
        withHistory("Reset to seed", get);
        set({
          catalog: SEED_CARDS,
          userCards: SEED_USER_CARDS,
          lists: SEED_LISTS,
          wantCardIds: SEED_WANT_CARD_IDS,
          filters: defaultFilters,
          sort: defaultSort,
          selectedId: null,
          selectedIds: [],
          marketRefreshedAt: undefined,
        });
      },

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
        catalog: s.catalog,
        marketRefreshedAt: s.marketRefreshedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const byId = new Map(state.catalog?.map((c) => [c.id, c]) ?? []);
          for (const c of SEED_CARDS) {
            if (!byId.has(c.id)) byId.set(c.id, c);
          }
          state.catalog = [...byId.values()];
          // migrate tags/location defaults
          state.userCards = state.userCards.map((uc) => ({
            ...uc,
            tags: uc.tags ?? [],
          }));
          state.hydrated = true;
        }
      },
    }
  )
);
