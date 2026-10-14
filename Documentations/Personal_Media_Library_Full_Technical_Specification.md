# Personal Media Library — Full Technical Specification


# Document control

**Project name:** Personal Media Library  
**Document type:** Product requirements, technical architecture, implementation plan, QA plan, deployment guide, and AI coding-agent execution specification  
**Version:** 1.0  
**Status:** Baseline specification for implementation  
**Primary use:** Give this document to an AI coding agent (Antigravity) as the source of truth for building a working website.

This specification is deliberately implementation-oriented. It defines what to build, how the parts connect, how to validate the result, and what evidence must exist before considering a phase complete. If a detail is not explicitly decided, use the defaults in this document, document the assumption, and avoid blocking on low-impact questions.

**Important implementation rule:** Build a working application, not only a mockup. Do not mark a feature complete merely because a screen exists. A feature is complete only when its UI, API, persistence, validation, failure states, and tests work together.


# 1. Executive summary

Build a private-first personal catalog for anime, manga, and manhwa. The product addresses the limitations of a conventional tracking list by separating **Bookmarks** (watch/read status and progress) from **My List** (user-created collections).

The user can create and edit titles manually or import available metadata from MyAnimeList through Jikan. Every imported record must be reviewed before it is saved. The app stores its own normalized copy of selected metadata in Supabase PostgreSQL, so the library remains usable when Jikan is unavailable.

The visual direction is a modern glassmorphism interface inspired by the supplied Flix.id reference: cool blue/gray atmosphere, translucent frosted surfaces, subtle borders, soft shadows, rounded cards, rich cover artwork, clear typography, and restrained use of blur. The interface must remain legible, responsive, accessible, and fast; glass effects must never compromise usability.

The first release is single-user/personal-first. It does not need public profiles, community reviews, social feeds, recommendation algorithms, or multi-user collaboration. The architecture should not prevent adding authentication or multiple users later.


# 2. Product goals and non-goals

### Goals
1. Provide a fast, attractive personal library for anime, manga, and manhwa.
2. Let the user create unlimited named collections such as Romance, Murim, Thriller, Favorites, Re-read, or Hidden Gems.
3. Let a title belong to multiple collections without duplicating the title record.
4. Keep tracking status and progress separate from collection membership.
5. Support manual title creation and editing even when external metadata services fail.
6. Import available metadata from a supported MyAnimeList URL, MAL ID, or search result through Jikan.
7. Allow the user to inspect, edit, and selectively accept imported fields before saving.
8. Support both external image URLs and uploaded cover images.
9. Persist data safely, provide useful errors, and offer export/backup.
10. Deploy the frontend on Vercel and use Supabase for database/storage; deploy the API using a compatible Node.js hosting model.

### Non-goals for version 1
- Public social network, profiles, comments, or user-to-user sharing.
- Community review ingestion or review hosting.
- Automated recommendation engine.
- Automatic sync/write-back to MyAnimeList.
- Full-text indexing of every external MAL page.
- Scraping arbitrary sites without checking their terms or technical restrictions.
- Guaranteed coverage of every manhwa entry in Jikan.
- Mobile native application.
- Complex multi-tenant billing or subscriptions.


# 3. Terminology and core concepts

- **Title:** A single anime, manga, or manhwa work stored in the local database.
- **Bookmark:** A user's tracking record for a title: status, progress, priority, personal rating, notes, and dates.
- **Collection:** A user-created folder/list that can contain many titles.
- **Collection membership:** The many-to-many link between a title and a collection.
- **Genre:** A standardized descriptive category, usually imported from a source or selected manually.
- **Tag:** A flexible user-defined or imported label. Tags and genres are not the same as collections.
- **Alias:** An alternate, native-language, romanized, or translated title.
- **External source:** A provider such as MyAnimeList/Jikan, including provider ID and source URL.
- **Metadata import:** Retrieving external metadata, normalizing it, previewing it, then saving selected fields locally.
- **Cover source:** Either an external URL or an uploaded object stored in Supabase Storage.
- **Personal rating:** The user's own score, distinct from a community score imported from a source.


# 4. Product navigation and information architecture

The primary navigation has only two prominent sections:
1. **My List** — collections and collection browsing.
2. **Bookmarks** — status-oriented tracking list.

Global actions available in the app shell:
- Search.
- Add title.
- Create collection.
- Theme preference (dark by default; light mode optional).
- Settings / data export.
- Optional profile/account affordance if authentication is enabled.

Suggested routes:
- `/` — dashboard / library overview.
- `/my-list` — collections index.
- `/collections/:collectionId` — titles in a collection.
- `/bookmarks` — tracking list with status filters.
- `/titles/new` — choose import or manual creation.
- `/titles/import` — source URL / MAL ID / search importer.
- `/titles/:titleId` — title detail.
- `/titles/:titleId/edit` — edit title.
- `/settings` — preferences, export, health information.
- `/login` — only if authentication is enabled.

The dashboard is not a third primary list category; it is a convenient overview with recently added titles, recently updated bookmarks, collection shortcuts, and quick actions.

Do not overload the interface with permanent navigation items. On small screens, collapse navigation into a compact menu or bottom navigation while preserving the two main destinations.


# 5. Visual design system

### 5.1 Art direction
Use the user's supplied Flix.id image as the primary visual reference. Translate the spirit, not the exact brand or assets: a cool blue/gray blurred backdrop, translucent panels, compact pill navigation, horizontal feature areas, rounded poster cards, and carefully spaced typography.

### 5.2 Design tokens
Start with CSS custom properties and centralize tokens. Exact values may be tuned during implementation, but avoid scattered one-off values.

- Background base: deep blue-gray for dark theme; pale blue-gray for light theme.
- Glass surface: semi-transparent neutral/blue surface with backdrop blur.
- Glass border: low-opacity white/blue-gray border.
- Text primary: high-contrast near-white in dark mode; deep blue-gray in light mode.
- Text secondary: muted but still readable.
- Accent: cool blue/cyan used sparingly for selected states and primary actions.
- Status colors: distinct but not the only way status is communicated; pair colors with text/icons.
- Radius scale: small controls, medium cards, large panels.
- Spacing scale: consistent 4/8-point rhythm.
- Shadow: soft ambient shadows; no harsh black outlines.
- Typography: modern sans-serif; use a system font stack or a dependable web font with fallbacks.

