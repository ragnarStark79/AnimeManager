import type { PoolClient } from 'pg';
import { db } from './db.js';
import type { TitleCreateInput, TitleUpdateInput } from '@animemanager/shared';

export interface TitleListFilters {
  page: number;
  pageSize: number;
  search?: string;
  mediaType?: string;
  collectionId?: string;
  bookmarkStatus?: string;
  sortBy: 'title' | 'createdAt' | 'updatedAt' | 'releaseYear' | 'personalRating';
  sortOrder: 'asc' | 'desc';
}

export interface TitleHydrated {
  id: string;
  ownerId: string;
  mediaType: string;
  englishTitle: string;
  originalTitle: string | null;
  synopsis: string | null;
  background: string | null;
  coverUrl: string | null;
  coverStoragePath: string | null;
  coverSourceType: string;
  releaseYear: number | null;
  publicationStatus: string | null;
  startDate: string | null;
  endDate: string | null;
  episodeCount: number | null;
  chapterCount: number | null;
  sourceScore: number | null;
  sourceRank: number | null;
  sourcePopularity: number | null;
  createdAt: string;
  updatedAt: string;
  aliases: Array<{ id: string; alias: string; languageCode: string | null; aliasType: string | null }>;
  genres: Array<{ id: string; name: string; slug: string }>;
  tags: Array<{ id: string; name: string; slug: string }>;
  collections: Array<{ id: string; name: string; icon: string | null; color: string | null }>;
  bookmark: {
    id: string;
    status: string;
    progress: number;
    progressUnit: string;
    progressTotal: number | null;
    priority: number | null;
    personalRating: number | null;
    notes: string | null;
    startedAt: string | null;
    completedAt: string | null;
  } | null;
  externalSources: Array<{ id: string; provider: string; externalId: string; sourceUrl: string | null }>;
}

