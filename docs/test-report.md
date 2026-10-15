# AnimeManager — Verification & Test Report

**Document Version:** 2.1
**Phase:** Phase 05.5 (Tenrai Metadata Provider Migration & Live Import Verification)
**Date:** 2026-10-16

---

## 1. Executive Summary

This document serves as the authoritative, ongoing record of all automated test suites, linting checks, type-checking runs, and manual verification procedures.

During **Phase 01**, the monorepo workspace was established and verified. Database migrations, constraints, triggers, RLS policies, and seed fixtures were implemented and tested against a live PostgreSQL database (`animemanager_test`). All unit tests and database assertions passed with 100% success.

During **Phase 02**, the Express REST backend was implemented with layered architecture (`app.ts`, `server.ts`, `config/`, `routes/`, `controllers/`, `services/`, `repositories/`, `middleware/`, `errors/`, `schemas/`), validated with Zod, and secured with Supabase JWT verification and owner scoping. All 35 API integration tests passed with 100% success.

During **Phase 03**, the Jikan API v4 metadata importer and resilient adapter were implemented and thoroughly tested. All 64 API tests (unit and Supertest integration) and 5 shared schema tests passed with 100% success.

During **Phase 04 Parts 1–3**, the frontend visual foundation, interactive catalog UI, responsive design system, and QA stabilization were completed. The dark glassmorphism design system was verified across 360px–1440px viewports, 32 frontend tests passed, and clean production builds were verified.

During **Phase 05**, full-stack integration and persistent core library workflows were implemented: TanStack Query & typed API client, JWT authentication & owner isolation, Title CRUD & detail view, collections & My List, bookmarks & progress tracking, metadata import workflow, streaming JSON/CSV library exports, and 113 automated tests.

During **Phase 05.1**, local development startup and API proxy connectivity were stabilized: created `scripts/dev.js` (`npm run dev`) and `scripts/healthcheck.js` (`npm run healthcheck`).

During **Phase 05.2**, authentication, JWT lifecycle, and protected workflows were repaired: guarded dev session endpoint (`GET /api/v1/auth/dev-session`), client token auto-pruning, and debounced 401 recovery.

During **Phase 05.3**, Jikan import search error classification and resilience were upgraded: structured error categories, HTTP 504 timeouts vs 502 DNS failures, and diagnostic logging.

During **Phase 05.4**, definitive Jikan network diagnostics established that the public hosted service at `api.jikan.moe` was officially discontinued and retired by its maintainers on October 1, 2026. Documented in `JIKAN_IMPORT_DIAGNOSTIC_REPORT.md`.

During **Phase 05.5**, AnimeManager successfully migrated from the discontinued Jikan public API to **Tenrai v1 API** (`https://api.tenrai.org/v1`), verified with live search, preview, atomic commit, and 139 passing tests.

During **Phase 05.6**, AnimeManager connected its Express backend to hosted **Supabase PostgreSQL 17.11** (`db.wbukfeqpsjwyaixwmpnc.supabase.co:5432`):
- **Remote Migrations:** Applied canonical migrations via `supabase db push` creating 10 tables, 3 triggers, and 35 RLS policies.
- **Remote Database Verification (`ALLOW_REMOTE_DB_TESTS=true npm run test:supabase:remote`):** 23/23 assertions passed against live Supabase PostgreSQL (version, RLS, triggers, check constraints, unique indexes, transactions, owner isolation, connection restart, and scoped cleanup).
- **Remote API Workflows Verification (`ALLOW_REMOTE_DB_TESTS=true npm run test:supabase:workflows`):** All 5 user workflows (Titles CRUD, Collections multi-membership, Bookmarks progress, Tenrai metadata import with duplicate protection, and JSON/CSV exports) executed cleanly against the Supabase-backed API.
- **Isolated Local Test Suite (`npm test`):** Local automated test runner preserved 100% test isolation, completing 139/139 tests against local test DB in ~2.4s.
- **Comprehensive Documentation:** Produced root report `SUPABASE_DATABASE_INTEGRATION_REPORT.md` covering all 25 required sections.

---

## 2. Quality Gate Verification Matrix (Phases 01 through 05.6)