### 5.3 Glassmorphism rules
- Use `backdrop-filter: blur(...)` only on key surfaces, not every nested element.
- Include translucent background fallbacks for browsers without backdrop-filter.
- Keep text contrast sufficient over every background state.
- Avoid placing small text over visually busy artwork without a solid or sufficiently opaque backing.
- Use a subtle border to define panel edges.
- Do not make controls indistinguishable from decorative surfaces.
- Respect `prefers-reduced-motion`.
- Do not use blur animations that create motion discomfort.
- Use opaque/high-contrast surfaces for dialogs and forms when readability requires it.

### 5.4 Poster cards
Each card can display:
- Cover artwork (fixed aspect ratio, object-fit: cover).
- Title (English display title first).
- Media-type indicator.
- Optional personal rating.
- Optional bookmark status/progress.
- Overflow menu for edit, remove from collection, or delete (delete requires confirmation).

Use skeleton placeholders during loading, a graceful fallback when no cover exists, and a clear broken-image fallback. Do not allow a missing image to collapse card layout.

### 5.5 Responsive behavior
- Mobile: single/two-column poster grid depending on width; controls wrap; dialogs become full-height sheets when needed.
- Tablet: two/three/four-column grids depending on available width.
- Desktop: wider grids, compact sidebar or top navigation, and multi-column detail layout.
- Avoid hard-coded fixed widths that overflow.
- Test at approximately 360 px, 768 px, 1024 px, and 1440 px viewport widths.

### 5.6 Accessibility
- Use semantic landmarks and heading hierarchy.
- All interactive controls must be keyboard reachable and have accessible names.
- Provide visible focus indicators.
- Do not rely on color alone.
- Use sufficient contrast for text over glass.
- Add alt text for covers when useful; otherwise treat decorative imagery appropriately.
- Ensure dialogs trap focus, close predictably, and return focus to the trigger.
- Support reduced motion.


# 6. User journeys and acceptance criteria

### Journey A: Create a collection
1. User opens My List.
2. User selects Create Collection.
3. User enters a required name, optional description, cover/color/icon, and optional sort mode.
4. The form validates name and length.
5. The collection is saved to PostgreSQL.
6. It appears immediately in the collection index.
7. Refreshing the page preserves it.

Acceptance criteria:
- Duplicate collection names are either allowed or rejected according to a documented product choice; default: allow similar names but trim whitespace and prevent exact duplicate names for the same owner, case-insensitively.
- Empty names are rejected.
- Errors are displayed near the relevant control.
- Collection deletion explains that title records are not deleted; only membership links are removed.

### Journey B: Add a title manually
1. User chooses Add Title → Manual Entry.
2. User selects Anime, Manga, or Manhwa.
3. User enters English title and optionally original title, aliases, synopsis, metadata, cover URL/upload, genres, tags, and external source details.
4. User saves.
5. The title detail page opens.
6. The user may optionally add it to a bookmark and/or collections.

Acceptance criteria:
- English title is the preferred display title; if absent only in legacy/import edge cases, fall back to original title.
- Media type is required.
- A title can be saved with minimal required fields even when all external metadata is absent.
- URL and upload cover modes are mutually exclusive for the primary cover.
- Saving a title does not silently create a bookmark unless the user explicitly asks to do so.

### Journey C: Import from MyAnimeList
1. User pastes a MAL anime/manga URL, enters a MAL ID, or searches by title.
2. Backend validates and identifies supported input.
3. Backend retrieves Jikan data.
4. The UI displays an editable preview with field-level provenance and missing-field indicators.
5. User chooses which fields to import and can edit values.
6. User confirms save.
7. Backend checks duplicates using provider + external ID.
8. A local title record and selected related records are saved in a transaction where practical.
9. User can then add a bookmark and collections.

Acceptance criteria:
- Import preview is not equivalent to saving.
- Duplicate import leads to a clear option to open/update the existing record, not create a duplicate silently.
- API failure leaves the form usable for manual entry.
- Imported score/rank are source metadata and never overwrite personal rating.
- The UI identifies imported fields as source-provided where useful.
- Only supported, permitted source data is retrieved and stored.

### Journey D: Bookmark tracking
1. User adds a bookmark from a title card or title detail.
2. User selects status and optional priority, progress, target, personal rating, and notes.
3. Updates persist.
4. Bookmark list can filter by status and media type.

Acceptance criteria:
- Progress is non-negative.
- If a total is known, progress cannot exceed total without explicit product policy; default: validate and show a correction prompt.
- Episode progress is used for anime; chapter progress for manga/manhwa.
- Status changes do not change collection membership.
- Removing a bookmark does not delete the title.

### Journey E: Add title to collections
1. User opens a title or card action.
2. User chooses one or more collections.
3. Memberships are saved.
4. The title appears in every selected collection.
5. Removing from one collection does not affect other memberships or bookmark state.

Acceptance criteria:
- No duplicate membership for the same title/collection pair.
- Deleting a collection removes its memberships, not the title itself.


# 7. Functional requirements

### FR-01: Title catalog
Create, read, update, and delete local title records. Use soft deletion only if implemented consistently; otherwise use explicit confirmation for permanent deletion and provide export/backup first.

### FR-02: Media type
Required enum: `anime`, `manga`, `manhwa`. Keep media type independent from external source category because source taxonomies can differ.

### FR-03: Titles and aliases
Store English/display title, original title, and zero or more aliases with optional language and alias type (native, romanized, translated, other). Search across all aliases.

### FR-04: Cover images
Support direct image URL and uploaded image. Validate file type and size; use generated storage paths, not user-controlled storage keys. Provide fallback image.

### FR-05: Synopsis and metadata
Support synopsis, optional background, genres, tags, author, artist, studio, source publication details, status, start/end dates, season/year, episode/chapter totals, and external links. All fields beyond media type and display title should be optional.

### FR-06: Collections
Create/edit/delete collections. Each has name, optional description, cover, icon/color, sort mode, created/updated timestamps. Titles can belong to many collections.

### FR-07: Bookmarks
One bookmark per title per owner. Fields: status, progress value, progress unit, optional total, priority, personal rating, private notes, started/completed dates, created/updated timestamps.

Bookmark statuses: `plan_to_consume`, `consuming`, `completed`, `on_hold`, `dropped`. UI labels can be “Plan to Watch/Read”, “Watching/Reading”, “Completed”, “On Hold”, and “Dropped” depending on media type.

### FR-08: Search and filtering
Search local titles by English title, original title, aliases, and optionally synopsis. Filter by media type, genres, tags, bookmark status, collection, and personal rating. Provide sorting by title, date added, date updated, rating, and custom collection order.

