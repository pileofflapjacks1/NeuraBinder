# Neurabeach listing copy (NeuraBinder)

Source of truth for catalog re-seed. Keep in sync with Neurabeach `seed-proj-neurabinder`.

| Field | Value |
|-------|--------|
| **Slug** | `neurabinder` |
| **Title** | NeuraBinder |
| **Version** | `0.3.0` |
| **Category** | accessibility |
| **Featured** | yes |
| **Collection** | `col-neura-suite` |
| **Suite role** | `app` |
| **Depends on** | `neuralbridge` |
| **GitHub** | https://github.com/pileofflapjacks1/NeuraBinder |
| **Live demo** | https://neura-binder.vercel.app/demo |
| **A11y** | https://neura-binder.vercel.app/a11y |
| **Manifest** | `neurabeach-manifest.json` in repo root |

## Short description

> BCI-inspired TCG binder with live /demo, BCI Mode, and first-class NeuralBridge integration (in-app simulator or multi-client service). Computer-side only — reference suite app.

## Screenshots (public URLs)

1. https://neura-binder.vercel.app/og/demo.svg  
2. https://neura-binder.vercel.app/screenshots/01-demo.svg  
3. https://neura-binder.vercel.app/screenshots/02-collection.svg  
4. https://neura-binder.vercel.app/screenshots/03-binder.svg  
5. https://neura-binder.vercel.app/screenshots/05-a11y.svg  

## Safety blurb (required)

Computer-side web app only. Not implant software. Not affiliated with Neuralink, The Pokémon Company, or Disney. Accessibility prototyping and generic intent streams (class_label, switch_binary, velocity_2d, synthetic).

## Tags

`typescript` `nextjs` `bci-mode` `accessibility` `tcg` `intent-v1` `web` `neura-suite` `neurabinder` `pwa` `showcase` `neuralbridge`

## Manifest highlights

```json
{
  "suite_role": "app",
  "depends_on": ["neuralbridge"],
  "entrypoint": "https://neura-binder.vercel.app/demo",
  "safety_class": "computer_side",
  "runtime": "web"
}
```

Local install still uses `pnpm install && pnpm dev` (see README). Catalog **entrypoint** is the public live demo.