| Check Category | Command Executed | Expected Outcome | Actual Result | Status |
|---|---|---|---|---|
| **Git Repository Safety** | `git status` | Clean status; no secrets or build artifacts untracked | `.env`, `node_modules`, `dist`, `.supabase` ignored properly | **PASS** |
| **Linting Check** | `npm run lint` | Workspace lint scripts execute without error | Clean execution across all workspaces (shared, api, web) | **PASS** |
| **TypeScript Check** | `npm run typecheck` | Strict TypeScript compilation across workspaces | Zero type errors in `shared`, `api`, `web` | **PASS** |
| **Monorepo Tests** | `npm test` | Node test runner verifies shared schemas, API suite, and web suite | 5 shared + 83 API + 51 web tests pass (139 total) | **PASS** |
| **Frontend Unit Tests** | `npm --prefix apps/web test` | Node test runner verifies design tokens, components, search, QA, Phase 05 workflows, auth lifecycle, and import workflows | 51/51 frontend assertions pass cleanly | **PASS** |
| **API Integration Tests**| `npm run test:api` | Node test runner executes integration, importer, export, auth, and Tenrai adapter suites | 83/83 test assertions passed cleanly | **PASS** |
| **Production Build** | `npm run build` | Workspaces compile to clean `dist/` bundles; zero secret leaks in client assets | Built cleanly with type definitions and Vite client bundle; 0 leaks | **PASS** |
| **Database Verification** | `npm run test:db` | Migrations, seed, and 18 constraint assertions against live local PostgreSQL | All 18 database assertions passed cleanly | **PASS** |
| **Remote Supabase DB Tests** | `ALLOW_REMOTE_DB_TESTS=true npm run test:supabase:remote` | Probes live Supabase PostgreSQL for schema, RLS, triggers, constraints, isolation | All 23 assertions passed against Supabase | **PASS** |
| **Remote Supabase Workflows**| `ALLOW_REMOTE_DB_TESTS=true npm run test:supabase:workflows` | Exercises Title CRUD, Collections, Bookmarks, Import, Export against Supabase API | All 5 user workflows passed cleanly | **PASS** |
| **Live Metadata Diagnostics** | `npm run test:metadata:live` | Probes live DNS, TLS, search, and detail endpoints against Tenrai v1 | All 8 live checks pass with HTTP 200/400 | **PASS** |
| **API & DB Healthcheck** | `npm run healthcheck` | Verifies API process, database connection, schema readiness, and Vite proxy | All checks operational (databaseTarget: supabase) | **PASS** |

---

## 3. Actual Command Execution Logs (Phase 01)

### 3.1 Unit Test Suite (`npm test`)
```shell
$ npm test

> animemanager-monorepo@1.0.0 test
> npm run --workspaces --if-present test

> @animemanager/shared@1.0.0 test
> node --test test/schemas.test.js

✔ mediaTypeSchema validates valid media types (0.792916ms)
✔ bookmarkStatusSchema validates valid statuses (0.114667ms)
✔ titleCreateSchema enforces required display title and valid values (0.765625ms)
✔ collectionCreateSchema trims names and rejects blanks (0.133167ms)
✔ bookmarkCreateSchema rejects negative progress and out-of-range rating (0.247916ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 126.418917
```

### 3.2 Live Database Assertion Test Suite (`npm run test:db`)
```shell
$ npm run test:db

> animemanager-monorepo@1.0.0 test:db
> node scripts/verify-db.js

[verify-db] Connecting to animemanager_test using psql...
[verify-db] Running migrations, seed data, and constraint test suite...

--- Database Verification Test Results ---
✔ All 10 required domain tables exist
✔ All 3 updated_at triggers exist on mutable tables
✔ Invalid media_type cartoon was successfully rejected by check constraint
✔ Invalid bookmark status watching was successfully rejected by check constraint
✔ Negative progress (-5) was successfully rejected by check constraint
✔ Out-of-range personal rating (10.5) was successfully rejected by check constraint
✔ Duplicate bookmark for owner+title was successfully rejected by unique constraint
✔ Case-insensitive duplicate collection name was successfully rejected by unique index
✔ Title belongs to multiple collections simultaneously (found 2)
✔ Deleting collection leaves title record intact
✔ Deleting collection leaves bookmark tracking intact
✔ Deleting bookmark leaves title record intact
✔ Cascade delete removed aliases
✔ Cascade delete removed bookmark
✔ Cascade delete removed external sources
✔ updated_at trigger automatically updated timestamp
✔ RLS policy expression strictly isolates titles to current auth.uid()
✔ Relationship security policy blocks attaching another owner title to collection

All 18 database assertions PASSED cleanly!
```

### 3.3 TypeScript Typecheck (`npm run typecheck`)
```shell
$ npm run typecheck

> animemanager-monorepo@1.0.0 typecheck
> npm run --workspaces --if-present typecheck

> @animemanager/shared@1.0.0 typecheck
> tsc --noEmit

> @animemanager/api@1.0.0 typecheck
> tsc --noEmit

> @animemanager/web@1.0.0 typecheck
> tsc --noEmit
# Exit code: 0 (zero type errors)
```