### FR-09: Importer
Support MAL URL parsing, MAL ID input, Jikan title search, anime detail, manga detail, and optional detail expansion for characters/staff/statistics where endpoints support it. Use adapters so providers can be added later without rewriting UI.

### FR-10: Metadata preview
Show normalized data before saving. Allow selection/editing of importable fields. Keep provenance/source ID and retrieval timestamp.

### FR-11: Export
Provide JSON export for a complete restorable backup and CSV export for basic title/bookmark/collection data. Include image URLs/storage paths and external IDs. Explain that exported CSV may not preserve every relationship as cleanly as JSON.

### FR-12: Settings
Provide theme preference, export action, app/API health indicator where safe, and optional data maintenance actions. Never expose secrets in the browser.


# 8. Recommended technology stack

### Frontend
- React with Vite.
- TypeScript strongly recommended, even if the initial preference was JavaScript. TypeScript reduces errors across title types, API responses, status enums, and importer mappings. If the user explicitly requires JavaScript, keep runtime validation and JSDoc types.
- React Router for routes.
- Tailwind CSS plus a small set of reusable components and CSS variables for glass effects.
- TanStack Query (or equivalent) for server-state fetching, caching, loading/error states, and invalidation.
- React Hook Form plus Zod (or equivalent) for form state and validation.
- A lightweight icon set such as Lucide.
- Vitest and React Testing Library for component/unit tests.
- Playwright for end-to-end tests.

### Backend
- Node.js current LTS.
- Express with TypeScript if TypeScript is used end-to-end.
- Zod or equivalent for request validation.
- Supabase JavaScript client for database/storage interactions.
- Centralized error middleware and structured logging.
- Rate limiting on import/search endpoints.
- A bounded HTTP client with timeouts for Jikan requests.

### Data and hosting
- Supabase PostgreSQL.
- Supabase Storage for uploaded covers.
- Supabase Auth only if actual login/multi-device access is needed; personal-only local deployment still requires a deliberate access model.
- Vercel for frontend.
- API can be Express on a compatible Node host or adapted to Vercel Functions. Decide based on function timeout, request size, and hosting limits before implementing long-running jobs.
- GitHub for version control and CI.

### Why PostgreSQL
The data is relational: title-to-collection is many-to-many, a title has many aliases/genres/tags/source identifiers, and bookmark state is separate. PostgreSQL constraints and transactions help preserve consistency. Supabase also bundles useful database and storage services.

### Dependency policy
Use stable compatible releases at implementation time. Do not blindly install latest prereleases. Pin dependencies with a lockfile and record runtime/tool versions in README.


# 9. Repository structure

Suggested monorepo:

```text
personal-media-library/
  apps/
    web/
      src/
        app/
        components/
          layout/
          media/
          collections/
          bookmarks/
          forms/
          import/
          ui/
        features/
          titles/
          collections/
          bookmarks/
          search/
          settings/
        routes/
        hooks/
        lib/
        styles/
        test/
      public/
      package.json
      vite.config.ts
    api/
      src/
        app.ts
        server.ts
        config/
        routes/
        controllers/
        services/
          titles/
          collections/
          bookmarks/
          import/
            providers/
              jikan/
            normalization/
        repositories/
        middleware/
        schemas/
        errors/
        utils/
        test/
      package.json
  packages/
    shared/
      src/
        schemas/
        types/
        constants/
      package.json
  supabase/
    migrations/
    seed.sql
    config.toml
  docs/
    architecture.md
    api-contracts.md
    testing.md
  .env.example
  .gitignore
  package.json
  README.md
```

The exact structure can be simplified if the coding environment works better with one app, but maintain separation between UI, API routes, business services, provider adapters, and database access. Do not put all logic into a single component or one giant route file.


# 10. Database schema

Use UUID primary keys for local records. Include timestamps consistently. Add an `owner_id` if Supabase Auth is enabled or expected. For a strict single-user deployment, define how ownership and authorization work rather than leaving tables accidentally public.

### 10.1 `titles`
- `id uuid primary key`
- `owner_id uuid nullable/referenced to auth.users` (required for multi-user)
- `media_type text check in ('anime','manga','manhwa') not null`
- `english_title text not null`
- `original_title text nullable`
- `synopsis text nullable`
- `background text nullable`
- `cover_url text nullable`
- `cover_storage_path text nullable`
- `cover_source_type text check in ('url','upload','provider','none')`
- `release_year integer nullable`
- `publication_status text nullable`
- `start_date date nullable`
- `end_date date nullable`
- `episode_count integer nullable`
- `chapter_count integer nullable`
- `source_score numeric nullable`
- `source_rank integer nullable`
- `source_popularity integer nullable`
- `personal_rating numeric nullable` (prefer bookmark table if rating is strictly tracking-specific; choose one canonical location)
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz nullable` only if implementing soft deletion.

Do not store all source response JSON indiscriminately. If retaining raw snapshots is useful for debugging, store a carefully scoped JSONB payload with size limits, access controls, and retention policy.

### 10.2 `title_aliases`
- `id uuid primary key`
- `title_id uuid references titles(id) on delete cascade`
- `alias text not null`
- `language_code text nullable`
- `alias_type text nullable`
- `created_at timestamptz default now()`
- Unique constraint on normalized alias per title where feasible.

### 10.3 `collections`
- `id uuid primary key`
- `owner_id uuid nullable/referenced`
- `name text not null`
- `description text nullable`
- `cover_url text nullable`
- `icon text nullable`
- `color text nullable`
- `sort_mode text not null default 'date_added'`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Prevent blank names. Consider case-insensitive unique `(owner_id, lower(name))` if this is the desired UX.

### 10.4 `title_collections`
- `title_id uuid references titles(id) on delete cascade`
- `collection_id uuid references collections(id) on delete cascade`
- `position integer nullable`
- `added_at timestamptz default now()`
- Composite primary key `(title_id, collection_id)`.

### 10.5 `bookmarks`
- `id uuid primary key`
- `owner_id uuid nullable/referenced`
- `title_id uuid references titles(id) on delete cascade`
- `status text check in ('plan_to_consume','consuming','completed','on_hold','dropped') not null`
- `progress integer not null default 0 check (progress >= 0)`
- `progress_unit text check in ('episode','chapter','volume','unknown') not null`
- `progress_total integer nullable check (progress_total is null or progress_total >= 0)`
- `priority smallint nullable check (priority between 1 and 5)`
- `personal_rating numeric nullable check (personal_rating between 0 and 10)`
- `notes text nullable`
- `started_at date nullable`
- `completed_at date nullable`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`
- Unique `(owner_id, title_id)` for one bookmark per owner; adapt constraint for a true single-user setup.

