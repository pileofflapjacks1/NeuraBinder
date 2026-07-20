# NeuraBinder — Feature TODO

Prioritized high-impact features. Status updates as work lands.

Legend: `[x]` done · `[~]` partial / local-only · `[ ]` not started · `[!]` blocked on external setup

---

## Tier 1 — Highest leverage

### 1. Catalog + import
- [x] Expand seed catalog (more 151 / set fillers for master-set demos)
- [x] CSV import (NeuraBinder, TCGPlayer-style, Collectr-style column maps)
- [x] Duplicate merge (same card + condition + variant → qty)
- [x] Import preview + confirm UI (`/import`)
- [!] Live Pokémon TCG API / Lorcana catalog sync — needs network + optional API keys

### 2. Scan flow
- [x] Batch scan queue (capture multiple → pending confirmations)
- [x] Pending confirmations list with ranked candidates
- [x] One-intent confirm / reject / cycle
- [!] Real vision / third-party recognition API
- [!] Production slab OCR service

### 3. Market & valuation
- [x] Local mock market refresh (drift prices, history)
- [x] Price alerts on cards / want-list items (local evaluation)
- [x] “Watch for drop” on want list
- [!] Live TCGPlayer / PriceCharting / eBay sold feeds — API keys + TOS

### 4. Three-intent power actions
- [x] Global intent palette (Add, Find, Trade, Worth, Missing, …)
- [x] Ranked quick-actions after NL queries
- [x] Predictive top actions from recent behavior
- [x] Keyboard / BCI shortcuts for palette (`Cmd+K` / intent)

---

## Tier 2 — Moat / retention

### 5. Master set & visual binder
- [x] Set completion with cheapest-path-to-complete
- [x] Visual binder pages (spatial grid by set number)
- [x] Binder route (`/binder`)

### 6. Want / have / trade
- [x] Local peer matching (seed “other collectors”)
- [x] Match view: they want what I have / have what I want
- [x] Share-link preview (local, no hosting)
- [x] One-tap trade proposal message
- [!] Global match network — needs auth + backend

### 7. AI that acts
- [x] Local tool mutations: add card, move to list, set filters, adjust qty
- [x] Command bar executes actions with confirmation toast
- [!] Cloud Grok tool-calling over full private inventory — `XAI_API_KEY` + opt-in

### 8. Offline-first
- [x] Offline mutation queue (IndexedDB)
- [x] Flush queue when online
- [x] Offline banner in shell
- [!] Full service-worker PWA caching + multi-device sync — hosting/backend

---

## Tier 3 — BCI / a11y leadership

### 9. BCI profile pack
- [x] Target size, dwell vs click, confirm timeout, scan auto-rank
- [x] Intent-only mode (no continuous-cursor assumption)
- [x] Calibration wizard (keyboard-simulated)
- [!] Real Neuralink SDK / WebHID bridge

### 10. Multi-modal input
- [x] Voice on command bar (existing + settings)
- [x] Single-switch / scanning focus mode
- [x] Screen-reader binder tour (announce set progress / top value)

### 11. Sensory feedback stubs
- [x] Confirm/error sound hooks + optional beep
- [x] `sendFeedback` adapter stubs for future neural feedback

---

## Tier 4 — Serious money users

### 12. Tax lots / inventory lots
- [x] Lot model (buy date, unit cost, fees, qty remaining)
- [x] Attach lots to user cards
- [x] Simple realized/unrealized lot report on portfolio

### 13. Condition- & grade-aware pricing
- [x] Multipliers already in utils — surface in UI
- [x] “Should I grade this?” heuristic on card detail
- [!] Real PSA population / grade premium feeds

### 14. Watchlist & event intel
- [x] Watchlist store + page (`/watch`)
- [x] Seed release calendar / spike notes
- [x] Local “spiked this week” from mock history

---

## External / needs you (saved for end)

Do **not** block local features on these. When ready:

| Need | What it unlocks |
|------|-----------------|
| Supabase or Clerk project + env | Auth, cloud persist, multi-device, public share links that work |
| `DATABASE_URL` + migrate | Postgres user_cards / lists / alerts |
| Vercel (or similar) deploy | Production URL, PWA install from web |
| `XAI_API_KEY` | Cloud Grok enhancement for NL |
| TCGPlayer / PriceCharting keys | Live market data |
| Card recognition API | Real camera ID accuracy |
| Neuralink SDK access | True neural intents / cursor / feedback |

### Checklist for you later
- [ ] Create Supabase project; paste URL + anon/service keys
- [ ] Run `supabase/migrations/001_init.sql` (or Drizzle push)
- [ ] Choose Clerk **or** Supabase Auth
- [ ] Deploy to Vercel; set env vars
- [ ] Optionally enable `NEXT_PUBLIC_ENABLE_CLOUD_AI=true` + `XAI_API_KEY`
- [ ] Optionally plug market provider keys into `src/lib/market/service.ts`

---

## Slice 2 — local power tools (done)

- [x] Undo / redo (⌘Z / ⌘⇧Z) for collection mutations
- [x] Bulk select + bulk condition / list / tag / location / delete
- [x] Saved views (named filter presets)
- [x] JSON backup download + restore
- [x] Portfolio snapshots + value-over-time chart
- [x] Physical location + tags on cards (filter + detail edit)
- [x] Trade package calculator (`/trade/calculator`)
- [x] Fuse.js fuzzy search on collection + catalog
- [x] Virtualized collection grid (`@tanstack/react-virtual`)
- [x] Service worker offline shell (`public/sw.js`, prod only)
- [x] Dwell-to-select (when calibrated / useDwell on)
- [x] Guided first-run tour (+ replay in Settings)

---

## Implementation notes

- Prefer **local-first**: Zustand + localStorage + IndexedDB.
- Keep Neuralink hooks isolated in `src/lib/bci/`.
- Privacy: no collection data leaves the device unless user enables cloud AI.