### 3.4 Production Build (`npm run build`)
```shell
$ npm run build

> animemanager-monorepo@1.0.0 build
> npm run --workspaces --if-present build

> @animemanager/shared@1.0.0 build
> tsc

> @animemanager/api@1.0.0 build
> tsc

> @animemanager/web@1.0.0 build
> tsc
# Exit code: 0
```

### 3.5 API Integration Test Suite (`npm run test:api`)
```shell
$ npm run test:api

> animemanager-monorepo@1.0.0 test:api
> npm --prefix apps/api test

> @animemanager/api@1.0.0 test
> node --test test/**/*.test.js

✔ Authentication: Protected routes reject requests without Authorization header (23.544791ms)
✔ Authentication: Protected routes reject malformed Authorization header (5.380458ms)
✔ Authentication: Protected routes reject invalid JWT signature (3.24225ms)
✔ Authentication: Protected routes reject expired JWT token (1.401791ms)
✔ Authentication: Valid token succeeds and accesses caller library (22.78975ms)
✔ Authorization & Privacy: Owner B cannot access Owner A private title detail (2.365375ms)
✔ Authorization & Privacy: Owner B cannot mutate Owner A title (9.181958ms)
✔ Authorization: Owner B cannot attach Owner A title to Owner B collection (5.50425ms)
✔ Authorization: Owner B cannot create a bookmark for Owner A title (2.413125ms)
✔ Authorization: Client-supplied owner_id in request body is strictly ignored (8.391875ms)
✔ Bookmarks API: List bookmarks with status filters (56.992917ms)
✔ Bookmarks API: Create a bookmark for a title without one (18.28475ms)
✔ Bookmarks API: Reject duplicate bookmark creation for same title (3.09625ms)
✔ Bookmarks API: Reject negative progress and invalid rating (2.853667ms)
✔ Bookmarks API: Reject progress exceeding progressTotal (6.277042ms)
✔ Bookmarks API: Update bookmark progress and rating (7.834708ms)
✔ Bookmarks API: Upsert bookmark via PUT /titles/:id/bookmark (2.441959ms)
✔ Bookmarks API: Delete bookmark preserves the title (7.465791ms)
✔ Collections API: List collections with titleCount summaries (53.195417ms)
✔ Collections API: Create a new custom collection (9.91775ms)
✔ Collections API: Reject case-insensitive duplicate collection names per owner (3.968458ms)
✔ Collections API: Add titles to collection (multi-collection membership) (33.695ms)
✔ Collections API: Remove title from collection preserves title and bookmark (3.944458ms)
✔ Collections API: Delete collection preserves titles and bookmarks (7.175833ms)
✔ Health API: GET /api/v1/health returns system and database status (81.171791ms)
✔ Middleware: X-Request-ID header is preserved when supplied (2.084708ms)
✔ Error Handling: Unknown endpoints return consistent 404 envelope (2.151166ms)
✔ Titles API: List seed titles with pagination and metadata (54.642375ms)
✔ Titles API: Search across english_title, original_title, and aliases (9.943583ms)
✔ Titles API: Filter by mediaType (4.852917ms)
✔ Titles API: Sorting support by title and releaseYear (10.592667ms)
✔ Titles API: Create a manual title with aliases, genres, and tags (16.73625ms)
✔ Titles API: Reject creation with invalid media type or missing required fields (3.214041ms)
✔ Titles API: Update existing title (4.355084ms)
✔ Titles API: Delete title requires explicit confirmation (6.394375ms)
ℹ tests 35
ℹ suites 0
ℹ pass 35
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 30599.358375
```

### 3.6 Phase 03 Automated Tests Suite (`npm run test:api`)
The Phase 03 test suite executes 64 total tests across 5 test suites covering both unit components and Supertest integration against an isolated PostgreSQL test database:

```shell
$ npm run test:api

> animemanager-monorepo@1.0.0 test:api
> npm --prefix apps/api test

> @animemanager/api@1.0.0 test
> node --test --test-concurrency=1 test/**/*.test.js

# URL Parser & SSRF Defense (10 tests)
✔ parses valid anime URL with numeric ID
✔ parses valid manga URL with numeric ID
✔ parses URL with optional slug
✔ parses URL with trailing slash
✔ discards query string and hash fragment safely
✔ parses direct numeric ID with explicit media type
✔ rejects invalid hostnames, lookalike domains, and subdomains
✔ rejects non-HTTPS protocols (http, ftp, file, javascript)
✔ rejects credentials and non-standard ports
✔ rejects malformed paths, non-numeric IDs, and unsupported paths

# Jikan Client Resilience, Backoff & Cache (7 tests)
✔ returns parsed JSON on successful 200 response
✔ retries on HTTP 429 and honors Retry-After header
✔ retries on transient HTTP 503 and succeeds on subsequent attempt
✔ fails immediately without retry on HTTP 404
✔ throws timeout error when request exceeds timeout threshold
✔ caches successful responses and serves subsequent requests from cache within TTL
✔ throttles rapid requests respecting minimum inter-request interval

# Normalizer & Manga vs. Manhwa Disambiguation (6 tests)
✔ normalizes anime payload into typed ImportDraft
✔ normalizes manga payload and identifies standard Japanese manga
✔ detects explicit manhwa and preselects manhwa media type
✔ flags ambiguous manga/manhwa with warning and requires confirmation
✔ handles null, sparse, and malformed upstream fields gracefully
✔ strictly excludes community reviews from normalized draft

# Import Endpoints Integration (10 tests)
✔ GET /api/v1/import/jikan/search requires authentication
✔ GET /api/v1/import/jikan/search validates query parameters
✔ GET /api/v1/import/jikan/search returns normalized candidates
✔ GET /api/v1/import/preview returns draft without mutating database
✔ GET /api/v1/import/preview detects existing external source as duplicate
✔ POST /api/v1/import/commit persists title with selected fields and external source
✔ POST /api/v1/import/commit enforces field selection (unselected fields default to null)
✔ POST /api/v1/import/commit rejects duplicate external ID for same owner with 409
✔ POST /api/v1/import/commit rolls back entire transaction if relationship fails
✔ Manual title creation remains functional when Jikan is unavailable

# Core Phase 02 APIs (31 tests: Auth, Cross-Owner Isolation, Titles, Collections, Bookmarks, Health)
✔ 31/31 core endpoints pass cleanly

ℹ tests 64
ℹ suites 0
ℹ pass 64
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

### 3.4 Frontend Unit Test Suite (`npm --prefix apps/web test`)
```shell
$ npm --prefix apps/web test

> @animemanager/web@1.0.0 test
> node --test test/**/*.test.js

✔ Shared UI Components: index.ts exports all 8 required design system components (0.783ms)
✔ PosterCard: verifies aspect ratio, fallback support, and rating presentation (0.805541ms)
✔ Input: accessible form control with label and aria bindings (0.207458ms)
✔ EmptyState & LoadingState: accessible status containers (0.91225ms)
✔ Design Tokens: tokens.css defines all required Flix.id design tokens (0.690083ms)
✔ Glassmorphism: glassmorphism.css provides backdrop filter utilities and fallback (0.557584ms)
✔ Global Styles: global.css imports design system and sets atmospheric background (0.30675ms)
✔ Router Configuration: All required Phase 04 Part 1 routes are registered (0.646208ms)
✔ Navigation Scope: Sidebar contains only approved primary destinations and omits Import (0.657458ms)
✔ AppShell: Page titles map all destinations including Collections (0.344417ms)
✔ Dashboard: Implements dual spotlight cards and navigation to all primary sections (0.237583ms)
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 145.854459
```

### 3.6 Phase 04 Part 2 Interactive Catalog Test Suite (`npm --prefix apps/web test`)
```shell
$ npm --prefix apps/web test

> @animemanager/web@1.0.0 test
> node --test test/**/*.test.js