export const titlesRepository = {
  async list(ownerId: string, filters: TitleListFilters) {
    const { page, pageSize, search, mediaType, collectionId, bookmarkStatus, sortBy, sortOrder } = filters;
    const offset = (page - 1) * pageSize;

    const conditions: string[] = ['t.owner_id = $1'];
    const params: unknown[] = [ownerId];
    let paramIndex = 2;

    if (mediaType) {
      conditions.push(`t.media_type = $${paramIndex++}`);
      params.push(mediaType);
    }

    if (collectionId) {
      conditions.push(`EXISTS (
        SELECT 1 FROM title_collections tc
        JOIN collections c ON c.id = tc.collection_id
        WHERE tc.title_id = t.id AND tc.collection_id = $${paramIndex++} AND c.owner_id = $1
      )`);
      params.push(collectionId);
    }

    if (bookmarkStatus) {
      conditions.push(`EXISTS (
        SELECT 1 FROM bookmarks b
        WHERE b.title_id = t.id AND b.owner_id = $1 AND b.status = $${paramIndex++}
      )`);
      params.push(bookmarkStatus);
    }

    if (search) {
      const searchPattern = `%${search.toLowerCase()}%`;
      conditions.push(`(
        lower(t.english_title) LIKE $${paramIndex} OR
        (t.original_title IS NOT NULL AND lower(t.original_title) LIKE $${paramIndex}) OR
        EXISTS (
          SELECT 1 FROM title_aliases ta
          WHERE ta.title_id = t.id AND lower(ta.alias) LIKE $${paramIndex}
        )
      )`);
      params.push(searchPattern);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Safe allowlisted order mapping
    let orderClause = 't.updated_at DESC';
    const direction = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    if (sortBy === 'title') {
      orderClause = `t.english_title ${direction}`;
    } else if (sortBy === 'createdAt') {
      orderClause = `t.created_at ${direction}`;
    } else if (sortBy === 'updatedAt') {
      orderClause = `t.updated_at ${direction}`;
    } else if (sortBy === 'releaseYear') {
      orderClause = `t.release_year ${direction} NULLS LAST`;
    } else if (sortBy === 'personalRating') {
      orderClause = `COALESCE(b.personal_rating, -1) ${direction}`;
    }

    // Count query
    const countSql = `
      SELECT count(DISTINCT t.id)::int as total
      FROM titles t
      LEFT JOIN bookmarks b ON b.title_id = t.id AND b.owner_id = t.owner_id
      WHERE ${whereClause}
    `;
    const countRes = await db.query<{ total: number }>(countSql, params);
    const total = countRes.rows[0]?.total || 0;

    // Items query
    const dataSql = `
      SELECT
        t.id, t.owner_id, t.media_type, t.english_title, t.original_title,
        t.synopsis, t.cover_url, t.cover_storage_path, t.cover_source_type,
        t.release_year, t.publication_status, t.episode_count, t.chapter_count,
        t.source_score, t.source_rank, t.created_at, t.updated_at,
        b.id as bookmark_id, b.status as bookmark_status, b.progress as bookmark_progress,
        b.progress_unit as bookmark_progress_unit, b.progress_total as bookmark_progress_total,
        b.personal_rating as bookmark_personal_rating
      FROM titles t
      LEFT JOIN bookmarks b ON b.title_id = t.id AND b.owner_id = t.owner_id
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const dataRes = await db.query(dataSql, [...params, pageSize, offset]);

    return {
      items: dataRes.rows.map((r) => ({
        id: r.id,
        ownerId: r.owner_id,
        mediaType: r.media_type,
        englishTitle: r.english_title,
        originalTitle: r.original_title,
        synopsis: r.synopsis,
        coverUrl: r.cover_url,
        coverStoragePath: r.cover_storage_path,
        coverSourceType: r.cover_source_type,
        releaseYear: r.release_year,
        publicationStatus: r.publication_status,
        episodeCount: r.episode_count,
        chapterCount: r.chapter_count,
        sourceScore: r.source_score ? Number(r.source_score) : null,
        sourceRank: r.source_rank,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        bookmark: r.bookmark_id
          ? {
              id: r.bookmark_id,
              status: r.bookmark_status,
              progress: r.bookmark_progress,
              progressUnit: r.bookmark_progress_unit,
              progressTotal: r.bookmark_progress_total,
              personalRating: r.bookmark_personal_rating ? Number(r.bookmark_personal_rating) : null,
            }
          : null,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  },

  async findById(ownerId: string, titleId: string): Promise<TitleHydrated | null> {
    const titleRes = await db.query(
      `SELECT * FROM titles WHERE id = $1 AND owner_id = $2`,
      [titleId, ownerId]
    );

    if (titleRes.rows.length === 0) {
      return null;
    }

    const t = titleRes.rows[0];

    // Fetch aliases
    const aliasesRes = await db.query<{ id: string; alias: string; languageCode: string | null; aliasType: string | null }>(
      `SELECT id, alias, language_code as "languageCode", alias_type as "aliasType"
       FROM title_aliases WHERE title_id = $1 ORDER BY created_at ASC`,
      [titleId]
    );

    // Fetch genres
    const genresRes = await db.query<{ id: string; name: string; slug: string }>(
      `SELECT g.id, g.name, g.slug
       FROM title_genres tg
       JOIN genres g ON g.id = tg.genre_id
       WHERE tg.title_id = $1 ORDER BY g.name ASC`,
      [titleId]
    );

    // Fetch tags
    const tagsRes = await db.query<{ id: string; name: string; slug: string }>(
      `SELECT tg.id, tg.name, tg.slug
       FROM title_tags tt
       JOIN tags tg ON tg.id = tt.tag_id
       WHERE tt.title_id = $1 AND tg.owner_id = $2 ORDER BY tg.name ASC`,
      [titleId, ownerId]
    );

    // Fetch collections
    const collectionsRes = await db.query<{ id: string; name: string; icon: string | null; color: string | null }>(
      `SELECT c.id, c.name, c.icon, c.color
       FROM title_collections tc
       JOIN collections c ON c.id = tc.collection_id
       WHERE tc.title_id = $1 AND c.owner_id = $2 ORDER BY tc.added_at ASC`,
      [titleId, ownerId]
    );

    // Fetch bookmark
    const bookmarkRes = await db.query<{
      id: string;
      status: string;
      progress: number;
      progressUnit: string;
      progressTotal: number | null;
      priority: number | null;
      personalRating: number | null;
      notes: string | null;
      startedAt: string | null;
      completedAt: string | null;
    }>(
      `SELECT id, status, progress, progress_unit as "progressUnit",
              progress_total as "progressTotal", priority, personal_rating as "personalRating",
              notes, started_at as "startedAt", completed_at as "completedAt"
       FROM bookmarks WHERE title_id = $1 AND owner_id = $2`,
      [titleId, ownerId]
    );

    // Fetch external sources
    const sourcesRes = await db.query<{ id: string; provider: string; externalId: string; sourceUrl: string | null }>(
      `SELECT id, provider, external_id as "externalId", source_url as "sourceUrl"
       FROM external_sources WHERE title_id = $1 ORDER BY created_at ASC`,
      [titleId]
    );

    const b = bookmarkRes.rows[0] || null;

    return {
      id: t.id,
      ownerId: t.owner_id,
      mediaType: t.media_type,
      englishTitle: t.english_title,
      originalTitle: t.original_title,
      synopsis: t.synopsis,
      background: t.background,
      coverUrl: t.cover_url,
      coverStoragePath: t.cover_storage_path,
      coverSourceType: t.cover_source_type,
      releaseYear: t.release_year,
      publicationStatus: t.publication_status,
      startDate: t.start_date,
      endDate: t.end_date,
      episodeCount: t.episode_count,
      chapterCount: t.chapter_count,
      sourceScore: t.source_score ? Number(t.source_score) : null,
      sourceRank: t.source_rank,
      sourcePopularity: t.source_popularity,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      aliases: aliasesRes.rows,
      genres: genresRes.rows,
      tags: tagsRes.rows,
      collections: collectionsRes.rows,
      bookmark: b
        ? {
            id: b.id,
            status: b.status,
            progress: b.progress,
            progressUnit: b.progressUnit,
            progressTotal: b.progressTotal,
            priority: b.priority,
            personalRating: b.personalRating ? Number(b.personalRating) : null,
            notes: b.notes,
            startedAt: b.startedAt,
            completedAt: b.completedAt,
          }
        : null,
      externalSources: sourcesRes.rows,
    };
  },

  async create(ownerId: string, data: TitleCreateInput): Promise<TitleHydrated> {
    const titleId = await db.transaction(async (client: PoolClient) => {
      const insertTitleSql = `
        INSERT INTO titles (
          owner_id, media_type, english_title, original_title,
          synopsis, background, cover_url, cover_storage_path, cover_source_type,
          release_year, publication_status, start_date, end_date,
          episode_count, chapter_count, source_score, source_rank, source_popularity
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        ) RETURNING id
      `;

      const titleRes = await client.query(insertTitleSql, [
        ownerId,
        data.mediaType,
        data.englishTitle,
        data.originalTitle || null,
        data.synopsis || null,
        data.background || null,
        data.coverUrl || null,
        data.coverStoragePath || null,
        data.coverSourceType || 'none',
        data.releaseYear || null,
        data.publicationStatus || null,
        data.startDate || null,
        data.endDate || null,
        data.episodeCount ?? null,
        data.chapterCount ?? null,
        data.sourceScore ?? null,
        data.sourceRank ?? null,
        data.sourcePopularity ?? null,
      ]);

      const newId = titleRes.rows[0].id as string;

      // Insert aliases
      if (data.aliases && data.aliases.length > 0) {
        for (const aliasItem of data.aliases) {
          await client.query(
            `INSERT INTO title_aliases (title_id, alias, language_code, alias_type)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (title_id, alias) DO NOTHING`,
            [newId, aliasItem.title, aliasItem.languageCode || null, aliasItem.aliasType || null]
          );
        }
      }

      // Link genres
      if (data.genres && data.genres.length > 0) {
        for (const genreName of data.genres) {
          const trimmed = genreName.trim();
          if (!trimmed) continue;
          const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          // Upsert genre
          const gRes = await client.query(
            `INSERT INTO genres (name, slug, source_provider)
             VALUES ($1, $2, 'user')
             ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug
             RETURNING id`,
            [trimmed, slug]
          );
          const genreId = gRes.rows[0].id;
          await client.query(
            `INSERT INTO title_genres (title_id, genre_id)
             VALUES ($1, $2)
             ON CONFLICT (title_id, genre_id) DO NOTHING`,
            [newId, genreId]
          );
        }
      }

      // Link tags
      if (data.tags && data.tags.length > 0) {
        for (const tagName of data.tags) {
          const trimmed = tagName.trim();
          if (!trimmed) continue;
          const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const tRes = await client.query(
            `INSERT INTO tags (owner_id, name, slug)
             VALUES ($1, $2, $3)
             ON CONFLICT (owner_id, lower(trim(name))) DO UPDATE SET slug = EXCLUDED.slug
             RETURNING id`,
            [ownerId, trimmed, slug]
          );
          const tagId = tRes.rows[0].id;
          await client.query(
            `INSERT INTO title_tags (title_id, tag_id)
             VALUES ($1, $2)
             ON CONFLICT (title_id, tag_id) DO NOTHING`,
            [newId, tagId]
          );
        }
      }

      return newId;
    });

    const created = await titlesRepository.findById(ownerId, titleId);
    if (!created) {
      throw new Error('Failed to retrieve newly created title');
    }
    return created;
  },

  async update(ownerId: string, titleId: string, data: TitleUpdateInput): Promise<TitleHydrated | null> {
    const exists = await db.transaction(async (client: PoolClient) => {
      // Check title ownership
      const checkRes = await client.query(
        `SELECT id FROM titles WHERE id = $1 AND owner_id = $2`,
        [titleId, ownerId]
      );
      if (checkRes.rows.length === 0) {
        return false;
      }

      // Dynamic UPDATE query builder for title fields
      const updates: string[] = [];
      const params: unknown[] = [titleId, ownerId];
      let pIdx = 3;

      const fieldMap: Record<string, string> = {
        mediaType: 'media_type',
        englishTitle: 'english_title',
        originalTitle: 'original_title',
        synopsis: 'synopsis',
        background: 'background',
        coverUrl: 'cover_url',
        coverStoragePath: 'cover_storage_path',
        coverSourceType: 'cover_source_type',
        releaseYear: 'release_year',
        publicationStatus: 'publication_status',
        startDate: 'start_date',
        endDate: 'end_date',
        episodeCount: 'episode_count',
        chapterCount: 'chapter_count',
        sourceScore: 'source_score',
        sourceRank: 'source_rank',
        sourcePopularity: 'source_popularity',
      };

      for (const [key, col] of Object.entries(fieldMap)) {
        if (key in data) {
          const val = (data as Record<string, unknown>)[key];
          updates.push(`${col} = $${pIdx++}`);
          params.push(val === undefined ? null : val);
        }
      }

      if (updates.length > 0) {
        const updateSql = `UPDATE titles SET ${updates.join(', ')} WHERE id = $1 AND owner_id = $2`;
        await client.query(updateSql, params);
      }

      // Update aliases if provided
      if (data.aliases !== undefined) {
        await client.query(`DELETE FROM title_aliases WHERE title_id = $1`, [titleId]);
        for (const aliasItem of data.aliases) {
          await client.query(
            `INSERT INTO title_aliases (title_id, alias, language_code, alias_type)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (title_id, alias) DO NOTHING`,
            [titleId, aliasItem.title, aliasItem.languageCode || null, aliasItem.aliasType || null]
          );
        }
      }

      // Update genres if provided
      if (data.genres !== undefined) {
        await client.query(`DELETE FROM title_genres WHERE title_id = $1`, [titleId]);
        for (const genreName of data.genres) {
          const trimmed = genreName.trim();
          if (!trimmed) continue;
          const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const gRes = await client.query(
            `INSERT INTO genres (name, slug, source_provider)
             VALUES ($1, $2, 'user')
             ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug
             RETURNING id`,
            [trimmed, slug]
          );
          await client.query(
            `INSERT INTO title_genres (title_id, genre_id)
             VALUES ($1, $2)
             ON CONFLICT (title_id, genre_id) DO NOTHING`,
            [titleId, gRes.rows[0].id]
          );
        }
      }

      // Update tags if provided
      if (data.tags !== undefined) {
        await client.query(`DELETE FROM title_tags WHERE title_id = $1`, [titleId]);
        for (const tagName of data.tags) {
          const trimmed = tagName.trim();
          if (!trimmed) continue;
          const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const tRes = await client.query(
            `INSERT INTO tags (owner_id, name, slug)
             VALUES ($1, $2, $3)
             ON CONFLICT (owner_id, lower(trim(name))) DO UPDATE SET slug = EXCLUDED.slug
             RETURNING id`,
            [ownerId, trimmed, slug]
          );
          await client.query(
            `INSERT INTO title_tags (title_id, tag_id)
             VALUES ($1, $2)
             ON CONFLICT (title_id, tag_id) DO NOTHING`,
            [titleId, tRes.rows[0].id]
          );
        }
      }

      return true;
    });

    if (!exists) {
      return null;
    }

    return titlesRepository.findById(ownerId, titleId);
  },

  async delete(ownerId: string, titleId: string): Promise<boolean> {
    const res = await db.query(
      `DELETE FROM titles WHERE id = $1 AND owner_id = $2`,
      [titleId, ownerId]
    );
    return (res.rowCount ?? 0) > 0;
  },
};
