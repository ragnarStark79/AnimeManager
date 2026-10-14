# AnimeManager — Project Build Progress Tracker

## 1. Project Overview & Current Status

**Project Name:** AnimeManager (Personal Media Library)  
**Description:** A private-first personal catalog and tracking application for anime, manga, and manhwa. The application strictly distinguishes between **My List** (user-defined collections/folders) and **Bookmarks** (watch/read tracking status and progress). It integrates with MyAnimeList via the Jikan API for metadata import with preview and editing before saving, storing local copies in Supabase PostgreSQL and cover images in Supabase Storage. The visual aesthetic follows a modern, responsive glassmorphism design.

- **Current Project Status:** Active Development
- **Current Active Phase:** **Phase 02: Backend Foundation & Core CRUD APIs**
- **Phase 02 Status:** **COMPLETED** (Verified with Automated API Integration Tests & Quality Gates)
- **Next Phase:** **Phase 03: Jikan Metadata Importer & Resilient Adapter** (Awaiting user authorization)

---

## 2. Phase Tracker & Completion Summary

| Phase | Description | Status | Completion Criteria / Gate |
|---|---|---|---|
| **Phase 00** | Workspace Inspection & Project Setup | **COMPLETED** | Workspace verified clean; technical specs thoroughly reviewed; tracking and architecture documentation created; baseline commands inspected; git and safety practices established. |
| **Phase 01** | Repository Foundation & Database Schema | **COMPLETED** | Monorepo scaffold initialized with npm workspaces; TypeScript base configs created; Supabase migrations (`000001_initial_schema.sql`, `000002_security_policies.sql`), triggers, RLS policies, seed fixtures, and test assertions verified against live PostgreSQL (18/18 assertions pass; 5/5 schema unit tests pass). |
| **Phase 02** | Backend Foundation & Core CRUD APIs | **COMPLETED** | Express API initialized with TypeScript, Zod validation, structured error handling, request ID logging, security headers (Helmet/CORS), JWT authentication, and owner scoping; CRUD endpoints for titles, collections, memberships, and bookmarks implemented and verified with integration tests (35/35 integration tests pass; 18/18 database assertions pass). |
| **Phase 03** | Jikan Metadata Importer & Resilient Adapter | **NOT STARTED** | Resilient Jikan v4 adapter implemented with MAL URL/ID parsing, search, normalization, draft preview, duplicate detection, field selection, timeouts, rate limiting, and caching; unit/integration tests with mocked payloads pass. |
| **Phase 04** | Frontend Foundation & Glassmorphism Design System | **NOT STARTED** | Vite + React + TypeScript shell configured; custom CSS design tokens, glassmorphism surface utilities, typography, responsive layout shell (desktop/mobile), route structure, and shared UI components established; verified responsive across viewports. |
| **Phase 05** | Product Workflows & End-to-End Integration | **NOT STARTED** | UI connected to backend APIs; manual title creation/editing, collection management, bookmark tracking with progress, cover upload/URL, search/filter/sort, import preview/commit, and JSON/CSV export operational. |
| **Phase 06** | Hardening: Security, Accessibility, & Performance | **NOT STARTED** | Server-side SSRF safeguards, image upload signature verification, accessibility audit (keyboard nav, ARIA, color contrast), glassmorphism performance optimization, and backup/restore rehearsal completed. |
| **Phase 07** | Deployment Preparation & Production Verification | **NOT STARTED** | Frontend deployed to Vercel; Express API deployed to compatible Node host; Supabase production instance configured with RLS and Storage policies; smoke tests pass; rollback plan verified. |

---

## 3. Work Completed vs. Work Not Yet Started

### Completed Work (Phases 00, 01, & 02)
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
  - `config/`: Validated environment variables via Zod.
  - `errors/`: Consistent `AppError` taxonomy (`ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `DatabaseError`).
  - `middleware/`: Request ID tracking (`X-Request-ID`), Supabase JWT verification (`auth.middleware.ts`), Zod request validation, centralized error handling (`error.middleware.ts`).
  - `repositories/`: Safe parameterized database access via `pg.Pool`, transaction wrapping (`titles.repository.ts`, `collections.repository.ts`, `bookmarks.repository.ts`).
  - `services/`: Business rules, case-insensitive collection uniqueness, progress-total validation, owner scoping (`titles.service.ts`, `collections.service.ts`, `bookmarks.service.ts`).
  - `controllers/` & `routes/`: REST endpoints for Health, Titles (CRUD, search, pagination, sort, confirmed delete), Collections (CRUD, multi-membership, order), and Bookmarks (CRUD, status tabs, upsert).
- [x] API integration test suite implemented (`apps/api/test/`) using Node test runner and Supertest:
  - 35/35 integration tests pass covering authentication, owner isolation, cross-owner security, CRUD, pagination, and health.
- [x] Quality gates verified: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:api`, `npm run test:db` all pass with zero errors.

### Work Not Yet Started (Phases 03–07)
- [ ] Jikan API provider adapter, URL parsers, and normalization logic (Phase 03).
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
| **Unit Tests** | `npm test` | **PASS** | 5 schema unit tests pass: media type enum, bookmark status, title required fields, collection name trimming, progress/rating bounds. |
| **API Integration Tests** | `npm run test:api` | **PASS** | 35 integration tests pass using Supertest against live database: auth rejection, owner isolation, title CRUD/search/filter, collection uniqueness/membership, bookmark upsert/validation, health endpoint. |
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
   - Upstream rate limits (~3 req/s) require server-side caching and backoff in Phase 03.

### Decisions Resolved in Phase 01
- **ADR-001 (RLS Cross-Ownership Enforcement):** In `20261014000002_security_policies.sql`, relationship join tables (`title_collections`, `title_tags`, `bookmarks`) enforce that the user must own both the parent container AND the title before inserting.
- **ADR-006 (Case-Insensitive Collection Uniqueness):** Enforced via unique index `uq_collections_owner_lower_name ON collections(owner_id, lower(trim(name)))`.
- **ADR-008 (Personal Rating Canonical Location):** Confirmed on `bookmarks.personal_rating` (numeric between 0.0 and 10.0).

---

## 6. Next Approved Task & Acceptance Criteria

### Next Task: Phase 03 — Jikan Metadata Importer & Resilient Adapter
**Prerequisite:** User review and formal approval of Phase 02 completion.

### Phase 03 Acceptance Criteria:
1. Resilient Jikan REST client module implementing timeouts (10s), exponential backoff for HTTP 429/503, and in-memory caching.
2. SSRF-safe URL parser for MyAnimeList URLs (`myanimelist.net/anime/:id/...` and `myanimelist.net/manga/:id/...`), rejecting any arbitrary external URLs.
3. Metadata normalization mapping MAL anime and manga payloads into internal draft models (English, original, romanized aliases, release year, status, episode/chapter counts, source score/rank, genres, tags).
4. MAL manga vs manhwa disambiguation logic with user confirmation flag.
5. Endpoints:
   - `GET /api/v1/import/jikan/search`
   - `GET /api/v1/import/preview`
   - `POST /api/v1/import/commit`
6. Community reviews strictly excluded from import payloads.
7. Automated tests with mocked Jikan payloads verifying normalization, rate-limit backoff, duplicate detection, and network failure fallback.

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
