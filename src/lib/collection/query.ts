/**
 * High-performance collection filtering & sorting for 5k–20k+ card inventories.
 * Pure functions — safe for client and server.
 */

import type {
  Card,
  CollectionFilters,
  CollectionItem,
  CollectionSort,
  PortfolioSummary,
  SetProgress,
  UserCard,
} from "@/lib/types";
import { estimateUnitValue } from "@/lib/utils";

export function toCollectionItem(userCard: UserCard, card: Card): CollectionItem {
  const unit = estimateUnitValue(
    userCard.estimatedValue ?? card.marketPrice,
    userCard.condition,
    userCard.isGraded,
    userCard.gradeCompany,
    userCard.grade
  );
  // Prefer stored estimatedValue if set (already includes grade/condition)
  const unitValue =
    userCard.estimatedValue != null
      ? userCard.estimatedValue
      : unit;
  const totalValue = unitValue * userCard.quantity;
  const totalCost = (userCard.purchasePrice ?? 0) * userCard.quantity;
  return {
    ...userCard,
    card,
    totalCost,
    totalValue,
    unrealizedGain: totalValue - totalCost,
  };
}

export function buildCollectionItems(
  userCards: UserCard[],
  cardsById: Map<string, Card>
): CollectionItem[] {
  const items: CollectionItem[] = [];
  for (const uc of userCards) {
    const card = cardsById.get(uc.cardId);
    if (!card) continue;
    items.push(toCollectionItem(uc, card));
  }
  return items;
}

