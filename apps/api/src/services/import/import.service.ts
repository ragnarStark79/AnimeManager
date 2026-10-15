import { db } from '../../repositories/db.js';
import { titlesRepository } from '../../repositories/titles.repository.js';
import { jikanClient, JikanClient } from './jikan.client.js';
import { parseMalUrl, validateMalIdAndType } from './url-parser.js';
import { normalizeSearchCandidates, normalizeDetailDraft } from './normalizer.js';
import {
  BadRequestError,
  DuplicateImportError,
  ForbiddenError,
  ValidationError,
} from '../../errors/index.js';
import type {
  ImportSearchQuery,
  ImportPreviewQuery,
  ImportDraft,
  ImportCommitInput,
  ImportSearchResponse,
} from '@animemanager/shared';
import type { TitleHydrated } from '../../repositories/titles.repository.js';
import type { PoolClient } from 'pg';

export class ImportService {
  private readonly client: JikanClient;

  constructor(client: JikanClient = jikanClient) {
    this.client = client;
  }

  /**
   * Search anime or manga via Jikan v4 with caching and throttling.
   */
  async search(query: ImportSearchQuery, requestId?: string): Promise<ImportSearchResponse> {
    const rawData = await this.client.search(
      query.type,
      query.q,
      query.page || 1,
      query.limit || 10,
      { requestId }
    );

    const candidates = normalizeSearchCandidates(rawData.data || [], query.type);
    const hasNextPage = Boolean(rawData.pagination?.has_next_page);

    return {
      items: candidates,
      page: query.page || 1,
      hasNextPage,
    };
  }

  /**
   * Preview metadata draft for a given MyAnimeList URL or ID.
   * Performs read-only duplicate detection without mutating database.
   */
  async preview(ownerId: string, query: ImportPreviewQuery, requestId?: string): Promise<ImportDraft> {
    let target: { mediaType: 'anime' | 'manga'; id: number; canonicalUrl: string };

    if (query.url) {
      target = parseMalUrl(query.url);
      if (query.type && query.type !== target.mediaType) {
        throw new BadRequestError(
          `URL media type (${target.mediaType}) conflicts with requested media type (${query.type})`
        );
      }
    } else if (query.id && query.type) {
      target = validateMalIdAndType(query.id, query.type);
    } else {
      throw new BadRequestError('Either url, or both id and type must be provided');
    }

    // Fetch detail from Jikan
    const rawDetail = await this.client.getDetail(target.mediaType, target.id, { requestId });

    // Normalize metadata into draft
    const draft = normalizeDetailDraft(rawDetail, target.mediaType);

    // Duplicate Detection: Check if caller already imported this provider & externalId
    const existingCheck = await db.query<{ title_id: string; english_title: string }>(
      `SELECT es.title_id, t.english_title
       FROM external_sources es
       JOIN titles t ON t.id = es.title_id
       WHERE es.provider = $1 AND es.external_id = $2 AND t.owner_id = $3
       LIMIT 1`,
      ['myanimelist', draft.externalId, ownerId]
    );

    if (existingCheck.rows.length > 0) {
      const match = existingCheck.rows[0];
      draft.duplicateExistingTitleId = match.title_id;
      draft.duplicateExistingTitleName = match.english_title;
      draft.warnings.push(
        `This title has already been imported into your library as '${match.english_title}'.`
      );
    }

    return draft;
  }

