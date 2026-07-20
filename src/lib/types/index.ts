/**
 * NeuraBinder core domain types
 * Designed for multi-TCG expansion and BCI-first interaction.
 */

export type TcgGame = "pokemon" | "lorcana" | "mtg" | "onepiece" | "custom";

export type CardCondition = "NM" | "LP" | "MP" | "HP" | "DMG";

export type GradeCompany = "PSA" | "BGS" | "CGC" | "SGC" | "ACE" | "OTHER";

export type ListType =
  | "collection"
  | "want"
  | "trade"
  | "for_sale"
  | "deck"
  | "investment"
  | "custom";

export type VariantType =
  | "normal"
  | "holo"
  | "reverse_holo"
  | "full_art"
  | "illustration_rare"
  | "special_illustration_rare"
  | "hyper_rare"
  | "ultra_rare"
  | "secret_rare"
  | "promo"
  | "first_edition"
  | "shadowless"
  | "cold_foil"
  | "enchanted"
  | "other";

export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "double_rare"
  | "ultra_rare"
  | "illustration_rare"
  | "special_illustration_rare"
  | "hyper_rare"
  | "secret"
  | "promo"
  | "legendary"
  | "enchanted"
  | "super_rare"
  | "other";

export interface Card {
  id: string;
  game: TcgGame;
  setId: string;
  setName: string;
  setCode: string;
  number: string;
  name: string;
  rarity: Rarity;
  artist?: string;
  imageUrl?: string;
  imageUrlHiRes?: string;
  language: string;
  /** Supertypes / types (e.g. Pokémon type, Lorcana ink) */
  types?: string[];
  /** Searchable text blob for NL + fuse */
  searchText: string;
  externalIds?: {
    tcgplayer?: string;
    pokemonTcgApi?: string;
    priceCharting?: string;
  };
  marketPrice?: number;
  marketPriceUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardVariant {
  id: string;
  cardId: string;
  variant: VariantType;
  finish?: string;
  label: string;
  marketPrice?: number;
}

export interface UserCard {
  id: string;
  userId: string;
  cardId: string;
  variantId?: string;
  quantity: number;
  condition: CardCondition;
  language: string;
  variant: VariantType;
  isGraded: boolean;
  gradeCompany?: GradeCompany;
  grade?: string;
  certNumber?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  notes?: string;
  listIds: string[];
  /** Physical storage location (binder, box, shelf…) */
  location?: string;
  /** Free-form tags e.g. grail, playable, JP */
  tags?: string[];
  /** Current estimated market value (per unit) */
  estimatedValue?: number;
  createdAt: string;
  updatedAt: string;
}

/** Joined view for UI */
export interface CollectionItem extends UserCard {
  card: Card;
  totalCost: number;
  totalValue: number;
  unrealizedGain: number;
}

export interface CardList {
  id: string;
  userId: string;
  name: string;
  type: ListType;
  description?: string;
  isPublic: boolean;
  shareSlug?: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PricePoint {
  id: string;
  cardId: string;
  variantId?: string;
  source: "tcgplayer" | "pricecharting" | "ebay" | "manual" | "mock";
  price: number;
  currency: string;
  condition?: CardCondition;
  recordedAt: string;
}

export interface PriceAlert {
  id: string;
  userId: string;
  cardId: string;
  direction: "above" | "below";
  targetPrice: number;
  active: boolean;
  createdAt: string;
}

export interface ScanCandidate {
  cardId: string;
  card: Card;
  confidence: number;
  suggestedCondition?: CardCondition;
  suggestedVariant?: VariantType;
}

export interface PendingScan {
  id: string;
  userId: string;
  imageDataUrl?: string;
  candidates: ScanCandidate[];
  selectedCardId?: string;
  status: "pending" | "confirmed" | "rejected";
  createdAt: string;
}

export interface SavedView {
  id: string;
  userId: string;
  name: string;
  filters: CollectionFilters;
  sort: CollectionSort;
  createdAt: string;
}

export interface CollectionFilters {
  query?: string;
  game?: TcgGame | "all";
  setIds?: string[];
  rarities?: Rarity[];
  conditions?: CardCondition[];
  variants?: VariantType[];
  gradedOnly?: boolean;
  minValue?: number;
  maxValue?: number;
  listId?: string;
  missingForMasterSet?: string; // setId
  language?: string;
  location?: string;
  tags?: string[];
}

export type CollectionSortField =
  | "name"
  | "set"
  | "number"
  | "value"
  | "cost"
  | "quantity"
  | "condition"
  | "updatedAt"
  | "gain";

export interface CollectionSort {
  field: CollectionSortField;
  direction: "asc" | "desc";
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  unrealizedGain: number;
  unrealizedGainPct: number;
  cardCount: number;
  uniqueCount: number;
  gradedCount: number;
  byGame: Record<string, number>;
  bySet: { setId: string; setName: string; value: number; count: number }[];
  byRarity: { rarity: string; value: number; count: number }[];
  byCondition: { condition: string; value: number; count: number }[];
  topGainers: CollectionItem[];
  topLosers: CollectionItem[];
}

export interface SetProgress {
  setId: string;
  setName: string;
  setCode: string;
  game: TcgGame;
  totalCards: number;
  ownedUnique: number;
  ownedQuantity: number;
  percentComplete: number;
  missingCardIds: string[];
  valueOwned: number;
}

export type BciIntent =
  | "select"
  | "confirm"
  | "cancel"
  | "back"
  | "search"
  | "next"
  | "prev"
  | "add"
  | "remove";

/**
 * Neuralink / BCI integration surface.
 * ROADMAP: Wire to Neuralink SDK / WebHID / WebUSB bridge when available.
 * Discrete intents map to BciIntent; continuous cursor is handled by OS/browser.
 */
export interface BciAdapter {
  isConnected: boolean;
  onIntent: (handler: (intent: BciIntent) => void) => () => void;
  /** Future: higher-bandwidth continuous signals */
  onCursorDelta?: (handler: (dx: number, dy: number) => void) => () => void;
  /** Future: sensory feedback / stimulation hooks */
  sendFeedback?: (payload: { type: string; intensity?: number }) => void;
}

export interface AiQueryResult {
  interpretation: string;
  filters?: CollectionFilters;
  sort?: CollectionSort;
  answer?: string;
  items?: CollectionItem[];
  suggestions?: string[];
}
