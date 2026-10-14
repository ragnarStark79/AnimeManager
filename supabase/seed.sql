-- ==============================================================================
-- AnimeManager — Development & Test Fixtures (supabase/seed.sql)
--
-- PURPOSE:
-- Provides reproducible, fictional test records representing Anime, Manga,
-- and Manhwa, demonstrating collections, bookmarks, and external mappings.
--
-- HOW TO APPLY:
-- In Supabase CLI: supabase db reset (automatically applies seed.sql)
-- In local PostgreSQL / psql: psql -d <dbname> -f supabase/seed.sql
-- ==============================================================================

DO $$
DECLARE
  v_owner_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;

  -- Title UUIDs
  v_title_anime UUID := '10000000-0000-0000-0000-000000000001'::uuid;
  v_title_manga UUID := '10000000-0000-0000-0000-000000000002'::uuid;
  v_title_manhwa UUID := '10000000-0000-0000-0000-000000000003'::uuid;

  -- Collection UUIDs
  v_col_masterpieces UUID := '20000000-0000-0000-0000-000000000001'::uuid;
  v_col_reading UUID := '20000000-0000-0000-0000-000000000002'::uuid;
  v_col_action UUID := '20000000-0000-0000-0000-000000000003'::uuid;

  -- Genre UUIDs
  v_genre_action UUID := '30000000-0000-0000-0000-000000000001'::uuid;
  v_genre_fantasy UUID := '30000000-0000-0000-0000-000000000002'::uuid;
  v_genre_drama UUID := '30000000-0000-0000-0000-000000000003'::uuid;
  v_genre_martial UUID := '30000000-0000-0000-0000-000000000004'::uuid;

  -- Tag UUIDs
  v_tag_magic UUID := '40000000-0000-0000-0000-000000000001'::uuid;
  v_tag_reincarnation UUID := '40000000-0000-0000-0000-000000000002'::uuid;
