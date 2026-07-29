# NeuraBinder

**BCI-inspired TCG collection & portfolio manager** for Pokémon TCG and Disney Lorcana — local-first, keyboard-first, with a **BCI Mode** optimized for discrete intents, dwell/switch, and low visual clutter.

> **Computer-side web app only.** Not implant software. Not a medical device. **Not affiliated with** Neuralink, The Pokémon Company, or Disney. Accessibility prototyping and suite demo.

**Version:** 0.3.0  
**Live demo:** [neura-binder.vercel.app/demo](https://neura-binder.vercel.app/demo) · **A11y:** [/a11y](https://neura-binder.vercel.app/a11y)  
**Suite role:** app (`depends_on: neurabridge`) · **Manifest:** [`neurabeach-manifest.json`](./neurabeach-manifest.json) · **Listing:** [`LISTING.md`](./LISTING.md)  
**Intent / Neurabridge:** [docs/INTENT_SOCKET.md](./docs/INTENT_SOCKET.md) · Settings → Neurabridge in the app  
**Screenshots:** [`public/screenshots/`](./public/screenshots/) · **OG:** [`public/og/demo.svg`](./public/og/demo.svg)

---

## Neurabeach suite

| Piece | Role |
|-------|------|
| **Neurabeach** | Catalog / storefront — listing slug **`neurabinder`**, collection **`col-neura-suite`** |
| **Neurabridge** | Intent middleware — Settings → Neurabridge (simulator or multi-client service) |
| **NeuraBinder** | This app — end-user web MVP |
| **Intent → OS** | Reference adapter (separate package) |

Package contract: **[`neurabeach-manifest.json`](./neurabeach-manifest.json)**

| Field | Value |
|-------|--------|
| `safety_class` | `computer_side` |
| `runtime` | `web` |
| `suite_role` | `app` |
| `depends_on` | `neurabridge` |
| `entrypoint` | https://neura-binder.vercel.app/demo |
| `inputs` | `class_label`, `switch_binary`, `velocity_2d`, `synthetic` |
| `banned_claims` | `true` |

---

## Quick start

```bash
git clone https://github.com/pileofflapjacks1/NeuraBinder
cd NeuraBinder
pnpm install
pnpm dev
```

| URL | Purpose |
|-----|---------|
| https://neura-binder.vercel.app/demo | **Public live demo** (no account) |
| http://localhost:3000/demo | Local showcase — BCI Mode, intents, record/replay |
| http://localhost:3000/a11y | Accessibility scorecard |
| Settings → **Neurabridge** | In-app simulator or multi-client service (`ws://127.0.0.1:7711`) |

```bash
pnpm build    # must succeed for ship
pnpm start    # production server
# Optional: Neurabridge multi-client bus (from neurabridge checkout)
#   npm run service   → ws://127.0.0.1:7711
pnpm intent:ws  # legacy local intent WS on :7843
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

Synthetic intents (Neurabridge-shaped): `src/lib/bci/generic-intent.ts` — used on **`/demo`**.

Keyboard emulator: `src/lib/bci/adapter.ts`. Future: plug generic streams from Neurabridge; do **not** hardcode implant APIs.

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