### 10.6 `genres`, `title_genres`
`genres(id, name, slug, source_provider nullable)` and a join table with composite primary key. Normalize names and prevent duplicate genre relationships.

### 10.7 `tags`, `title_tags`
Tags can be owner-specific. Use `owner_id`, `name`, `slug`, and timestamps. Add a join table with a composite primary key. Decide whether imported tags and personal tags need a source/type field.

### 10.8 `external_sources`
- `id uuid primary key`
- `title_id uuid references titles(id) on delete cascade`
- `provider text not null` (e.g. `myanimelist`)
- `external_id text not null`
- `source_url text nullable`
- `last_fetched_at timestamptz nullable`
- `created_at timestamptz default now()`
- Unique `(provider, external_id)` within the intended ownership scope. For a shared global catalog, external identity can be globally unique; for a private catalog, it may still be useful to enforce one source mapping per local title.

### 10.9 Optional `title_characters`
Only implement if character information is a committed first-release feature.
- `id uuid primary key`
- `title_id uuid references titles(id) on delete cascade`
- `external_character_id text nullable`
- `name text not null`
- `image_url text nullable`
- `role text nullable`
- `voice_actors jsonb nullable` (or normalize into separate tables if querying is needed)
- `source_provider text`
- `source_url text nullable`

### 10.10 Indexes
Add indexes for:
- `titles(owner_id, media_type)`.
- normalized title/alias search; use `pg_trgm` if available and appropriate.
- `bookmarks(owner_id, status)`.
- `bookmarks(title_id)`.
- `title_collections(collection_id, position)`.
- `external_sources(provider, external_id)`.
- foreign keys and frequently filtered join columns.

### 10.11 Data integrity and migrations
- Create versioned SQL migrations; never rely only on dashboard clicks.
- Use constraints for enums/ranges/required fields.
- Add an `updated_at` trigger or explicitly update timestamps in a consistent repository layer.
- Use transactions for multi-table create/update operations.
- Add seed data only for local development/demo, never overwrite production data with seed scripts.
- Write a rollback/recovery note for destructive migrations.


# 11. Security, privacy, and Supabase policies

### 11.1 Secrets
- Never expose Supabase service-role keys, API secrets, or server-only environment variables to the browser.
- Browser may use only the Supabase anon/publishable key with correctly configured RLS.
- Store secrets in local environment files ignored by Git and in deployment secret settings.
- Provide `.env.example` with variable names and safe placeholders only.

### 11.2 Row Level Security
Enable RLS on tables exposed through Supabase APIs. If authentication is enabled, policies must scope rows to `auth.uid()`. Do not assume obscurity of IDs is access control. If the Express API uses a service-role key, authorization must be enforced in the API before every operation; the service role bypasses RLS.

For a single-user private site, choose one of:
1. Supabase Auth with a single permitted account (recommended for remote/private deployment); or
2. A private network/local-only deployment with a clearly documented threat model; or
3. A server-side access gate with a proper authentication mechanism.

Do not deploy a publicly reachable unauthenticated API that can read or mutate the personal library.

### 11.3 URL import SSRF protection
When fetching a user-supplied URL:
- Prefer parse-only MAL URL support: extract a MAL ID and call the known Jikan endpoint instead of fetching the supplied page.
- Allowlist supported hostnames and URL formats.
- Reject non-HTTP(S) protocols.
- Reject localhost, private IPv4/IPv6, link-local, and internal service targets.
- Do not follow arbitrary redirects without revalidating every redirect destination.
- Apply timeouts, response-size limits, content-type checks, and rate limits.
- Never render untrusted HTML from a source.
- Treat imported metadata as data, never as instructions.
- Sanitize text for display and avoid unsafe HTML rendering.

### 11.4 Image uploads
- Allow only supported raster image types such as JPEG, PNG, and WebP for v1.
- Enforce a reasonable maximum size (initial target: 5 MB; configurable).
- Verify MIME and file signature where possible.
- Generate storage object paths server-side.
- Avoid SVG uploads unless a robust sanitization policy is implemented.
- Use signed URLs or public bucket policy deliberately; do not expose private user content accidentally.
- Consider image resizing/thumbnail generation later.

### 11.5 Logging and privacy
- Do not log secrets, session tokens, or full private notes.
- Keep logs useful but minimal.
- Provide a way to export data.
- Document retention and deletion behavior.


# 12. Backend architecture and API contract

Use thin controllers, validated request schemas, service-layer business logic, repositories/data-access helpers, and provider adapters. Routes should not contain all business logic.

API base path: `/api/v1`.

### Health
- `GET /health` — service health, no secrets; return version/environment metadata only if safe.

### Titles
- `GET /titles` — pagination, search, media type, sorting, filters.
- `POST /titles` — create manual title.
- `GET /titles/:id` — title detail with aliases, genres, tags, source mappings, collection memberships, and optional bookmark.
- `PATCH /titles/:id` — partial update with validation.
- `DELETE /titles/:id` — confirmed deletion; define whether hard/soft delete.
- `GET /titles/:id/related` — optional related titles if supported by provider and product scope.

### Collections
- `GET /collections`
- `POST /collections`
- `GET /collections/:id`
- `PATCH /collections/:id`
- `DELETE /collections/:id`
- `POST /collections/:id/titles` — add title membership(s).
- `DELETE /collections/:id/titles/:titleId` — remove one membership.
- `PATCH /collections/:id/order` — save custom ordering.

### Bookmarks
- `GET /bookmarks` — filter by status/media type, pagination.
- `POST /bookmarks` — create bookmark.
- `GET /bookmarks/:id`
- `PATCH /bookmarks/:id`
- `DELETE /bookmarks/:id` — remove tracking record, not title.
- Optional convenience: `PUT /titles/:id/bookmark` to upsert one bookmark per title.

### Import
- `GET /import/jikan/search?q=...&type=anime|manga`
- `GET /import/jikan/anime/:malId`
- `GET /import/jikan/manga/:malId`
- `GET /import/preview?url=...` — parse a supported MAL URL and fetch normalized preview.
- `POST /import/commit` — accept selected/edited normalized fields and save locally; validate again on server.
- Optional detail endpoints: `/import/jikan/anime/:malId/characters`, `/staff`, `/statistics`, `/relations`; corresponding manga routes only where supported.

