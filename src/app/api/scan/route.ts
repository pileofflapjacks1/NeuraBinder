import { NextResponse } from "next/server";
import { z } from "zod";
import { SEED_CARDS } from "@/lib/seed/cards";

/**
 * POST /api/scan
 * Card identification endpoint.
 *
 * MVP: returns ranked mock candidates (vision pipeline integration point).
 * ROADMAP: edge vision model, third-party recognition API, slab OCR.
 */

const bodySchema = z.object({
  /** base64 image optional — not required for demo */
  imageBase64: z.string().optional(),
  game: z.enum(["pokemon", "lorcana", "all"]).optional().default("all"),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    let pool = SEED_CARDS;
    if (body.game !== "all") {
      pool = pool.filter((c) => c.game === body.game);
    }

    // Deterministic-ish ranking for demo: prefer higher market value + name length hash
    const ranked = [...pool]
      .sort((a, b) => (b.marketPrice ?? 0) - (a.marketPrice ?? 0))
      .slice(0, 8)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((card, i) => ({
        cardId: card.id,
        card,
        confidence: Math.round((0.9 - i * 0.11) * 100) / 100,
        suggestedCondition: i === 0 ? "NM" : "LP",
        suggestedVariant: card.rarity.includes("illustration")
          ? card.rarity
          : "normal",
      }));

    return NextResponse.json({
      candidates: ranked,
      status: "pending",
      // BCI: client should present top candidate first for one-signal confirm
      uxHint: "confirm_top_or_cycle",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
