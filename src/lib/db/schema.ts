/**
 * NeuraBinder Drizzle schema (PostgreSQL / Supabase).
 *
 * Privacy: user collection tables are private by default (RLS policies in
 * supabase/migrations). Only explicit shareSlug lists are publicly readable.
 *
 * BCI note: schema is input-modality agnostic; interaction lives in the client.
 */

import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const tcgGameEnum = pgEnum("tcg_game", [
  "pokemon",
  "lorcana",
  "mtg",
  "onepiece",
  "custom",
]);

export const conditionEnum = pgEnum("card_condition", [
  "NM",
  "LP",
  "MP",
  "HP",
  "DMG",
]);

export const listTypeEnum = pgEnum("list_type", [
  "collection",
  "want",
  "trade",
  "for_sale",
  "deck",
  "investment",
  "custom",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  // Preferences
  bciModeDefault: boolean("bci_mode_default").default(false).notNull(),
  highContrast: boolean("high_contrast").default(false).notNull(),
  reducedMotion: boolean("reduced_motion").default(false).notNull(),
  locale: text("locale").default("en").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cardSets = pgTable(
  "card_sets",
  {
    id: text("id").primaryKey(),
    game: tcgGameEnum("game").notNull(),
    name: text("name").notNull(),
    code: text("code").notNull(),
    releaseDate: text("release_date"),
    totalCards: integer("total_cards"),
    logoUrl: text("logo_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("card_sets_game_idx").on(t.game),
    uniqueIndex("card_sets_game_code_idx").on(t.game, t.code),
  ]
);

export const cards = pgTable(
  "cards",
  {
    id: text("id").primaryKey(),
    game: tcgGameEnum("game").notNull(),
    setId: text("set_id")
      .notNull()
      .references(() => cardSets.id),
    setName: text("set_name").notNull(),
    setCode: text("set_code").notNull(),
    number: text("number").notNull(),
    name: text("name").notNull(),
    rarity: text("rarity").notNull(),
    artist: text("artist"),
    imageUrl: text("image_url"),
    imageUrlHiRes: text("image_url_hi_res"),
    language: text("language").default("en").notNull(),
    types: jsonb("types").$type<string[]>(),
    searchText: text("search_text").notNull(),
    externalIds: jsonb("external_ids").$type<Record<string, string>>(),
    marketPrice: real("market_price"),
    marketPriceUpdatedAt: timestamp("market_price_updated_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("cards_game_idx").on(t.game),
    index("cards_set_id_idx").on(t.setId),
    index("cards_name_idx").on(t.name),
    index("cards_search_text_idx").on(t.searchText),
    uniqueIndex("cards_set_number_lang_idx").on(t.setId, t.number, t.language),
  ]
);

export const cardVariants = pgTable(
  "card_variants",
  {
    id: text("id").primaryKey(),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    variant: text("variant").notNull(),
    finish: text("finish"),
    label: text("label").notNull(),
    marketPrice: real("market_price"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("card_variants_card_id_idx").on(t.cardId)]
);

export const userCards = pgTable(
  "user_cards",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id),
    variantId: text("variant_id").references(() => cardVariants.id),
    quantity: integer("quantity").default(1).notNull(),
    condition: conditionEnum("condition").default("NM").notNull(),
    language: text("language").default("en").notNull(),
    variant: text("variant").default("normal").notNull(),
    isGraded: boolean("is_graded").default(false).notNull(),
    gradeCompany: text("grade_company"),
    grade: text("grade"),
    certNumber: text("cert_number"),
    purchasePrice: real("purchase_price"),
    purchaseDate: text("purchase_date"),
    notes: text("notes"),
    estimatedValue: real("estimated_value"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("user_cards_user_id_idx").on(t.userId),
    index("user_cards_card_id_idx").on(t.cardId),
    index("user_cards_user_card_idx").on(t.userId, t.cardId),
  ]
);

export const lists = pgTable(
  "lists",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: listTypeEnum("type").notNull(),
    description: text("description"),
    isPublic: boolean("is_public").default(false).notNull(),
    shareSlug: text("share_slug").unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("lists_user_id_idx").on(t.userId),
    index("lists_share_slug_idx").on(t.shareSlug),
  ]
);

export const listItems = pgTable(
  "list_items",
  {
    id: text("id").primaryKey(),
    listId: text("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    userCardId: text("user_card_id").references(() => userCards.id, {
      onDelete: "cascade",
    }),
    cardId: text("card_id").references(() => cards.id),
    quantity: integer("quantity").default(1).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("list_items_list_id_idx").on(t.listId),
    index("list_items_card_id_idx").on(t.cardId),
  ]
);

export const priceHistory = pgTable(
  "price_history",
  {
    id: text("id").primaryKey(),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    variantId: text("variant_id"),
    source: text("source").notNull(),
    price: real("price").notNull(),
    currency: text("currency").default("USD").notNull(),
    condition: conditionEnum("condition"),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    index("price_history_card_id_idx").on(t.cardId),
    index("price_history_recorded_at_idx").on(t.recordedAt),
  ]
);

export const priceAlerts = pgTable(
  "price_alerts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id),
    direction: text("direction").notNull(), // above | below
    targetPrice: real("target_price").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("price_alerts_user_id_idx").on(t.userId)]
);

export const scans = pgTable(
  "scans",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    imageUrl: text("image_url"),
    candidates: jsonb("candidates").$type<
      { cardId: string; confidence: number }[]
    >(),
    selectedCardId: text("selected_card_id"),
    status: text("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("scans_user_id_idx").on(t.userId)]
);

export const savedViews = pgTable(
  "saved_views",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    filters: jsonb("filters").notNull(),
    sort: jsonb("sort").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("saved_views_user_id_idx").on(t.userId)]
);

export type DbUser = typeof users.$inferSelect;
export type DbCard = typeof cards.$inferSelect;
export type DbUserCard = typeof userCards.$inferSelect;
export type DbList = typeof lists.$inferSelect;
