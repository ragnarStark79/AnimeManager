import { db } from './db.js';
import type { CollectionCreateInput, CollectionUpdateInput } from '@animemanager/shared';
import { NotFoundError, ForbiddenError } from '../errors/index.js';

export interface CollectionSummary {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  icon: string | null;
  color: string | null;
  sortMode: string;
  titleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionDetail extends CollectionSummary {
  titles: Array<{
    id: string;
    englishTitle: string;
    originalTitle: string | null;
    mediaType: string;
    coverUrl: string | null;
    position: number | null;
    addedAt: string;
  }>;
}

export const collectionsRepository = {
  async list(ownerId: string): Promise<CollectionSummary[]> {
    const sql = `
      SELECT
        c.id, c.owner_id as "ownerId", c.name, c.description,
        c.cover_url as "coverUrl", c.icon, c.color, c.sort_mode as "sortMode",
        c.created_at as "createdAt", c.updated_at as "updatedAt",
        count(tc.title_id)::int as "titleCount"
      FROM collections c
      LEFT JOIN title_collections tc ON tc.collection_id = c.id
      WHERE c.owner_id = $1
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `;
    const res = await db.query<CollectionSummary>(sql, [ownerId]);
    return res.rows;
  },

  async findById(ownerId: string, collectionId: string): Promise<CollectionDetail | null> {
    const colSql = `
      SELECT
        c.id, c.owner_id as "ownerId", c.name, c.description,
        c.cover_url as "coverUrl", c.icon, c.color, c.sort_mode as "sortMode",
        c.created_at as "createdAt", c.updated_at as "updatedAt",
        count(tc.title_id)::int as "titleCount"
      FROM collections c
      LEFT JOIN title_collections tc ON tc.collection_id = c.id
      WHERE c.id = $1 AND c.owner_id = $2
      GROUP BY c.id
    `;
    const colRes = await db.query<CollectionSummary>(colSql, [collectionId, ownerId]);

    if (colRes.rows.length === 0) {
      return null;
    }

    const c = colRes.rows[0];

    const titlesSql = `
      SELECT
        t.id, t.english_title as "englishTitle", t.original_title as "originalTitle",
        t.media_type as "mediaType", t.cover_url as "coverUrl",
        tc.position, tc.added_at as "addedAt"
      FROM title_collections tc
      JOIN titles t ON t.id = tc.title_id
      WHERE tc.collection_id = $1 AND t.owner_id = $2
      ORDER BY COALESCE(tc.position, 999999) ASC, tc.added_at ASC
    `;
    const titlesRes = await db.query<{
      id: string;
      englishTitle: string;
      originalTitle: string | null;
      mediaType: string;
      coverUrl: string | null;
      position: number | null;
      addedAt: string;
    }>(titlesSql, [collectionId, ownerId]);

    return {
      ...c,
      titles: titlesRes.rows,
    };
  },

  async create(ownerId: string, data: CollectionCreateInput): Promise<CollectionSummary> {
    const sql = `
      INSERT INTO collections (owner_id, name, description, cover_url, icon, color, sort_mode)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id, owner_id as "ownerId", name, description,
        cover_url as "coverUrl", icon, color, sort_mode as "sortMode",
        created_at as "createdAt", updated_at as "updatedAt",
        0 as "titleCount"
    `;
    const res = await db.query<CollectionSummary>(sql, [
      ownerId,
      data.name.trim(),
      data.description || null,
      data.coverUrl || null,
      data.icon || null,
      data.color || null,
      data.sortMode || 'date_added',
    ]);
    return res.rows[0];
  },

  async update(ownerId: string, collectionId: string, data: CollectionUpdateInput): Promise<CollectionSummary | null> {
    const updates: string[] = [];
    const params: unknown[] = [collectionId, ownerId];
    let pIdx = 3;

    if (data.name !== undefined) {
      updates.push(`name = $${pIdx++}`);
      params.push(data.name.trim());
    }
    if (data.description !== undefined) {
      updates.push(`description = $${pIdx++}`);
      params.push(data.description || null);
    }
    if (data.coverUrl !== undefined) {
      updates.push(`cover_url = $${pIdx++}`);
      params.push(data.coverUrl || null);
    }
    if (data.icon !== undefined) {
      updates.push(`icon = $${pIdx++}`);
      params.push(data.icon || null);
    }
    if (data.color !== undefined) {
      updates.push(`color = $${pIdx++}`);
      params.push(data.color || null);
    }
    if (data.sortMode !== undefined) {
      updates.push(`sort_mode = $${pIdx++}`);
      params.push(data.sortMode);
    }

    if (updates.length === 0) {
      return collectionsRepository.findById(ownerId, collectionId);
    }

    const sql = `
      UPDATE collections
      SET ${updates.join(', ')}
      WHERE id = $1 AND owner_id = $2
      RETURNING id
    `;
    const res = await db.query(sql, params);
    if (res.rows.length === 0) {
      return null;
    }

    return collectionsRepository.findById(ownerId, collectionId);
  },

  async delete(ownerId: string, collectionId: string): Promise<boolean> {
    const res = await db.query(
      `DELETE FROM collections WHERE id = $1 AND owner_id = $2`,
      [collectionId, ownerId]
    );
    return (res.rowCount ?? 0) > 0;
  },

  async addTitles(ownerId: string, collectionId: string, titleIds: string[]): Promise<void> {
    // 1. Verify caller owns collection
    const colCheck = await db.query(
      `SELECT id FROM collections WHERE id = $1 AND owner_id = $2`,
      [collectionId, ownerId]
    );
    if (colCheck.rows.length === 0) {
      throw new NotFoundError('Collection not found');
    }

    // 2. Verify caller owns every title being added (prevents cross-owner manipulation!)
    const titleCheck = await db.query<{ id: string }>(
      `SELECT id FROM titles WHERE id = ANY($1::uuid[]) AND owner_id = $2`,
      [titleIds, ownerId]
    );
    if (titleCheck.rows.length !== titleIds.length) {
      throw new ForbiddenError('One or more titles do not belong to you or do not exist');
    }

    // 3. Insert into title_collections
    for (const titleId of titleIds) {
      await db.query(
        `INSERT INTO title_collections (title_id, collection_id)
         VALUES ($1, $2)
         ON CONFLICT (title_id, collection_id) DO NOTHING`,
        [titleId, collectionId]
      );
    }
  },

  async removeTitle(ownerId: string, collectionId: string, titleId: string): Promise<boolean> {
    // 1. Verify caller owns collection
    const colCheck = await db.query(
      `SELECT id FROM collections WHERE id = $1 AND owner_id = $2`,
      [collectionId, ownerId]
    );
    if (colCheck.rows.length === 0) {
      throw new NotFoundError('Collection not found');
    }

    // 2. Delete membership link (Title itself is NOT deleted)
    const res = await db.query(
      `DELETE FROM title_collections WHERE collection_id = $1 AND title_id = $2`,
      [collectionId, titleId]
    );
    return (res.rowCount ?? 0) > 0;
  },

  async reorderTitles(
    ownerId: string,
    collectionId: string,
    order: Array<{ titleId: string; position: number }>
  ): Promise<void> {
    // Verify collection ownership
    const colCheck = await db.query(
      `SELECT id FROM collections WHERE id = $1 AND owner_id = $2`,
      [collectionId, ownerId]
    );
    if (colCheck.rows.length === 0) {
      throw new NotFoundError('Collection not found');
    }

    for (const item of order) {
      await db.query(
        `UPDATE title_collections
         SET position = $1
         WHERE collection_id = $2 AND title_id = $3`,
        [item.position, collectionId, item.titleId]
      );
    }
  },
};
