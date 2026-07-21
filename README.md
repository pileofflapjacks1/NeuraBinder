# NeuraBinder

**BCI-inspired TCG collection & portfolio manager** for Pokémon TCG and Disney Lorcana — local-first, keyboard-first, with a **BCI Mode** optimized for discrete intents, dwell/switch, and low visual clutter.

> **Computer-side web app only.** Not implant software. Not a medical device. **Not affiliated with** Neuralink, The Pokémon Company, or Disney. Accessibility prototyping and suite demo.

**Version:** 0.2.2  
**Hero demo:** [`/demo`](./src/app/demo/page.tsx) · **Showcase:** `?showcase=1` · **A11y:** [`/a11y`](./src/app/a11y/page.tsx)  
**Intent socket:** [docs/INTENT_SOCKET.md](./docs/INTENT_SOCKET.md)  
**Screenshots:** [`public/screenshots/`](./public/screenshots/) · **OG:** [`public/og/demo.svg`](./public/og/demo.svg)

---

## Neurabeach suite

| Piece | Role |
|-------|------|
| **Neurabeach** | Catalog / storefront — listing slug **`neurabinder`**, collection **`col-neura-suite`** |
| **NeuralBridge** | Intent middleware — Settings → NeuralBridge (simulator or multi-client service) |
| **NeuraBinder** | This app — end-user web MVP |
| **Intent → OS** | Reference adapter (separate package) |

Package contract: **[`neurabeach-manifest.json`](./neurabeach-manifest.json)**

| Field | Value |
|-------|--------|
| `safety_class` | `computer_side` |
| `runtime` | `web` |
| `inputs` | `class_label`, `switch_binary`, `velocity_2d`, `synthetic` |
| `banned_claims` | `true` |

---

## Quick start

```bash
cd ~/Projects/neurabinder   # or /Users/joe/Projects/neurabinder
pnpm install
pnpm dev
```

| URL | Purpose |
|-----|---------|
| http://localhost:3000/demo | **Public showcase** — scripted path, record/replay, intents |
| http://localhost:3000/a11y | Accessibility scorecard |
| http://localhost:3000/?showcase=1 | Showcase mode (seed lock + banner) |
| http://localhost:3000/collection | Full collection UI |
| http://localhost:3000 | Home |

```bash
pnpm build    # must succeed for ship
pnpm start    # production server
pnpm intent:ws  # optional local NeuralBridge-shaped WS on :7843
pnpm lint
```

No env vars required for the local demo. Optional keys (Postgres, Grok) are in [`.env.example`](./.env.example).

---

## Deploy (Vercel)

1. Push to GitHub (this repo).
2. [vercel.com/new](https://vercel.com/new) → import **pileofflapjacks1/NeuraBinder**.
3. Framework: Next.js (auto). No env required for demo.
4. Production URL → set as Neurabeach `demo` / project link when listing is updated.

```bash
# if you have Vercel CLI logged in:
npx vercel
npx vercel --prod
```

`vercel.json` is included. Service worker offline shell activates in production builds only.

---

## BCI Mode (no hardware)

| Action | Input |
|--------|--------|
| Intent palette | `⌘K` / `Ctrl+K` |
| Command bar | `/` |
| Select / confirm | Enter · Space |
| Cancel | Esc |
| Navigate | ← → or `n` `p` |
| Undo / redo | `⌘Z` / `⌘⇧Z` |

Synthetic intents (NeuralBridge-shaped): `src/lib/bci/generic-intent.ts` — used on **`/demo`**.

Keyboard emulator: `src/lib/bci/adapter.ts`. Future: plug generic streams from NeuralBridge; do **not** hardcode implant APIs.

---

## Features (0.2.0 MVP)

- Collection: filters, bulk edit, saved views, undo/redo, locations/tags  
- Import CSV (local match) · visual binder · scan queue (mock ID)  
- Portfolio + tax lots + local snapshots  
- Trade match (seed peers) · trade package calculator  
- Watchlist / price alerts (local mock market)  
- Offline mutation queue (IndexedDB) · PWA shell  
- Intent palette + NL command bar that can mutate collection  

Full backlog: [`TODO.md`](./TODO.md)

---

## Safety & claims

- **Allowed:** computer-side UI, simulation, accessibility prototyping, generic intent streams  
- **Forbidden claims:** implant firmware, medical treatment, Neuralink partnership, official Pokémon/Disney product  

TCG names are used for interoperability of a personal collection tracker only.

---

## License

Private / all rights reserved unless otherwise stated. Open the GitHub repo when ready for public showcase.
