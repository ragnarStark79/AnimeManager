# AnimeManager — REST API Contracts

**Document Version:** 1.0  
**Base Path:** `/api/v1`  
**Status:** Baseline Specification (Phase 00)  
**Implementation State:** Planned / Pending Phase 02 (Core API) & Phase 03 (Importer)  

---

## 1. Response Formats & Error Conventions

All API responses use consistent JSON envelope structures.

### 1.1 Single Item Success Envelope
```json
{
  "data": { ... },
  "meta": {
    "requestId": "req_abc123456",
    "timestamp": "2026-10-14T14:55:00Z"
  }
}
```

### 1.2 Paginated List Success Envelope
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 24,
    "total": 128,
    "totalPages": 6
  },
  "meta": {
    "requestId": "req_abc123456",
    "timestamp": "2026-10-14T14:55:00Z"
  }
}
```

### 1.3 Error Envelope
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The provided payload failed schema validation.",
    "details": [
      {
        "field": "englishTitle",
        "message": "Title cannot be blank."
      }
    ]
  },
  "meta": {
    "requestId": "req_abc123456",
    "timestamp": "2026-10-14T14:55:00Z"
  }
}
```

### 1.4 Standard HTTP Status Codes & Error Codes
| HTTP Status | Error Code | Description |
|---|---|---|
| 200 OK | - | Successful GET, PATCH, or PUT request. |
| 201 Created | - | Resource successfully created. |
| 204 No Content | - | Successful DELETE request. |
| 400 Bad Request | `BAD_REQUEST`, `MALFORMED_INPUT` | Unparseable syntax or invalid parameters. |
| 401 Unauthorized | `UNAUTHORIZED` | Missing or invalid authentication token. |
| 403 Forbidden | `FORBIDDEN` | Caller lacks permission for this resource. |
| 404 Not Found | `NOT_FOUND` | Resource does not exist or is not owned by user. |
| 409 Conflict | `CONFLICT`, `DUPLICATE_RESOURCE` | Resource already exists (e.g. duplicate collection name, duplicate external ID). |
| 422 Unprocessable | `VALIDATION_ERROR` | Schema validation error on payload. |
| 429 Too Many Requests| `RATE_LIMITED` | Exceeded rate limit thresholds. |
| 502 Bad Gateway | `EXTERNAL_PROVIDER_UNAVAILABLE`| Jikan API failed or unreachable. |
| 504 Gateway Timeout | `EXTERNAL_PROVIDER_TIMEOUT` | Jikan API did not respond within timeout window. |
| 500 Server Error | `INTERNAL_ERROR` | Unhandled error; details kept server-side. |

---

## 2. Health & System

### `GET /api/v1/health`
Checks API service health and database connectivity.

- **Authentication:** Public
- **Response 200 OK:**
```json
{
  "data": {
    "status": "healthy",
    "database": "connected",
    "version": "1.0.0",
    "uptime": 12450.5
  },
  "meta": { "requestId": "req_health_1" }
}
```

---

## 3. Titles

### `GET /api/v1/titles`
Query and list titles with filtering, search, and pagination.

- **Query Parameters:**
  - `page` (integer, default: 1)
  - `pageSize` (integer, default: 24, max: 100)
  - `search` (string, optional, searches english_title, original_title, aliases)
  - `mediaType` (enum: `anime` | `manga` | `manhwa`, optional)
  - `collectionId` (UUID, optional)
  - `bookmarkStatus` (enum: `plan_to_consume` | `consuming` | `completed` | `on_hold` | `dropped`, optional)
  - `sortBy` (enum: `title` | `createdAt` | `updatedAt` | `releaseYear` | `personalRating`, default: `updatedAt`)
  - `sortOrder` (enum: `asc` | `desc`, default: `desc`)

- **Response 200 OK:** Paginated list of Title summary objects.

### `POST /api/v1/titles`
Create a title manually.

- **Request Body:**
```json
{
  "mediaType": "anime",
  "englishTitle": "Frieren: Beyond Journey's End",
  "originalTitle": "葬送のフリーレン",
  "aliases": [
    { "title": "Sousou no Frieren", "aliasType": "romanized", "languageCode": "ja" }
  ],
  "synopsis": "An elf mage examines the passage of time...",
  "background": "Based on the award-winning manga.",
  "coverUrl": "https://example.com/cover.jpg",
  "coverSourceType": "url",
  "releaseYear": 2023,
  "publicationStatus": "Finished Airing",
  "startDate": "2023-09-29",
  "endDate": "2024-03-22",
  "episodeCount": 28,
  "chapterCount": null,
  "genres": ["Adventure", "Drama", "Fantasy"],
  "tags": ["Elves", "Magic", "Melancholy"]
}
```
- **Response 201 Created:** Full created Title object with generated UUID.

