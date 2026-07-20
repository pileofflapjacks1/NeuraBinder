/**
 * Local want/have trade matching against seed peer collectors.
 */

import type { Card, CollectionItem } from "@/lib/types";
import type { TradeMatch, TradePeer } from "@/lib/types/features";

export const SEED_PEERS: TradePeer[] = [
  {
    id: "peer-alex",
    displayName: "Alex (151 hunter)",
    bio: "Finishing SV151 IRs. Heavy into modern.",
    wantCardIds: [
      "sv3pt5-168",
      "sv3pt5-166",
      "sv3pt5-170",
      "sv3pt5-025-ir",
      "sv3pt5-094",
    ],
    haveCardIds: [
      "sv3pt5-094",
      "sv3pt5-143",
      "sv3pt5-131",
      "sv3pt5-065",
      "sv4pt5-055",
      "lorcana-tfc-192",
    ],
  },
  {
    id: "peer-sam",
    displayName: "Sam (Lorcana & slabs)",
    bio: "Enchanteds + graded modern.",
    wantCardIds: [
      "lorcana-tfc-204",
      "lorcana-tfc-005",
      "sv3-199",
      "sv8pt5-100",
    ],
    haveCardIds: [
      "lorcana-tfc-001",
      "lorcana-ur-042",
      "base1-58",
      "sv3pt5-151",
      "sv3-125",
    ],
  },
  {
    id: "peer-riley",
    displayName: "Riley (trade binder)",
    bio: "Open to multi-card packages.",
    wantCardIds: ["sv3pt5-199", "sv3pt5-193", "base1-4", "sv4pt5-227"],
    haveCardIds: [
      "sv3pt5-025",
      "sv3pt5-004",
      "sv3pt5-001",
      "sv3pt5-007",
      "sv3pt5-150",
      "sv8pt5-028",
    ],
  },
];

export function computeTradeMatches(
  myItems: CollectionItem[],
  myWantIds: string[],
  catalog: Card[],
  peers: TradePeer[] = SEED_PEERS
): TradeMatch[] {
  const myHaveIds = new Set(myItems.map((i) => i.cardId));
  const valueByCard = new Map<string, number>();
  for (const i of myItems) {
    valueByCard.set(
      i.cardId,
      (valueByCard.get(i.cardId) ?? 0) + i.totalValue
    );
  }
  const catalogMap = new Map(catalog.map((c) => [c.id, c]));

  const matches: TradeMatch[] = [];

  for (const peer of peers) {
    const theyWantFromMe = peer.wantCardIds
      .filter((id) => myHaveIds.has(id))
      .map((cardId) => {
        const card = catalogMap.get(cardId);
        return {
          cardId,
          name: card?.name ?? cardId,
          value: valueByCard.get(cardId) ?? card?.marketPrice ?? 0,
        };
      });

    const iWantFromThem = peer.haveCardIds
      .filter((id) => myWantIds.includes(id) || !myHaveIds.has(id))
      .filter((id) => myWantIds.includes(id))
      .map((cardId) => {
        const card = catalogMap.get(cardId);
        return {
          cardId,
          name: card?.name ?? cardId,
          value: card?.marketPrice ?? 0,
        };
      });

    // Also surface cards they have that I don't own (secondary)
    const extras = peer.haveCardIds
      .filter((id) => !myHaveIds.has(id) && !myWantIds.includes(id))
      .slice(0, 0); // reserved

    void extras;

    const score =
      theyWantFromMe.length * 2 +
      iWantFromThem.length * 3 +
      theyWantFromMe.reduce((s, x) => s + x.value, 0) * 0.01;

    if (theyWantFromMe.length || iWantFromThem.length) {
      matches.push({
        peer,
        theyWantFromMe,
        iWantFromThem,
        score,
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

export function buildTradeProposal(
  match: TradeMatch,
  myName = "me"
): string {
  const offer = match.theyWantFromMe
    .map((c) => `• ${c.name} (~$${c.value.toFixed(2)})`)
    .join("\n");
  const want = match.iWantFromThem
    .map((c) => `• ${c.name} (~$${c.value.toFixed(2)})`)
    .join("\n");

  return `Trade proposal via NeuraBinder

Hi ${match.peer.displayName} — I'm ${myName}.

I can offer:
${offer || "• (open to counter)"}

I'm interested in:
${want || "• equal-value package from your binder"}

Happy to multi-card to even value. Thanks!`;
}
