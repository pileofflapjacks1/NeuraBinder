import type { MarketEvent } from "@/lib/types/features";

export const SEED_EVENTS: MarketEvent[] = [
  {
    id: "ev-1",
    title: "Scarlet & Violet 151 — still hot IRs",
    date: "2026-07-01",
    kind: "spike",
    game: "pokemon",
    setId: "sv3pt5",
    body: "Illustration Rares for starters remain liquid. Watch Charmander/Squirtle/Bulbasaur IR spreads.",
  },
  {
    id: "ev-2",
    title: "Prismatic Evolutions — Umbreon SIR premium",
    date: "2026-06-15",
    kind: "spike",
    game: "pokemon",
    setId: "sv8pt5",
    body: "High-end Eeveelution SIRs continue to lead modern chase. Grade only true NM candidates.",
  },
  {
    id: "ev-3",
    title: "Lorcana — First Chapter Enchanteds",
    date: "2026-05-20",
    kind: "note",
    game: "lorcana",
    setId: "lorcana-tfc",
    body: "Early Enchanteds remain scarce relative to demand. Liquidity thinner than Pokémon.",
  },
  {
    id: "ev-4",
    title: "Upcoming: hypothetical set window",
    date: "2026-09-01",
    kind: "release",
    game: "pokemon",
    body: "Demo calendar entry — wire live calendars when a feed is available.",
  },
  {
    id: "ev-5",
    title: "Base Set unlimited — condition sensitivity",
    date: "2026-04-01",
    kind: "note",
    game: "pokemon",
    setId: "base1",
    body: "Raw Charizard pricing is highly condition-dependent; MP vs NM spreads are wide.",
  },
];
