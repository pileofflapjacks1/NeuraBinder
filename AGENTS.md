# AGENTS.md — NeuraBinder

You are working on **NeuraBinder only** unless the user asks to edit another suite repo.

## Product

BCI-inspired **TCG collection / binder PWA** with `/demo`, BCI Mode, a11y paths, and first-class **Neurabridge** integration (in-app simulator or multi-client service).

- **Version:** 0.3.0 (see package.json / LISTING)
- **Suite role:** `app` · depends on Neurabridge soft integration
- Computer-side web app only — reference suite product demo
- **Not** implant software · **not** medical · **not** affiliated with Neuralink / Pokémon Company / Disney

## Boundaries

- Simulator-first; keyboard / synthetic intents always work.
- Intent vocab (shared suite): `class_label` | `switch_binary` | `velocity_2d` | `synthetic`
- Do **not** add robot control (that is NeuraRoboBridge) or monorepo merges.
- On version/demo change: update `LISTING.md` + `neurabeach-manifest.json` for Beach re-seed.

## Layout

```
src/app/             Next.js routes (/demo, /a11y, …)
src/components/
src/lib/             store, bridge, intents, …
public/
LISTING.md
neurabeach-manifest.json
TODO.md
```

## Next.js note

This Next.js version may differ from training data. Prefer project docs and `node_modules/next/dist/docs/` when APIs look unfamiliar.

## Commands

```bash
pnpm install   # or npm, match lockfile in repo
pnpm dev
pnpm build
pnpm lint
pnpm db:generate / db:push / db:studio   # if schema work
pnpm intent:ws                           # local intent helper if present
```

## Commits

Author: Joe \<pileofflapjacks1@gmail.com\>  
Repo: https://github.com/pileofflapjacks1/NeuraBinder  
Demo: https://neura-binder.vercel.app/demo  
A11y: https://neura-binder.vercel.app/a11y
