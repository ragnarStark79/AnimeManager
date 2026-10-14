-- ==============================================================================
-- AnimeManager — Migration 000001: Initial Relational Schema
-- Version: 1.0 (Phase 01)
-- ==============================================================================

-- Enable UUID extension if not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- Reusable updated_at Trigger Function
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. titles: Core catalog entries for anime, manga, and manhwa
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('anime', 'manga', 'manhwa')),
  english_title TEXT NOT NULL CHECK (char_length(trim(english_title)) > 0),
  original_title TEXT,
  synopsis TEXT,
  background TEXT,
  cover_url TEXT,
  cover_storage_path TEXT,
  cover_source_type TEXT NOT NULL DEFAULT 'none' CHECK (cover_source_type IN ('url', 'upload', 'provider', 'none')),
  release_year INTEGER CHECK (release_year IS NULL OR (release_year >= 1900 AND release_year <= 2100)),
  publication_status TEXT,
  start_date DATE,
  end_date DATE,
  episode_count INTEGER CHECK (episode_count IS NULL OR episode_count >= 0),
  chapter_count INTEGER CHECK (chapter_count IS NULL OR chapter_count >= 0),
  source_score NUMERIC(4, 2) CHECK (source_score IS NULL OR (source_score >= 0.0 AND source_score <= 10.0)),
  source_rank INTEGER CHECK (source_rank IS NULL OR source_rank >= 1),
  source_popularity INTEGER CHECK (source_popularity IS NULL OR source_popularity >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_titles_updated_at
  BEFORE UPDATE ON titles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 2. title_aliases: Alternate, native, romanized, and translated titles
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS title_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  alias TEXT NOT NULL CHECK (char_length(trim(alias)) > 0),
  language_code TEXT,
  alias_type TEXT CHECK (alias_type IS NULL OR alias_type IN ('native', 'romanized', 'translated', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_title_alias_per_title UNIQUE (title_id, alias)
);

-- ------------------------------------------------------------------------------
-- 3. collections: User-created folders/lists (My List)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  description TEXT,
  cover_url TEXT,
  icon TEXT,
  color TEXT,
  sort_mode TEXT NOT NULL DEFAULT 'date_added' CHECK (sort_mode IN ('date_added', 'title', 'rating', 'custom')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness for collection names per owner
CREATE UNIQUE INDEX IF NOT EXISTS uq_collections_owner_lower_name
  ON collections (owner_id, lower(trim(name)));

CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 4. title_collections: Many-to-Many membership between titles and collections
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS title_collections (
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  position INTEGER,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (title_id, collection_id)
);

-- ------------------------------------------------------------------------------
-- 5. bookmarks: Personal tracking state, progress, rating, and notes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('plan_to_consume', 'consuming', 'completed', 'on_hold', 'dropped')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  progress_unit TEXT NOT NULL DEFAULT 'episode' CHECK (progress_unit IN ('episode', 'chapter', 'volume', 'unknown')),
  progress_total INTEGER CHECK (progress_total IS NULL OR progress_total >= 0),
  priority SMALLINT CHECK (priority IS NULL OR (priority >= 1 AND priority <= 5)),
  personal_rating NUMERIC(3, 1) CHECK (personal_rating IS NULL OR (personal_rating >= 0.0 AND personal_rating <= 10.0)),
  notes TEXT,
  started_at DATE,
  completed_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_bookmarks_owner_title UNIQUE (owner_id, title_id)
);

CREATE TRIGGER trg_bookmarks_updated_at
  BEFORE UPDATE ON bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 6. genres & title_genres: Standardized classification
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  slug TEXT NOT NULL CHECK (char_length(trim(slug)) > 0),
  source_provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_genres_lower_name UNIQUE (name),
  CONSTRAINT uq_genres_lower_slug UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS title_genres (
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (title_id, genre_id)
);

-- ------------------------------------------------------------------------------
-- 7. tags & title_tags: Flexible user-defined labels
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  slug TEXT NOT NULL CHECK (char_length(trim(slug)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tags_owner_lower_name
  ON tags (owner_id, lower(trim(name)));

CREATE TABLE IF NOT EXISTS title_tags (
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (title_id, tag_id)
);

-- ------------------------------------------------------------------------------
-- 8. external_sources: External provenance mappings (e.g., MyAnimeList via Jikan)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS external_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (char_length(trim(provider)) > 0),
  external_id TEXT NOT NULL CHECK (char_length(trim(external_id)) > 0),
  source_url TEXT,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_external_sources_provider_external_id UNIQUE (provider, external_id),
  CONSTRAINT uq_external_sources_title_provider UNIQUE (title_id, provider)
);

-- ------------------------------------------------------------------------------
-- 9. Performance Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_titles_owner_media ON titles(owner_id, media_type);
CREATE INDEX IF NOT EXISTS idx_titles_owner_created ON titles(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_titles_lower_english ON titles(lower(english_title));
CREATE INDEX IF NOT EXISTS idx_title_aliases_lower_alias ON title_aliases(lower(alias));
CREATE INDEX IF NOT EXISTS idx_bookmarks_owner_status ON bookmarks(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_bookmarks_title ON bookmarks(title_id);
CREATE INDEX IF NOT EXISTS idx_title_collections_col_pos ON title_collections(collection_id, position);
CREATE INDEX IF NOT EXISTS idx_external_sources_lookup ON external_sources(provider, external_id);