Do not expose a generic proxy such as `/proxy?url=...`. Do not accept arbitrary endpoint paths from the client.

### Images
- `POST /uploads/covers` — authenticated upload; validate and return storage path/URL.
- `DELETE /uploads/covers/:id` — only if safe ownership checking is implemented.

### Export
- `GET /export/json`
- `GET /export/csv`
Use appropriate content type and content-disposition. Ensure export authorization.

### API response conventions
Success responses should be consistent. Example:
```json
{
  "data": { },
  "meta": { "requestId": "..." }
}
```
Paginated responses:
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 24,
    "total": 120,
    "totalPages": 5
  }
}
```
Error responses:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "details": []
  },
  "meta": { "requestId": "..." }
}
```
Never leak stack traces or secret configuration in production responses.

### Validation rules
- Validate every path param, query param, and body.
- Limit pagination sizes (e.g. default 24, maximum 100).
- Bound search query length.
- Trim titles and collection names.
- Enforce media type and status enums.
- Reject invalid numeric ranges and malformed URLs.
- Use consistent `404`, `409`, `422`, `429`, and `5xx` semantics.


# 13. Jikan integration specification

### 13.1 Provider adapter
Implement Jikan as a provider adapter with a stable internal normalized model. UI components must not depend directly on raw Jikan response fields.

Suggested adapter methods:
- `searchAnime(query, page)`
- `searchManga(query, page)`
- `getAnimeById(malId, includeFullDetails)`
- `getMangaById(malId, includeFullDetails)`
- `getAnimeCharacters(malId)`
- `getAnimeStaff(malId)`
- `getAnimeStatistics(malId)`
- `getAnimeRelations(malId)`
- Manga-specific detail methods only when documented and supported.
- `parseMalUrl(url)` returning `{type, malId}` for recognized URL patterns.

Confirm exact endpoint names and response schemas against the current official Jikan documentation at implementation time. Do not guess endpoint availability based on a feature name.

### 13.2 Import flow
1. Parse URL/ID/search input.
2. Validate provider and media category.
3. Check local `external_sources` for duplicate provider ID.
4. Fetch Jikan response with timeout.
5. Normalize response into internal `TitleImportDraft`.
6. Return preview to frontend.
7. User selects fields and edits values.
8. Commit endpoint validates normalized draft and user selections.
9. Check duplicate again to avoid race conditions.
10. Insert/update title and related aliases/genres/source mapping transactionally.
11. Return saved local title ID.

### 13.3 Normalized draft
Example shape:
```ts
type MediaType = "anime" | "manga" | "manhwa";

interface TitleImportDraft {
  provider: "myanimelist";
  externalId: string;
  sourceUrl?: string;
  mediaType: MediaType;
  englishTitle: string;
  originalTitle?: string;
  aliases: Array<{
    title: string;
    languageCode?: string;
    type?: "native" | "romanized" | "translated" | "other";
  }>;
  synopsis?: string;
  background?: string;
  coverUrl?: string;
  releaseYear?: number;
  publicationStatus?: string;
  episodeCount?: number;
  chapterCount?: number;
  sourceScore?: number;
  sourceRank?: number;
  sourcePopularity?: number;
  genres: string[];
  authors?: string[];
  studios?: string[];
  sourceRetrievedAt: string;
  warnings: string[];
}
```
Keep optional values optional. Do not turn absent data into empty strings or fabricated values.

### 13.4 Source mapping
- MAL anime records map to local `anime`.
- MAL manga records may represent manga, manhwa, or other publication types. Map to `manga` vs `manhwa` using source fields when reliable; if ambiguous, ask the user during preview. Never label all MAL manga entries as manga automatically.
- Preserve provider category and ID independently of the local media type.
- Use the English title for display where available; otherwise use original title.
- Store community score/rank as source fields, never as personal rating.
- Normalize dates and counts carefully; unknown/ongoing totals stay null.

### 13.5 Optional extended data
Character, staff, statistics, and relations can be fetched on demand from title detail tabs or an explicit “Load more details” action. Do not call every endpoint during every import. This reduces latency and external API pressure.
- Cache external detail responses with a configurable TTL.
- Store only data needed by the product.
- Make failures non-fatal: the title detail page still works if characters or staff cannot load.
- Do not import reviews in v1.
- Make it clear that source data may be incomplete or stale.

### 13.6 Resilience
- Set request timeout (initial target: 8–12 seconds).
- Retry only safe transient failures, with bounded retries and backoff.
- Respect `429` and rate-limit headers where provided.
- Avoid parallel request storms.
- Cache repeated search/detail requests.
- Return actionable messages such as “Jikan is temporarily unavailable; you can continue manually.”
- Add tests for missing fields, null images, malformed payloads, rate limits, and timeout behavior.


# 14. Frontend component specification

### App shell
- `AppLayout`
- `TopNavigation`
- `MobileNavigation`
- `GlobalSearch`
- `QuickAddButton`
- `ThemeToggle`
- `PageContainer`
- `ToastProvider`
- `ConfirmDialog`
- `LoadingSkeleton`
- `EmptyState`
- `ErrorState`

### Dashboard
- `WelcomeHeader`
- `RecentlyAddedSection`
- `RecentlyUpdatedBookmarks`
- `CollectionShortcutGrid`
- `QuickStats` (local counts only; no external reviews/social stats).

### My List / collections
- `CollectionGrid`
- `CollectionCard`
- `CreateCollectionDialog`
- `EditCollectionForm`
- `CollectionDetailHeader`
- `TitleGrid`
- `TitleListView`
- `CollectionFilters`
- `SortMenu`
- `CollectionMembershipPicker`
- `ReorderCollectionItems`

### Bookmarks
- `BookmarkStatusTabs`
- `BookmarkFilters`
- `BookmarkTableOrGrid`
- `BookmarkEditor`
- `ProgressEditor`
- `PriorityControl`
- `PersonalRatingInput`
- `BookmarkNotesEditor`

### Title details
- `TitleHero`
- `CoverImage`
- `TitleHeading`
- `MediaTypeBadge`
- `ExternalSourceLink`
- `SynopsisSection`
- `MetadataGrid`
- `GenreChipList`
- `TagChipList`
- `BookmarkPanel`
- `CollectionMembershipPanel`
- `PersonalNotesPanel`
- Optional lazy-loaded `CharactersPanel`, `StaffPanel`, `StatisticsPanel`, `RelationsPanel`.

