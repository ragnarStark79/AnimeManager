import { db } from './db.js';
import type { BookmarkCreateInput, BookmarkUpdateInput } from '@animemanager/shared';
import { NotFoundError, ForbiddenError, ConflictError } from '../errors/index.js';

export interface BookmarkListItem {
  id: string;
  ownerId: string;
  titleId: string;
  status: string;
  progress: number;
  progressUnit: string;
  progressTotal: number | null;
  priority: number | null;
  personalRating: number | null;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  title: {
    id: string;
    englishTitle: string;
    originalTitle: string | null;
    mediaType: string;
    coverUrl: string | null;
    episodeCount: number | null;
    chapterCount: number | null;
  };
}

export interface BookmarkListFilters {
  status?: string;
  mediaType?: string;
  page: number;
  pageSize: number;
  sortBy: 'updatedAt' | 'createdAt' | 'personalRating' | 'priority' | 'progress';
  sortOrder: 'asc' | 'desc';
}

export const bookmarksRepository = {
  async list(ownerId: string, filters: BookmarkListFilters) {
    const { status, mediaType, page, pageSize, sortBy, sortOrder } = filters;
    const offset = (page - 1) * pageSize;

    const conditions: string[] = ['b.owner_id = $1'];
    const params: unknown[] = [ownerId];
    let pIdx = 2;

    if (status) {
      conditions.push(`b.status = $${pIdx++}`);
      params.push(status);
    }

    if (mediaType) {
      conditions.push(`t.media_type = $${pIdx++}`);
      params.push(mediaType);
    }

    const whereClause = conditions.join(' AND ');

    let orderCol = 'b.updated_at';
    if (sortBy === 'createdAt') orderCol = 'b.created_at';
    if (sortBy === 'personalRating') orderCol = 'COALESCE(b.personal_rating, -1)';
    if (sortBy === 'priority') orderCol = 'COALESCE(b.priority, 0)';
    if (sortBy === 'progress') orderCol = 'b.progress';

    const direction = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countSql = `
      SELECT count(*)::int as total
      FROM bookmarks b
      JOIN titles t ON t.id = b.title_id AND t.owner_id = b.owner_id
      WHERE ${whereClause}
    `;
    const countRes = await db.query<{ total: number }>(countSql, params);
    const total = countRes.rows[0]?.total || 0;

    const dataSql = `
      SELECT
        b.id, b.owner_id as "ownerId", b.title_id as "titleId", b.status,
        b.progress, b.progress_unit as "progressUnit", b.progress_total as "progressTotal",
        b.priority, b.personal_rating as "personalRating", b.notes,
        b.started_at as "startedAt", b.completed_at as "completedAt",
        b.created_at as "createdAt", b.updated_at as "updatedAt",
        t.english_title as "title_englishTitle", t.original_title as "title_originalTitle",
        t.media_type as "title_mediaType", t.cover_url as "title_coverUrl",
        t.episode_count as "title_episodeCount", t.chapter_count as "title_chapterCount"
      FROM bookmarks b
      JOIN titles t ON t.id = b.title_id AND t.owner_id = b.owner_id
      WHERE ${whereClause}
      ORDER BY ${orderCol} ${direction}
      LIMIT $${pIdx++} OFFSET $${pIdx++}
    `;

    const dataRes = await db.query(dataSql, [...params, pageSize, offset]);

    return {
      items: dataRes.rows.map((r) => ({
        id: r.id,
        ownerId: r.ownerId,
        titleId: r.titleId,
        status: r.status,
        progress: r.progress,
        progressUnit: r.progressUnit,
        progressTotal: r.progressTotal,
        priority: r.priority,
        personalRating: r.personalRating ? Number(r.personalRating) : null,
        notes: r.notes,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        title: {
          id: r.titleId,
          englishTitle: r.title_englishTitle,
          originalTitle: r.title_originalTitle,
          mediaType: r.title_mediaType,
          coverUrl: r.title_coverUrl,
          episodeCount: r.title_episodeCount,
          chapterCount: r.title_chapterCount,
        },
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  },

  async findById(ownerId: string, id: string): Promise<BookmarkListItem | null> {
    const sql = `
      SELECT
        b.id, b.owner_id as "ownerId", b.title_id as "titleId", b.status,
        b.progress, b.progress_unit as "progressUnit", b.progress_total as "progressTotal",
        b.priority, b.personal_rating as "personalRating", b.notes,
        b.started_at as "startedAt", b.completed_at as "completedAt",
        b.created_at as "createdAt", b.updated_at as "updatedAt",
        t.english_title as "title_englishTitle", t.original_title as "title_originalTitle",
        t.media_type as "title_mediaType", t.cover_url as "title_coverUrl",
        t.episode_count as "title_episodeCount", t.chapter_count as "title_chapterCount"
      FROM bookmarks b
      JOIN titles t ON t.id = b.title_id AND t.owner_id = b.owner_id
      WHERE b.id = $1 AND b.owner_id = $2
    `;
    const res = await db.query(sql, [id, ownerId]);
    if (res.rows.length === 0) return null;

    const r = res.rows[0];
    return {
      id: r.id,
      ownerId: r.ownerId,
      titleId: r.titleId,
      status: r.status,
      progress: r.progress,
      progressUnit: r.progressUnit,
      progressTotal: r.progressTotal,
      priority: r.priority,
      personalRating: r.personalRating ? Number(r.personalRating) : null,
      notes: r.notes,
      startedAt: r.startedAt,
      completedAt: r.completedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      title: {
        id: r.titleId,
        englishTitle: r.title_englishTitle,
        originalTitle: r.title_originalTitle,
        mediaType: r.title_mediaType,
        coverUrl: r.title_coverUrl,
        episodeCount: r.title_episodeCount,
        chapterCount: r.title_chapterCount,
      },
    };
  },

  async create(ownerId: string, data: BookmarkCreateInput): Promise<BookmarkListItem> {
    // 1. Verify caller owns the title
    const titleCheck = await db.query(
      `SELECT id FROM titles WHERE id = $1 AND owner_id = $2`,
      [data.titleId, ownerId]
    );
    if (titleCheck.rows.length === 0) {
      throw new ForbiddenError('Referenced title does not belong to you or does not exist');
    }

    // 2. Check if bookmark already exists
    const existing = await db.query(
      `SELECT id FROM bookmarks WHERE owner_id = $1 AND title_id = $2`,
      [ownerId, data.titleId]
    );
    if (existing.rows.length > 0) {
      throw new ConflictError('A bookmark already exists for this title. Use PUT /titles/:id/bookmark or PATCH /bookmarks/:id to update.');
    }

    const sql = `
      INSERT INTO bookmarks (
        owner_id, title_id, status, progress, progress_unit,
        progress_total, priority, personal_rating, notes, started_at, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;
    const res = await db.query(sql, [
      ownerId,
      data.titleId,
      data.status,
      data.progress ?? 0,
      data.progressUnit || 'episode',
      data.progressTotal ?? null,
      data.priority ?? null,
      data.personalRating ?? null,
      data.notes || null,
      data.startedAt || null,
      data.completedAt || null,
    ]);

    const created = await bookmarksRepository.findById(ownerId, res.rows[0].id);
    if (!created) {
      throw new Error('Failed to retrieve newly created bookmark');
    }
    return created;
  },

  async update(ownerId: string, id: string, data: BookmarkUpdateInput): Promise<BookmarkListItem | null> {
    const check = await db.query(
      `SELECT id FROM bookmarks WHERE id = $1 AND owner_id = $2`,
      [id, ownerId]
    );
    if (check.rows.length === 0) {
      return null;
    }

    const updates: string[] = [];
    const params: unknown[] = [id, ownerId];
    let pIdx = 3;

    const fieldMap: Record<string, string> = {
      status: 'status',
      progress: 'progress',
      progressUnit: 'progress_unit',
      progressTotal: 'progress_total',
      priority: 'priority',
      personalRating: 'personal_rating',
      notes: 'notes',
      startedAt: 'started_at',
      completedAt: 'completed_at',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in data) {
        const val = (data as Record<string, unknown>)[key];
        updates.push(`${col} = $${pIdx++}`);
        params.push(val === undefined ? null : val);
      }
    }

    if (updates.length > 0) {
      const sql = `UPDATE bookmarks SET ${updates.join(', ')} WHERE id = $1 AND owner_id = $2`;
      await db.query(sql, params);
    }

    return bookmarksRepository.findById(ownerId, id);
  },

  async delete(ownerId: string, id: string): Promise<boolean> {
    const res = await db.query(
      `DELETE FROM bookmarks WHERE id = $1 AND owner_id = $2`,
      [id, ownerId]
    );
    return (res.rowCount ?? 0) > 0;
  },

  async upsertByTitleId(
    ownerId: string,
    titleId: string,
    data: Omit<BookmarkCreateInput, 'titleId'>
  ): Promise<BookmarkListItem> {
    // Verify caller owns title
    const titleCheck = await db.query(
      `SELECT id FROM titles WHERE id = $1 AND owner_id = $2`,
      [titleId, ownerId]
    );
    if (titleCheck.rows.length === 0) {
      throw new ForbiddenError('Referenced title does not belong to you or does not exist');
    }

    const sql = `
      INSERT INTO bookmarks (
        owner_id, title_id, status, progress, progress_unit,
        progress_total, priority, personal_rating, notes, started_at, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (owner_id, title_id) DO UPDATE SET
        status = EXCLUDED.status,
        progress = EXCLUDED.progress,
        progress_unit = EXCLUDED.progress_unit,
        progress_total = EXCLUDED.progress_total,
        priority = EXCLUDED.priority,
        personal_rating = EXCLUDED.personal_rating,
        notes = EXCLUDED.notes,
        started_at = EXCLUDED.started_at,
        completed_at = EXCLUDED.completed_at
      RETURNING id
    `;

    const res = await db.query(sql, [
      ownerId,
      titleId,
      data.status,
      data.progress ?? 0,
      data.progressUnit || 'episode',
      data.progressTotal ?? null,
      data.priority ?? null,
      data.personalRating ?? null,
      data.notes || null,
      data.startedAt || null,
      data.completedAt || null,
    ]);

    const item = await bookmarksRepository.findById(ownerId, res.rows[0].id);
    if (!item) {
      throw new Error('Failed to retrieve upserted bookmark');
    }
    return item;
  },
};