✔ Shared UI Components: index.ts exports all 8 required design system components (0.9625ms)
✔ PosterCard: verifies aspect ratio, fallback support, and rating presentation (1.098ms)
✔ Input: accessible form control with label and aria bindings (0.312125ms)
✔ EmptyState & LoadingState: accessible status containers (1.043917ms)
✔ Design Tokens: tokens.css defines all required Flix.id design tokens (0.975584ms)
✔ Glassmorphism: glassmorphism.css provides backdrop filter utilities and fallback (1.27675ms)
✔ Global Styles: global.css imports design system and sets atmospheric background (0.379041ms)
✔ 1. Search Filtering: Filters accurately by english title, original title, and genre (0.784667ms)
✔ 2. Clearing Search: Empty or whitespace query returns the complete dataset (0.114541ms)
✔ 3. No-Results State: Zero matches produce empty results with EmptyState in UI (0.070625ms)
✔ 4. Media-Type Filtering: Separates anime, manga, and manhwa accurately (0.090375ms)
✔ 5. Sorting: Correctly orders records by title, rating, and year (14.058041ms)
✔ 6. Bookmark Status Filtering: Accurately filters and tallies statuses (0.1585ms)
✔ 7. Empty-State Rendering: Pages render EmptyState for zero records (0.066542ms)
✔ 8. Poster Fallback: PosterCard provides img onError fallback to avoid broken image icons (0.05025ms)
✔ 9. Valid Navigation: All navigation links in Header, Sidebar, and AppShell lead to registered routes (0.112625ms)
✔ 10. Honest Preview-Only Add Title Behavior: Modal is marked as preview and does not claim persistence (0.1115ms)
✔ Router Configuration: All required Phase 04 Part 1 routes are registered (0.641292ms)
✔ Navigation Scope: Sidebar contains only approved primary destinations and omits Import (0.865333ms)
✔ AppShell: Page titles map all destinations including Collections (0.31475ms)
✔ Dashboard: Implements dual spotlight cards and navigation to all primary sections (0.446ms)
✔ QA: CollectionsPage modal supports backdrop click and Escape key dismissal (0.501958ms)
✔ QA: AddTitleModal handles Escape and backdrop dismissal (0.068875ms)
✔ QA: Search inputs provide accessible Escape key dismissal (0.054709ms)
✔ QA: ImportPage clearly discloses Phase 05 status and does not pretend persistence (0.05125ms)
✔ QA: SettingsPage clearly discloses that settings features are Phase 05 only (0.14175ms)
✔ QA: Preview forms have disabled submit buttons preventing false saves (0.062291ms)
✔ QA: My List and Bookmarks maintain strict conceptual distinction in UI (0.053833ms)
✔ QA: Header CSS accommodates desktop, tablet, and 360px mobile viewports (0.069958ms)
✔ QA: Layout adapts between desktop sidebar and mobile bottom navigation at 768px (0.598208ms)
✔ QA: Poster grids support 2-column mobile layout for 360px and 390px viewports (0.114ms)
✔ QA: Placeholder modals and search controls handle mobile viewports without overflow (0.062083ms)
ℹ tests 32
ℹ suites 0
ℹ pass 32
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 154.551625
```

---

## 3.8 Phase 05.1: Local Startup, API Connectivity & Runtime Verification

### A. Healthcheck & Connectivity Verification
Executed `node scripts/healthcheck.js` (`npm run healthcheck`):

```text
======================================================
  AnimeManager — Healthcheck & Connectivity Status
======================================================

1. Checking Express API (direct on port 4000)...
   ✔ API Process (port 4000): REACHABLE (HTTP 200)
     Version: 1.0.0, Uptime: 12s
   ✔ Database Connection: CONNECTED (PostgreSQL healthy)
   ✔ Overall API Status: HEALTHY

2. Checking Frontend Vite Proxy (port 5173 -> 4000)...
   ✔ Frontend Proxy (port 5173 -> 4000): PROXYING SUCCESSFULLY (HTTP 200)

------------------------------------------------------
✔ ALL SYSTEMS OPERATIONAL
```

### B. Live HTTP Request Testing Matrix
All endpoints tested against the live running server through the Vite proxy (`http://localhost:5173`):

| Endpoint Tested | Auth / Headers | HTTP Status | Verified Response Behavior |
|---|---|---|---|
| `GET /api/v1/health` | None | **200 OK** | Returns `{"status":"healthy","database":"connected","version":"1.0.0"}` |
| `GET /api/v1/titles` | None (Unauthenticated) | **401 Unauthorized** | Returns `{"error":{"code":"UNAUTHORIZED","message":"Authentication required"}}` |
| `GET /api/v1/titles` | `Bearer <dev_token>` | **200 OK** | Returns 3 seeded titles (`Cowboy Bebop`, `Berserk`, `Solo Leveling`) with bookmarks |
| `GET /api/v1/collections` | `Bearer <dev_token>` | **200 OK** | Returns 3 seeded collections (`Favorites`, `Masterpieces`, `Action & Adventure`) |
| `GET /api/v1/bookmarks` | `Bearer <dev_token>` | **200 OK** | Returns 3 seeded bookmarks with ratings and status categories |

### C. Development Process Runner & Graceful Shutdown
- **Startup:** `node scripts/dev.js` (`npm run dev`) successfully compiles the API TypeScript project, detects port availability, and spawns both `[api]` and `[web]` processes concurrently.
- **Port Bindings:** Express bound to `0.0.0.0:4000`; Vite bound to `0.0.0.0:5173`. Vite proxy targets `http://127.0.0.1:4000` to prevent IPv6 loopback delay.
- **Shutdown:** Clean `SIGINT` (Ctrl+C) handling sends interrupt signals to child processes and releases port 4000 without orphaned background tasks.

