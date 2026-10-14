import { MEDIA_TYPES, BOOKMARK_STATUSES } from '@animemanager/shared';

export function getApiMetadata() {
  return {
    name: 'AnimeManager API',
    supportedMediaTypes: MEDIA_TYPES,
    supportedBookmarkStatuses: BOOKMARK_STATUSES,
    phase: 'Phase 01 - Foundation',
  };
}
