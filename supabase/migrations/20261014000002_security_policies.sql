-- ==============================================================================
-- AnimeManager — Migration 000002: Row Level Security & Ownership Policies
-- Version: 1.0 (Phase 01)
-- ==============================================================================

-- Ensure roles exist (native in Supabase; created conditionally in standalone postgres)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon;
  END IF;
END $$;

-- Ensure auth schema and auth.uid() exist for Supabase and local environments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    CREATE SCHEMA auth;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
  ) THEN
    CREATE FUNCTION auth.uid() RETURNS uuid AS $func$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $func$ LANGUAGE sql STABLE;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 1. Enable Row Level Security (RLS) on all tables
-- ------------------------------------------------------------------------------
ALTER TABLE titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE title_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE title_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE title_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE title_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_sources ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. Titles Policies
-- ------------------------------------------------------------------------------
CREATE POLICY titles_owner_select ON titles
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY titles_owner_insert ON titles
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY titles_owner_update ON titles
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY titles_owner_delete ON titles
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 3. Title Aliases Policies (Scoped through title ownership)
-- ------------------------------------------------------------------------------
CREATE POLICY title_aliases_owner_select ON title_aliases
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM titles WHERE titles.id = title_aliases.title_id AND titles.owner_id = auth.uid()));

CREATE POLICY title_aliases_owner_insert ON title_aliases
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM titles WHERE titles.id = title_aliases.title_id AND titles.owner_id = auth.uid()));

CREATE POLICY title_aliases_owner_update ON title_aliases
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM titles WHERE titles.id = title_aliases.title_id AND titles.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM titles WHERE titles.id = title_aliases.title_id AND titles.owner_id = auth.uid()));

CREATE POLICY title_aliases_owner_delete ON title_aliases
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM titles WHERE titles.id = title_aliases.title_id AND titles.owner_id = auth.uid()));

-- ------------------------------------------------------------------------------
-- 4. Collections Policies
-- ------------------------------------------------------------------------------
CREATE POLICY collections_owner_select ON collections
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY collections_owner_insert ON collections
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY collections_owner_update ON collections
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY collections_owner_delete ON collections
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 5. Title Collections Membership Policies (Enforces cross-table ownership!)
-- ------------------------------------------------------------------------------
CREATE POLICY title_collections_owner_select ON title_collections
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM collections WHERE collections.id = title_collections.collection_id AND collections.owner_id = auth.uid()));

-- A user can only link a title to a collection if they OWN BOTH the collection AND the title!
CREATE POLICY title_collections_owner_insert ON title_collections
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM collections WHERE collections.id = title_collections.collection_id AND collections.owner_id = auth.uid())
    AND
    EXISTS (SELECT 1 FROM titles WHERE titles.id = title_collections.title_id AND titles.owner_id = auth.uid())
  );

CREATE POLICY title_collections_owner_update ON title_collections
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM collections WHERE collections.id = title_collections.collection_id AND collections.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM collections WHERE collections.id = title_collections.collection_id AND collections.owner_id = auth.uid()));

CREATE POLICY title_collections_owner_delete ON title_collections
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM collections WHERE collections.id = title_collections.collection_id AND collections.owner_id = auth.uid()));

-- ------------------------------------------------------------------------------
-- 6. Bookmarks Policies (Owner owns bookmark AND title)
-- ------------------------------------------------------------------------------
CREATE POLICY bookmarks_owner_select ON bookmarks
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY bookmarks_owner_insert ON bookmarks
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND
    EXISTS (SELECT 1 FROM titles WHERE titles.id = bookmarks.title_id AND titles.owner_id = auth.uid())
  );

CREATE POLICY bookmarks_owner_update ON bookmarks
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (
    owner_id = auth.uid()
    AND
    EXISTS (SELECT 1 FROM titles WHERE titles.id = bookmarks.title_id AND titles.owner_id = auth.uid())
  );

CREATE POLICY bookmarks_owner_delete ON bookmarks
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 7. Genres Policies (Reference catalog: readable by authenticated users)
-- ------------------------------------------------------------------------------
CREATE POLICY genres_read_policy ON genres
  FOR SELECT TO authenticated
  USING (true);

-- Title Genres join table: scoped through title ownership
CREATE POLICY title_genres_owner_select ON title_genres
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM titles WHERE titles.id = title_genres.title_id AND titles.owner_id = auth.uid()));

CREATE POLICY title_genres_owner_insert ON title_genres
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM titles WHERE titles.id = title_genres.title_id AND titles.owner_id = auth.uid()));

CREATE POLICY title_genres_owner_delete ON title_genres
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM titles WHERE titles.id = title_genres.title_id AND titles.owner_id = auth.uid()));

-- ------------------------------------------------------------------------------
-- 8. Tags Policies
-- ------------------------------------------------------------------------------
CREATE POLICY tags_owner_select ON tags
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY tags_owner_insert ON tags
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY tags_owner_update ON tags
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY tags_owner_delete ON tags
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Title Tags join table: user must own title and tag
CREATE POLICY title_tags_owner_select ON title_tags
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM titles WHERE titles.id = title_tags.title_id AND titles.owner_id = auth.uid()));

CREATE POLICY title_tags_owner_insert ON title_tags
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM titles WHERE titles.id = title_tags.title_id AND titles.owner_id = auth.uid())
    AND
    EXISTS (SELECT 1 FROM tags WHERE tags.id = title_tags.tag_id AND tags.owner_id = auth.uid())
  );

CREATE POLICY title_tags_owner_delete ON title_tags
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM titles WHERE titles.id = title_tags.title_id AND titles.owner_id = auth.uid()));

-- ------------------------------------------------------------------------------
-- 9. External Sources Policies
-- ------------------------------------------------------------------------------
CREATE POLICY external_sources_owner_select ON external_sources
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM titles WHERE titles.id = external_sources.title_id AND titles.owner_id = auth.uid()));

CREATE POLICY external_sources_owner_insert ON external_sources
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM titles WHERE titles.id = external_sources.title_id AND titles.owner_id = auth.uid()));

CREATE POLICY external_sources_owner_update ON external_sources
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM titles WHERE titles.id = external_sources.title_id AND titles.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM titles WHERE titles.id = external_sources.title_id AND titles.owner_id = auth.uid()));

CREATE POLICY external_sources_owner_delete ON external_sources
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM titles WHERE titles.id = external_sources.title_id AND titles.owner_id = auth.uid()));