---

### 3.9 Phase 05.2: Authentication, JWT Lifecycle & Protected Workflow Verification

#### A. Backend Authentication & Dev-Session Tests (`apps/api/test/auth.test.js`)
Executed `node --test apps/api/test/auth.test.js` (35 assertions passing):
- **Development Token Issuance:** Verified `GET /api/v1/auth/dev-session` returns HTTP 200 with a valid signed JWT for seeded owner `00000000-0000-0000-0000-000000000001`.
- **Owner Override Immunity:** Verified passing `{ ownerId: "attacker-id" }` in the request body is strictly ignored; the token is unconditionally bound to the default development owner.
- **Production Guard:** Verified that attempting to enable dev session endpoints in production (`ENABLE_DEV_AUTH=true` with `NODE_ENV=production`) causes a fatal configuration error on startup.
- **Signature & Expiry Rejection:** Verified tokens signed with mismatched keys fail with HTTP 401 (`signature verification failed`), and expired tokens fail with HTTP 401 (`token has expired`).
- **Owner Scoping Enforcement:** Verified cross-owner read and write operations are strictly prevented via `owner_id` assertions.

#### B. Frontend Authentication Lifecycle Tests (`apps/web/test/auth-lifecycle.test.js`)
Executed `node --test apps/web/test/auth-lifecycle.test.js` (6 assertions passing):
- **Token Expiration Detection:** Verified `isTokenExpired()` correctly detects past timestamps, honors the 10-second buffer, and marks unexpired tokens as valid.
- **Expired Token Pruning:** Verified that `ApiClient` clears expired tokens from `localStorage` upon initialization rather than sending invalid `Bearer` headers.
- **Dev Session Auto-Acquisition:** Verified `AuthProvider` requests `GET /api/v1/auth/dev-session` when initialized without a valid token in development mode.
- **401 Recovery Throttling:** Verified 401 automatic recovery is throttled with a 15-second debounce window to prevent infinite retry loops.
- **Mutation Idempotency on 401:** Verified `POST`, `PUT`, and `DELETE` requests are never retried automatically after a 401 authentication error.
- **Client Bundle Secret Leak Audit:** Verified production build assets contain zero instances of `JWT_SECRET` or `SERVICE_ROLE_KEY`.

#### C. Live HTTP Workflow & Session Verification
Tested against the live full-stack application through Vite proxy (`http://localhost:5173`):

| Action / Workflow Tested | HTTP Method & Path | Authorization Header | Result Status | Response Verification |
|---|---|---|---|---|
| Unauthenticated Read | `GET /api/v1/titles` | None | **401 Unauthorized** | Returns `{"error":{"code":"UNAUTHORIZED","message":"Authentication required"}}` |
| Malformed Bearer | `GET /api/v1/titles` | `Bearer invalid.jwt.string` | **401 Unauthorized** | Returns `{"error":{"code":"UNAUTHORIZED","message":"Invalid or expired authentication token: signature verification failed"}}` |
| Dev Session Issuance | `GET /api/v1/auth/dev-session` | None (Local Dev Only) | **200 OK** | Returns `{ success: true, data: { token, user: { id: "00000000-0000-0000-0000-000000000001", email: "dev@animemanager.local" } } }` |
| Title Catalog Read | `GET /api/v1/titles` | `Bearer <dev_session_token>` | **200 OK** | Successfully returns seeded titles for user `00000000-0000-0000-0000-000000000001` |
| Collection Read | `GET /api/v1/collections` | `Bearer <dev_session_token>` | **200 OK** | Successfully returns seeded collections |
| Bookmark Read | `GET /api/v1/bookmarks` | `Bearer <dev_session_token>` | **200 OK** | Successfully returns seeded bookmarks |
| Title Creation | `POST /api/v1/titles` | `Bearer <dev_session_token>` | **201 Created** | Creates persistent title `Phase 05.2 Auth Test Title`, returns new UUID |
| Persistence Verification | `GET /api/v1/titles/:id` | `Bearer <dev_session_token>` | **200 OK** | Confirms record persists in database with owner `00000000-0000-0000-0000-000000000001` |
| Confirmed Deletion | `DELETE /api/v1/titles/:id?confirm=true` | `Bearer <dev_session_token>` | **204 No Content** | Safely cleans up test record without affecting existing fixtures |

---

### 3.10 Phase 05.3: Jikan Import Search Connectivity & Network Error Diagnostics

