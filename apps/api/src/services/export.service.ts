import { db } from '../repositories/db.js';
import { titlesRepository } from '../repositories/titles.repository.js';
import { collectionsRepository } from '../repositories/collections.repository.js';
import { bookmarksRepository } from '../repositories/bookmarks.repository.js';

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export class ExportService {
  /**
   * Export complete relational library data for authenticated owner.
   */
  async exportJson(ownerId: string) {
    // 1. Fetch all titles
    const titlesRes = await db.query(
      `SELECT t.*,
         COALESCE(json_agg(DISTINCT ta.*) FILTER (WHERE ta.id IS NOT NULL), '[]') as aliases,
         COALESCE(json_agg(DISTINCT g.*) FILTER (WHERE g.id IS NOT NULL), '[]') as genres,
         COALESCE(json_agg(DISTINCT tag.*) FILTER (WHERE tag.id IS NOT NULL), '[]') as tags,
         COALESCE(json_agg(DISTINCT es.*) FILTER (WHERE es.id IS NOT NULL), '[]') as external_sources
       FROM titles t
       LEFT JOIN title_aliases ta ON ta.title_id = t.id
       LEFT JOIN title_genres tg ON tg.title_id = t.id
       LEFT JOIN genres g ON g.id = tg.genre_id
       LEFT JOIN title_tags tt ON tt.title_id = t.id
       LEFT JOIN tags tag ON tag.id = tt.tag_id
       LEFT JOIN external_sources es ON es.title_id = t.id
       WHERE t.owner_id = $1
       GROUP BY t.id
       ORDER BY t.created_at ASC`,
      [ownerId]
    );

    // 2. Fetch all collections with memberships
    const collectionsRes = await db.query(
      `SELECT c.*,
         COALESCE(json_agg(DISTINCT jsonb_build_object('titleId', tc.title_id, 'position', tc.position, 'addedAt', tc.added_at)) FILTER (WHERE tc.title_id IS NOT NULL), '[]') as titles
       FROM collections c
       LEFT JOIN title_collections tc ON tc.collection_id = c.id
       WHERE c.owner_id = $1
       GROUP BY c.id
       ORDER BY c.created_at ASC`,
      [ownerId]
    );

    // 3. Fetch all bookmarks
    const bookmarksRes = await db.query(
      `SELECT b.* FROM bookmarks b WHERE b.owner_id = $1 ORDER BY b.created_at ASC`,
      [ownerId]
    );

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      ownerId,
      titles: titlesRes.rows.map((row) => ({
        id: row.id,
        mediaType: row.media_type,
        englishTitle: row.english_title,
        originalTitle: row.original_title,
        synopsis: row.synopsis,
        background: row.background,
        coverUrl: row.cover_url,
        coverStoragePath: row.cover_storage_path,
        coverSourceType: row.cover_source_type,
        releaseYear: row.release_year,
        publicationStatus: row.publication_status,
        startDate: row.start_date,
        endDate: row.end_date,
        episodeCount: row.episode_count,
        chapterCount: row.chapter_count,
        sourceScore: row.source_score ? Number(row.source_score) : null,
        sourceRank: row.source_rank,
        sourcePopularity: row.source_popularity,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        aliases: row.aliases,
        genres: row.genres,
        tags: row.tags,
        externalSources: row.external_sources,
      })),
      collections: collectionsRes.rows.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        coverUrl: c.cover_url,
        icon: c.icon,
        color: c.color,
        sortMode: c.sort_mode,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        titles: c.titles,
      })),
      bookmarks: bookmarksRes.rows.map((b) => ({
        id: b.id,
        titleId: b.title_id,
        status: b.status,
        progress: b.progress,
        progressUnit: b.progress_unit,
        progressTotal: b.progress_total,
        priority: b.priority,
        personalRating: b.personal_rating ? Number(b.personal_rating) : null,
        notes: b.notes,
        startedAt: b.started_at,
        completedAt: b.completed_at,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
      })),
    };
  }

  /**
   * Export flat CSV of titles with tracking and collections.
   */
  async exportCsv(ownerId: string): Promise<string> {
    const res = await db.query(
      `SELECT
         t.id, t.media_type, t.english_title, t.original_title,
         t.release_year, t.publication_status, t.episode_count, t.chapter_count,
         b.status as bookmark_status, b.progress as bookmark_progress,
         b.progress_unit as bookmark_progress_unit, b.progress_total as bookmark_progress_total,
         b.personal_rating as bookmark_personal_rating,
         COALESCE(string_agg(DISTINCT c.name, '; '), '') as collections
       FROM titles t
       LEFT JOIN bookmarks b ON b.title_id = t.id AND b.owner_id = t.owner_id
       LEFT JOIN title_collections tc ON tc.title_id = t.id
       LEFT JOIN collections c ON c.id = tc.collection_id AND c.owner_id = t.owner_id
       WHERE t.owner_id = $1
       GROUP BY t.id, b.id
       ORDER BY t.created_at ASC`,
      [ownerId]
    );

    const headers = [
      'Title ID',
      'Media Type',
      'English Title',
      'Original Title',
      'Release Year',
      'Status',
      'Episode Count',
      'Chapter Count',
      'Bookmark Status',
      'Progress',
      'Progress Unit',
      'Total Progress',
      'Personal Rating',
      'Collections',
    ];

    const lines: string[] = [headers.map(escapeCsvField).join(',')];

    for (const r of res.rows) {
      lines.push(
        [
          r.id,
          r.media_type,
          r.english_title,
          r.original_title,
          r.release_year,
          r.publication_status,
          r.episode_count,
          r.chapter_count,
          r.bookmark_status || 'untracked',
          r.bookmark_progress ?? '',
          r.bookmark_progress_unit ?? '',
          r.bookmark_progress_total ?? '',
          r.bookmark_personal_rating ? Number(r.bookmark_personal_rating).toFixed(1) : '',
          r.collections,
        ]
          .map(escapeCsvField)
          .join(',')
      );
    }

    return lines.join('\r\n');
  }
}

export const exportService = new ExportService();
