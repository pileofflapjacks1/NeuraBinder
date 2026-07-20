/**
 * Local AI actions that *mutate* collection state (privacy-first, offline).
 */

import type { AiQueryResult, Card, CollectionItem } from "@/lib/types";
import type { AiAction } from "@/lib/types/features";
import { runLocalAiQuery } from "./query-engine";

export interface AiResultWithActions extends AiQueryResult {
  actions: AiAction[];
}

export function runLocalAiWithActions(
  input: string,
  items: CollectionItem[],
  catalog: Card[]
): AiResultWithActions {
  const base = runLocalAiQuery(input, items, catalog);
  const actions: AiAction[] = [];
  const lower = input.toLowerCase();

  // Navigate suggestions
  if (/portfolio|worth|value/i.test(input)) {
    actions.push({
      type: "navigate",
      label: "Open portfolio",
      description: "Go to portfolio dashboard",
      payload: { href: "/portfolio" },
    });
  }
  if (/missing|master set|binder/i.test(input)) {
    actions.push({
      type: "navigate",
      label: "Open visual binder",
      description: "Browse set binder pages",
      payload: { href: "/binder" },
    });
  }
  if (/trade/i.test(input)) {
    actions.push({
      type: "navigate",
      label: "Open trade match",
      description: "See local want/have matches",
      payload: { href: "/trade" },
    });
  }
  if (/scan/i.test(input)) {
    actions.push({
      type: "navigate",
      label: "Open scan",
      description: "Camera / batch scan flow",
      payload: { href: "/scan" },
    });
  }

  // Add to want list: "add Gengar to want list"
  const wantAdd = input.match(
    /add\s+(.+?)\s+to\s+(?:my\s+)?want(?:\s+list)?/i
  );
  if (wantAdd) {
    const name = wantAdd[1].trim();
    const card = catalog.find(
      (c) =>
        c.name.toLowerCase() === name.toLowerCase() ||
        c.name.toLowerCase().includes(name.toLowerCase())
    );
    if (card) {
      actions.push({
        type: "add_to_want",
        label: `Add ${card.name} to want list`,
        description: `Want list += ${card.name} (${card.setCode} #${card.number})`,
        payload: { cardId: card.id },
      });
    }
  }

  // Move filtered / named card to list
  const moveMatch = input.match(
    /move\s+(.+?)\s+to\s+(trade|investment|for sale|want|collection)/i
  );
  if (moveMatch) {
    const name = moveMatch[1].trim();
    const listKey = moveMatch[2].toLowerCase();
    const listId =
      listKey === "trade"
        ? "list-trade"
        : listKey === "investment"
          ? "list-investment"
          : listKey === "for sale"
            ? "list-for-sale"
            : listKey === "want"
              ? "list-want"
              : "list-collection";
    const item = items.find((i) =>
      i.card.name.toLowerCase().includes(name.toLowerCase())
    );
    if (item) {
      actions.push({
        type: "move_to_list",
        label: `Move ${item.card.name} → ${listKey}`,
        description: `Add list membership ${listId}`,
        payload: { userCardId: item.id, listId },
      });
    }
  }

  // Add card from catalog: "add 2 Squirtle to collection"
  const addMatch = input.match(
    /add\s+(\d+\s+)?(.+?)\s+to\s+(?:my\s+)?collection/i
  );
  if (addMatch) {
    const qty = parseInt((addMatch[1] ?? "1").trim() || "1", 10) || 1;
    const name = addMatch[2].trim();
    const card = catalog.find(
      (c) =>
        c.name.toLowerCase() === name.toLowerCase() ||
        c.searchText.includes(name.toLowerCase())
    );
    if (card) {
      actions.push({
        type: "add_card",
        label: `Add ×${qty} ${card.name}`,
        description: `Create collection entry for ${card.name}`,
        payload: {
          cardId: card.id,
          quantity: qty,
          condition: "NM",
          language: "en",
          variant: "normal",
          isGraded: false,
          listIds: ["list-collection"],
        },
      });
    }
  }

  // Price alert: "alert me if Iono under 100"
  const alertMatch = input.match(
    /alert(?:\s+me)?\s+(?:if|when)\s+(.+?)\s+(?:under|below|over|above)\s+\$?(\d+)/i
  );
  if (alertMatch) {
    const name = alertMatch[1].trim();
    const price = parseFloat(alertMatch[2]);
    const card = catalog.find((c) =>
      c.name.toLowerCase().includes(name.toLowerCase())
    );
    const direction = /over|above/i.test(input) ? "above" : "below";
    if (card) {
      actions.push({
        type: "create_alert",
        label: `Alert: ${card.name} ${direction} $${price}`,
        description: "Create local price alert",
        payload: {
          cardId: card.id,
          cardName: card.name,
          direction,
          targetPrice: price,
        },
      });
    }
  }

  // If we have filter results, offer set_filters as explicit action
  if (base.filters && Object.keys(base.filters).length) {
    actions.unshift({
      type: "set_filters",
      label: "Apply filters to collection",
      description: base.interpretation,
      payload: {
        filters: base.filters,
        sort: base.sort,
      },
    });
  }

  // Suggestions from missing master set
  if (base.suggestions?.length && /missing|want/i.test(lower)) {
    for (const s of base.suggestions.slice(0, 3)) {
      const m = s.match(/Add (.+) to want/i);
      if (m) {
        const card = catalog.find((c) => c.name === m[1]);
        if (card) {
          actions.push({
            type: "add_to_want",
            label: s,
            description: s,
            payload: { cardId: card.id },
          });
        }
      }
    }
  }

  return {
    ...base,
    actions,
    suggestions: [
      ...(base.suggestions ?? []),
      "Add Gengar to want list",
      "Move Charizard to trade",
      "Alert me if Iono under 100",
    ],
  };
}