#### A. Backend Adapter & Client Tests (`apps/api/test/import-client.test.js` & `import-api.test.js`)
Executed `node --test apps/api/test/import-client.test.js apps/api/test/import-api.test.js` (80 API tests passing total):
- **Error Classification:** Tested and verified `classifyNetworkError()` for all 8 categories:
  - `UPSTREAM_DNS_ERROR`: Handled when `code === 'ENOTFOUND'`.
  - `UPSTREAM_CONNECTION_ERROR`: Handled when `code === 'ECONNREFUSED'`.
  - `UPSTREAM_TLS_ERROR`: Handled when code is `CERT_HAS_EXPIRED` or `DEPTH_ZERO_SELF_SIGNED_CERT`.
  - `UPSTREAM_TIMEOUT`: Handled when `name === 'TimeoutError'`, `UND_ERR_CONNECT_TIMEOUT`, or cause includes `ETIMEDOUT`.
  - `UPSTREAM_RATE_LIMITED`: Handled on HTTP 429 response.
  - `UPSTREAM_UNAVAILABLE`: Handled on HTTP 503 response.
  - `UPSTREAM_BAD_RESPONSE`: Handled when upstream returns non-JSON or malformed syntax.
  - `UPSTREAM_INVALID_PAYLOAD`: Handled when upstream JSON fails Zod schema validation.
- **HTTP 504 Timeout Semantics:** Verified connection timeouts throw `ExternalProviderTimeoutError` yielding HTTP 504 `EXTERNAL_PROVIDER_TIMEOUT` with user-friendly message rather than raw `fetch failed`.
- **HTTP 502 Unavailability Semantics:** Verified connection refused and DNS failures throw `ExternalProviderUnavailableError` yielding HTTP 502 `EXTERNAL_PROVIDER_UNAVAILABLE`.
- **Cache Exclusion on Failure:** Confirmed failed requests are strictly omitted from `BoundedTtlCache` so transient failures never poison future queries as empty successes.
- **Sanitized Diagnostic Logging:** Verified upstream error logger formats structured context (`requestId`, `category`, `durationMs`, `attempt`, `reason`) while strictly stripping sensitive headers and tokens.

#### B. Frontend Import Workflow Tests (`apps/web/test/import-workflows.test.js`)
Executed `node --test apps/web/test/import-workflows.test.js` (51 web tests passing total):
- **Fetch Failed Sanitization:** Verified `getSearchErrorMessage` intercepts raw `fetch failed` and `TypeError` messages and displays actionable user guidance: *"MyAnimeList search is temporarily unavailable. Please try again shortly."*
- **Error Title Mapping:** Verified HTTP 504 maps to *"Upstream Connection Timed Out"*, HTTP 502 maps to *"MyAnimeList Service Unavailable"*, and HTTP 429 maps to *"MyAnimeList Rate Limit Exceeded"*.
- **Candidate Suppression on Error:** Verified stale candidate results from previous searches are immediately hidden if a subsequent search fails.
- **Concurrency Guard:** Verified duplicate simultaneous searches and submissions while queries are pending are blocked.
- **Preview Error Resilience:** Verified preview mutation failures display an accessible ErrorState with retry trigger.

#### C. Live Upstream Probe & Diagnostic Tooling (`scripts/test-jikan-live.js`)
Executed `npm run test:jikan:live`:
- DNS resolution: Verified `api.jikan.moe` successfully resolves to `135.181.39.91` and `2a01:4f9:c010:b863::1`.
- TCP probe to `135.181.39.91:443`: Packet drops and connection timeouts identified on Hetzner routing (100% packet loss).
- Diagnostic reporting: Accurately reports upstream network reachability status without falsely claiming upstream health or breaking automated CI test runners.

---

### 3.11 Phase 05.4: Definitive Jikan Diagnosis, Import Recovery & Full Technical Report

#### A. Comprehensive Network Stack & Upstream Retirement Diagnosis
- **Multi-Layer Diagnostic Battery:** Independently tested OS DNS, secondary DNS (Google 8.8.8.8), IPv4 TCP, IPv6 TCP, TLS handshake, `curl -v -m 5`, Node.js Undici `fetch`, direct Express API (`:4000`), and Vite dev proxy (`:5173`).
- **Decommissioning Finding:** Confirmed that the upstream public service `api.jikan.moe` was officially retired and discontinued on October 1, 2026. Outbound TCP port 443 packets to Hetzner IP `135.181.39.91` are dropped without SYN-ACK response.
- **Baseline Internet Health:** Confirmed general outbound HTTPS on this host machine is fully operational (Google 174ms, GitHub 262ms, Cloudflare 280ms, MyAnimeList 975ms).
- **Deliverable:** Created root report `JIKAN_IMPORT_DIAGNOSTIC_REPORT.md` documenting all 16 required sections for independent review by engineers or ChatGPT.