### Add/import forms
- `AddTitleChooser`
- `ManualTitleForm`
- `ImportSourceInput`
- `ImportSearchResults`
- `ImportPreview`
- `ImportFieldSelector`
- `CoverSourcePicker`
- `CoverUrlPreview`
- `CoverUploadDropzone`
- `ImportWarnings`
- `DuplicateImportDialog`

Each component must support loading, error, empty, disabled, and success states where relevant. Reuse shared validation and types.


# 15. Search, sorting, and performance

### Search
- Debounce remote/local query input.
- Search English title, original title, aliases, and optionally synopsis.
- Normalize whitespace and case.
- Display recent local results quickly; do not call Jikan for every keystroke by default.
- Separate “Search my library” from “Search MyAnimeList via Jikan” so behavior is clear.
- Handle zero results with helpful next actions.

### Sorting
Supported global sorting:
- Title A–Z / Z–A.
- Recently added.
- Recently updated.
- Personal rating.
- Release year.
Collection-specific custom order is stored as `position` on membership.

### Performance
- Paginate or virtualize large lists if needed.
- Use appropriately sized thumbnails.
- Lazy-load off-screen covers.
- Avoid fetching character/staff detail for every card.
- Use TanStack Query or equivalent caching and request deduplication.
- Add database indexes before optimizing prematurely.
- Measure performance on a realistic seed catalog.
- Avoid heavy blur on large scrolling surfaces if it harms frame rate.


# 16. Error states and recovery behavior

The UI must handle:
- No titles yet.
- No collections yet.
- Empty search results.
- Invalid or unsupported URL.
- MAL ID not found.
- Jikan unavailable or rate-limited.
- Duplicate import.
- Cover URL unreachable or invalid.
- Upload too large or wrong type.
- Database permission error.
- Session expired.
- Network disconnected.
- Validation error.
- Delete failure.
- Partial optional detail failure.

Errors should be specific and actionable, without leaking internal stack traces. Preserve form input when saving fails. If metadata retrieval fails, keep the user's input and offer manual entry. Do not clear forms on transient errors.


# 17. Testing and quality assurance plan

### 17.1 Testing layers
1. **Unit tests:** validation, normalizers, URL parser, title display fallback, progress rules, status labels, source mapping.
2. **Repository/database integration tests:** migrations, constraints, joins, ownership, cascade behavior, duplicate external IDs.
3. **API integration tests:** endpoints, auth, validation, pagination, error semantics, rate limits.
4. **Frontend component tests:** forms, empty/error states, status controls, collection picker, import preview.
5. **End-to-end tests:** core user journeys in a browser.
6. **Manual visual QA:** responsive layout, contrast, glass readability, broken covers, keyboard use.
7. **Deployment smoke tests:** health, login, create/edit title, collection membership, bookmark update, import preview, export.

### 17.2 Minimum automated acceptance suite
- Create, edit, and delete a title.
- Create a collection and add a title.
- Add one title to two collections.
- Remove from one collection without removing the other membership.
- Create/update/remove a bookmark without deleting the title.
- Prevent duplicate bookmark per owner/title.
- Search by alias.
- Import a known MAL anime ID with mocked Jikan response.
- Import a known MAL manga ID with mocked response.
- Handle missing English title and cover.
- Handle unsupported URL and malformed ID.
- Handle Jikan 429, 500, timeout, and malformed payload.
- Prevent arbitrary URL fetch / SSRF attempt.
- Reject invalid image type/oversized upload.
- Verify unauthorized user cannot access or mutate data.
- Export JSON and validate that relationships can be restored.
- Test mobile and desktop core journeys.

### 17.3 Testing data
Use fixtures/mocks in automated tests; do not make the test suite depend on live Jikan availability. Keep a small, clearly labeled local seed dataset for manual QA. Use live API smoke tests only as optional, rate-limited checks.


# 18. Development phases and completion gates

### Phase 0 — Repository and decisions
Deliverables:
- Git repository and package manager setup.
- README and `.env.example`.
- Architecture record and API conventions.
- Lint, format, typecheck and test commands.

Gate: a clean install and all baseline checks pass.

### Phase 1 — Database foundation
Deliverables:
- Versioned migrations.
- Core tables, foreign keys, constraints, indexes.
- RLS/auth decision implemented.
- Seed script for local development.
- Database tests.

Gate: migrations apply cleanly to a fresh database and constraints are verified.

### Phase 2 — Backend foundation
Deliverables:
- Express app, configuration validation, health route.
- Error middleware, request IDs, validation schemas.
- Title, collection and bookmark endpoints.
- Authorization and rate limits.
- Unit/integration tests.

Gate: API tests pass against a test database; secrets are not exposed.

### Phase 3 — Jikan adapter
Deliverables:
- URL/ID parsing.
- Search/detail adapter.
- Normalization and preview.
- Duplicate checks.
- Cache, timeout, retry and rate-limit handling.
- Mocked tests for failure paths.

Gate: imports are repeatable, no duplicates are silently created, and manual fallback works.

### Phase 4 — Frontend foundation
Deliverables:
- Design tokens and glassmorphism surfaces.
- Navigation, routes, responsive shell.
- Loading/empty/error components.
- API client and server-state management.

Gate: design system is consistent and usable at mobile/desktop widths.

### Phase 5 — Product workflows
Deliverables:
- Manual create/edit.
- Collections.
- Bookmarks/progress.
- Title detail.
- Image URL/upload.
- Search/filter/sort.
- Import preview/commit.
- Export.

Gate: all acceptance journeys pass end-to-end.

### Phase 6 — Hardening
Deliverables:
- Accessibility pass.
- Security review.
- Migration and backup recovery rehearsal.
- Error handling and logging review.
- Performance check.
- Production environment separation.

Gate: no known critical security issues; critical flows and export are tested.

### Phase 7 — Deployment
Deliverables:
- Frontend deployment.
- API deployment.
- Supabase production configuration.
- Environment variables.
- Domain and HTTPS if applicable.
- Smoke test report.
- Rollback notes.

Gate: deployed site works with production configuration and no development secrets/data.


# 19. Environment variables and configuration

Use a validated configuration module. Example variable names (actual requirements depend on hosting model):

```dotenv
# Frontend: only public values may use the VITE_ prefix
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Backend
NODE_ENV=development
PORT=4000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JIKAN_BASE_URL=https://api.jikan.moe/v4
REQUEST_TIMEOUT_MS=10000
IMPORT_RATE_LIMIT_WINDOW_MS=60000
IMPORT_RATE_LIMIT_MAX=20
COVER_MAX_BYTES=5242880
```

