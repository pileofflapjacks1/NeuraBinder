/**
 * Abstracted market data layer.
 * Plug in TCGPlayer, PriceCharting, eBay sold, etc. Cache aggressively.
 */

import type { Card, CardCondition, PricePoint } from "@/lib/types";
import { nanoid } from "nanoid";

export interface MarketProvider {
  id: string;
  getPrice(
    card: Card,
    opts?: { condition?: CardCondition; variant?: string }
  ): Promise<number | null>;
  getHistory?(cardId: string, days?: number): Promise<PricePoint[]>;
}

/** Deterministic mock prices with mild drift for charts */
export class MockMarketProvider implements MarketProvider {
  id = "mock";

  async getPrice(card: Card): Promise<number | null> {
    return card.marketPrice ?? null;
  }

  async getHistory(cardId: string, days = 90): Promise<PricePoint[]> {
    // Seed from cardId hash for stable demo charts
    let hash = 0;
    for (let i = 0; i < cardId.length; i++) {
      hash = (hash * 31 + cardId.charCodeAt(i)) >>> 0;
    }
    const base = 10 + (hash % 200);
    const points: PricePoint[] = [];
    const now = Date.now();
    let price = base;
    for (let d = days; d >= 0; d--) {
      const drift = Math.sin((hash + d) * 0.15) * 0.03 + ((hash + d) % 7) * 0.001;
      price = Math.max(0.1, price * (1 + drift * 0.1));
      points.push({
        id: nanoid(),
        cardId,
        source: "mock",
        price: Math.round(price * 100) / 100,
        currency: "USD",
        recordedAt: new Date(now - d * 86400000).toISOString(),
      });
    }
    return points;
  }
}

/**
 * ROADMAP: TCGPlayerMarketProvider
 * - Use partner API / affiliate scrape with aggressive Redis/KV cache (1h TTL market, 24h history)
 */
export class TcgPlayerMarketProvider implements MarketProvider {
  id = "tcgplayer";

  async getPrice(_card: Card): Promise<number | null> {
    // Placeholder until API keys configured
    return null;
  }
}

const cache = new Map<string, { at: number; value: number | null }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

export class MarketService {
  constructor(private providers: MarketProvider[] = [new MockMarketProvider()]) {}

  async getBestPrice(
    card: Card,
    opts?: { condition?: CardCondition; variant?: string }
  ): Promise<{ price: number | null; source: string }> {
    const key = `${card.id}:${opts?.condition ?? ""}:${opts?.variant ?? ""}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return { price: hit.value, source: "cache" };
    }

    for (const p of this.providers) {
      try {
        const price = await p.getPrice(card, opts);
        if (price != null) {
          cache.set(key, { at: Date.now(), value: price });
          return { price, source: p.id };
        }
      } catch {
        // try next provider
      }
    }
    cache.set(key, { at: Date.now(), value: card.marketPrice ?? null });
    return { price: card.marketPrice ?? null, source: "fallback" };
  }

  async getHistory(cardId: string, days = 90): Promise<PricePoint[]> {
    for (const p of this.providers) {
      if (p.getHistory) {
        try {
          return await p.getHistory(cardId, days);
        } catch {
          /* next */
        }
      }
    }
    return [];
  }
}

export const marketService = new MarketService();