### `GET /api/v1/titles/:id`
Retrieve full title details including aliases, genres, tags, collection memberships, external source mappings, and attached bookmark (if one exists).

- **Response 200 OK:** Full Title detail object.
- **Response 404 Not Found:** Title ID not found.

### `PATCH /api/v1/titles/:id`
Partially update title metadata.

- **Request Body:** Any subset of mutable title fields.
- **Response 200 OK:** Updated Title object.

### `DELETE /api/v1/titles/:id`
Permanently delete title and its relationships (aliases, tags, collection memberships, bookmark, external sources) via database cascade.

- **Response 204 No Content.**

---

## 4. Collections (My List)

### `GET /api/v1/collections`
List all user collections with title count summaries.

- **Response 200 OK:**
```json
{
  "data": [
    {
      "id": "c1a9c148-1122-4a5c-9c3a-86714db254cb",
      "name": "Masterpieces",
      "description": "Top-tier favorites with immaculate storytelling",
      "coverUrl": "https://...",
      "icon": "star",
      "color": "#38bdf8",
      "sortMode": "custom",
      "titleCount": 14,
      "createdAt": "2026-10-14T10:00:00Z",
      "updatedAt": "2026-10-14T10:00:00Z"
    }
  ],
  "meta": { "requestId": "req_col_list" }
}
```

### `POST /api/v1/collections`
Create a new collection.

- **Request Body:**
```json
{
  "name": "Chill Fantasy",
  "description": "Slow life and comforting atmosphere",
  "icon": "coffee",
  "color": "#38bdf8",
  "sortMode": "date_added"
}
```
- **Validation:** `name` must be non-empty, trimmed, and case-insensitively unique for the owner.
- **Response 201 Created:** Collection object.
- **Response 409 Conflict:** Collection with identical name already exists.

### `GET /api/v1/collections/:id`
Retrieve collection metadata and list of titles in the collection.

### `PATCH /api/v1/collections/:id`
Update collection metadata (name, description, color, sortMode).

### `DELETE /api/v1/collections/:id`
Delete collection.
*Note: Title records are never deleted when a collection is removed; only the link in `title_collections` is removed.*

### `POST /api/v1/collections/:id/titles`
Add one or more titles to a collection.

- **Request Body:**
```json
{
  "titleIds": ["550e8400-e29b-41d4-a716-446655440000"]
}
```
- **Response 200 OK:** Updated collection membership count.

### `DELETE /api/v1/collections/:id/titles/:titleId`
Remove a single title from a collection.

- **Response 204 No Content.**

### `PATCH /api/v1/collections/:id/order`
Update custom display order of titles in a collection.

- **Request Body:**
```json
{
  "order": [
    { "titleId": "550e8400-e29b-41d4-a716-446655440000", "position": 1 },
    { "titleId": "770e8400-e29b-41d4-a716-446655440001", "position": 2 }
  ]
}
```
- **Response 200 OK.**

---

## 5. Bookmarks (Tracking)

### `GET /api/v1/bookmarks`
List tracking bookmarks with status and media type filters.

- **Query Parameters:**
  - `status` (`plan_to_consume`, `consuming`, `completed`, `on_hold`, `dropped`)
  - `mediaType` (`anime`, `manga`, `manhwa`)
  - `page`, `pageSize`, `sortBy`, `sortOrder`

- **Response 200 OK:** Paginated list of bookmarks joined with core title data (title, cover, counts).

### `POST /api/v1/bookmarks`
Create a bookmark for a title.

- **Request Body:**
```json
{
  "titleId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "consuming",
  "progress": 12,
  "progressUnit": "episode",
  "progressTotal": 28,
  "priority": 4,
  "personalRating": 9.5,
  "notes": "Incredible animation in episode 9.",
  "startedAt": "2026-10-01"
}
```
- **Validation Rules:**
  - `progress >= 0`.
  - `personalRating` between `0.0` and `10.0`.
  - Only one bookmark per `(owner_id, title_id)`.
- **Response 201 Created.**
- **Response 409 Conflict:** Bookmark already exists for this title.

### `PATCH /api/v1/bookmarks/:id`
Update tracking progress, status, rating, or notes.

