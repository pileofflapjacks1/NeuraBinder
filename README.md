# NeuraBinder

**BCI / Neuralink-native TCG collection & portfolio manager** for Pokémon TCG and Disney Lorcana — designed so managing a large physical + digital collection feels as fast as thinking.

> The first TCG-type app architecture aimed at future Neuralink users: high-bandwidth cursor, discrete intents, predictive ranking, low clutter, and first-class keyboard/screen-reader support.

---

## Features (local-first MVP)

- **Collection management** — qty, condition, variants, grades, cost basis, notes, multi-lists
- **CSV import** — NeuraBinder / TCGPlayer-style / Collectr-style + duplicate merge (`/import`)
- **BCI Mode + profile** — targets, intent-only, switch-scan, calibration wizard, sound feedback
- **Intent palette** — ⌘K power actions with predictive ranking
- **NL command bar that acts** — filters + mutations (want list, move to trade, alerts…)
- **Batch scan queue** — simulate/capture → pending confirms (vision API later)
- **Visual binder** — 3×3 pages + cheapest path to complete (`/binder`)
- **Trade match** — local seed peers + trade proposal copy (`/trade`)
- **Watch & intel** — price alerts, watchlist, mock market refresh (`/watch`)
- **Portfolio + tax lots** — charts, CSV export, lot cost basis
- **Offline queue** — IndexedDB ops when offline; auto-flush online
- **Undo/redo** — ⌘Z / ⌘⇧Z for collection edits
- **Bulk select** — multi-edit condition, tags, location, lists
- **Saved views** — named filter presets on collection
- **JSON backup/restore** — Settings → download/restore full local state
- **Portfolio snapshots** — value-over-time chart (local history)
- **Locations + tags** — physical storage + free tags
- **Trade package calculator** — `/trade/calculator`
- **Fuzzy search + virtualized grid** — Fuse.js + TanStack Virtual
- **Service worker** — offline shell in production builds
- **Dwell-to-select + guided tour** — BCI calibration path
- See **TODO.md** for full backlog and external blockers

---

## Quick start

```bash
cd ~/projects/neurabinder   # or /Users/joe/Projects/neurabinder
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
pnpm build    # production build
pnpm start    # serve production
pnpm lint     # eslint
```

Optional icons:

```bash
node scripts/generate-icons.mjs
```

---

## Environment variables

Copy `.env.example` → `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | No | Postgres connection string (Supabase/PlanetScale). Without it, local seed + Zustand is used. |
| `XAI_API_KEY` | No | Enables optional Grok enhancement on `/api/ai/query` |
| `XAI_MODEL` | No | Default `grok-3-mini` |
| `NEXT_PUBLIC_ENABLE_CLOUD_AI` | No | Set `true` to let the client call cloud AI from the command bar |
| `NEXT_PUBLIC_APP_URL` | No | Canonical app URL for share links |

---

## Project structure

```
src/
  app/                  # App Router pages + API routes
  components/
    collection/         # BCI-optimized grid, filters, detail
    command/            # Always-on NL bar
    scan/               # Camera + confirmation UX
    portfolio/
    layout/             # Shell, nav
    ui/                 # Primitives
  lib/
    bci/                # BciAdapter + Neuralink roadmap hooks
    collection/         # Filter/sort/portfolio pure functions
    ai/                 # Local NL + Grok context builder
    market/             # Price provider abstraction
    db/                 # Drizzle schema
    seed/               # Pokémon + Lorcana demo catalog
    stores/             # Zustand (collection, BCI prefs)
docs/ARCHITECTURE.md    # Full architecture & phases
supabase/migrations/    # SQL + RLS sketch
```

---

## BCI Mode

Toggle **BCI Mode** in the header or Settings.

| Action | Input |
|--------|--------|
| Select / open | Enter or Space |
| Confirm | Shift+Enter (scan flow also accepts Enter) |
| Cancel / close | Escape |
| Search / command bar | `/` |
| Next / previous item | → ← or `n` `p` |
| Add / remove | `a` / `r` (where implemented) |

Integration surface for future Neuralink SDK / WebHID:

```text
src/lib/bci/adapter.ts
```

---

## Try these NL queries

- Show me all Illustration Rares I own under $40  
- What am I missing for a master set of Scarlet & Violet 151?  
- How much is my entire graded Pokémon collection worth right now?  
- Cards that have risen more than 30% in the last 90 days  
- Suggest trades from my trade binder  

---

## Database

Drizzle schema: `src/lib/db/schema.ts`  
SQL migration: `supabase/migrations/001_init.sql`

```bash
# when DATABASE_URL is set
pnpm db:generate
pnpm db:push
```

---

## Seed data

`src/lib/seed/cards.ts` ships a realistic **demo collection** (Pokémon 151 / Obsidian Flames / Paldean Fates / Prismatic / Base Set + Lorcana First Chapter / Ursula’s Return).

**Production seed approach:**

1. Nightly job: Pokémon TCG API → `cards` / `card_sets`
2. Lorcana public sources / partner feeds → same tables (`game = 'lorcana'`)
3. Users can attach custom variants without polluting canonical rows
4. Images: hotlink CDN early; later Cloudflare R2 / Supabase Storage

---

## Security & privacy

- Collections are **private by default** (local demo; RLS when using Supabase)
- Sharing only via explicit public lists / slugs
- AI prefers **on-device** parsing; Grok receives a minimal sample only when configured
- No invasive analytics in MVP
- BCI intent handling stays client-side

---

## Phased roadmap

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the full plan.

1. **Now** — local demo, BCI UX, NL, scan confirm, portfolio  
2. **Phase 1** — auth, Postgres persist, CSV import, full catalog sync, real recognition  
3. **Phase 2** — live prices, trade matching, offline SW, Neuralink SDK, family sharing  

---

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Next.js dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Drizzle kit generate |
| `pnpm db:push` | Push schema to DATABASE_URL |

---

## License

Private / all rights reserved unless otherwise stated.
