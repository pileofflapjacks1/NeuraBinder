/**
 * Natural-language query engine over the user's private collection.
 *
 * Privacy: only the user's collection slice + catalog metadata needed for the
 * query are used. Never send full collection to external APIs unless XAI_API_KEY
 * is set and the user explicitly enables cloud AI.
 *
 * When XAI_API_KEY is present, the API route can call Grok with a tight tool
 * schema; local parser always works offline as the default path.
 */

import type {
  AiQueryResult,
  Card,
  CollectionItem,
  CollectionFilters,
  CollectionSort,
} from "@/lib/types";
import {
  filterCollection,
  getMissingCards,
  parseNaturalLanguageQuery,
  sortCollection,
  computePortfolio,
} from "@/lib/collection/query";
import { formatCurrency, formatPct } from "@/lib/utils";

export function runLocalAiQuery(
  input: string,
  items: CollectionItem[],
  catalog: Card[]
): AiQueryResult {
  const parsed = parseNaturalLanguageQuery(input);
  const filters: CollectionFilters = parsed.filters;
  const sort: CollectionSort = parsed.sort ?? {
    field: "value",
    direction: "desc",
  };

  // Master set gap analysis
  if (filters.missingForMasterSet) {
    const setId = filters.missingForMasterSet;
    const missing = getMissingCards(catalog, items, setId);
    const setName =
      catalog.find((c) => c.setId === setId)?.setName ?? setId;
    const ownedInSet = items.filter((i) => i.card.setId === setId);
    const totalInCatalog = catalog.filter((c) => c.setId === setId).length;
    const ownedUnique = new Set(ownedInSet.map((i) => i.cardId)).size;

    return {
      interpretation: parsed.interpretation,
      filters,
      sort,
      answer: `For **${setName}**, you own **${ownedUnique}** of **${totalInCatalog}** catalog cards in this demo set (${(
        (ownedUnique / Math.max(totalInCatalog, 1)) *
        100
      ).toFixed(0)}%). Missing **${missing.length}** cards: ${missing
        .map((c) => `${c.name} (#${c.number})`)
        .join(", ") || "none"}.`,
      items: sortCollection(
        filterCollection(items, {
          ...filters,
          missingForMasterSet: undefined,
          setIds: [setId],
        }),
        sort
      ),
      suggestions: missing.slice(0, 5).map((c) => `Add ${c.name} to want list`),
    };
  }

  // Portfolio total questions
  if (/how much|worth|entire|portfolio value|total value/i.test(input)) {
    let scoped = items;
    if (filters.game && filters.game !== "all") {
      scoped = items.filter((i) => i.card.game === filters.game);
    }
    if (filters.gradedOnly) {
      scoped = scoped.filter((i) => i.isGraded);
    }
    if (filters.setIds?.length) {
      scoped = scoped.filter((i) => filters.setIds!.includes(i.card.setId));
    }
    const p = computePortfolio(scoped);
    const scope =
      filters.gradedOnly && filters.game === "pokemon"
        ? "graded Pokémon"
        : filters.game === "pokemon"
          ? "Pokémon"
          : filters.game === "lorcana"
            ? "Lorcana"
            : filters.gradedOnly
              ? "graded"
              : "entire";

    return {
      interpretation: `Valuing your ${scope} collection`,
      filters,
      sort: { field: "value", direction: "desc" },
      answer: `Your ${scope} collection is worth **${formatCurrency(
        p.totalValue
      )}** right now (cost basis ${formatCurrency(
        p.totalCost
      )}, unrealized ${formatCurrency(p.unrealizedGain)} / ${formatPct(
        p.unrealizedGainPct
      )}). ${p.uniqueCount} unique entries · ${p.cardCount} total cards · ${
        p.gradedCount
      } graded.`,
      items: sortCollection(scoped, { field: "value", direction: "desc" }).slice(
        0,
        25
      ),
      suggestions: [
        "Show graded only",
        "Top gainers",
        "Missing for master set of Scarlet & Violet 151",
      ],
    };
  }

  // Trade suggestions (simple heuristic)
  if (/suggest trades?|trade proposal|for a psa/i.test(input)) {
    const trade = items.filter((i) => i.listIds.includes("list-trade"));
    const total = trade.reduce((s, i) => s + i.totalValue, 0);
    return {
      interpretation: "Trade binder valuation & proposal draft",
      filters: { listId: "list-trade" },
      sort: { field: "value", direction: "desc" },
      answer: `Your trade binder has **${trade.length}** lots worth **${formatCurrency(
        total
      )}**. Suggested opener: "Hey — I have ${trade
        .slice(0, 3)
        .map((i) => `${i.card.name} (${formatCurrency(i.totalValue)})`)
        .join(
          ", "
        )} available. Looking to move toward a high-end graded piece; open to multi-card packages around equal value."`,
      items: sortCollection(trade, { field: "value", direction: "desc" }),
      suggestions: ["Show investment holds", "Generate want list share link"],
    };
  }

  // Risers
  if (/risen|gainers?|30%|increased/i.test(input)) {
    const gainers = sortCollection(items, {
      field: "gain",
      direction: "desc",
    }).filter((i) => i.unrealizedGain > 0 && i.totalCost > 0);
    const big = gainers.filter(
      (i) => i.totalCost > 0 && i.unrealizedGain / i.totalCost >= 0.3
    );
    const list = big.length ? big : gainers;
    return {
      interpretation: "Cards with strongest unrealized gains",
      filters,
      sort: { field: "gain", direction: "desc" },
      answer:
        list.length === 0
          ? "No clear gainers in the current demo prices."
          : `Found **${list.length}** cards with positive unrealized gain${
              big.length
                ? ` (**${big.length}** over ~30% vs cost basis)`
                : " (demo prices; live feeds in Phase 2)"
            }: ${list
              .slice(0, 5)
              .map(
                (i) =>
                  `${i.card.name} ${formatCurrency(i.unrealizedGain)} (${formatPct(
                    i.totalCost ? (i.unrealizedGain / i.totalCost) * 100 : 0
                  )})`
              )
              .join("; ")}.`,
      items: list,
      suggestions: ["Graded only", "Illustration Rares under $40"],
    };
  }

  const filtered = sortCollection(
    filterCollection(items, filters, catalog),
    sort
  );

  return {
    interpretation: parsed.interpretation,
    filters,
    sort,
    answer:
      filtered.length === 0
        ? "No cards matched that query. Try broadening filters or resetting the collection view."
        : `Matched **${filtered.length}** items (showing top results). Total value of matches: **${formatCurrency(
            filtered.reduce((s, i) => s + i.totalValue, 0)
          )}**.`,
    items: filtered,
    suggestions: [
      "Show me all Illustration Rares I own under $40",
      "What am I missing for a master set of Scarlet & Violet 151?",
      "How much is my entire graded Pokémon collection worth right now?",
    ],
  };
}

/**
 * Build a privacy-preserving context payload for Grok tool-calling.
 * Only include fields necessary for the active query.
 */
export function buildGrokContext(
  items: CollectionItem[],
  maxItems = 80
): {
  summary: ReturnType<typeof computePortfolio>;
  sample: {
    name: string;
    set: string;
    rarity: string;
    condition: string;
    qty: number;
    value: number;
    cost: number;
    graded: boolean;
    lists: string[];
  }[];
} {
  const summary = computePortfolio(items);
  const sample = sortCollection(items, { field: "value", direction: "desc" })
    .slice(0, maxItems)
    .map((i) => ({
      name: i.card.name,
      set: i.card.setName,
      rarity: i.card.rarity,
      condition: i.condition,
      qty: i.quantity,
      value: Math.round(i.totalValue * 100) / 100,
      cost: Math.round(i.totalCost * 100) / 100,
      graded: i.isGraded,
      lists: i.listIds,
    }));
  return { summary, sample };
}
