# AnimeManager — Known Limitations & Scope Constraints

**Document Version:** 1.6
**Phase:** Phase 05.4 (Definitive Jikan Connectivity Diagnosis, Import Recovery & Technical Report)
**Status:** Documented & Verified

---

## 1. Upstream Service Limitations (Jikan & MyAnimeList)

1. **Unofficial API Dependency:**
   - Jikan is an open-source, community-driven REST API that parses MyAnimeList data. It is not an official MyAnimeList service.
   - **Impact:** Upstream changes to MyAnimeList HTML structures, Cloudflare challenge modifications, or Jikan hosting downtime can cause temporary import failures.
   - **Mitigation:** The application treats Jikan as an enhancement, never a hard dependency. Manual title entry and editing are fully functional without external network access.

2. **Rate Limits & In-Memory Cache Characteristics:**
   - Jikan enforces rate limits (~3 requests/second, ~60 requests/minute). Exceeding this triggers HTTP 429 Too Many Requests.
   - **Mitigation & Characteristics:** The backend Jikan adapter implements an in-memory `RequestThrottler` (~334ms spacing), bounded exponential backoff with `Retry-After` header parsing, and a `BoundedTtlCache` (10m TTL, 500 entry LRU cap). The cache is process-local; it resets if the server restarts. Failed requests are never cached as successes.
   - **Limitation:** In multi-instance or serverless environments, an in-memory cache is not shared across instances. For a single-instance container or personal server, this is completely sufficient and avoids external Redis dependencies.

3. **Manga vs. Manhwa Classification Boundaries:**
   - MyAnimeList catalogs Japanese manga, Korean manhwa, and Chinese manhua under a single `/manga/` taxonomy.
   - **Mitigation:** The import normalizer inspects the publication type. If the type is explicitly `"Manhwa"`, it preselects `manhwa`. If ambiguous, it flags `needsMediaConfirmation: true` and includes a warning requiring the user to explicitly select `manga` or `manhwa` before commit.