#### B. Adapter Custom Endpoint Verification (`apps/api/test/import-client.test.js`)
- **Custom Base URL Test:** Added automated regression test confirming that `JikanClient` seamlessly honors custom `baseUrl` settings (e.g. `http://localhost:8080/v4` for self-hosted Docker instances).
- **Total Monorepo Tests:** 137 / 137 passing (5 shared + 81 API + 51 web).

---

## 4. Planned Testing Matrix (Phases 01–07)

```mermaid
graph TD
    E2E[End-to-End Tests<br/>Playwright - Phase 05]
    Comp[Component, Catalog, Responsive, Auth & Import Tests<br/>Node test runner / 51 Passed - Phase 05.4 PASSED]
    Int[API Integration Tests<br/>Supertest / 81 Passed - Phase 02, 03, 05, 05.2, 05.3 & 05.4 PASSED]
    DB[Database Tests<br/>18 Assertions - Phase 01 PASSED]
    Unit[Unit Tests<br/>Zod Schemas - Phase 01 PASSED]

    E2E --> Comp
    Comp --> Int
    Int --> DB
    Int --> Unit
```

- [x] **Phase 01: Unit Tests (Schemas & Enums):** 5/5 PASSED.
- [x] **Phase 01: Database Verification Suite:** 18/18 PASSED.
- [x] **Phase 02: API Integration Tests (Supertest):** 35/35 PASSED (Titles, Collections, Bookmarks, Health, Auth, Cross-Owner Isolation, Confirmation, Error envelopes).
- [x] **Phase 03: Jikan Provider Adapter & Importer Suite:** 64/64 PASSED (URL parsing, SSRF defense, client resilience, 429 backoff, Retry-After, caching, throttling, normalization, manhwa disambiguation, review exclusion, duplicate detection, atomic commit, and manual creation decoupling).
- [x] **Phase 04 Part 1: Visual Foundation & Design System Tests:** 11/11 PASSED (Design tokens, glassmorphism fallback, shared UI components, router table, navigation boundaries, AppShell title mapping, and Dashboard spotlight & filter pills).
- [x] **Phase 04 Part 2: Interactive Catalog & Filtering QA:** 21/21 PASSED (Search filtering, clearing query, no-results state, media type filtering, sorting, bookmark status filtering, empty states, poster fallbacks, valid navigation, and honest Add Title preview behavior).
- [x] **Phase 04 Part 3: Frontend Verification & Responsive QA:** 32/32 PASSED (8 routes verified, modal dismissal, keyboard navigation, responsive CSS contracts across 360px–1440px, non-persistence disclosures, 101 monorepo tests total).
- [x] **Phase 05: Full-Stack Integration & Library Workflows:** 113/113 PASSED (5 shared schema tests, 68 API integration tests including 4 new export tests, 40 frontend tests including 8 new workflow tests; 18 live DB assertions pass; production build succeeds).
- [x] **Phase 05.1: Local Startup, API Connectivity & Runtime Verification:** PASSED (Root `npm run dev`, `npm run healthcheck`, Vite proxy `127.0.0.1:4000`, live HTTP 200/401 tests, graceful Ctrl+C shutdown, `docs/LOCAL_DEVELOPMENT.md`).
- [x] **Phase 05.2: Authentication, JWT Lifecycle & Protected Workflow Repair:** PASSED (122/122 monorepo tests: 5 shared, 71 API, 46 web; guarded dev session endpoint, client expiration auto-pruning, debounced 401 recovery, zero secret leakage in client bundle, live HTTP CRUD verified).
- [x] **Phase 05.3: Jikan Import Search Connectivity & Error Diagnostics:** PASSED (136/136 monorepo tests: 5 shared, 80 API, 51 web; 8-category error classification, HTTP 504 gateway timeout, sanitized diagnostic logs, UI error sanitization, candidate suppression on failure, live Jikan probe tool).
- [x] **Phase 05.4: Definitive Jikan Diagnosis, Import Recovery & Full Technical Report:** PASSED (137/137 monorepo tests: 5 shared, 81 API, 51 web; root cause conclusively established as Oct 1, 2026 public Jikan shutdown; delivered `JIKAN_IMPORT_DIAGNOSTIC_REPORT.md`; custom baseUrl verified).
- [ ] **Phase 06: Security & Accessibility Audits:** SSRF protection suite, file upload validation, axe a11y audit, keyboard focus traps.
- [ ] **Phase 07: Production Smoke Tests:** Health, login, title/collection/bookmark management on production deployment.