Do not duplicate credentials into frontend variables. If the frontend talks only to the Express API, it may not need direct Supabase credentials at all. Prefer server-side database access where that simplifies security. If direct browser-to-Supabase access is used, RLS must be correctly enforced.

Fail fast at server startup when required variables are missing or malformed. Never print secret values in logs. Provide separate environment configuration for local, preview, and production deployments.


# 20. Deployment and operations

### Frontend
- Build static React/Vite assets and deploy to Vercel.
- Configure SPA route fallback if required by the deployment configuration.
- Set the production API base URL.
- Verify asset caching and environment variable behavior.

### Backend
Choose one:
- Deploy Express to a compatible Node.js host; or
- Adapt the app to Vercel Functions with a serverless-compatible entry point.

Do not assume long-running background work is available in serverless functions. Keep initial imports request/response based and bounded. If future bulk import jobs are added, choose a queue/worker architecture deliberately.

### Supabase
- Create separate development and production projects where practical.
- Apply migrations through a repeatable process.
- Enable RLS and verify policies.
- Configure Storage buckets and access policies.
- Enable backups appropriate to the selected plan.
- Keep service role credentials server-only.
- Test restoration/export before launch.

### Production checklist
- [ ] Environment variables validated.
- [ ] No secrets in Git or client bundles.
- [ ] HTTPS enabled.
- [ ] Auth/private access verified.
- [ ] RLS and API authorization tested.
- [ ] Migrations applied.
- [ ] Storage policy tested.
- [ ] API health route responds.
- [ ] Jikan timeout/rate-limit handling verified.
- [ ] Create/edit/delete flows verified.
- [ ] Export verified.
- [ ] Mobile/desktop smoke tests passed.
- [ ] Error logging configured without sensitive data.
- [ ] Rollback instructions documented.


# 21. Backup, export, and recovery

The library is valuable personal data; backup is a product feature, not an afterthought.

- JSON export should preserve title IDs, aliases, genres, tags, bookmarks, collections, collection memberships, source mappings, and cover references.
- CSV export is convenient for spreadsheet review but is not the authoritative full backup.
- Include schema/version metadata in JSON exports.
- Validate import files before applying them.
- Provide a dry-run summary: number of titles, collections, bookmarks, and conflicts.
- Avoid overwriting existing records silently; offer merge/skip/replace policies.
- Document database backup limitations based on the chosen Supabase plan.
- Test a restore into a clean development project before declaring backup complete.


# 22. Licensing, source use, and data provenance

Jikan is an unofficial, read-only API that exposes MyAnimeList-derived data. Its availability, coverage, terms, rate limits, and behavior can change. Before deployment, check the current Jikan documentation, project terms, and applicable MyAnimeList policies.

Implementation rules:
- Use the API rather than scraping arbitrary page HTML wherever possible.
- Do not attempt to bypass access controls, CAPTCHAs, rate limits, or technical restrictions.
- Do not assume publicly visible information is automatically licensed for unrestricted reuse.
- Store provider, external ID, source URL, and retrieval timestamp.
- Clearly distinguish source score/rank from personal rating.
- Keep a manual entry/edit path if provider access fails or a record is absent.
- Avoid importing reviews in v1.
- Fetch optional data only when the user asks for it or opens the relevant detail section.
- Review image reuse/hotlinking restrictions and provide a user-upload alternative.
- Do not claim legal compliance merely because the application calls an API.


# 23. Decisions intentionally left configurable

The following choices should be made during setup without changing the core product architecture:

1. **Authentication:** recommended for any public internet deployment. Single-user account is enough for v1.
2. **TypeScript vs JavaScript:** TypeScript is recommended; if JavaScript is required, use runtime schema validation.
3. **API hosting:** Vercel Functions vs a dedicated Node.js host depends on deployment constraints.
4. **Cover storage policy:** public covers may be simpler, but verify source rights and whether the library is private.
5. **MAL manga type mapping:** ask the user when source fields cannot reliably distinguish manga from manhwa.
6. **Collection name uniqueness:** default to case-insensitive uniqueness per owner.
7. **Deletion:** default to confirmed permanent deletion; consider soft delete only with a clear recovery design.
8. **Optional character/staff tabs:** implement after core catalog/bookmark/collection workflows are stable.
9. **Source metadata refresh:** manual refresh in v1; do not overwrite user edits without preview/merge logic.
10. **Community fields:** source score/rank may be stored, but they are informational and may become stale.

The coding agent should record decisions in `docs/decisions.md` and avoid inventing additional features that expand scope.


# 24. AI coding-agent instructions (Antigravity)

Treat this document as the product and engineering source of truth.

### Mandatory working style
1. Inspect the existing repository before editing files.
2. If no repository exists, create the structure described here.
3. Build incrementally in the specified phases. Do not attempt a single giant code-generation pass.
4. Before each phase, state the goal and files/modules expected to change.
5. Implement real persistence and API behavior; do not substitute hard-coded demo data for completed features.
6. Keep UI, business logic, provider integration, and database access separated.
7. Validate all untrusted inputs on the server.
8. Write tests alongside each feature.
9. Run lint, typecheck, unit tests, integration tests, and build after meaningful changes.
10. Fix failures before moving to the next phase; never hide failing tests or disable checks to make a build pass.
11. Do not invent Jikan endpoints. Verify current documentation and model each endpoint response safely.
12. Do not expose service-role credentials to the browser.
13. Do not fetch arbitrary user-provided URLs; parse allowlisted MAL URL formats and call Jikan endpoints.
14. Do not import reviews.
15. Preserve manual entry as a reliable fallback.
16. Make all primary routes usable on mobile and desktop.
17. Use the supplied visual reference for the glassmorphism direction without copying third-party branding/assets.
18. Do not declare the project finished until acceptance criteria and deployment smoke tests pass.

### Required progress artifacts
Maintain:
- `README.md` — setup and commands.
- `.env.example` — names/placeholders only.
- `docs/architecture.md` — current architecture.
- `docs/api-contracts.md` — actual implemented API contract.
- `docs/decisions.md` — decisions and assumptions.
- `docs/test-report.md` — commands run and results.
- `docs/deployment.md` — deployment procedure and rollback.
- `docs/known-limitations.md` — known gaps, including source coverage.