BEGIN
  -- ----------------------------------------------------------------------------
  -- 1. Reference Genres (Idempotent upsert)
  -- ----------------------------------------------------------------------------
  INSERT INTO genres (id, name, slug, source_provider)
  VALUES
    (v_genre_action, 'Action', 'action', 'system'),
    (v_genre_fantasy, 'Fantasy', 'fantasy', 'system'),
    (v_genre_drama, 'Drama', 'drama', 'system'),
    (v_genre_martial, 'Martial Arts', 'martial-arts', 'system')
  ON CONFLICT (name) DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 2. User Tags
  -- ----------------------------------------------------------------------------
  INSERT INTO tags (id, owner_id, name, slug)
  VALUES
    (v_tag_magic, v_owner_id, 'High Magic', 'high-magic'),
    (v_tag_reincarnation, v_owner_id, 'Reincarnation', 'reincarnation')
  ON CONFLICT (owner_id, lower(trim(name))) DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 3. Titles (Anime, Manga, and Manhwa test fixtures)
  -- ----------------------------------------------------------------------------
  -- Anime Fixture
  INSERT INTO titles (
    id, owner_id, media_type, english_title, original_title,
    synopsis, background, cover_url, cover_source_type,
    release_year, publication_status, start_date, end_date,
    episode_count, chapter_count, source_score, source_rank, source_popularity
  ) VALUES (
    v_title_anime, v_owner_id, 'anime', 'Echoes of the Astral Sky', '星空のエコー',
    'A solitary cartographer maps forgotten constellations across a fractured sky realm.',
    'Original animated production by Studio Starlight.',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    'url', 2024, 'Finished Airing', '2024-01-05', '2024-03-29',
    12, NULL, 8.75, 42, 1200
  ) ON CONFLICT (id) DO NOTHING;

  -- Manga Fixture
  INSERT INTO titles (
    id, owner_id, media_type, english_title, original_title,
    synopsis, background, cover_url, cover_source_type,
    release_year, publication_status, start_date, end_date,
    episode_count, chapter_count, source_score, source_rank, source_popularity
  ) VALUES (
    v_title_manga, v_owner_id, 'manga', 'Chronicles of the Wind Blade', '風刃の記録',
    'A wandering swordsman carries a fractured blade that whispers secrets of ancient techniques.',
    'Serialized in Monthly Shonen Horizon.',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    'url', 2021, 'Publishing', '2021-06-15', NULL,
    NULL, 75, 8.40, 150, 3400
  ) ON CONFLICT (id) DO NOTHING;

  -- Manhwa Fixture
  INSERT INTO titles (
    id, owner_id, media_type, english_title, original_title,
    synopsis, background, cover_url, cover_source_type,
    release_year, publication_status, start_date, end_date,
    episode_count, chapter_count, source_score, source_rank, source_popularity
  ) VALUES (
    v_title_manhwa, v_owner_id, 'manhwa', 'The Heavenly Sovereign Return', '천마군림보',
    'Betrayed by his closest disciples, the Heavenly Sovereign awakens three centuries later in the body of an exiled noble.',
    'Adapted from the hit web novel by Moonlit Studio.',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    'url', 2023, 'Publishing', '2023-04-10', NULL,
    NULL, 110, 9.10, 18, 850
  ) ON CONFLICT (id) DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 4. Title Aliases
  -- ----------------------------------------------------------------------------
  INSERT INTO title_aliases (title_id, alias, language_code, alias_type)
  VALUES
    (v_title_anime, 'Hoshizora no Echo', 'ja', 'romanized'),
    (v_title_manga, 'Kazenoba no Kiroku', 'ja', 'romanized'),
    (v_title_manhwa, 'Return of the Heavenly Demon', 'en', 'translated')
  ON CONFLICT (title_id, alias) DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 5. Title Genres & Tags Join Records
  -- ----------------------------------------------------------------------------
  INSERT INTO title_genres (title_id, genre_id)
  VALUES
    (v_title_anime, v_genre_fantasy),
    (v_title_anime, v_genre_drama),
    (v_title_manga, v_genre_action),
    (v_title_manga, v_genre_martial),
    (v_title_manhwa, v_genre_action),
    (v_title_manhwa, v_genre_fantasy),
    (v_title_manhwa, v_genre_martial)
  ON CONFLICT (title_id, genre_id) DO NOTHING;

  INSERT INTO title_tags (title_id, tag_id)
  VALUES
    (v_title_anime, v_tag_magic),
    (v_title_manhwa, v_tag_reincarnation)
  ON CONFLICT (title_id, tag_id) DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 6. External Sources (Mock MyAnimeList records)
  -- ----------------------------------------------------------------------------
  INSERT INTO external_sources (title_id, provider, external_id, source_url)
  VALUES
    (v_title_anime, 'myanimelist', '99001', 'https://myanimelist.net/anime/99001/astral_sky'),
    (v_title_manga, 'myanimelist', '99002', 'https://myanimelist.net/manga/99002/wind_blade'),
    (v_title_manhwa, 'myanimelist', '99003', 'https://myanimelist.net/manga/99003/heavenly_sovereign')
  ON CONFLICT (provider, external_id) DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 7. Collections (My List)
  -- ----------------------------------------------------------------------------
  INSERT INTO collections (id, owner_id, name, description, icon, color, sort_mode)
  VALUES
    (v_col_masterpieces, v_owner_id, 'Masterpieces', 'Unforgettable narratives and exceptional art direction', 'star', '#38bdf8', 'custom'),
    (v_col_reading, v_owner_id, 'Current Reading', 'Active reading list for weekly manhwa and manga chapters', 'book-open', '#10b981', 'date_added'),
    (v_col_action, v_owner_id, 'Action & Martial Arts', 'High-adrenaline choreography and cultivation works', 'flame', '#f59e0b', 'title')
  ON CONFLICT (owner_id, lower(trim(name))) DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 8. Title Collections Membership (Demonstrates many-to-many relationship)
  -- Notice: Chronicles of the Wind Blade belongs to BOTH Masterpieces and Action!
  -- ----------------------------------------------------------------------------
  INSERT INTO title_collections (title_id, collection_id, position)
  VALUES
    (v_title_anime, v_col_masterpieces, 1),
    (v_title_manga, v_col_masterpieces, 2),
    (v_title_manga, v_col_action, 1),
    (v_title_manhwa, v_col_action, 2),
    (v_title_manhwa, v_col_reading, 1)
  ON CONFLICT (title_id, collection_id) DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 9. Bookmarks (Independent tracking status, progress, and personal rating)
  -- ----------------------------------------------------------------------------
  INSERT INTO bookmarks (
    owner_id, title_id, status, progress, progress_unit, progress_total,
    priority, personal_rating, notes, started_at, completed_at
  ) VALUES
    (v_owner_id, v_title_anime, 'completed', 12, 'episode', 12, 5, 9.5, 'Phenomenal finale. The soundtrack is breathtaking.', '2024-01-05', '2024-03-29'),
    (v_owner_id, v_title_manga, 'consuming', 45, 'chapter', 75, 4, 8.5, 'The tournament arc pacing is superb.', '2023-08-10', NULL),
    (v_owner_id, v_title_manhwa, 'plan_to_consume', 0, 'chapter', 110, 3, NULL, 'Recommended by the community for top-tier art.', NULL, NULL)
  ON CONFLICT (owner_id, title_id) DO NOTHING;

END $$;
