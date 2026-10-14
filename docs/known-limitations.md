# AnimeManager — Known Limitations & Scope Constraints

**Document Version:** 1.0  
**Phase:** Phase 00 (Baseline)  
**Status:** Documented  

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
   - For containerized Supabase CLI stacks, Docker Desktop / daemon must be started. Hosted Supabase instances work without local Docker.

---

## 5. Security & Scope Boundaries

1. **Backend Service-Role Authorization Boundary:**
   - When the backend connects via a privileged PostgreSQL connection (or Supabase service role), PostgreSQL table-level RLS policies are bypassed by the privileged role.
   - **Mitigation & Enforcement:** Backend service-layer authorization is strictly mandatory. All database queries in the repository layer enforce `owner_id = $x` in both reads and writes. Cross-owner references (e.g. attaching a title belonging to another user to one's own collection or bookmark) are blocked by explicit ownership validation queries before writes occur. In automated integration tests, attempts by Owner B to access or manipulate Owner A's records return 404 or 403.

2. **Phase 03 Scope Boundaries:**
   - The Jikan external metadata import endpoints (`/api/v1/import/jikan/search`, `/api/v1/import/preview`, `/api/v1/import/commit`) are fully implemented and verified in Phase 03.
   - File upload handlers for custom covers (`/api/v1/uploads/covers`) and backup streaming exports (`/api/v1/export/*`) remain deferred to Phase 05.
   - React frontend UI components, Vite setup, and glassmorphism styling are strictly deferred to Phase 04 and Phase 05.