### Definition of done
A phase is done only when:
- Implementation exists.
- Tests cover expected behavior and meaningful failure cases.
- Checks run successfully.
- UI/API integration is verified where relevant.
- Documentation is updated.
- Remaining limitations are stated honestly.


# 25. Final release acceptance checklist

### Core catalog
- [ ] Create, view, edit, delete title.
- [ ] Anime/manga/manhwa media type.
- [ ] English, original, and alternate titles.
- [ ] Synopsis, background, genres, tags.
- [ ] Cover URL and upload.
- [ ] Missing image fallback.
- [ ] Source URL and external IDs.

### Collections
- [ ] Create/edit/delete collection.
- [ ] Add title to multiple collections.
- [ ] Remove from one collection only.
- [ ] Filter/sort collection titles.
- [ ] Preserve collection order if custom sort is enabled.

### Bookmarks
- [ ] All five statuses.
- [ ] Progress with episode/chapter unit.
- [ ] Optional target, priority, rating, notes, dates.
- [ ] Filter/sort bookmarks.
- [ ] Remove bookmark without deleting title.

### Jikan
- [ ] MAL URL parsing.
- [ ] MAL ID import.
- [ ] Search by title.
- [ ] Anime and manga detail normalization.
- [ ] Manhwa ambiguity handled in preview.
- [ ] Duplicate detection.
- [ ] Field selection and editing.
- [ ] Missing data and provider failure states.
- [ ] Rate limits, timeout, and caching.
- [ ] Optional character/staff/statistics loaded on demand.
- [ ] No reviews in v1.

### Security and reliability
- [ ] Auth/private access configured.
- [ ] RLS or server authorization tested.
- [ ] No service-role key in client bundle.
- [ ] URL import SSRF protections.
- [ ] Upload validation.
- [ ] Server-side validation on every write.
- [ ] No sensitive data in logs.
- [ ] Export and recovery tested.

### UX and deployment
- [ ] Glassmorphism consistent across pages.
- [ ] Text contrast and keyboard accessibility checked.
- [ ] Responsive at mobile/tablet/desktop sizes.
- [ ] Loading, empty, error, and success states.
- [ ] Production environment configured.
- [ ] Build and automated tests pass.
- [ ] Production smoke tests pass.
- [ ] Known limitations documented.


# Appendix A. Example normalized internal types

```ts
type MediaType = "anime" | "manga" | "manhwa";

type BookmarkStatus =
  | "plan_to_consume"
  | "consuming"
  | "completed"
  | "on_hold"
  | "dropped";

type ProgressUnit = "episode" | "chapter" | "volume" | "unknown";

interface Title {
  id: string;
  mediaType: MediaType;
  englishTitle: string;
  originalTitle?: string | null;
  aliases: TitleAlias[];
  synopsis?: string | null;
  background?: string | null;
  coverUrl?: string | null;
  coverStoragePath?: string | null;
  releaseYear?: number | null;
  publicationStatus?: string | null;
  episodeCount?: number | null;
  chapterCount?: number | null;
  sourceScore?: number | null;
  sourceRank?: number | null;
  genres: string[];
  tags: string[];
  externalSources: ExternalSource[];
  createdAt: string;
  updatedAt: string;
}

interface TitleAlias {
  id: string;
  title: string;
  languageCode?: string | null;
  aliasType?: "native" | "romanized" | "translated" | "other" | null;
}

interface Bookmark {
  id: string;
  titleId: string;
  status: BookmarkStatus;
  progress: number;
  progressUnit: ProgressUnit;
  progressTotal?: number | null;
  priority?: number | null;
  personalRating?: number | null;
  notes?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

interface Collection {
  id: string;
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  icon?: string | null;
  color?: string | null;
  sortMode: string;
  titleIds: string[];
}
```
These are illustrative internal contracts; database column names may use snake_case. Keep mapping centralized rather than scattering conversions through UI components.


# Appendix B. Example API error codes

- `VALIDATION_ERROR` — request fields are invalid.
- `NOT_FOUND` — requested local title/collection/bookmark does not exist or is not accessible.
- `DUPLICATE_EXTERNAL_SOURCE` — provider + external ID is already linked.
- `DUPLICATE_BOOKMARK` — bookmark already exists where an insert was requested.
- `UNSUPPORTED_SOURCE_URL` — URL is not a recognized allowed source pattern.
- `EXTERNAL_PROVIDER_UNAVAILABLE` — Jikan cannot be reached or is failing.
- `EXTERNAL_RATE_LIMITED` — provider rate limit reached.
- `UPLOAD_INVALID_TYPE` — file type not allowed.
- `UPLOAD_TOO_LARGE` — upload exceeds configured size.
- `UNAUTHORIZED` — no valid session.
- `FORBIDDEN` — session is not permitted to access the resource.
- `CONFLICT` — operation conflicts with current data state.
- `INTERNAL_ERROR` — unexpected server error with a request ID for support.

Keep messages human-readable. Use structured details only where they help the client highlight fields or offer recovery.


# Appendix C. First implementation sprint

The first sprint should establish a reliable base rather than attempt all features.

1. Initialize repository, package scripts, linting, formatting, TypeScript/runtime schemas.
2. Create Supabase project and initial migration.
3. Implement title, collection, membership, and bookmark tables with constraints.
4. Decide and implement the authentication/access model.
5. Create Express health endpoint, config validation, error middleware, and request logging.
6. Implement title and collection CRUD with integration tests.
7. Implement bookmark CRUD with progress validation and tests.
8. Add a small test dataset and verify API contracts with an API client.
9. Add React app shell, routes, design tokens, and glass surfaces.
10. Connect only the completed API flows to the frontend.
11. Record results in `docs/test-report.md`.
12. Proceed to Jikan only after core local CRUD and authorization are stable.


# Appendix D. References to verify during implementation

Use current official documentation; do not treat this list as a guarantee that a service's terms or endpoints remain unchanged.

- Jikan documentation: https://docs.api.jikan.moe/
- Jikan project: https://jikan.moe/
- Supabase documentation: https://supabase.com/docs
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage: https://supabase.com/docs/guides/storage
- Vercel documentation: https://vercel.com/docs
- React documentation: https://react.dev/
- Vite documentation: https://vite.dev/
- Express documentation: https://expressjs.com/
- Playwright documentation: https://playwright.dev/docs/intro

At implementation time, verify the current Jikan endpoint names, rate-limit guidance, response schemas, and applicable source terms. This document deliberately avoids hard-coding unverified endpoint response details.