  /**
   * Atomically commits user-reviewed metadata draft, creating Title,
   * Aliases, Genres, Tags, External Source mapping, and optional Bookmark & Collection memberships.
   */
  async commit(ownerId: string, input: ImportCommitInput): Promise<TitleHydrated> {
    const { draft, selectedFields, overrides, confirmedMediaType, initialBookmark, collectionIds } =
      input;

    const externalId = String(draft.externalId || '').trim();
    if (!externalId) {
      throw new ValidationError('External ID is required in import draft');
    }

    // 1. Duplicate Check: Block importing duplicate externalId for this owner
    const existingCheck = await db.query<{ title_id: string; english_title: string }>(
      `SELECT es.title_id, t.english_title
       FROM external_sources es
       JOIN titles t ON t.id = es.title_id
       WHERE es.provider = $1 AND es.external_id = $2 AND t.owner_id = $3
       LIMIT 1`,
      ['myanimelist', externalId, ownerId]
    );

    if (existingCheck.rows.length > 0) {
      const match = existingCheck.rows[0];
      throw new DuplicateImportError(
        `This title has already been imported into your library as '${match.english_title}'.`,
        [
          {
            existingTitleId: match.title_id,
            existingTitle: match.english_title,
            provider: 'myanimelist',
            externalId,
          },
        ]
      );
    }

    // 2. Collection Ownership Verification (if collections specified)
    if (collectionIds && collectionIds.length > 0) {
      const colCheck = await db.query<{ id: string }>(
        `SELECT id FROM collections WHERE id = ANY($1) AND owner_id = $2`,
        [collectionIds, ownerId]
      );
      if (colCheck.rows.length !== collectionIds.length) {
        throw new ForbiddenError(
          'One or more specified collections do not belong to you or do not exist'
        );
      }
    }

    // 3. Resolve Media Type
    const finalMediaType = confirmedMediaType || overrides?.mediaType || draft.mediaType;

    // 4. Resolve Selected & Overridden Fields (Server-side field selection enforcement)
    const englishTitle =
      overrides?.englishTitle?.trim() ||
      (selectedFields.englishTitle !== false ? draft.englishTitle : draft.englishTitle);

    if (!englishTitle || !englishTitle.trim()) {
      throw new ValidationError('Display title cannot be blank');
    }

    const originalTitle =
      overrides?.originalTitle !== undefined
        ? overrides.originalTitle
        : selectedFields.originalTitle
          ? draft.originalTitle
          : null;

    const synopsis =
      overrides?.synopsis !== undefined
        ? overrides.synopsis
        : selectedFields.synopsis
          ? draft.synopsis
          : null;

    const background =
      overrides?.background !== undefined
        ? overrides.background
        : selectedFields.background
          ? draft.background
          : null;

    const coverUrl =
      overrides?.coverUrl !== undefined
        ? overrides.coverUrl
        : selectedFields.coverUrl
          ? draft.coverUrl
          : null;

    const releaseYear =
      overrides?.releaseYear !== undefined
        ? overrides.releaseYear
        : selectedFields.releaseYear
          ? draft.releaseYear
          : null;

    const publicationStatus =
      overrides?.publicationStatus !== undefined
        ? overrides.publicationStatus
        : selectedFields.publicationStatus
          ? draft.publicationStatus
          : null;

    const startDate =
      overrides?.startDate !== undefined
        ? overrides.startDate
        : selectedFields.startDate
          ? draft.startDate
          : null;

    const endDate =
      overrides?.endDate !== undefined
        ? overrides.endDate
        : selectedFields.endDate
          ? draft.endDate
          : null;

    const episodeCount =
      overrides?.episodeCount !== undefined
        ? overrides.episodeCount
        : selectedFields.episodeCount
          ? draft.episodeCount
          : null;

    const chapterCount =
      overrides?.chapterCount !== undefined
        ? overrides.chapterCount
        : selectedFields.chapterCount
          ? draft.chapterCount
          : null;

    const sourceScore =
      overrides?.sourceScore !== undefined
        ? overrides.sourceScore
        : selectedFields.sourceScore
          ? draft.sourceScore
          : null;

    const sourceRank =
      overrides?.sourceRank !== undefined
        ? overrides.sourceRank
        : selectedFields.sourceRank
          ? draft.sourceRank
          : null;

    const sourcePopularity =
      overrides?.sourcePopularity !== undefined
        ? overrides.sourcePopularity
        : selectedFields.sourcePopularity
          ? draft.sourcePopularity
          : null;

    const aliases =
      overrides?.aliases !== undefined
        ? overrides.aliases
        : selectedFields.aliases
          ? draft.aliases
          : [];

    const genres =
      overrides?.genres !== undefined
        ? overrides.genres
        : selectedFields.genres
          ? draft.genres
          : [];

    const tags =
      overrides?.tags !== undefined
        ? overrides.tags
        : selectedFields.tags
          ? draft.tags
          : [];

    // 5. Execute Atomic Multi-Table Transaction
    const titleId = await db.transaction(async (client: PoolClient) => {
      // 5.1 Insert Title
      const insertTitleSql = `
        INSERT INTO titles (
          owner_id, media_type, english_title, original_title,
          synopsis, background, cover_url, cover_source_type,
          release_year, publication_status, start_date, end_date,
          episode_count, chapter_count, source_score, source_rank, source_popularity
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        ) RETURNING id
      `;

      const titleRes = await client.query(insertTitleSql, [
        ownerId,
        finalMediaType,
        englishTitle.trim(),
        originalTitle?.trim() || null,
        synopsis?.trim() || null,
        background?.trim() || null,
        coverUrl || null,
        coverUrl ? 'provider' : 'none',
        releaseYear ?? null,
        publicationStatus || null,
        startDate || null,
        endDate || null,
        episodeCount ?? null,
        chapterCount ?? null,
        sourceScore ?? null,
        sourceRank ?? null,
        sourcePopularity ?? null,
      ]);

      const newTitleId = titleRes.rows[0].id as string;

      // 5.2 Insert Aliases
      if (aliases && aliases.length > 0) {
        for (const aliasItem of aliases) {
          if (!aliasItem.title?.trim()) continue;
          await client.query(
            `INSERT INTO title_aliases (title_id, alias, language_code, alias_type)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (title_id, alias) DO NOTHING`,
            [newTitleId, aliasItem.title.trim(), aliasItem.languageCode || null, aliasItem.aliasType || null]
          );
        }
      }

      // 5.3 Upsert & Link Genres
      if (genres && genres.length > 0) {
        for (const genreName of genres) {
          const trimmed = genreName.trim();
          if (!trimmed) continue;
          const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const gRes = await client.query(
            `INSERT INTO genres (name, slug, source_provider)
             VALUES ($1, $2, 'myanimelist')
             ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug
             RETURNING id`,
            [trimmed, slug]
          );
          const genreId = gRes.rows[0].id;
          await client.query(
            `INSERT INTO title_genres (title_id, genre_id)
             VALUES ($1, $2)
             ON CONFLICT (title_id, genre_id) DO NOTHING`,
            [newTitleId, genreId]
          );
        }
      }

      // 5.4 Upsert & Link Tags
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
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
            [newTitleId, tagId]
          );
        }
      }

