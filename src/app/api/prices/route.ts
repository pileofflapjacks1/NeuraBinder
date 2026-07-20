import { NextResponse } from "next/server";
import { marketService } from "@/lib/market/service";
import { SEED_CARDS } from "@/lib/seed/cards";

/**
 * GET /api/prices?cardId=&history=1&days=90
 * Abstracted market layer with aggressive caching (in-memory demo).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get("cardId");
  const history = searchParams.get("history") === "1";
  const days = parseInt(searchParams.get("days") ?? "90", 10);

  if (!cardId) {
    return NextResponse.json({ error: "cardId required" }, { status: 400 });
  }

  const card = SEED_CARDS.find((c) => c.id === cardId);
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const price = await marketService.getBestPrice(card);
  const payload: Record<string, unknown> = {
    cardId,
    ...price,
    currency: "USD",
  };

  if (history) {
    payload.history = await marketService.getHistory(cardId, days);
  }

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
}
