import { NextResponse } from "next/server";
import { SEED_CARDS } from "@/lib/seed/cards";

/**
 * GET /api/cards?q=&game=&set=
 * Catalog search for add-card / scan correction flows.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").toLowerCase().trim();
  const game = searchParams.get("game");
  const set = searchParams.get("set");

  let results = SEED_CARDS;
  if (game) results = results.filter((c) => c.game === game);
  if (set) results = results.filter((c) => c.setId === set);
  if (q) {
    results = results.filter((c) => c.searchText.includes(q));
  }

  return NextResponse.json({
    cards: results.slice(0, 50),
    total: results.length,
  });
}
