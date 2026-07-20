-- NeuraBinder initial schema (PostgreSQL / Supabase)
-- Privacy: enable RLS on all user-owned tables; private by default.

-- Enums
DO $$ BEGIN
  CREATE TYPE tcg_game AS ENUM ('pokemon', 'lorcana', 'mtg', 'onepiece', 'custom');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE card_condition AS ENUM ('NM', 'LP', 'MP', 'HP', 'DMG');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE list_type AS ENUM ('collection', 'want', 'trade', 'for_sale', 'deck', 'investment', 'custom');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bci_mode_default BOOLEAN NOT NULL DEFAULT false,
  high_contrast BOOLEAN NOT NULL DEFAULT false,
  reduced_motion BOOLEAN NOT NULL DEFAULT false,
  locale TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS card_sets (
  id TEXT PRIMARY KEY,
  game tcg_game NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  release_date TEXT,
  total_cards INTEGER,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS card_sets_game_idx ON card_sets (game);
CREATE UNIQUE INDEX IF NOT EXISTS card_sets_game_code_idx ON card_sets (game, code);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  game tcg_game NOT NULL,
  set_id TEXT NOT NULL REFERENCES card_sets(id),
  set_name TEXT NOT NULL,
  set_code TEXT NOT NULL,
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL,
  artist TEXT,
  image_url TEXT,
  image_url_hi_res TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  types JSONB,
  search_text TEXT NOT NULL,
  external_ids JSONB,
  market_price REAL,
  market_price_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cards_game_idx ON cards (game);
CREATE INDEX IF NOT EXISTS cards_set_id_idx ON cards (set_id);
CREATE INDEX IF NOT EXISTS cards_name_idx ON cards (name);
CREATE UNIQUE INDEX IF NOT EXISTS cards_set_number_lang_idx ON cards (set_id, number, language);

CREATE TABLE IF NOT EXISTS card_variants (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  finish TEXT,
  label TEXT NOT NULL,
  market_price REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS card_variants_card_id_idx ON card_variants (card_id);

CREATE TABLE IF NOT EXISTS user_cards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL REFERENCES cards(id),
  variant_id TEXT REFERENCES card_variants(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  condition card_condition NOT NULL DEFAULT 'NM',
  language TEXT NOT NULL DEFAULT 'en',
  variant TEXT NOT NULL DEFAULT 'normal',
  is_graded BOOLEAN NOT NULL DEFAULT false,
  grade_company TEXT,
  grade TEXT,
  cert_number TEXT,
  purchase_price REAL,
  purchase_date TEXT,
  notes TEXT,
  estimated_value REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_cards_user_id_idx ON user_cards (user_id);
CREATE INDEX IF NOT EXISTS user_cards_card_id_idx ON user_cards (card_id);
CREATE INDEX IF NOT EXISTS user_cards_user_card_idx ON user_cards (user_id, card_id);

CREATE TABLE IF NOT EXISTS lists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type list_type NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  share_slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lists_user_id_idx ON lists (user_id);

CREATE TABLE IF NOT EXISTS list_items (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_card_id TEXT REFERENCES user_cards(id) ON DELETE CASCADE,
  card_id TEXT REFERENCES cards(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS list_items_list_id_idx ON list_items (list_id);

CREATE TABLE IF NOT EXISTS price_history (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  variant_id TEXT,
  source TEXT NOT NULL,
  price REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  condition card_condition,
  recorded_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS price_history_card_id_idx ON price_history (card_id);
CREATE INDEX IF NOT EXISTS price_history_recorded_at_idx ON price_history (recorded_at);

CREATE TABLE IF NOT EXISTS price_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL REFERENCES cards(id),
  direction TEXT NOT NULL,
  target_price REAL NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT,
  candidates JSONB,
  selected_card_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_views (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  sort JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security (private by default)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;

-- Example policies (Supabase auth.uid())
-- CREATE POLICY users_self ON users FOR ALL USING (id = auth.uid()::text);
-- CREATE POLICY user_cards_self ON user_cards FOR ALL USING (user_id = auth.uid()::text);
-- CREATE POLICY lists_self ON lists FOR ALL USING (user_id = auth.uid()::text OR is_public = true);
-- Catalog tables (cards, card_sets) can be publicly readable.