- **Request Body:** Subset of mutable bookmark fields.
- **Response 200 OK.**

### `DELETE /api/v1/bookmarks/:id`
Delete bookmark tracking record.
*Note: The underlying title record is preserved.*

- **Response 204 No Content.**

### `PUT /api/v1/titles/:titleId/bookmark`
Convenience endpoint to upsert (create or update) the bookmark associated with a title.

- **Response 200 OK.**

---

## 6. Jikan Import & Metadata Normalization

### `GET /api/v1/import/jikan/search`
Search MyAnimeList via Jikan API.

- **Query Parameters:**
  - `q` (string, required, min length 3)
  - `type` (`anime` | `manga`, required)
  - `page` (integer, default: 1)

- **Response 200 OK:** List of candidate search results with MAL ID, titles, image URLs, synopsis snippet, score, and publication details.

### `GET /api/v1/import/preview`
Parse a MyAnimeList URL or ID and return an editable normalized preview draft.

- **Query Parameters:**
  - `url` (string, optional: e.g. `https://myanimelist.net/anime/52991/Sousou_no_Frieren`)
  - `id` (integer, optional)
  - `type` (`anime` | `manga`, optional if URL is provided)

- **Safety:** Backend validates that the URL matches strict allowlist regex: `^https:\/\/myanimelist\.net\/(anime|manga)\/(\d+)`. Arbitrary hostnames return `400 BAD_REQUEST`.
- **Response 200 OK:**
```json
{
  "data": {
    "provider": "myanimelist",
    "externalId": "52991",
    "sourceUrl": "https://myanimelist.net/anime/52991/Sousou_no_Frieren",
    "mediaType": "anime",
    "englishTitle": "Frieren: Beyond Journey's End",
    "originalTitle": "葬送のフリーレン",
    "aliases": [
      { "title": "Sousou no Frieren", "languageCode": "ja", "type": "romanized" }
    ],
    "synopsis": "During their decade-long quest...",
    "background": "Sousou no Frieren was released on Blu-ray...",
    "coverUrl": "https://cdn.myanimelist.net/images/anime/1015/138006l.jpg",
    "releaseYear": 2023,
    "publicationStatus": "Finished Airing",
    "episodeCount": 28,
    "chapterCount": null,
    "sourceScore": 9.38,
    "sourceRank": 1,
    "sourcePopularity": 234,
    "genres": ["Adventure", "Drama", "Fantasy"],
    "studios": ["Madhouse"],
    "sourceRetrievedAt": "2026-10-14T14:50:00Z",
    "warnings": [],
    "duplicateExistingTitleId": null
  },
  "meta": { "requestId": "req_preview_1" }
}
```

### `POST /api/v1/import/commit`
Accept user-reviewed and edited metadata fields to create local Title and external source mappings.

- **Request Body:**
```json
{
  "draft": { ... },
  "selectedFields": {
    "englishTitle": true,
    "originalTitle": true,
    "synopsis": true,
    "background": false,
    "coverUrl": true,
    "genres": true
  },
  "overrides": {
    "englishTitle": "Frieren: Beyond Journey's End"
  },
  "initialBookmark": {
    "status": "plan_to_consume"
  },
  "collectionIds": ["c1a9c148-1122-4a5c-9c3a-86714db254cb"]
}
```
- **Response 201 Created:** Saved Title object with ID.

---

## 7. Cover Image Uploads

### `POST /api/v1/uploads/covers`
Upload custom cover image.

- **Content-Type:** `multipart/form-data`
- **File Constraints:**
  - Max size: 5 MB
  - Allowed types: `image/jpeg`, `image/png`, `image/webp`
- **Response 201 Created:**
```json
{
  "data": {
    "storagePath": "covers/user_1/550e8400_abc.webp",
    "publicUrl": "https://supabase-storage.../covers/user_1/550e8400_abc.webp"
  },
  "meta": { "requestId": "req_upload_1" }
}
```

---

## 8. Data Export & Backup

### `GET /api/v1/export/json`
Full relational JSON backup including all titles, aliases, collections, memberships, bookmarks, genres, tags, and source mappings.

- **Content-Type:** `application/json`
- **Content-Disposition:** `attachment; filename="animemanager_backup_YYYY-MM-DD.json"`

### `GET /api/v1/export/csv`
Flat tabular export of titles with bookmark status, progress, and collection names.

- **Content-Type:** `text/csv`
- **Content-Disposition:** `attachment; filename="animemanager_titles_YYYY-MM-DD.csv"`