      // 5.5 Insert External Source Record
      await client.query(
        `INSERT INTO external_sources (title_id, provider, external_id, source_url, last_fetched_at)
         VALUES ($1, $2, $3, $4, now())`,
        [newTitleId, 'myanimelist', externalId, draft.sourceUrl || null]
      );

      // 5.6 Optional Initial Bookmark
      if (initialBookmark) {
        // Enforce bookmark invariants
        if (initialBookmark.progress !== undefined && initialBookmark.progress < 0) {
          throw new ValidationError('Progress cannot be negative');
        }
        if (
          initialBookmark.progress !== undefined &&
          initialBookmark.progressTotal !== undefined &&
          initialBookmark.progressTotal !== null &&
          initialBookmark.progress > initialBookmark.progressTotal
        ) {
          throw new ValidationError('Progress cannot exceed total progress');
        }
        if (
          initialBookmark.personalRating !== undefined &&
          initialBookmark.personalRating !== null &&
          (initialBookmark.personalRating < 0 || initialBookmark.personalRating > 10)
        ) {
          throw new ValidationError('Personal rating must be between 0 and 10');
        }

        const insertBookmarkSql = `
          INSERT INTO bookmarks (
            owner_id, title_id, status, progress, progress_unit, progress_total,
            priority, personal_rating, notes, started_at, completed_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
          )
        `;
        await client.query(insertBookmarkSql, [
          ownerId,
          newTitleId,
          initialBookmark.status,
          initialBookmark.progress ?? 0,
          initialBookmark.progressUnit ?? (finalMediaType === 'anime' ? 'episode' : 'chapter'),
          initialBookmark.progressTotal ?? (finalMediaType === 'anime' ? episodeCount : chapterCount),
          initialBookmark.priority ?? null,
          initialBookmark.personalRating ?? null,
          initialBookmark.notes ?? null,
          initialBookmark.startedAt ?? null,
          initialBookmark.completedAt ?? null,
        ]);
      }

      // 5.7 Optional Collection Memberships
      if (collectionIds && collectionIds.length > 0) {
        for (let i = 0; i < collectionIds.length; i++) {
          await client.query(
            `INSERT INTO title_collections (title_id, collection_id, position)
             VALUES ($1, $2, $3)
             ON CONFLICT (title_id, collection_id) DO NOTHING`,
            [newTitleId, collectionIds[i], i + 1]
          );
        }
      }

      return newTitleId;
    });

    // 6. Return fully hydrated title
    const created = await titlesRepository.findById(ownerId, titleId);
    if (!created) {
      throw new Error('Failed to retrieve newly imported title');
    }
    return created;
  }
}

export const importService = new ImportService();
