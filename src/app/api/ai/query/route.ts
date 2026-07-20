import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildGrokContext,
  runLocalAiQuery,
} from "@/lib/ai/query-engine";
import { SEED_CARDS, SEED_USER_CARDS } from "@/lib/seed/cards";
import { buildCollectionItems } from "@/lib/collection/query";

/**
 * POST /api/ai/query
 *
 * Privacy-first NL query endpoint.
 * - Always can answer via local parser over demo/server collection context.
 * - If XAI_API_KEY is set, optionally calls Grok with a minimal context slice.
 *
 * Client should send only what's needed; for full privacy keep AI local.
 */

const bodySchema = z.object({
  query: z.string().min(1).max(2000),
  /** Optional: client can pass serialized items; otherwise demo seed is used */
  useDemo: z.boolean().optional().default(true),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { query } = bodySchema.parse(json);

    const cardsById = new Map(SEED_CARDS.map((c) => [c.id, c]));
    const items = buildCollectionItems(SEED_USER_CARDS, cardsById);
    const local = runLocalAiQuery(query, items, SEED_CARDS);

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        ...local,
        source: "local",
      });
    }

    // Optional Grok enhancement — minimal private context only
    const ctx = buildGrokContext(items, 40);
    try {
      const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.XAI_MODEL ?? "grok-3-mini",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content: `You are NeuraBinder AI, a TCG collection assistant. Answer ONLY about the user's collection context provided. Be concise. Suggest filters when helpful. Never invent cards not in context. Portfolio summary: value=${ctx.summary.totalValue}, cost=${ctx.summary.totalCost}, cards=${ctx.summary.cardCount}.`,
            },
            {
              role: "user",
              content: `Query: ${query}\n\nCollection sample JSON:\n${JSON.stringify(ctx.sample)}`,
            },
          ],
        }),
      });

      if (grokRes.ok) {
        const data = (await grokRes.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return NextResponse.json({
            ...local,
            answer: content,
            source: "grok+local",
          });
        }
      }
    } catch {
      // fall through to local
    }

    return NextResponse.json({ ...local, source: "local" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