4. **Public Jikan Server Retirement & Tenrai v1 Migration (Phase 05.5):**
   - The primary public Jikan endpoint (`https://api.jikan.moe/v4`) was **officially decommissioned on October 1, 2026**, causing TCP port 443 packets to be dropped, as documented in [JIKAN_IMPORT_DIAGNOSTIC_REPORT.md](file:///Users/ragnar/Documents/Projects/AnimeManager/JIKAN_IMPORT_DIAGNOSTIC_REPORT.md).
   - In Phase 05.5, AnimeManager migrated to **Tenrai v1 API** (`https://api.tenrai.org/v1`), the community alternative recommended by Jikan maintainers. Full details are documented in [IMPORT_PROVIDER_MIGRATION_REPORT.md](file:///Users/ragnar/Documents/Projects/AnimeManager/IMPORT_PROVIDER_MIGRATION_REPORT.md).
   - **Tenrai Characteristics & Beta Status:**
     - Tenrai provides verified Jikan-v4-compatible REST endpoints for the public MyAnimeList catalog.
     - Public tier rate limits are 4 req/sec (250ms interval) and 120 req/min per IP address. AnimeManager's `RequestThrottler` (350ms interval ~2.8 rps) guarantees compliant throughput.
     - User lists, user updates, and clubs are not supported in Tenrai v1.
     - The backend `MetadataClient` supports both `METADATA_API_BASE_URL` (primary, pointing to Tenrai) and legacy `JIKAN_BASE_URL` (for private self-hosted Jikan instances).
     - Live diagnostics can be run via `npm run test:metadata:live`.
     - Core library operations (manual title entry, collection organization, bookmark tracking, and CSV/JSON export) operate completely independently of external metadata provider availability.

---

## 2. Media & Storage Limitations

1. **External Image Availability & CDN Hotlinking:**
   - Using external image URLs from MyAnimeList/CDN risks image broken links if external URLs expire or block hotlinking.
   - **Mitigation:** The application supports direct cover uploads to private Supabase Storage, and the UI implements a graceful glassmorphism placeholder fallback for broken images.

2. **Upload Constraints:**
   - Initial cover uploads are limited to 5 MB and raster formats (`image/jpeg`, `image/png`, `image/webp`). Animated GIFs and vector SVGs are restricted in v1 to avoid client performance issues and SVG-based XSS vectors.

---

## 3. Product Scope & Non-Goals for Version 1

1. **No Community Reviews:**
   - In accordance with the project specification and master prompt, community reviews are excluded from v1 imports to keep the database lean and avoid unstructured content moderation issues.
2. **Single-User / Personal-First:**
   - Version 1 is designed specifically for personal library management. Multi-user collaboration, social sharing feeds, public profiles, and multi-tenant subscriptions are not part of this release.
   - *Architectural safeguard:* Tables include `owner_id` and RLS policies so multi-user accounts can be enabled in the future without schema rewrites.
3. **No Two-Way Write-Back Sync to MAL:**
   - Version 1 imports metadata from MyAnimeList unidirectionally. It does not synchronize progress back to a personal MyAnimeList account.
4. **No Native Mobile App:**
   - The product is delivered as a progressive, responsive web application (tested across mobile, tablet, and desktop viewports) rather than a native iOS/Android binary.

---

## 4. Development Environment Notes

1. **Node.js Runtime:**
   - The current development environment is running Node.js `v26.10.0`.
   - Production targets (Vercel, Render) typically run Node 20 or 22 LTS. All dependencies and build targets remain strictly compatible with Node 20+ LTS standards.

2. **Local PostgreSQL & Supabase Environment:**
   - A local PostgreSQL service running on port 5432 is used for migration, seed, and constraint test verification via `npm run test:db` and `npm run test:api`.
   - **Remote Supabase IPv6-Only Routing:** Certain hosted Supabase endpoints (e.g. direct database connection hostnames) resolve exclusively via IPv6 `AAAA` records. On local development machines or ISP routes where IPv6 traffic is not natively routed, direct connections fail with `EHOSTUNREACH`. For local development, the repository defaults to local PostgreSQL (`animemanager_test` on `localhost:5432`), while remote Supabase remains the production deployment target.

3. **Browser Automation in Sandboxed CI/Dev Environment:**
   - In environments where outbound network access to external binary CDN repositories (`playwright.azureedge.net`) is firewalled or blocked, Playwright driver automatic installation fails.
   - **Mitigation & Verification:** Frontend verification is established through automated unit tests (`node:test` covering design tokens, glassmorphism fallbacks, UI components, router registration, and accessibility contracts), strict TypeScript typechecking, production Vite build validation, and static CSS media query auditing across 360px, 390px, 768px, 1024px, and 1440px viewports.

---

## 5. Security & Scope Boundaries

1. **Backend Service-Role Authorization Boundary:**
   - When the backend connects via a privileged PostgreSQL connection (or Supabase service role), PostgreSQL table-level RLS policies are bypassed by the privileged role.
   - **Mitigation & Enforcement:** Backend service-layer authorization is strictly mandatory. All database queries in the repository layer enforce `owner_id = $x` in both reads and writes. Cross-owner references (e.g. attaching a title belonging to another user to one's own collection or bookmark) are blocked by explicit ownership validation queries before writes occur. In automated integration tests, attempts by Owner B to access or manipulate Owner A's records return 404 or 403.

2. **Phase 05 Full-Stack Integration & Storage Prerequisites:**
   - **Real API Persistence:** Library catalog (`/titles`), custom collections (`/collections`), bookmarks (`/bookmarks`), and Jikan imports (`/import`) are connected to the live Express REST backend via TanStack Query and the typed `ApiClient`. User data is persisted to PostgreSQL and isolated by `owner_id`.
   - **Demonstration Dataset Isolation:** The typed sample dataset (`src/data/demo.ts`) is retained exclusively for test suite backward compatibility and isolated test harness assertions. Authenticated views display live server data and explicit loading/error/empty states.
   - **Supabase Storage Configuration Requirement:** Direct file uploads to Supabase Storage require an active Supabase project with the `covers` bucket created and public/authenticated read policies established. In local offline development environments without hosted Supabase Storage, cover images are handled via external URLs or rendered with the application's gradient initial placeholders.
   - **Export Streaming:** JSON and CSV library exports are streamed directly from the Express backend via authenticated GET requests (`/api/v1/export/json` and `/api/v1/export/csv`), strictly scoped to the requesting owner and omitting credentials, signing keys, and secrets.

3. **Local Development Authentication Lifecycle & Production Separation (Phase 05.2):**
   - **Absence of User-Facing Sign-In Flow:** The frontend currently does not include an interactive Supabase Auth email/password or OAuth login modal. In production, Supabase Auth manages user registration and authentication tokens.
   - **Option B Local Development Strategy:** To support local full-stack development without requiring active remote Supabase credentials, the backend provides a development session endpoint (`GET /api/v1/auth/dev-session`) guarded by `ENABLE_DEV_AUTH=true`. This endpoint issues short-lived (24h) JWTs strictly bound to the seeded local owner (`00000000-0000-0000-0000-000000000001`), ensuring compatibility with seed fixtures and automated test databases.
   - **Production Isolation:** If `ENABLE_DEV_AUTH=true` is present when `NODE_ENV=production`, the backend throws a fatal configuration exception during boot. Test signing secrets are never used in production, and dev token issuance routes return 404/disabled when running in production mode.
   - **Frontend Expiration Pruning:** Stale or expired tokens in browser `localStorage` are automatically detected via `isTokenExpired()` and cleared on client startup, avoiding recurring 401 loops. Automatic renewal is debounced to 15-second intervals, and state-mutating requests (`POST`/`PUT`/`DELETE`) are never repeated automatically after an authentication error.
