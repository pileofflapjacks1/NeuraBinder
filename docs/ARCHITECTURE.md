# NeuraBinder Architecture

## Vision

NeuraBinder is a **BCI/Neuralink-native** TCG collection and portfolio manager. Traditional collection apps optimize for touch and mouse. NeuraBinder treats **thought-driven, high-speed, low-friction control** as the primary modality while remaining excellent for keyboard, mouse, touch, and screen readers.

Product name: **NeuraBinder**  
Primary games (MVP): **Pokémon TCG**, **Disney Lorcana**  
Expandable to: MTG, One Piece, custom catalogs

---

## Stack decisions & rationale

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Next.js 15+ App Router, TypeScript, Tailwind | Performance, SSR/PWA-ready, strong a11y ecosystem |
| UI | Lightweight shadcn-style + Radix | Accessible primitives, full keyboard control |
| Client state | Zustand + persist | Instant collection UI, offline-first local edits |
| Server data | TanStack Query (ready) + Route Handlers | Clean cache boundaries for market/AI |
| DB | PostgreSQL + Drizzle | Typed schema, Supabase-friendly, RLS for privacy |
| Auth (Phase 1.5) | Clerk or Supabase Auth | Email/social/passkeys without custom auth risk |
| Market | Abstract `MarketService` | Swap TCGPlayer / PriceCharting / eBay without UI churn |
| AI | Local NL parser + optional Grok | Privacy-first; cloud only with explicit key + opt-in |
| Scan | Client UX first + `/api/scan` | Confirmation flow is the product; vision model is pluggable |
| BCI | `BciAdapter` interface | Keyboard emulator today; Neuralink SDK / WebHID later |

---

## High-level diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Clients: BCI cursor + intents · Keyboard · Touch · Voice   │
├─────────────────────────────────────────────────────────────┤
│  Next.js App Router (PWA)                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │Collection│ │  Scan    │ │Portfolio │ │ Command Bar NL │ │
│  │ + BCI UI │ │ Confirm  │ │ Charts   │ │ Local + Grok   │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬────────┘ │
│       │            │            │               │          │
│  Zustand (offline collection) · BciAdapter · Theme/A11y    │
├───────┴────────────┴────────────┴───────────────┴──────────┤
│  Route Handlers: /api/collection · /cards · /prices · /scan │
│                  /api/ai/query                               │
├─────────────────────────────────────────────────────────────┤
│  Services: MarketService · QueryEngine · Seed/Catalog sync  │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL (Drizzle) · Storage (R2/Supabase) · Optional KV │
└─────────────────────────────────────────────────────────────┘
```

---

## BCI Mode strategy

### What changes when BCI Mode is on

1. **Density** — fewer columns, larger cards (`min-h`, `h-14` controls)
2. **Focus model** — discrete `next` / `prev` / `select` / `confirm` / `cancel` / `search`
3. **Predictive ranking** — NL bar + quick views surface likely intent first
4. **Stable layout** — consistent chrome for spatial memory
5. **High-contrast option** — independent toggle
6. **Reduced motion** — independent toggle

### Intent map (`src/lib/bci/adapter.ts`)

| Intent | Keyboard (dev) | Future Neuralink |
|--------|----------------|------------------|
| select | Enter / Space | Discrete select click |
| confirm | Shift+Enter | Confirm / yes |
| cancel | Escape | Cancel / no |
| back | Backspace | Back |
| search | `/` | Search intent |
| next / prev | → / ← or n / p | Navigate candidates |
| add / remove | a / r | Inventory intents |

### Integration roadmap comments

All Neuralink hooks are concentrated in:

- `src/lib/bci/adapter.ts` — `NeuralinkBridgeAdapter`, feedback, cursor delta
- `src/components/providers.tsx` — global intent routing
- Scan flow — confirm-top-candidate path for ≤2–3 signals

---

## Data model (summary)

- **users** — prefs including `bci_mode_default`
- **card_sets / cards / card_variants** — canonical multi-TCG catalog
- **user_cards** — qty, condition, grade, cost, notes
- **lists / list_items** — want, trade, for_sale, investment, custom
- **price_history / price_alerts**
- **scans** — pending confirmations
- **saved_views** — filter presets

See `src/lib/db/schema.ts` and `supabase/migrations/001_init.sql`.

---

## AI layer

1. **Local (default)** — `parseNaturalLanguageQuery` + `runLocalAiQuery` over in-memory collection. Works offline. Zero data leaves device.
2. **Cloud (optional)** — `POST /api/ai/query` with `XAI_API_KEY` sends a **truncated sample** (top N by value) + portfolio summary, never the full private collection by default.

---

## Market data

`MarketService` tries providers in order; 1h in-memory cache. Mock provider ships for demo charts/history.

---

## Offline-first

- Collection viewing and basic CRUD: Zustand + `localStorage`
- Catalog seed bundled in client for demo
- Phase 2: service worker + IndexedDB (`idb` already installed) for true offline queue

---

## Security & privacy

- Collection **private by default**
- Explicit share only (`lists.is_public` + `share_slug`)
- RLS policies in SQL migration (enable with Supabase Auth)
- AI: prefer local; cloud uses minimal context
- No invasive analytics in MVP
- BCI signals stay on-device until user opts into cloud features

---

## Phased implementation

### Phase 0 — Done in this repo
- Project scaffold, schema, seed Pokémon + Lorcana
- Collection view + filters + BCI Mode
- Command bar (local NL)
- Scan confirmation UX (mock vision)
- Portfolio dashboard + CSV export
- Lists + trade proposal copy
- Settings / a11y
- API route stubs

### Phase 1 — Usable personal MVP
- Supabase/Clerk auth
- Persist user_cards to Postgres
- CSV / Collectr import
- Full set catalog sync (Pokémon TCG API)
- Real camera → recognition API

### Phase 2
- Live market feeds + price alerts
- Public want/have matching
- Service worker offline queue
- Shared family collections
- Tax-lot tracking
- Neuralink SDK binding when available