function matchesQuery(item: CollectionItem, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase().trim();
  if (!needle) return true;
  const hay = [
    item.card.searchText,
    item.notes,
    item.grade,
    item.gradeCompany,
    item.variant,
    item.condition,
    item.certNumber,
    item.location,
    ...(item.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  // Support simple multi-token AND
  return needle.split(/\s+/).every((tok) => hay.includes(tok));
}

export function filterCollection(
  items: CollectionItem[],
  filters: CollectionFilters,
  catalogCards?: Card[]
): CollectionItem[] {
  let result = items;

  if (filters.query) {
    result = result.filter((i) => matchesQuery(i, filters.query!));
  }
  if (filters.game && filters.game !== "all") {
    result = result.filter((i) => i.card.game === filters.game);
  }
  if (filters.setIds?.length) {
    const set = new Set(filters.setIds);
    result = result.filter((i) => set.has(i.card.setId));
  }
  if (filters.rarities?.length) {
    const set = new Set(filters.rarities);
    result = result.filter((i) => set.has(i.card.rarity));
  }
  if (filters.conditions?.length) {
    const set = new Set(filters.conditions);
    result = result.filter((i) => set.has(i.condition));
  }
  if (filters.variants?.length) {
    const set = new Set(filters.variants);
    result = result.filter((i) => set.has(i.variant));
  }
  if (filters.gradedOnly) {
    result = result.filter((i) => i.isGraded);
  }
  if (filters.minValue != null) {
    result = result.filter((i) => i.totalValue >= filters.minValue!);
  }
  if (filters.maxValue != null) {
    result = result.filter((i) => i.totalValue <= filters.maxValue!);
  }
  if (filters.listId) {
    result = result.filter((i) => i.listIds.includes(filters.listId!));
  }
  if (filters.language) {
    result = result.filter((i) => i.language === filters.language);
  }
  if (filters.location) {
    const loc = filters.location.toLowerCase();
    result = result.filter((i) =>
      (i.location ?? "").toLowerCase().includes(loc)
    );
  }
  if (filters.tags?.length) {
    result = result.filter((i) =>
      filters.tags!.every((t) =>
        (i.tags ?? []).map((x) => x.toLowerCase()).includes(t.toLowerCase())
      )
    );
  }

  // Master-set missing: handled via computeSetProgress / getMissingForSet
  void catalogCards;

  return result;
}

export function sortCollection(
  items: CollectionItem[],
  sort: CollectionSort
): CollectionItem[] {
  const dir = sort.direction === "asc" ? 1 : -1;
  const sorted = [...items];
  sorted.sort((a, b) => {
    let cmp = 0;
    switch (sort.field) {
      case "name":
        cmp = a.card.name.localeCompare(b.card.name);
        break;
      case "set":
        cmp =
          a.card.setName.localeCompare(b.card.setName) ||
          a.card.number.localeCompare(b.card.number, undefined, {
            numeric: true,
          });
        break;
      case "number":
        cmp = a.card.number.localeCompare(b.card.number, undefined, {
          numeric: true,
        });
        break;
      case "value":
        cmp = a.totalValue - b.totalValue;
        break;
      case "cost":
        cmp = a.totalCost - b.totalCost;
        break;
      case "quantity":
        cmp = a.quantity - b.quantity;
        break;
      case "condition": {
        const order = ["NM", "LP", "MP", "HP", "DMG"];
        cmp = order.indexOf(a.condition) - order.indexOf(b.condition);
        break;
      }
      case "gain":
        cmp = a.unrealizedGain - b.unrealizedGain;
        break;
      case "updatedAt":
        cmp = a.updatedAt.localeCompare(b.updatedAt);
        break;
      default:
        cmp = 0;
    }
    return cmp * dir;
  });
  return sorted;
}

export function computePortfolio(items: CollectionItem[]): PortfolioSummary {
  let totalValue = 0;
  let totalCost = 0;
  let cardCount = 0;
  let gradedCount = 0;
  const byGame: Record<string, number> = {};
  const setMap = new Map<
    string,
    { setId: string; setName: string; value: number; count: number }
  >();
  const rarityMap = new Map<string, { rarity: string; value: number; count: number }>();
  const conditionMap = new Map<
    string,
    { condition: string; value: number; count: number }
  >();

  for (const item of items) {
    totalValue += item.totalValue;
    totalCost += item.totalCost;
    cardCount += item.quantity;
    if (item.isGraded) gradedCount += item.quantity;

    byGame[item.card.game] = (byGame[item.card.game] ?? 0) + item.totalValue;

    const s = setMap.get(item.card.setId) ?? {
      setId: item.card.setId,
      setName: item.card.setName,
      value: 0,
      count: 0,
    };
    s.value += item.totalValue;
    s.count += item.quantity;
    setMap.set(item.card.setId, s);

    const r = rarityMap.get(item.card.rarity) ?? {
      rarity: item.card.rarity,
      value: 0,
      count: 0,
    };
    r.value += item.totalValue;
    r.count += item.quantity;
    rarityMap.set(item.card.rarity, r);

    const c = conditionMap.get(item.condition) ?? {
      condition: item.condition,
      value: 0,
      count: 0,
    };
    c.value += item.totalValue;
    c.count += item.quantity;
    conditionMap.set(item.condition, c);
  }

  const byGain = [...items].sort((a, b) => b.unrealizedGain - a.unrealizedGain);

  return {
    totalValue,
    totalCost,
    unrealizedGain: totalValue - totalCost,
    unrealizedGainPct:
      totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    cardCount,
    uniqueCount: items.length,
    gradedCount,
    byGame,
    bySet: [...setMap.values()].sort((a, b) => b.value - a.value),
    byRarity: [...rarityMap.values()].sort((a, b) => b.value - a.value),
    byCondition: [...conditionMap.values()],
    topGainers: byGain.filter((i) => i.unrealizedGain > 0).slice(0, 5),
    topLosers: byGain
      .filter((i) => i.unrealizedGain < 0)
      .reverse()
      .slice(0, 5),
  };
}

export function computeSetProgress(
  catalog: Card[],
  items: CollectionItem[],
  setId: string
): SetProgress | null {
  const setCards = catalog.filter((c) => c.setId === setId);
  if (setCards.length === 0) return null;

  const ownedIds = new Set(
    items.filter((i) => i.card.setId === setId).map((i) => i.cardId)
  );
  const missing = setCards.filter((c) => !ownedIds.has(c.id));
  const ownedItems = items.filter((i) => i.card.setId === setId);
  const sample = setCards[0];

  return {
    setId,
    setName: sample.setName,
    setCode: sample.setCode,
    game: sample.game,
    totalCards: setCards.length,
    ownedUnique: ownedIds.size,
    ownedQuantity: ownedItems.reduce((s, i) => s + i.quantity, 0),
    percentComplete: (ownedIds.size / setCards.length) * 100,
    missingCardIds: missing.map((c) => c.id),
    valueOwned: ownedItems.reduce((s, i) => s + i.totalValue, 0),
  };
}

export function getMissingCards(
  catalog: Card[],
  items: CollectionItem[],
  setId: string
): Card[] {
  const progress = computeSetProgress(catalog, items, setId);
  if (!progress) return [];
  const missing = new Set(progress.missingCardIds);
  return catalog.filter((c) => missing.has(c.id));
}

/**
 * Parse simple natural-language collection queries into filters.
 * Used offline; server AI route can refine with Grok when configured.
 */
export function parseNaturalLanguageQuery(input: string): {
  interpretation: string;
  filters: CollectionFilters;
  sort?: CollectionSort;
  setFocus?: string;
  answerHint?: string;
} {
  const q = input.trim();
  const lower = q.toLowerCase();
  const filters: CollectionFilters = {};
  let sort: CollectionSort | undefined;
  let setFocus: string | undefined;
  let interpretation = `Showing results for: "${q}"`;

  // Game
  if (/\b(pok[eé]mon|pkmn)\b/i.test(q)) filters.game = "pokemon";
  if (/\blorcana\b/i.test(q)) filters.game = "lorcana";

  // Graded
  if (/\bgraded\b|\bpsa\b|\bbgs\b|\bcgc\b/i.test(q)) {
    filters.gradedOnly = true;
  }

  // Rarity / variant
  if (/illustration rares?|illustration_rare|\bir\b(?!\w)/i.test(q)) {
    filters.rarities = ["illustration_rare"];
    filters.variants = ["illustration_rare"];
  }
  if (/special illustration|sir\b/i.test(q)) {
    filters.rarities = ["special_illustration_rare"];
    filters.variants = ["special_illustration_rare"];
  }
  if (/\benchanted\b/i.test(q)) {
    filters.rarities = ["enchanted"];
    filters.variants = ["enchanted"];
  }
  if (/\bholo\b/i.test(q)) {
    filters.variants = ["holo", "reverse_holo"];
  }

  // Price under/over
  const under = lower.match(
    /(?:under|below|less than|cheaper than|<)\s*\$?\s*(\d+(?:\.\d+)?)/
  );
  if (under) filters.maxValue = parseFloat(under[1]);

  const over = lower.match(
    /(?:over|above|more than|greater than|>)\s*\$?\s*(\d+(?:\.\d+)?)/
  );
  if (over) filters.minValue = parseFloat(over[1]);

  // Sets
  if (/151|scarlet\s*&\s*violet\s*151|sv3pt5|mew\b/i.test(q)) {
    filters.setIds = ["sv3pt5"];
    setFocus = "sv3pt5";
  }
  if (/obsidian flames|obf|sv3\b/i.test(q)) {
    filters.setIds = ["sv3"];
    setFocus = "sv3";
  }
  if (/paldean fates|paf/i.test(q)) {
    filters.setIds = ["sv4pt5"];
    setFocus = "sv4pt5";
  }
  if (/prismatic|pre\b/i.test(q)) {
    filters.setIds = ["sv8pt5"];
    setFocus = "sv8pt5";
  }
  if (/base set/i.test(q)) {
    filters.setIds = ["base1"];
    setFocus = "base1";
  }
  if (/first chapter|tfc/i.test(q)) {
    filters.setIds = ["lorcana-tfc"];
    setFocus = "lorcana-tfc";
  }

  // Master set missing
  if (/missing|master set|complete|need for/i.test(q)) {
    if (setFocus) {
      filters.missingForMasterSet = setFocus;
      interpretation = `Master set gap analysis for set ${setFocus}`;
    }
  }

  // Portfolio worth
  if (/how much|worth|value of|portfolio/i.test(q)) {
    sort = { field: "value", direction: "desc" };
    interpretation = "Portfolio value overview (sorted by value)";
  }

  // Gainers
  if (/risen|gainers?|up more|increased/i.test(q)) {
    sort = { field: "gain", direction: "desc" };
    interpretation = "Cards ranked by unrealized gain";
  }

  // Trade binder
  if (/trade binder|for trade/i.test(q)) {
    filters.listId = "list-trade";
  }
  if (/for sale|selling/i.test(q)) {
    filters.listId = "list-for-sale";
  }
  if (/investment|holds?/i.test(q)) {
    filters.listId = "list-investment";
  }

  // Name fragments if no strong structure
  const nameMatch = q.match(
    /(?:show|find|get|list)?\s*(?:me\s+)?(?:all\s+)?(.+?)(?:\s+i own|\s+under|\s+over|$)/i
  );
  if (
    nameMatch &&
    !filters.rarities &&
    !filters.setIds &&
    !filters.gradedOnly &&
    !filters.listId
  ) {
    const frag = nameMatch[1]
      .replace(/\b(cards?|that|have|my|the|a|an)\b/gi, "")
      .trim();
    if (frag.length > 1 && frag.length < 40) {
      filters.query = frag;
    }
  }

  // If still empty filters, use full string as query
  if (
    !filters.query &&
    !filters.rarities &&
    !filters.setIds &&
    !filters.gradedOnly &&
    !filters.listId &&
    !filters.minValue &&
    !filters.maxValue &&
    !filters.game &&
    !filters.missingForMasterSet
  ) {
    filters.query = q;
  }

  return { interpretation, filters, sort, setFocus };
}
