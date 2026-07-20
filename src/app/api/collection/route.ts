import { NextResponse } from "next/server";
import { SEED_CARDS, SEED_LISTS, SEED_USER_CARDS } from "@/lib/seed/cards";
import { buildCollectionItems, computePortfolio } from "@/lib/collection/query";

/**
 * GET /api/collection
 * Returns demo collection (local-first MVP).
 * Production: auth-gated query against Postgres via Drizzle.
 */
export async function GET() {
  const cardsById = new Map(SEED_CARDS.map((c) => [c.id, c]));
  const items = buildCollectionItems(SEED_USER_CARDS, cardsById);
  const portfolio = computePortfolio(items);

  return NextResponse.json(
    {
      items,
      lists: SEED_LISTS,
      catalogSize: SEED_CARDS.length,
      portfolio,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=30",
      },
    }
  );
}
