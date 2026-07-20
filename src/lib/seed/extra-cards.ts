/**
 * Extra catalog cards to flesh out master-set / binder demos.
 * Merged into SEED_CARDS at runtime.
 */

import type { Card } from "@/lib/types";

const now = () => new Date().toISOString();

function c(
  partial: Omit<Card, "createdAt" | "updatedAt" | "searchText" | "language"> & {
    language?: string;
  }
): Card {
  const language = partial.language ?? "en";
  const searchText = [
    partial.name,
    partial.setName,
    partial.setCode,
    partial.number,
    partial.rarity,
    partial.artist,
    ...(partial.types ?? []),
    partial.game,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return {
    ...partial,
    language,
    searchText,
    createdAt: now(),
    updatedAt: now(),
  };
}

/** Additional SV151 fillers + odds for binder pages */
export const EXTRA_CARDS: Card[] = [
  c({
    id: "sv3pt5-016",
    game: "pokemon",
    setId: "sv3pt5",
    setName: "Scarlet & Violet 151",
    setCode: "MEW",
    number: "016",
    name: "Pidgey",
    rarity: "common",
    types: ["Colorless"],
    imageUrl: "https://images.pokemontcg.io/sv3pt5/16.png",
    marketPrice: 0.15,
  }),
  c({
    id: "sv3pt5-025b",
    game: "pokemon",
    setId: "sv3pt5",
    setName: "Scarlet & Violet 151",
    setCode: "MEW",
    number: "026",
    name: "Raichu",
    rarity: "uncommon",
    types: ["Lightning"],
    imageUrl: "https://images.pokemontcg.io/sv3pt5/26.png",
    marketPrice: 0.4,
  }),
  c({
    id: "sv3pt5-039",
    game: "pokemon",
    setId: "sv3pt5",
    setName: "Scarlet & Violet 151",
    setCode: "MEW",
    number: "039",
    name: "Jigglypuff",
    rarity: "common",
    types: ["Colorless"],
    imageUrl: "https://images.pokemontcg.io/sv3pt5/39.png",
    marketPrice: 0.2,
  }),
  c({
    id: "sv3pt5-052",
    game: "pokemon",
    setId: "sv3pt5",
    setName: "Scarlet & Violet 151",
    setCode: "MEW",
    number: "052",
    name: "Meowth",
    rarity: "common",
    types: ["Colorless"],
    imageUrl: "https://images.pokemontcg.io/sv3pt5/52.png",
    marketPrice: 0.25,
  }),
  c({
    id: "sv3pt5-063",
    game: "pokemon",
    setId: "sv3pt5",
    setName: "Scarlet & Violet 151",
    setCode: "MEW",
    number: "063",
    name: "Abra",
    rarity: "common",
    types: ["Psychic"],
    imageUrl: "https://images.pokemontcg.io/sv3pt5/63.png",
    marketPrice: 0.2,
  }),
  c({
    id: "sv3pt5-092",
    game: "pokemon",
    setId: "sv3pt5",
    setName: "Scarlet & Violet 151",
    setCode: "MEW",
    number: "092",
    name: "Gastly",
    rarity: "common",
    types: ["Psychic"],
    imageUrl: "https://images.pokemontcg.io/sv3pt5/92.png",
    marketPrice: 0.3,
  }),
  c({
    id: "sv3pt5-129",
    game: "pokemon",
    setId: "sv3pt5",
    setName: "Scarlet & Violet 151",
    setCode: "MEW",
    number: "129",
    name: "Magikarp",
    rarity: "common",
    types: ["Water"],
    imageUrl: "https://images.pokemontcg.io/sv3pt5/129.png",
    marketPrice: 0.35,
  }),
  c({
    id: "sv3pt5-133",
    game: "pokemon",
    setId: "sv3pt5",
    setName: "Scarlet & Violet 151",
    setCode: "MEW",
    number: "133",
    name: "Eevee",
    rarity: "common",
    types: ["Colorless"],
    imageUrl: "https://images.pokemontcg.io/sv3pt5/133.png",
    marketPrice: 0.75,
  }),
  c({
    id: "sv3pt5-147",
    game: "pokemon",
    setId: "sv3pt5",
    setName: "Scarlet & Violet 151",
    setCode: "MEW",
    number: "147",
    name: "Dratini",
    rarity: "common",
    types: ["Dragon"],
    imageUrl: "https://images.pokemontcg.io/sv3pt5/147.png",
    marketPrice: 0.3,
  }),
  c({
    id: "lorcana-tfc-050",
    game: "lorcana",
    setId: "lorcana-tfc",
    setName: "The First Chapter",
    setCode: "TFC",
    number: "50",
    name: "Maui - Hero to All",
    rarity: "super_rare",
    types: ["Storyborn", "Hero", "Deity"],
    marketPrice: 12,
  }),
  c({
    id: "lorcana-tfc-022",
    game: "lorcana",
    setId: "lorcana-tfc",
    setName: "The First Chapter",
    setCode: "TFC",
    number: "22",
    name: "Maleficent - Monstrous Dragon",
    rarity: "legendary",
    types: ["Storyborn", "Villain", "Dragon"],
    marketPrice: 15,
  }),
];
