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

2. **Rate Limits & Throttling:**
   - Jikan enforces rate limits (~3 requests/second, ~60 requests/minute). Exceeding this triggers HTTP 429 Too Many Requests.
   - **Mitigation:** The backend Jikan adapter implements request throttling, exponential backoff for transient errors, and response caching for search and detail queries.

3. **Manga vs. Manhwa Classification:**
   - MyAnimeList catalogs Japanese manga, Korean manhwa, and Chinese manhua under a single `/manga/` taxonomy.
   - **Mitigation:** The import normalizer inspects the publication type and country of origin to detect manhwa, but prompts the user in the interactive preview draft if classification is ambiguous.

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
   - While Node 26 supports modern ESM and TypeScript execution natively, production targets (Vercel, Render) typically run Node 20 or 22 LTS. All dependencies and build targets must remain compatible with Node 20+ LTS standards.

2. **Local Docker & Supabase CLI Environment:**
   - Docker daemon is currently not running in this environment, which prevents running `npx supabase start` containerized stacks directly.
   - However, a native PostgreSQL service is running on port 5432 and was used for live migration, seed, and constraint test verification via `npm run test:db`.
   - To use the local Supabase containerized stack, Docker Desktop / daemon must be started. Hosted Supabase instances work without local Docker.

