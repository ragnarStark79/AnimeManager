# AnimeManager — Project Build Progress Tracker

## 1. Project Overview & Current Status

**Project Name:** AnimeManager (Personal Media Library)  
**Description:** A private-first personal catalog and tracking application for anime, manga, and manhwa. The application strictly distinguishes between **My List** (user-defined collections/folders) and **Bookmarks** (watch/read tracking status and progress). It integrates with MyAnimeList via the Jikan API for metadata import with preview and editing before saving, storing local copies in Supabase PostgreSQL and cover images in Supabase Storage. The visual aesthetic follows a modern, responsive glassmorphism design.

- **Current Project Status:** Active Development
- **Current Active Phase:** **Phase 05.4: Definitive Jikan Connectivity Diagnosis, Import Recovery, and Full Technical Report**
- **Phase 05.4 Status:** **COMPLETED** (Definitively diagnosed external upstream decommissioning of public hosted Jikan API at api.jikan.moe on Oct 1, 2026; confirmed general outbound HTTPS is fully operational; delivered comprehensive root report [JIKAN_IMPORT_DIAGNOSTIC_REPORT.md](file:///Users/ragnar/Documents/Projects/AnimeManager/JIKAN_IMPORT_DIAGNOSTIC_REPORT.md) for independent review; enhanced dual-stack diagnostic probe; verified 137 monorepo tests pass [5 shared + 81 API + 51 web], 18 DB assertions, and production build)
- **Next Phase:** **Phase 06: Hardening: Security, Accessibility, & Performance** (Pending user review and authorization)

---

## 2. Phase Tracker & Completion Summary

| Phase | Description | Status | Completion Criteria / Gate |
|---|---|---|---|
| **Phase 00** | Workspace Inspection & Project Setup | **COMPLETED** | Workspace verified clean; technical specs thoroughly reviewed; tracking and architecture documentation created; baseline commands inspected; git and safety practices established. |
| **Phase 01** | Repository Foundation & Database Schema | **COMPLETED** | Monorepo scaffold initialized with npm workspaces; TypeScript base configs created; Supabase migrations (`000001_initial_schema.sql`, `000002_security_policies.sql`), triggers, RLS policies, seed fixtures, and test assertions verified against live PostgreSQL (18/18 assertions pass; 5/5 schema unit tests pass). |
| **Phase 02** | Backend Foundation & Core CRUD APIs | **COMPLETED** | Express API initialized with TypeScript, Zod validation, structured error handling, request ID logging, security headers (Helmet/CORS), JWT authentication, and owner scoping; CRUD endpoints for titles, collections, memberships, and bookmarks implemented and verified with integration tests (35/35 integration tests pass; 18/18 database assertions pass). |
| **Phase 03** | Jikan Metadata Importer & Resilient Adapter | **COMPLETED** | Resilient Jikan v4 client with bounded retries, Retry-After header, request throttler, bounded TTL/LRU cache; strict URL/SSRF parser; metadata normalizer with explicit/ambiguous manhwa disambiguation and review data exclusion; read-only preview with duplicate detection; atomic transactional commit enforcing field selection (64/64 tests pass). |
| **Phase 04 (Part 1)** | Visual Foundation, Design System & Application Shell | **COMPLETED** | Vite + React + TypeScript application configured; custom CSS design tokens (`tokens.css`), glassmorphism utilities (`glassmorphism.css`), animations, global styling, AppShell, Header with center pill navigation, Sidebar, MobileNav, 8 reusable UI components (`Button`, `Badge`, `Input`, `GlassCard`, `PosterCard`, `EmptyState`, `LoadingState`, `ErrorState`), Dashboard with dual spotlight cards & 6-poster grid, route placeholders for `/bookmarks`, `/my-list`, `/collections`, `/titles`, `/settings`, and `*` 404 page; 11/11 automated frontend tests pass. |
| **Phase 04 (Part 2)** | Interactive Catalog UI, Search, Filters & Navigation | **COMPLETED** | Interactive catalog UI with search, filtering (media type, status), sorting (alphabetical, rating, year), AddTitleModal preview form with honest disclosure, URL search sync via `useSearchParams`, and 21 automated frontend unit tests. |
| **Phase 04 (Part 3)** | Frontend Verification, Responsive QA & Phase Gate | **COMPLETED** | Comprehensive verification of all 8 routes, responsive CSS audit across 360px, 390px, 768px, 1024px, 1440px viewports, modal dismissal (backdrop click and Escape key), honest non-persistence disclosures for `/import` and `/settings`, URL search parameter sync, and 32/32 passing frontend tests (101 monorepo tests total). |
| **Phase 05** | Full-Stack Integration & Core Library Workflows | **COMPLETED** | React frontend connected to Express REST backend via TanStack Query and typed `ApiClient`; AuthProvider and token storage; Title CRUD and Detail view (`/titles/:id`) with confirmed deletion; Collections management with multi-collection title membership and strict independence from bookmarks; Bookmarks tracking with status tabs, chapter/episode progress stepper, and personal rating; Jikan Import UI with URL parsing, candidate search, metadata preview, duplicate warning, manga/manhwa disambiguation, and atomic commit; JSON and CSV export endpoints and UI download triggers; 40 web tests, 68 API tests, 5 shared tests (113 total passing automated tests). |
| **Phase 05.1** | Local Startup, API Connectivity & Runtime Verification | **COMPLETED** | Diagnosed and fixed `ECONNREFUSED` / HTTP 500 error; established zero-dependency concurrent runner `scripts/dev.js` (`npm run dev`) with labeled logs (`[api]`, `[web]`), graceful shutdown, and port conflict checks; created `scripts/healthcheck.js` (`npm run healthcheck`) verifying API, DB, and Vite proxy; aligned Vite proxy target to `http://127.0.0.1:4000`; created `docs/LOCAL_DEVELOPMENT.md` and root `README.md`; verified live HTTP requests. |
| **Phase 05.2** | Authentication, JWT Lifecycle & Protected Workflow Repair | **COMPLETED** | Diagnosed and resolved 401 Unauthorized errors caused by expired static env token and invalid dev signature; implemented guarded backend development session endpoint (`GET /api/v1/auth/dev-session`, `POST /api/v1/auth/dev-token`) issuing fresh 24h JWT for seeded owner (`00000000-0000-0000-0000-000000000001`); implemented client-side `isTokenExpired()` pruning on startup, debounced 401 auto-recovery, and Settings page session management; verified zero backend secrets in production frontend bundle; 122 automated tests pass. |
| **Phase 05.3** | Jikan Import Search Connectivity & Error Diagnostics | **COMPLETED** | Diagnosed upstream network timeout on public Jikan server (Hetzner IP 135.181.39.91); added 8-category network error classification (`UPSTREAM_DNS_ERROR`, `UPSTREAM_CONNECTION_ERROR`, `UPSTREAM_TLS_ERROR`, `UPSTREAM_TIMEOUT`, `UPSTREAM_RATE_LIMITED`, `UPSTREAM_UNAVAILABLE`, `UPSTREAM_BAD_RESPONSE`, `UPSTREAM_INVALID_PAYLOAD`); upgraded timeout to HTTP 504; sanitized logs with request IDs; enhanced frontend error presentation and candidate suppression; created `scripts/test-jikan-live.js`; 136 monorepo tests pass. |
| **Phase 05.4** | Definitive Jikan Diagnosis, Import Recovery & Technical Report | **COMPLETED** | Conclusively identified that public api.jikan.moe was retired on Oct 1, 2026; confirmed general outbound HTTPS is healthy (Google, GitHub, MAL); delivered root report `JIKAN_IMPORT_DIAGNOSTIC_REPORT.md` for independent review; enhanced dual-stack probe; added custom baseUrl tests (137 tests pass). |
| **Phase 06** | Hardening: Security, Accessibility, & Performance | **PENDING REVIEW** | Server-side SSRF safeguards, image upload signature verification, accessibility audit (keyboard nav, ARIA, color contrast), glassmorphism performance optimization, and backup/restore rehearsal completed. Awaiting user authorization. |
| **Phase 07** | Deployment Preparation & Production Verification | **NOT STARTED** | Frontend deployed to Vercel; Express API deployed to compatible Node host; Supabase production instance configured with RLS and Storage policies; smoke tests pass; rollback plan verified. |

---

## 3. Work Completed vs. Work Not Yet Started

### Completed Work (Phases 00, 01, 02, & 03)
- [x] Workspace inspection performed: confirmed clean workspace containing only `Documentations/`.
- [x] Full review of `Antigravity_Master_Build_Prompt.txt`, `Personal_Media_Library_Full_Technical_Specification.md`, and `.docx`.
- [x] Documentation suite initialized (`BUILD_PROGRESS.md`, `architecture.md`, `api-contracts.md`, `decisions.md`, `test-report.md`, `requirements-traceability.md`, `deployment.md`, `known-limitations.md`).
- [x] Git repository initialized with `.gitignore` and `.env.example`.
- [x] Baseline Git commit created (`2d5b7dd`).
- [x] Monorepo workspace established (`packages/shared`, `apps/api`, `apps/web`).
- [x] Shared package created with domain constants, TypeScript interfaces, Zod schemas, and unit test suite (5/5 unit tests pass).
- [x] Supabase SQL migrations created:
  - `supabase/migrations/20261014000001_initial_schema.sql` (10 tables, constraints, indexes, cascade deletions, `updated_at` trigger).
  - `supabase/migrations/20261014000002_security_policies.sql` (Row Level Security on all 10 tables, cross-table ownership validation).
- [x] Development and test fixtures created in `supabase/seed.sql` representing anime, manga, and manhwa.
- [x] Automated database test suite created in `supabase/tests/database_verification.sql` and hardened test runner `scripts/verify-db.js`.
- [x] Layered Express API implemented in `apps/api/src`:
  - `config/`: Validated environment variables via Zod including Jikan and rate-limit configuration.
  - `errors/`: Consistent `AppError` taxonomy (`ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `DatabaseError`, `ExternalProviderUnavailableError`, `ExternalProviderTimeoutError`, `ExternalProviderRateLimitError`, `ExternalResourceNotFoundError`, `DuplicateImportError`).
  - `middleware/`: Request ID tracking (`X-Request-ID`), Supabase JWT verification (`auth.middleware.ts`), Zod request validation (supporting refined schemas), centralized error handling (`error.middleware.ts`).
  - `repositories/`: Safe parameterized database access via `pg.Pool`, transaction wrapping (`titles.repository.ts`, `collections.repository.ts`, `bookmarks.repository.ts`).
  - `services/`: Business rules, case-insensitive collection uniqueness, progress-total validation, owner scoping (`titles.service.ts`, `collections.service.ts`, `bookmarks.service.ts`).
  - `controllers/` & `routes/`: REST endpoints for Health, Titles (CRUD, search, pagination, sort, confirmed delete), Collections (CRUD, multi-membership, order), and Bookmarks (CRUD, status tabs, upsert).
- [x] Implemented Phase 03 Jikan Metadata Importer & Resilient Adapter:
  - `url-parser.ts`: Strict MyAnimeList URL parser rejecting arbitrary hosts, lookalikes, non-HTTPS protocols, credentials, bad ports, and path traversal (zero SSRF risk).
  - `cache.ts`: `BoundedTtlCache` with configurable TTL and LRU eviction policy to prevent unbounded memory growth.
  - `throttler.ts`: `RequestThrottler` enforcing ~3 req/s spacing between upstream Jikan requests.
  - `jikan.client.ts`: Resilient client with bounded exponential backoff for HTTP 429/503, `Retry-After` header parsing, 10s timeout, `redirect: 'error'`, non-retryable 4xx rejection, and injectable test fetch.
  - `normalizer.ts`: Maps Jikan anime/manga payloads into internal `ImportDraft`, disambiguates manga vs manhwa with `needsMediaConfirmation` flags, deduplicates aliases/genres/tags, and strictly excludes community reviews.
  - `import.service.ts`: Orchestrates candidate search, read-only preview with duplicate detection query, and atomic transactional commit enforcing field selection and initial bookmark/collection assignments.
  - Mounted `/api/v1/import/jikan/search`, `/api/v1/import/preview`, and `/api/v1/import/commit`.
- [x] API integration & unit test suite implemented across `apps/api/test/`:
  - 64/64 tests pass covering URL parser adversarial SSRF, resilient client retry/cache/throttling, metadata normalization, and Supertest endpoint integration.
- [x] Phase 04 Part 1 Visual Foundation & Application Shell implemented in `apps/web`:
  - Configured Vite 5 + React 18 + TypeScript with `@/` path alias and strict typechecking.
  - Implemented tokenized CSS design system (`tokens.css`, `glassmorphism.css`, `animations.css`, `global.css`) matching user reference image.
  - Implemented application shell (`AppShell.tsx`, `Header.tsx` with center pill navigation, `Sidebar.tsx`, `MobileNav.tsx`).
  - Implemented 8 reusable UI components: `Button`, `Badge`, `Input`, `GlassCard`, `PosterCard`, `EmptyState`, `LoadingState`, `ErrorState`.
  - Implemented Dashboard with dual spotlight cards (Anime & Manhwa), category filter pills, 6-column portrait poster grid, and navigation cards to Bookmarks, My List, and Collections.
  - Implemented placeholder route pages: `/bookmarks`, `/my-list`, `/collections`, `/titles`, `/settings`, and `*` (NotFoundPage).
  - Implemented automated frontend test suite in `apps/web/test/` (11/11 tests pass).
- [x] Phase 04 Part 2 Interactive Catalog UI, Search, Filters & Navigation implemented in `apps/web`:
  - Created typed demonstration dataset `src/data/demo.ts` with 12 balanced sample titles across anime, manga, and manhwa, bookmark statuses, genres, ratings, and query functions (`searchTitles`, `filterByMediaType`, `filterByBookmarkStatus`, `sortTitles`, `countByStatus`).
  - Implemented shared `FilterChips` component (`FilterChips.tsx`, `FilterChips.css`) with accessible radiogroup/radio ARIA bindings, active pills, counts, and horizontal scroll capability.
  - Implemented shared `SortControl` component (`SortControl.tsx`, `SortControl.css`) with styled trigger and native select overlay for keyboard and mobile accessibility.
  - Implemented shared `AddTitleModal` component (`AddTitleModal.tsx`, `AddTitleModal.css`) with clear non-persistent preview disclosure, disabled submit button ("Save Title (Phase 05)"), and native dialog focus trapping.
  - Upgraded `TitlesPage` with real-time substring search, clear query button, media-type filter chips, 6 sort modes, empty-catalog and no-results states, and URL search parameter sync via `useSearchParams` (`?q=...`).
  - Upgraded `BookmarksPage` with functional status filtering tabs (All, In Progress, Plan to Watch, Completed, On Hold, Dropped), dynamic item counts, status-labeled poster cards, and empty state per category.
  - Fixed `MyListPage` and `CollectionsPage` headings and semantic clarity; added collection theme ideas and non-persistent preview modal for creating collections.
  - Upgraded `Dashboard` to filter showcase items by category/top-rated/planning using `FilterChips`, wired honest navigation shortcuts to `/titles`, `/bookmarks`, `/my-list`, and `/collections`.
  - Connected `Header` search form to navigate to `/titles?q=...` on submit; wired `Add` button to open `AddTitleModal` preview; linked avatar to `/settings`; disabled decorative notification button with honest tooltip.
  - Resolved `PosterCard` image fallback using `imgFailed` state so failed images render stylized gradients with title initials.
  - Created automated test suite `interactive-catalog.test.js` validating all 10 required catalog behaviors (21/21 frontend tests pass).
- [x] Phase 04 Part 3 Frontend Verification, Responsive QA & Phase Gate implemented in `apps/web`:
  - Verified all 8 routes (`/`, `/titles`, `/bookmarks`, `/my-list`, `/collections`, `/import`, `/settings`, and `*` 404).
  - Audited responsive layout and CSS media queries across 360px, 390px, 768px, 1024px, and 1440px viewports (horizontal overflow prevention, flex wrap, 2-column mobile poster grids, mobile navigation padding).
  - Added modal backdrop click and Escape key dismissal to `CollectionsPage` new collection dialog.
  - Added accessible Escape key blurring/clearing to global search (`Header.tsx`) and catalog search (`TitlesPage.tsx`).
  - Added honest Phase 05 preview notice and disabled search button on `/import` (`ImportPage.tsx`) to prevent false persistence expectations.
  - Created automated verification test suite `apps/web/test/verification-qa.test.js` (11 new tests, total 32/32 web tests pass).
- [x] Quality gates verified: `npm run lint`, `npm run typecheck`, `npm test` (101/101 pass), `npm run build`, `npm run test:api` (64/64 pass), `npm run test:db` (18/18 pass) all pass with zero errors.

- [x] Phase 05 Full-Stack Integration & Core Library Workflows implemented across `apps/api` and `apps/web`:
  - Installed `@tanstack/react-query` and created `queryClient` with 2-minute stale time and 4xx bypass.
  - Implemented typed `ApiClient` (`apps/web/src/lib/api-client.ts`) with custom `ApiError` class, JWT header injection, and typed resource namespaces for titles, collections, bookmarks, import, and export.
  - Implemented `AuthProvider` and `useAuth` hook (`apps/web/src/lib/auth-context.tsx`) with localStorage token sync, JWT claims parsing (`sub`, `email`), and dev token fallback.
  - Created Title Detail view (`TitleDetailPage.tsx`, `TitleDetailPage.css`) with hero poster, metadata stats, interactive bookmark tracking stepper, collection assignment picker, metadata edit modal, and confirmed delete modal (`DELETE /api/v1/titles/:id?confirm=true`).
  - Upgraded `AddTitleModal.tsx` to persist titles via `api.titles.create` with full field coverage (display title, original title, media type, release year, cover URL, synopsis, episode/chapter count, genres, tags) and query invalidation.
  - Upgraded `TitlesPage.tsx` and `Dashboard.tsx` to fetch from live `api.titles.list` with debounced search, media type filter chips, sort options, loading, error, and empty states.
  - Upgraded `CollectionsPage.tsx` and `MyListPage.tsx` to fetch and mutate collections via `api.collections.list`, `create`, `update`, `delete`, and collection title membership (`addTitle`, `removeTitle`) while upholding the invariant that collection deletion never touches titles or bookmarks.
  - Upgraded `BookmarksPage.tsx` to fetch and tally live bookmarks across status categories (`consuming`, `plan_to_consume`, `completed`, `on_hold`, `dropped`).
  - Upgraded `ImportPage.tsx` to connect to `api.import.search`, `api.import.preview`, and `api.import.commit` with candidate selection, editable field inputs, duplicate MAL import warning banners, manga vs manhwa disambiguation radio controls, and optional initial bookmark/collection assignment.
  - Created library export endpoints in Express (`apps/api/src/routes/export.routes.ts`, `controllers/export.controller.ts`, `services/export.service.ts`) for authenticated JSON backup (`/api/v1/export/json`) and CSV download (`/api/v1/export/csv`) with strict owner isolation.
  - Upgraded `SettingsPage.tsx` with functional JSON and CSV backup download triggers, token inspection/override, connection health check, and honest Supabase Storage setup requirement disclosures.
  - Added automated test suite `apps/web/test/phase05-workflows.test.js` (8 tests) and `apps/api/test/export.test.js` (4 tests).
- [x] Quality gates verified: `npm run lint`, `npm run typecheck`, `npm test` (113/113 pass: 5 shared + 68 API + 40 web), `npm run build`, `npm run test:api` (68/68 pass), `npm run test:db` (18/18 pass) all pass with zero errors.

- [x] Phase 05.1 Local Startup, API Connectivity & Runtime Verification implemented:
  - Root Cause Diagnosed: Resolved `ECONNREFUSED` / HTTP 500 error caused by Express API not being started by single `npm run dev` in `apps/web` and IPv6/IPv4 loopback discrepancies on macOS.
  - Implemented root development runner `scripts/dev.js` (`npm run dev`) compiling API TypeScript, detecting port availability, and spawning Express API (4000) and Vite frontend (5173) with labeled color streams (`[api]`, `[web]`) and clean `SIGINT`/`SIGTERM` process management.
  - Implemented root healthcheck script `scripts/healthcheck.js` (`npm run healthcheck`) testing direct Express reachability, PostgreSQL database readiness (`database: "connected"`), and Vite proxy forwarding.
  - Updated Vite proxy in `apps/web/vite.config.ts` to target `http://127.0.0.1:4000` and bound Express in `apps/api/src/server.ts` to `0.0.0.0` with database startup probe.
  - Created comprehensive setup documentation in `docs/LOCAL_DEVELOPMENT.md` and project entry point `README.md`.
  - Verified live HTTP endpoints: direct health (200), proxy health (200), unauthenticated requests (401), and authenticated titles, collections, and bookmarks (200).

- [x] Phase 05.2 Authentication, JWT Lifecycle & Protected Workflow Repair implemented:
  - Diagnosed Root Cause: `401 Unauthorized` in browser caused by expired static token in `.env` (`jwt expired`) and mismatched secret in hardcoded fallback (`invalid signature`), which persisted in `localStorage`.
  - Implemented guarded backend dev token issuer in Express (`GET /api/v1/auth/dev-session`, `POST /api/v1/auth/dev-token`) generating valid 24h JWTs strictly scoped to seeded owner `00000000-0000-0000-0000-000000000001`.
  - Added startup safety check: `ENABLE_DEV_AUTH` is strictly prohibited in `NODE_ENV === 'production'`.
  - Upgraded client-side token lifecycle in `api-client.ts` and `auth-context.tsx`: automatically prunes expired stored tokens on load, auto-fetches fresh dev session on startup, and provides debounced 401 recovery without infinite request loops.
  - Enhanced `SettingsPage.tsx` with explicit session origin display ("Local Development" badge), owner UUID inspection, and "Refresh Dev Session" button.
  - Added automated test suites: 3 new API tests in `apps/api/test/auth.test.js` (total 71 tests) and 6 new frontend tests in `apps/web/test/auth-lifecycle.test.js` (total 46 tests).
  - Verified zero backend secrets or service-role keys in production frontend build.

### Work Not Yet Started (Phase 06 to Phase 07)
- [ ] Security, accessibility, and performance hardening audits (Phase 06).
- [ ] Production deployments on Vercel and Node host with Supabase (Phase 07).

---

## 4. Verification & Testing Log

| Target | Command | Status | Result / Notes |
|---|---|---|---|
| **Linting** | `npm run lint` | **PASS** | Checked across workspaces; clean execution with 0 warnings. |
| **Type Checking** | `npm run typecheck` | **PASS** | Strict TypeScript compiler verified across `shared`, `api`, `web` with 0 type errors. |
| **Monorepo Tests** | `npm test` | **PASS** | 5 schema unit tests in `shared`, 71 tests in `api`, 46 tests in `web` (total 122 automated tests pass). |
| **Frontend Unit Tests** | `npm --prefix apps/web test` | **PASS** | 46/46 tests pass covering design tokens, glassmorphism fallback, shared UI components, router table, navigation boundaries, search, clearing, no-results state, media filtering, sorting, bookmark status filtering, empty states, poster fallbacks, honest Add Title preview behavior, modal dismissal, responsive QA, Phase 05 workflows, and Phase 05.2 auth lifecycle. |
| **API Integration Tests** | `npm run test:api` | **PASS** | 71 tests pass in `apps/api` using Node test runner against isolated test database (includes auth, dev-session, titles, collections, bookmarks, import, export, and resilience). |
| **Production Build** | `npm run build` | **PASS** | All workspaces compile cleanly to `dist/` with declaration maps and sources; Vite bundles client assets in ~1.43s with zero leaked secrets. |
| **Database Verification** | `npm run test:db` | **PASS** | 18 assertions pass against live PostgreSQL: 10 tables, triggers, constraints, multi-collection membership, cascade deletions, and cross-owner RLS policies. |
| **Healthcheck Suite** | `npm run healthcheck` | **PASS** | Verifies Express API process (port 4000), PostgreSQL connection, and Vite proxy forwarding (port 5173 -> 4000). |
| **Development Runner** | `npm run dev` | **PASS** | Starts both API and Web with labeled terminal output and clean Ctrl+C shutdown. |
| **Git Safety** | `git status` | **PASS** | Clean staging; `.env`, `node_modules`, and build artifacts strictly ignored. |

---

## 5. Outstanding Decisions, Required Credentials, & Dependencies

### External Service Dependencies
1. **Supabase PostgreSQL & Storage:**
   - Production / staging Supabase credentials (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_ANON_KEY`) needed when deploying to hosted Supabase.
   - Storage bucket `covers` to be provisioned in hosted Supabase prior to cloud deployment (URL-based artwork and gradient initials currently operational).
2. **Jikan REST API v4:**
   - Upstream rate limits (~3 req/s) handled via in-memory throttler, bounded backoff, and TTL/LRU cache in Phase 03.

### Decisions Resolved in Phase 01 & 02 & 03 & 05
- **ADR-001 (RLS Cross-Ownership Enforcement):** In `20261014000002_security_policies.sql`, relationship join tables enforce mutual ownership before inserting.
- **ADR-006 (Case-Insensitive Collection Uniqueness):** Enforced via unique index `uq_collections_owner_lower_name ON collections(owner_id, lower(trim(name)))`.
- **ADR-008 (Personal Rating Canonical Location):** Confirmed on `bookmarks.personal_rating` (numeric between 0.0 and 10.0).
- **ADR-016 (Jikan Importer with Strict SSRF Defense, Bounded Cache, and Atomic Commit):** Documented in `decisions.md`.
- **ADR-017 (Frontend Query & API Architecture):** Typed `ApiClient` class with TanStack Query caching and React context authentication.
- **ADR-018 (Library Export Streaming):** JSON and CSV export endpoints stream user-scoped relational data without leaking secrets.

---

## 6. Next Approved Task & Acceptance Criteria

### Next Task: Phase 06 — Hardening: Security, Accessibility, & Performance (Pending Review & Authorization)
**Prerequisite:** User review and formal approval of Phase 05 completion.

### Phase 06 Scope & Acceptance Criteria (Preview Only — Awaiting Authorization):
1. Complete server-side SSRF safeguards and file signature verification.
2. Conduct comprehensive accessibility (a11y) audit: full keyboard focus management, ARIA announcements, screen reader compatibility, and contrast compliance.
3. Optimize glassmorphism rendering and CSS backdrop-filter performance on lower-power devices.
4. Verify database backup and restore rehearsals.

---

## 7. Change Log by Task

### Phase 01 Task 1: Repository Foundation & Workspace Scaffold
- Initialized Git repository and created root `.gitignore` and `.env.example`.
- Created npm workspaces structure: `apps/web`, `apps/api`, `packages/shared`, `supabase/migrations`, `supabase/tests`, `docs`.
- Configured root `package.json` with scripts: `build`, `typecheck`, `lint`, `test`, `test:db`.
- Created `tsconfig.base.json` targeting ES2022 with Node 20+ LTS compatibility.
- Committed initial baseline commit `2d5b7dd`.

### Phase 01 Task 2–4: Schema, Migrations, RLS, and Seed Data
- Created migration `supabase/migrations/20261014000001_initial_schema.sql` (10 tables, domain constraints, check constraints, indexes, `updated_at` triggers).
- Created migration `supabase/migrations/20261014000002_security_policies.sql` (RLS enabled on all tables, cross-ownership enforcement on relationships).
- Created `supabase/seed.sql` with reproducible fictional test fixtures for anime, manga, and manhwa.

### Phase 01 Task 5–6: Verification & Development Quality Gates
- Created `packages/shared/test/schemas.test.js` validating domain validation logic (5 unit tests pass).
- Created `supabase/tests/database_verification.sql` and `scripts/verify-db.js`.
- Verified against live PostgreSQL database `animemanager_test`: all 18 database test assertions passed cleanly.
- Verified all root quality scripts (`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:db`).

### Phase 02: Backend Foundation & Core CRUD APIs
- Implemented layered architecture in `apps/api/src/`:
  - `config/index.ts`: Runtime configuration parsed with Zod, safe placeholder handling, zero secrets logged.
  - `errors/index.ts`: Standardized error hierarchy (`AppError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `DatabaseError`).
  - `repositories/db.ts`: Connection pooling via `pg.Pool`, transaction execution helper `db.transaction()`, health check `db.checkHealth()`.
  - `middleware/`: Request ID attribution (`X-Request-ID`), Supabase Auth token verification, input validation, centralized error handling.
  - `repositories/`: Safe parameterized queries with transaction wrappers for titles, collections, and bookmarks.
  - `services/`: Business validation for title operations, collection case-insensitive uniqueness, bookmark progress/rating rules, and cross-owner scoping.
  - `controllers/` & `routes/`: REST endpoints for `/health`, `/titles`, `/collections`, and `/bookmarks`.
- Implemented automated API integration test suite (`apps/api/test/`) using Supertest:
  - 35/35 integration tests pass cleanly against live database.
- Hardened database verification script `scripts/verify-db.js` with multi-factor safeguards to prevent targeting non-test databases.
- Verified full quality suite: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:api`, `npm run test:db`.

### Phase 03: Jikan Metadata Importer & Resilient Adapter
- Implemented Zod validation schemas and TypeScript types in `packages/shared/src/`:
  - `importSearchQuerySchema`, `importPreviewQuerySchema`, `importDraftSchema`, `importFieldSelectionSchema`, `importCommitSchema`.
  - Type definitions: `ImportCandidate`, `ImportDraft`, `ImportFieldSelection`, `ImportCommitInput`.
- Implemented strict SSRF-safe URL parser in `apps/api/src/services/import/url-parser.ts`:
  - Uses WHATWG `URL` parser; validates `https:`, hostname strictly `myanimelist.net`, port 443, no user/password.
  - Validates pathname regex `^\/(anime|manga)\/(\d+)(?:\/[^\/]+)?\/?$`; strips query and fragments; rejects lookalikes and IP literals.
  - Never passes client URLs to HTTP fetch.
- Implemented in-memory resilience utilities:
  - `cache.ts`: `BoundedTtlCache` with TTL expiration and LRU capacity eviction.
  - `throttler.ts`: `RequestThrottler` enforcing minimum time spacing between upstream requests (~3 req/s).
- Implemented typed Jikan v4 client in `apps/api/src/services/import/jikan.client.ts`:
  - Outbound URLs built strictly from `https://api.jikan.moe/v4/{endpoint}`.
  - `redirect: 'error'` preventing open redirects.
  - Bounded exponential backoff (max 3 retries, max delay 10s) with `Retry-After` header handling for HTTP 429 and 503.
  - Non-retryable 4xx rejection, 10s AbortSignal timeout, test fetch injection hooks.
- Implemented metadata normalizer in `apps/api/src/services/import/normalizer.ts`:
  - Normalizes search candidates and full detail records.
  - Manga vs. Manhwa classification: automatically selects `manhwa` for explicit manhwa types; flags ambiguous types with warning and `needsMediaConfirmation`.
  - Deduplicates aliases, genres, and tags.
  - Strictly excludes community reviews.
- Implemented import service, controller, and routes in `apps/api/src/`:
  - `GET /api/v1/import/jikan/search`: Authenticated, throttled candidate search.
  - `GET /api/v1/import/preview`: Authenticated, read-only preview with duplicate detection against `external_sources`.
  - `POST /api/v1/import/commit`: Authenticated, atomic transactional persistence enforcing server-side field selection and initial bookmark/collection creation.
- Implemented comprehensive automated test suite (64 tests in `apps/api`):
  - `test/import-url.test.js`: Adversarial SSRF, lookalike hosts, ports, query strings, paths, IDs.
  - `test/import-client.test.js`: 429 backoff, `Retry-After`, 503 backoff, 404 instant error, timeouts, cache TTL/LRU, throttler.
  - `test/import-normalizer.test.js`: Normalization, manhwa detection, ambiguous flags, null resilience, deduplication, review exclusion.
  - `test/import-api.test.js`: Supertest integration tests for auth, search, preview (no DB mutation), duplicate detection, field selection enforcement, atomic commit, rollback on failure, manual creation unaffected.
- Quality gates verified: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:api`, `npm run test:db`, `npm run build`.

### Phase 04 Part 1: Visual Foundation, Design System & Application Shell
- Configured Vite 5 + React 18 + TypeScript environment in `apps/web`:
  - Path alias `@/` mapping to `src/`.
  - Strict type checking with `tsc --noEmit`.
  - Production build producing optimized CSS and JS assets in `dist/`.
- Created comprehensive Vanilla CSS Design System inspired closely by the reference image:
  - `styles/tokens.css`: Typography (`Plus Jakarta Sans` & `Inter`), font scale (`--text-xs` to `--text-5xl`), weights, atmospheric dark blue-gray color palette (`--bg-base`, `--bg-deep`, `--bg-elevated`), glass surfaces (`--glass-light`, `--glass-mid`, `--glass-strong`, `--glass-hover`), borders, shadows, and 2:3 poster aspect ratio (`--poster-aspect`).
  - `styles/glassmorphism.css`: Multi-tiered glass surface utilities (`.glass`, `.glass-sm`, `.glass-mid`, `.glass-strong`, `.glass-interactive`, `.glass-card`), subtle SVG noise/grain layer, top highlights, and graceful `@supports not (backdrop-filter)` fallback to opaque panels.
  - `styles/animations.css`: Keyframes for `fadeUp`, `scaleIn`, `shimmer`, `spin`, `pulse-soft`, and `orb-float` with full `prefers-reduced-motion` overrides.
  - `styles/global.css`: CSS reset, accessible focus ring (`:focus-visible`), selection styling, screen-reader-only utility (`.sr-only`), and ambient light orbs.
- Created Application Shell components:
  - `components/layout/AppShell.tsx`: Root shell container with ambient lighting orbs, sidebar, header, and animated main view container.
  - `components/layout/Header.tsx`: Fixed frosted glass header with brand title, center pill navigation (`Dashboard`, `Bookmarks`, `My List`, `Collections`, `Titles`), quick search bar, notification button, avatar button, and Add Title button.
  - `components/layout/Sidebar.tsx`: Desktop fixed sidebar navigation containing active route indication, brand mark, top-level routes (`Dashboard`, `Bookmarks`, `My List`, `Collections`, `Titles`), and bottom Settings link (omits Import from primary nav).
  - `components/layout/MobileNav.tsx`: Bottom navigation bar appearing automatically on screens $\le$ 768px with touch-friendly navigation targets.
- Created 8 Reusable Shared UI Components:
  - `Button`: Sizes (`sm`, `md`, `lg`), variants (`primary`, `secondary`, `ghost`, `danger`, `success`), loading spinner, and icon slots.
  - `Badge`: Pill badge supporting domain media types (`anime`, `manga`, `manhwa`) and semantic variants (`default`, `primary`, `success`, `warning`, `danger`, `info`).
  - `Input`: Accessible input with floating label, error state (`role="alert"`, `aria-invalid`), hint slot, and left/right icon slots.
  - `GlassCard`: Polymorphic container component with padding variants (`none`, `sm`, `md`, `lg`) and optional keyboard-accessible interactive button mode.
  - `PosterCard`: Portrait card enforcing 2:3 aspect ratio, cover image loading with error fallback to initials/media-type placeholder, hover overlay reveal, title truncation, star rating with amber star (`★ 9.1`), and year.
  - `EmptyState`: Library empty state container with icon, title, description, and call-to-action button (`role="status"`).
  - `LoadingState`: Frosted glass loading container with spinning ring, pulsing orb, and accessible live region.
  - `ErrorState`: Alert container with danger icon, error message, and retry button (`role="alert"`).
  - `components/ui/index.ts`: Centralized barrel export for all UI components.
- Created Dashboard Page (`pages/Dashboard.tsx` & `pages/Dashboard.css`):
  - Page header with clear library mission and quick action buttons.
  - Dual spotlight hero cards (Anime & Manhwa) with play/action pill buttons, tags, ratings, and atmospheric artwork.
  - Category filter pills row (`All Titles`, `Anime`, `Manga`, `Manhwa`, `Trending`, `Plan to Watch`) with active luminous pill state and interactive filtering.
  - Section header with sort icon pill and view-all catalog link.
  - 6-column portrait poster grid displaying representative titles with ratings and badges.
  - Overview navigation cards to Bookmarks, My List, and Collections.
- Created Route Placeholder Pages:
  - `pages/BookmarksPage.tsx`: Status tabs navigation (`All`, `In Progress`, `Plan to Watch`, `Completed`, `On Hold`, `Dropped`) with zero-state badges and empty state.
  - `pages/MyListPage.tsx`: Personal collections/folders overview with empty state and create collection CTA.
  - `pages/CollectionsPage.tsx`: Themed collections and multi-title groupings with suggested theme cards and create collection CTA.
  - `pages/TitlesPage.tsx`: Full catalog search input and dual-action empty state.
  - `pages/ImportPage.tsx`: MyAnimeList import search input and preview guide.
  - `pages/SettingsPage.tsx`: Application preferences cards with structured feature sections.
  - `pages/NotFoundPage.tsx`: Accessible 404 page with return-to-dashboard CTA.
- Created Automated Frontend Unit/Integration Test Suite:
  - `apps/web/test/design-system.test.js`: Verifies typography, colors, glass surfaces, radii, 2:3 aspect ratio, and reduced motion.
  - `apps/web/test/components.test.js`: Verifies barrel exports, image fallback handling, form accessibility, and status roles.
  - `apps/web/test/routes-and-navigation.test.js`: Verifies router registration, navigation boundaries, page title mappings, and Dashboard features.
  - 11/11 tests pass with zero failures.
- Quality Gates Verified:
  - `npm run lint` — Clean across all 3 workspaces.
  - `npm run typecheck` — 0 TypeScript errors across all workspaces.
  - `npm test` — 80 total tests pass (5 shared, 64 API, 11 web).
  - `npm run build` — Clean production bundle for shared, api, and web.
  - `npm run test:db` — 18/18 database assertions pass.

### Phase 04 Part 2: Interactive Catalog UI, Search, Filters & Navigation
- Created typed demonstration dataset `src/data/demo.ts` with 12 balanced sample titles across anime, manga, and manhwa, bookmark statuses, genres, ratings, and query functions (`searchTitles`, `filterByMediaType`, `filterByBookmarkStatus`, `sortTitles`, `countByStatus`).
- Implemented shared `FilterChips` component (`FilterChips.tsx`, `FilterChips.css`) with accessible radiogroup/radio ARIA bindings, active pills, counts, and horizontal scroll capability.
- Implemented shared `SortControl` component (`SortControl.tsx`, `SortControl.css`) with styled trigger and native select overlay for keyboard and mobile accessibility.
- Implemented shared `AddTitleModal` component (`AddTitleModal.tsx`, `AddTitleModal.css`) with clear non-persistent preview disclosure, disabled submit button ("Save Title (Phase 05)"), and native dialog focus trapping.
- Upgraded `TitlesPage` with real-time substring search, clear query button, media-type filter chips, 6 sort modes, empty-catalog and no-results states, and URL search parameter sync via `useSearchParams` (`?q=...`).
- Upgraded `BookmarksPage` with functional status filtering tabs (All, In Progress, Plan to Watch, Completed, On Hold, Dropped), dynamic item counts, status-labeled poster cards, and empty state per category.
- Fixed `MyListPage` and `CollectionsPage` headings and semantic clarity; added collection theme ideas and non-persistent preview modal for creating collections.
- Upgraded `Dashboard` to filter showcase items by category/top-rated/planning using `FilterChips`, wired honest navigation shortcuts to `/titles`, `/bookmarks`, `/my-list`, and `/collections`.
- Connected `Header` search form to navigate to `/titles?q=...` on submit; wired `Add` button to open `AddTitleModal` preview; linked avatar to `/settings`; disabled decorative notification button with honest tooltip.
- Resolved `PosterCard` image fallback using `imgFailed` state so failed images render stylized gradients with title initials.
- Created automated test suite `interactive-catalog.test.js` validating all 10 required catalog behaviors (21/21 frontend tests pass).

### Phase 04 Part 3: Frontend Verification, Responsive QA & Phase Gate
- Verified all 8 application routes (`/`, `/titles`, `/bookmarks`, `/my-list`, `/collections`, `/import`, `/settings`, and `*` 404).
- Audited responsive presentation across target viewports:
  - 360px & 390px (Mobile): Verified 2-column poster grids, icon-only header add button, full-width stacked action buttons, `min-width: 0` header search container, modal padding reduction to `var(--space-4)`, and bottom safe area padding.
  - 768px (Tablet): Verified sidebar hiding, mobile bottom navigation appearance, 3-column poster grid, and spotlight content adjustments.
  - 1024px (Tablet/Desktop Transition): Verified center pill navigation gracefully hiding at <=1080px to avoid search collision while sidebar provides navigation, and 4-column poster grid.
  - 1440px (Desktop): Verified full desktop layout, 6-column poster showcase, dual spotlight hero cards, and center pill navigation.
- Added backdrop click and Escape key dismissal handlers to the New Collection dialog in `CollectionsPage.tsx`.
- Added accessible Escape key blurring/clearing to global search (`Header.tsx`) and catalog search (`TitlesPage.tsx`).
- Added honest Phase 05 preview notice banner and disabled search button on `/import` (`ImportPage.tsx`) to clearly identify importer features as non-persistent.
- Created comprehensive verification and responsive QA test suite `apps/web/test/verification-qa.test.js` adding 11 automated checks.
- Verified all quality gates across the monorepo: `npm run lint`, `npm run typecheck` (0 errors), `npm test` (101/101 pass: 5 shared, 64 API, 32 web), `npm run build` (clean dist bundles), `npm run test:api` (64/64 pass), and `npm run test:db` (18/18 live database assertions pass).
- Verified Git working tree and documentation reconciliation.

### Phase 05: Full-Stack Integration & Core Library Workflows
- Integrated TanStack Query (`@tanstack/react-query`) with typed `ApiClient` (`apps/web/src/lib/api-client.ts`) and custom `ApiError` class.
- Implemented `AuthProvider` and `useAuth` hook (`apps/web/src/lib/auth-context.tsx`) with localStorage token sync, claims parsing (`sub`, `email`), and fallback token integration.
- Built `TitleDetailPage` (`/titles/:id`) featuring hero cover banner, metadata badges, interactive bookmark stepper, collection assignment picker, metadata edit modal, and confirmed deletion dialog (`DELETE /api/v1/titles/:id?confirm=true`).
- Upgraded `AddTitleModal` to persist titles via `api.titles.create` with full field coverage.
- Upgraded `TitlesPage` and `Dashboard` to fetch live data with search, media filtering, and sorting.
- Implemented collection CRUD and multi-collection title membership in `CollectionsPage` and `MyListPage`, upholding the core domain invariant that collection deletion never deletes titles or bookmarks.
- Implemented live bookmark tracking in `BookmarksPage` and `TitleDetailPage`, supporting status tabs, chapter/episode progress stepper, and personal ratings (0.0–10.0).
- Connected `ImportPage` to `/api/v1/import/jikan/search`, `/preview`, and `/commit` with candidate selection, metadata preview, editable fields, duplicate MAL import warning banners, manga vs manhwa disambiguation, and atomic commit navigation.
- Implemented JSON and CSV export endpoints in Express (`apps/api/src/routes/export.routes.ts`, `controllers/export.controller.ts`, `services/export.service.ts`) and download triggers in `SettingsPage`, strictly scoped to the requesting owner.
- Added `apps/web/test/phase05-workflows.test.js` (8 tests) and `apps/api/test/export.test.js` (4 tests). Total monorepo tests increased to 113/113 passing (5 shared + 68 API + 40 web).

### Phase 05.1: Local Startup, API Connectivity & Runtime Verification
- Diagnosed and fixed `ECONNREFUSED` / HTTP 500 error caused by missing backend process in web-only dev workflow and macOS IPv6/IPv4 loopback delay (`::1` vs `127.0.0.1`).
- Established zero-dependency concurrent runner `scripts/dev.js` (`npm run dev`) compiling API TypeScript and concurrently spawning Express API (port 4000) and Vite frontend (port 5173) with formatted terminal labels (`[api]`, `[web]`), graceful shutdown (`SIGINT`/`SIGTERM`), and port conflict checks.
- Created `scripts/healthcheck.js` (`npm run healthcheck`) verifying API reachability, PostgreSQL database connection, and Vite proxy forwarding.
- Aligned Vite proxy target to `http://127.0.0.1:4000` to prevent IPv6 loopback delay.
- Created `docs/LOCAL_DEVELOPMENT.md` and root `README.md` startup guides.
- Verified live HTTP requests across `/api/v1/health`, authenticated `/api/v1/titles`, `/collections`, and `/bookmarks`.

### Phase 05.2: Authentication, JWT Lifecycle & Protected Workflow Repair
- Diagnosed root causes of browser HTTP 401 (`Invalid or expired authentication token`):
  1. Static `VITE_AUTH_TOKEN` in `.env` had expired (`jwt expired`).
  2. Hardcoded fallback token in `auth-context.tsx` was signed with an invalid key (`invalid signature`).
  3. Browser `localStorage` persisted the expired/invalid token without verifying `exp`, causing every browser request to fail.
- Implemented guarded backend development session endpoint (`GET /api/v1/auth/dev-session`, `POST /api/v1/auth/dev-token`):
  - Issues fresh 24-hour signed JWT strictly bound to seeded owner `00000000-0000-0000-0000-000000000001`.
  - Client-supplied owner IDs in body/query are strictly ignored.
  - Guarded by `ENABLE_DEV_AUTH=true`; startup throws fatal error if enabled in `production`.
  - Test signing secret never used as production fallback.
- Enhanced backend JWT middleware error handling to distinguish `TokenExpiredError` ("token has expired") and `JsonWebTokenError` ("signature verification failed") while retaining the expected message prefix.
- Upgraded `ApiClient` and `AuthProvider`:
  - Added `parseJwtPayload()` and `isTokenExpired()` with 10s clock-skew buffer.
  - Pruned expired tokens automatically from `localStorage` on client startup and token setting.
  - Dynamically fetched fresh dev session on startup in development mode (`import.meta.env.DEV`).
  - Debounced 401 recovery (15-second throttle) to prevent infinite retry loops.
  - Guaranteed mutations (`POST`/`PUT`/`DELETE`) never retry automatically on 401.
- Updated `SettingsPage`:
  - Added transparent session origin display ("Local Development Session" badge vs "Authenticated Session").
  - Displayed active owner UUID.
  - Added "Refresh Dev Session" button to manually renew the dev token.
  - Displayed honest alert banner when authentication errors occur.
- Verified zero backend secrets leaked into the production frontend bundle (`npm run build`).
- Added automated regression tests:
  - 3 new backend authentication tests in `apps/api/test/auth.test.js` (total 71 API tests pass).
  - 6 new frontend lifecycle tests in `apps/web/test/auth-lifecycle.test.js` (total 46 web tests pass).
- Monorepo automated test count increased to 122/122 passing (5 shared + 71 API + 46 web).

### Phase 05.3: Jikan Import Search Connectivity & Error Diagnostics
- Diagnosed root cause of `502 Bad Gateway` / `Failed to connect to MyAnimeList: fetch failed`:
  - Upstream DNS resolves `api.jikan.moe` to `135.181.39.91` and `2a01:4f9:c010:b863::1` (Hetzner, Helsinki).
  - Traceroute reached Helsinki border router (`65.108.118.169`) then encountered 100% packet loss to `135.181.39.91`.
  - Node.js `fetch` threw `TypeError: fetch failed` with `[cause]: ConnectTimeoutError (UND_ERR_CONNECT_TIMEOUT, AggregateError [ETIMEDOUT])`.
  - The legacy client previously ignored `err.cause`, swallowed error codes, and threw a generic `ExternalProviderUnavailableError('Failed to connect to MyAnimeList: fetch failed')` returning HTTP 502 with the raw "fetch failed" string to the browser.
- Upgraded backend Jikan client (`apps/api/src/services/import/jikan.client.ts`):
  - Implemented `classifyNetworkError(err)` categorizing errors into 8 explicit categories: `UPSTREAM_DNS_ERROR`, `UPSTREAM_CONNECTION_ERROR`, `UPSTREAM_TLS_ERROR`, `UPSTREAM_TIMEOUT`, `UPSTREAM_RATE_LIMITED`, `UPSTREAM_UNAVAILABLE`, `UPSTREAM_BAD_RESPONSE`, `UPSTREAM_INVALID_PAYLOAD`.
  - Upstream connection timeouts and abort signals now throw `ExternalProviderTimeoutError` returning HTTP 504 `EXTERNAL_PROVIDER_TIMEOUT`.
  - Outbound DNS resolution failures and connection refusals throw `ExternalProviderUnavailableError` returning HTTP 502 `EXTERNAL_PROVIDER_UNAVAILABLE`.
  - Replaced raw `fetch failed` error strings with human-friendly diagnostics ("Connection to MyAnimeList timed out. The upstream server is not responding.") and structured error details (`[{ category, reason, retryable }]`).
  - Added sanitized upstream diagnostic logging: `[Jikan Upstream Error] requestId=... category=... attempt=... duration=... reason=...` (never logs authorization headers, cookies, or secrets).
  - Wired `requestId` through `import.controller.ts` -> `import.service.ts` -> `jikan.client.ts`.
- Upgraded frontend Importer UI (`apps/web/src/pages/ImportPage.tsx`):
  - Added `getSearchErrorTitle(err)` and `getSearchErrorMessage(err)` mapping HTTP 504 -> "Upstream Connection Timed Out", HTTP 502 -> "MyAnimeList Service Unavailable", and sanitizing any raw `fetch failed` string into actionable advice ("MyAnimeList search is temporarily unavailable. Please try again shortly.").
  - Added preview mutation error state handling with retry support and clear alert banner.
  - Suppressed stale `candidates` from prior queries whenever `searchError` is active.
  - Enforced search submission concurrency guards (`if (isSearching || previewMutation.isPending) return;`).
  - Added `.catch(() => {})` on `executeSearch()` to eliminate unhandled console rejections.
- Implemented standalone live probe script (`scripts/test-jikan-live.js` via `npm run test:jikan:live`):
  - Probes DNS A/AAAA records, TCP handshake on port 443, and Jikan v4 API queries, reporting latency, packet drop, or success with zero dependencies.
- Added comprehensive regression tests:
  - 6 new client tests in `apps/api/test/import-client.test.js` (network error classification, bad JSON, invalid schema, DNS error, timeout, cache exclusion on failure).
  - 3 new API tests in `apps/api/test/import-api.test.js` (504 timeout formatting, 502 DNS failure formatting, empty search results).
  - 5 new frontend tests in `apps/web/test/import-workflows.test.js` (sanitization of `fetch failed`, error title mapping, candidate suppression on failure, concurrency guard, preview error state).
- Monorepo automated test count increased to **136 / 136 passing** (5 shared + 80 API + 51 web).

### Phase 05.4: Definitive Jikan Diagnosis, Import Recovery & Full Technical Report
- Executed timestamped multi-layer network diagnostic protocol across DNS, TCP sockets, TLS handshakes, system `curl`, Node.js Undici, and application routes:
  - Verified DNS resolution succeeds across OS default and secondary (Google 8.8.8.8) resolvers (`135.181.39.91` and `2a01:4f9:c010:b863::1`).
  - Verified IPv4 TCP handshake to `135.181.39.91:443` times out with 0 response.
  - Verified system `curl -v -m 5` times out with error code 28 (`Operation timed out after 5006ms`).
  - Verified Node.js `fetch` throws `ConnectTimeoutError (UND_ERR_CONNECT_TIMEOUT)` after attempting both addresses.
  - Verified general outbound HTTPS connectivity from this exact host machine is 100% operational (`google.com`: 174ms, `api.github.com`: 262ms, `1.1.1.1`: 280ms, `myanimelist.net`: 975ms).
  - Corroborated with upstream `jikan-me` GitHub repository announcements: **the public hosted service at `api.jikan.moe` was officially retired and discontinued on October 1, 2026**.
- Created comprehensive standalone root technical deliverable: `JIKAN_IMPORT_DIAGNOSTIC_REPORT.md` containing all 16 required sections formatted for independent review by engineers or ChatGPT.
- Enhanced `scripts/test-jikan-live.js` (`npm run test:jikan:live`):
  - Probes OS default IPv4 and IPv6 DNS records.
  - Compares with Google 8.8.8.8 DNS resolver.
  - Evaluates TCP socket connectivity on port 443 with explicit timeout.
  - Reports actionable self-hosted Docker instructions if public host is down.
- Added regression test in `apps/api/test/import-client.test.js` validating custom `JIKAN_BASE_URL` routing for private self-hosted Jikan instances.
- Monorepo automated test count increased to **137 / 137 passing** (5 shared + 81 API + 51 web).

### Phase 05.5: Migration from Discontinued Jikan API to Tenrai v1 & Live Import Recovery
- Investigated official Jikan community recommendation ([jikan-me/jikan-rest#613](https://github.com/jikan-me/jikan-rest/issues/613)) and migrated to **Tenrai v1 API** (`https://api.tenrai.org/v1`), which serves Jikan v4-compatible REST endpoints for the public MyAnimeList catalog.
- Conducted independent multi-layer live diagnostics verifying:
  - DNS resolution to Cloudflare Anycast (`104.21.4.236`, `172.67.154.63`).
  - TLSv1.3 handshake with Let's Encrypt certificate valid through Dec 2026.
  - Live anime searches ("Frieren", "Naruto"), manga search ("Berserk"), manhwa search ("Solo Leveling"), full detail retrieval by ID, zero-result queries, and parameter validation.
- Refactored `apps/api/src/services/import/jikan.client.ts` into a provider-neutral `MetadataClient` (retaining `JikanClient` backward-compatibility alias):
  - Added safe URL construction using `new URL()` and `URLSearchParams` to prevent double-slashes or unwanted `/v4` concatenation.
  - Integrated 350ms inter-request throttling (`RequestThrottler`) to comply with Tenrai's 4 rps public ceiling.
  - Retained `BoundedTtlCache` with 5-minute TTL and failure cache exclusion.
- Updated environment configuration (`apps/api/src/config/index.ts` & `.env.example`):
  - Added `METADATA_API_BASE_URL` with default `https://api.tenrai.org/v1`.
  - Added precedence-based fallback: respects legacy `JIKAN_BASE_URL` if set to a custom host (e.g., self-hosted Jikan container); automatically warns and falls back to Tenrai v1 if pointing to discontinued `api.jikan.moe`.
- Upgraded frontend error handling in `apps/web/src/pages/ImportPage.tsx`:
  - Granular error categorization (504 timeout, 502/503 service unavailable, 429 rate limit, 401/403 auth, 400/422 validation, network issues).
  - Preserved upstream `requestId` in error alerts without leaking stack traces.
  - Integrated direct "Create Title Manually Instead" fallback action across error and empty states.
- Created `scripts/test-tenrai-live.js` (`npm run test:metadata:live`) providing automated live diagnostic verification across DNS, TLS, search, and detail endpoints.
- Executed real live end-to-end integration test through Vite proxy (`:5173` -> `:4000` -> PostgreSQL):
  - Verified live search, candidate preview, editorial title modification ("Naruto (Import Verified)"), and atomic commit to authenticated library (`00000000-0000-0000-0000-000000000001`).
  - Verified duplicate prevention on re-commit (409 `DuplicateImportError`).
  - Verified manual title creation remains 100% operational offline.
- Created comprehensive root deliverable: **`IMPORT_PROVIDER_MIGRATION_REPORT.md`** containing all 24 required sections.
- Added regression tests in `apps/api/test/import-client.test.js` validating `MetadataClient`, safe URLSearchParams construction, and whitespace query rejection.
- Monorepo automated test count increased to **139 / 139 passing** (5 shared + 83 API + 51 web), plus 18 database assertions = **157 / 157 total passing checks**.
