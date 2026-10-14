# AnimeManager — Project Build Progress Tracker

## 1. Project Overview & Current Status

**Project Name:** AnimeManager (Personal Media Library)  
**Description:** A private-first personal catalog and tracking application for anime, manga, and manhwa. The application strictly distinguishes between **My List** (user-defined collections/folders) and **Bookmarks** (watch/read tracking status and progress). It integrates with MyAnimeList via the Jikan API for metadata import with preview and editing before saving, storing local copies in Supabase PostgreSQL and cover images in Supabase Storage. The visual aesthetic follows a modern, responsive glassmorphism design.

- **Current Project Status:** Active Development
- **Current Active Phase:** **Phase 03: Jikan Metadata Importer & Resilient Adapter**
- **Phase 03 Status:** **COMPLETED** (Verified with 64 Automated Tests & Quality Gates)
- **Next Phase:** **Phase 04: Frontend Foundation & Glassmorphism Design System** (Awaiting user authorization)

---

## 2. Phase Tracker & Completion Summary

| Phase | Description | Status | Completion Criteria / Gate |
|---|---|---|---|
| **Phase 00** | Workspace Inspection & Project Setup | **COMPLETED** | Workspace verified clean; technical specs thoroughly reviewed; tracking and architecture documentation created; baseline commands inspected; git and safety practices established. |
| **Phase 01** | Repository Foundation & Database Schema | **COMPLETED** | Monorepo scaffold initialized with npm workspaces; TypeScript base configs created; Supabase migrations (`000001_initial_schema.sql`, `000002_security_policies.sql`), triggers, RLS policies, seed fixtures, and test assertions verified against live PostgreSQL (18/18 assertions pass; 5/5 schema unit tests pass). |
| **Phase 02** | Backend Foundation & Core CRUD APIs | **COMPLETED** | Express API initialized with TypeScript, Zod validation, structured error handling, request ID logging, security headers (Helmet/CORS), JWT authentication, and owner scoping; CRUD endpoints for titles, collections, memberships, and bookmarks implemented and verified with integration tests (35/35 integration tests pass; 18/18 database assertions pass). |
| **Phase 03** | Jikan Metadata Importer & Resilient Adapter | **COMPLETED** | Resilient Jikan v4 client with bounded retries, Retry-After header, request throttler, bounded TTL/LRU cache; strict URL/SSRF parser; metadata normalizer with explicit/ambiguous manhwa disambiguation and review data exclusion; read-only preview with duplicate detection; atomic transactional commit enforcing field selection (64/64 tests pass). |
| **Phase 04** | Frontend Foundation & Glassmorphism Design System | **NOT STARTED** | Vite + React + TypeScript shell configured; custom CSS design tokens, glassmorphism surface utilities, typography, responsive layout shell (desktop/mobile), route structure, and shared UI components established; verified responsive across viewports. |
| **Phase 05** | Product Workflows & End-to-End Integration | **NOT STARTED** | UI connected to backend APIs; manual title creation/editing, collection management, bookmark tracking with progress, cover upload/URL, search/filter/sort, import preview/commit, and JSON/CSV export operational. |
| **Phase 06** | Hardening: Security, Accessibility, & Performance | **NOT STARTED** | Server-side SSRF safeguards, image upload signature verification, accessibility audit (keyboard nav, ARIA, color contrast), glassmorphism performance optimization, and backup/restore rehearsal completed. |
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
- [x] Quality gates verified: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:api`, `npm run test:db` all pass with zero errors.

### Work Not Yet Started (Phases 04–07)
- [ ] React frontend, Vite configuration, glassmorphism CSS design system, and route pages (Phase 04).
- [ ] End-to-end integration of collections, bookmarks, title details, and import workflows (Phase 05).
- [ ] Security, accessibility, and performance hardening audits (Phase 06).
- [ ] Production deployments on Vercel and Node host with Supabase (Phase 07).

---

## 4. Verification & Testing Log

| Target | Command | Status | Result / Notes |
|---|---|---|---|
| **Linting** | `npm run lint` | **PASS** | Checked across workspaces; clean execution with 0 warnings. |
| **Type Checking** | `npm run typecheck` | **PASS** | Strict TypeScript compiler verified across `shared`, `api`, `web` with 0 type errors. |
| **Unit Tests** | `npm test` | **PASS** | 5 schema unit tests pass in `shared`; 64 tests pass in `api` (total 69 tests pass). |
| **API Integration Tests** | `npm run test:api` | **PASS** | 64 tests pass in `apps/api` using Node test runner against isolated test database. |
| **Production Build** | `npm run build` | **PASS** | All workspaces compile cleanly to `dist/` with declaration maps and sources. |
| **Database Verification** | `npm run test:db` | **PASS** | 18 assertions pass against live PostgreSQL: 10 tables, triggers, constraints, multi-collection membership, cascade deletions, and cross-owner RLS policies. |
| **Git Safety** | `git status` | **PASS** | Clean staging; `.env`, `node_modules`, and build artifacts strictly ignored. |

---

## 5. Outstanding Decisions, Required Credentials, & Dependencies

### External Service Dependencies
1. **Supabase PostgreSQL & Storage:**
   - Production / staging Supabase credentials (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_ANON_KEY`) needed when deploying to hosted Supabase.
   - Storage bucket `covers` to be provisioned in hosted Supabase prior to Phase 05.
2. **Jikan REST API v4:**
   - Upstream rate limits (~3 req/s) handled via in-memory throttler, bounded backoff, and TTL/LRU cache in Phase 03.

### Decisions Resolved in Phase 01 & 02 & 03
- **ADR-001 (RLS Cross-Ownership Enforcement):** In `20261014000002_security_policies.sql`, relationship join tables enforce mutual ownership before inserting.
- **ADR-006 (Case-Insensitive Collection Uniqueness):** Enforced via unique index `uq_collections_owner_lower_name ON collections(owner_id, lower(trim(name)))`.
- **ADR-008 (Personal Rating Canonical Location):** Confirmed on `bookmarks.personal_rating` (numeric between 0.0 and 10.0).
- **ADR-016 (Jikan Importer with Strict SSRF Defense, Bounded Cache, and Atomic Commit):** Documented in `decisions.md`.

---

## 6. Next Approved Task & Acceptance Criteria

### Next Task: Phase 04 — Frontend Foundation & Glassmorphism Design System
**Prerequisite:** User review and formal approval of Phase 03 completion.

### Phase 04 Acceptance Criteria:
1. Configure Vite + React + TypeScript shell in `apps/web`.
2. Implement Vanilla CSS design system (`styles/tokens.css`, `styles/glassmorphism.css`) adhering to Flix.id cool blue/gray translucent aesthetic.
3. Establish primary navigation shell featuring **My List** and **Bookmarks** as top-level destinations.
4. Build reusable UI components (GlassCard, Button, Dialog/Modal, Input, Badge, PosterCard, Dropdown).
5. Verify responsive layout across mobile (360px), tablet (768px), and desktop (1024px+).
6. Implement theme provider, accessible focus states, and reduced-motion support.

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
