import { z } from 'zod';
import {
  MEDIA_TYPES,
  BOOKMARK_STATUSES,
  PROGRESS_UNITS,
  COVER_SOURCE_TYPES,
  COLLECTION_SORT_MODES,
} from '../constants/index.js';

export const mediaTypeSchema = z.enum(MEDIA_TYPES);
export const bookmarkStatusSchema = z.enum(BOOKMARK_STATUSES);
export const progressUnitSchema = z.enum(PROGRESS_UNITS);
export const coverSourceTypeSchema = z.enum(COVER_SOURCE_TYPES);
export const collectionSortModeSchema = z.enum(COLLECTION_SORT_MODES);

export const titleAliasSchema = z.object({
  title: z.string().trim().min(1, 'Alias title cannot be empty'),
  languageCode: z.string().trim().max(10).optional().nullable(),
  aliasType: z.enum(['native', 'romanized', 'translated', 'other']).optional().nullable(),
});

export const titleCreateSchema = z.object({
  mediaType: mediaTypeSchema,
  englishTitle: z.string().trim().min(1, 'English display title is required'),
  originalTitle: z.string().trim().optional().nullable(),
  aliases: z.array(titleAliasSchema).optional().default([]),
  synopsis: z.string().trim().optional().nullable(),
  background: z.string().trim().optional().nullable(),
  coverUrl: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
  coverStoragePath: z.string().trim().optional().nullable(),
  coverSourceType: coverSourceTypeSchema.optional().default('none'),
  releaseYear: z.number().int().min(1900).max(2100).optional().nullable(),
  publicationStatus: z.string().trim().optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().nullable(),
  episodeCount: z.number().int().min(0, 'Episode count cannot be negative').optional().nullable(),
  chapterCount: z.number().int().min(0, 'Chapter count cannot be negative').optional().nullable(),
  sourceScore: z.number().min(0).max(10).optional().nullable(),
  sourceRank: z.number().int().min(1).optional().nullable(),
  sourcePopularity: z.number().int().min(1).optional().nullable(),
  genres: z.array(z.string().trim().min(1)).optional().default([]),
  tags: z.array(z.string().trim().min(1)).optional().default([]),
});

export const titleUpdateSchema = titleCreateSchema.partial();

export const collectionCreateSchema = z.object({
  name: z.string().trim().min(1, 'Collection name is required').max(100, 'Collection name too long'),
  description: z.string().trim().max(1000).optional().nullable(),
  coverUrl: z.string().url().optional().nullable().or(z.literal('')),
  icon: z.string().trim().max(50).optional().nullable(),
  color: z.string().trim().max(50).optional().nullable(),
  sortMode: collectionSortModeSchema.optional().default('date_added'),
});

export const collectionUpdateSchema = collectionCreateSchema.partial();

export const bookmarkCreateSchema = z.object({
  titleId: z.string().uuid('Invalid Title UUID'),
  status: bookmarkStatusSchema,
  progress: z.number().int().min(0, 'Progress cannot be negative').default(0),
  progressUnit: progressUnitSchema.default('episode'),
  progressTotal: z.number().int().min(0, 'Total progress cannot be negative').optional().nullable(),
  priority: z.number().int().min(1).max(5, 'Priority must be between 1 and 5').optional().nullable(),
  personalRating: z.number().min(0).max(10, 'Personal rating must be between 0 and 10').optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  startedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().nullable(),
  completedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().nullable(),
});

export const bookmarkUpdateSchema = bookmarkCreateSchema.omit({ titleId: true }).partial();
