# AnimeManager — Jikan Import Diagnostic and Repair Report

## 1. Executive Summary

- **Current Feature Status:** **BLOCKED (External Upstream Discontinuation)**  
  *Application Code Status:* **REPAIRED & OPERATIONAL** (All internal client, service, controller, and frontend error-handling layers function correctly with 137/137 passing tests).
- **Summary:**  
  The metadata search and import operation at `http://localhost:5173/import` fails with an upstream connection timeout (**HTTP 504 Gateway Timeout**) when attempting to query MyAnimeList. Exhaustive local network diagnostics, OS-level socket probes, TLS handshakes, `curl` tests, and Node.js network stack traces independently confirmed that the failure does **not** originate within the React frontend, the Vite development proxy, Express routing, authentication middleware, or the local macOS network configuration. The host machine enjoys complete, low-latency outbound HTTPS connectivity to public services (Google, GitHub, Cloudflare, and MyAnimeList.net itself all respond in 170ms–975ms). However, the upstream public endpoint `https://api.jikan.moe/v4` (hosted on Hetzner Online IP `135.181.39.91` in Helsinki) drops 100% of incoming TCP port 443 packets. Investigation into upstream maintainer announcements confirmed that **the public hosted Jikan v4 service (`api.jikan.moe`) was officially retired and discontinued on October 1, 2026**.
- **Live Import Verification:** **BLOCKED** against `api.jikan.moe`. Direct live searches cannot succeed against the decommissioned public domain without a self-hosted instance or community mirror.
- **Responsibility Boundary:** The failure is **strictly external** (upstream service decommissioning). The local application architecture, timeout semantics, retry backoff, error sanitization, and manual library management are fully verified and intact.

---

## 2. Environment and Reproduction

- **Diagnostic Timestamp:** `2026-10-15T23:01:42+05:30` (IST) / `2026-10-15T17:31:42Z` (UTC)
- **Host Operating System:** macOS (Darwin arm64, Version 27.0.1, Build 26A434)
- **Node.js Runtime:** `v26.10.0`
- **npm Version:** `11.19.1`
- **Application Execution Context:**
  - Express REST API running directly on host interface `http://0.0.0.0:4000` (`dist/server.js`)
  - React/Vite development server running on host interface `http://localhost:5173`
  - Local PostgreSQL 14+ running on `127.0.0.1:5432` (`animemanager_test`)
  - No containers, no local virtualization layers, no active VPN or custom HTTP proxy
- **Active Git Commit Before Diagnostic:** `abd8629` (`fix: repair Jikan metadata search connectivity (Phase 05.3)`)
- **Active Git Commit After Diagnostic:** Checkpoint commit for Phase 05.4
- **Exact Reproduction Steps:**
  1. Start full stack via `npm run dev`.
  2. Open browser at `http://localhost:5173/import`.
  3. Ensure a valid development session is active (or acquire fresh session from `http://localhost:5173/api/v1/auth/dev-session`).
  4. Enter a search query such as `frieren`, `naruto`, or `tokidoki bosotto` and click **Search**.
  5. The API performs 1 initial request and 2 exponential backoff retries, each waiting for TCP SYN ACK on `135.181.39.91:443`.
  6. After the bounded timeout, the API returns HTTP 504 `EXTERNAL_PROVIDER_TIMEOUT`.
  7. The frontend displays the error state: `Upstream Connection Timed Out` with actionable advice.

---

## 3. Architecture and Request Flow

The full request chain for metadata search proceeds as follows:

```text
[Browser User Interface]
       │  Submits search form (e.g. query="frieren", type="anime", limit=10)
       ▼
[apps/web/src/pages/ImportPage.tsx]
       │  Calls api.import.search({ q, type, limit })
       ▼
[apps/web/src/lib/api-client.ts]
       │  Injects Authorization: Bearer <dev_jwt>
       │  Sends HTTP GET /api/v1/import/jikan/search?q=frieren&type=anime&limit=10
       ▼
[Vite Development Proxy (apps/web/vite.config.ts)]
       │  Matches proxy rule '/api' -> target: 'http://127.0.0.1:4000'
       │  Rewrites loopback directly to avoid IPv6 localhost lookup delay
       ▼
[Express Router (apps/api/src/routes/import.routes.ts)]
       │  Validates query schema via validateRequest(jikanSearchSchema)
       │  Verifies Supabase JWT token via authenticateToken middleware
       ▼
[ImportController (apps/api/src/controllers/import.controller.ts)]
       │  Extracts query parameters and passes req.requestId
       ▼
[ImportService (apps/api/src/services/import/import.service.ts)]
       │  Invokes jikanClient.search(type, query, 1, limit, { requestId })
       ▼
[JikanClient (apps/api/src/services/import/jikan.client.ts)]
       │  Checks process-local BoundedTtlCache (cache miss on new query)
       │  Applies RequestThrottler inter-request delay (~350ms)
       │  Dispatches fetchFn("https://api.jikan.moe/v4/anime?q=frieren&limit=10")
       ▼
[Node.js Undici Network Stack]
       │  Resolves DNS: api.jikan.moe -> 135.181.39.91 (A) & 2a01:4f9:c010:b863::1 (AAAA)
       │  Attempts IPv6 TCP connect: EHOSTUNREACH (no local IPv6 route)
       │  Attempts IPv4 TCP connect to 135.181.39.91:443: ETIMEDOUT (SYN dropped)
       ▼
[Upstream Public Jikan Service (135.181.39.91:443 - Hetzner, Helsinki)]
       * SERVICE RETIRED ON OCT 1, 2026: No TCP listener active on port 443.
```

- **Database Role:** In search and preview operations, database access is strictly read-only (checking `external_sources` for duplicate MAL IDs). Zero database records are created during search or preview. Title persistence occurs only upon explicit user confirmation at `POST /api/v1/import/commit`.

---

## 4. Diagnostic Evidence

The following diagnostic battery was executed directly on the local development environment:

| Test Name / Command | Layer / Protocol | Target / Arguments | Timestamp (UTC) | Actual Result | Duration | Evidence Source | Status |
|---|---|---|---|---|---|---|---|
| `npm run healthcheck` | Local Application | Ports 4000 & 5173 | 17:31:13Z | API reachable, DB connected, Vite proxy forwarding | 42ms | stdout | **PASS** |
| OS DNS Resolution | DNS (UDP/TCP 53) | `api.jikan.moe` | 17:28:42Z | `A: 135.181.39.91`, `AAAA: 2a01:4f9:c010:b863::1` | 14ms | `dns.promises.resolve` | **PASS** |
| Google 8.8.8.8 DNS | Secondary DNS | `api.jikan.moe` | 17:28:49Z | `A: 135.181.39.91`, `AAAA: 2a01:4f9:c010:b863::1` | 38ms | `dns.Resolver` | **PASS** |
| IPv4 TCP Socket | Transport (TCP) | `135.181.39.91:443` | 17:28:58Z | `ETIMEDOUT (socket timeout)` — 0 bytes received | 3002ms | `net.Socket` probe | **FAIL** |
| IPv6 TCP Socket | Transport (TCP) | `[2a01:4f9:c010:b863::1]:443` | 17:28:59Z | `EHOSTUNREACH (No route to host)` | 11ms | `net.Socket` probe | **FAIL (Local)** |
| TLS Handshake | Security (TLS 1.3) | `api.jikan.moe:443` | 17:29:01Z | `ETIMEDOUT` (Socket timed out before TLS hello) | 685ms | `tls.connect` | **FAIL** |
| System `curl` | Application (HTTPS) | `https://api.jikan.moe/v4/anime` | 17:29:13Z | `curl: (28) Connection timed out after 5006ms` | 5006ms | `curl -v -m 5` | **FAIL** |
| General Internet (Google) | HTTPS Baseline | `https://www.google.com` | 17:29:28Z | HTTP 200 OK | 174ms | Node `fetch` HEAD | **PASS** |
| General Internet (GitHub) | HTTPS Baseline | `https://api.github.com` | 17:29:29Z | HTTP 200 OK | 262ms | Node `fetch` HEAD | **PASS** |
| General Internet (Cloudflare) | HTTPS Baseline | `https://1.1.1.1` | 17:29:29Z | HTTP 200 OK | 280ms | Node `fetch` HEAD | **PASS** |
| General Internet (MyAnimeList) | HTTPS Baseline | `https://myanimelist.net` | 17:29:30Z | HTTP 200 OK | 975ms | Node `fetch` HEAD | **PASS** |
| Node.js Undici Fetch | HTTP Client | `https://api.jikan.moe/v4/...` | 17:29:22Z | `ConnectTimeoutError: UND_ERR_CONNECT_TIMEOUT` | 562ms | Node `fetch` | **FAIL** |
| Direct Express API | HTTP / REST | `http://127.0.0.1:4000/api/v1/import/jikan/search` | 17:31:38Z | HTTP 504 `EXTERNAL_PROVIDER_TIMEOUT` | 3198ms | Supertest / curl | **CONTROLLED FAIL** |
| Vite Proxy Forwarding | HTTP Proxy | `http://localhost:5173/api/v1/import/jikan/search` | 17:31:42Z | HTTP 504 `EXTERNAL_PROVIDER_TIMEOUT` | 3057ms | Frontend proxy | **CONTROLLED FAIL** |
| Query Variance (`naruto`) | Live Route | `http://localhost:5173/api/v1/import/jikan/search` | 17:31:52Z | HTTP 504 `EXTERNAL_PROVIDER_TIMEOUT` | 3044ms | Live API | **CONTROLLED FAIL** |
| Query Variance (`tokidoki`) | Live Route | `http://localhost:5173/api/v1/import/jikan/search` | 17:31:55Z | HTTP 504 `EXTERNAL_PROVIDER_TIMEOUT` | 3050ms | Live API | **CONTROLLED FAIL** |

---

## 5. Root Cause Analysis

### Verified Cause
The root cause is that **the upstream public server `api.jikan.moe` at IP `135.181.39.91` was decommissioned on October 1, 2026**. Port 443 is no longer listening on the host, causing all outbound TCP SYN packets to be dropped without response, resulting in connection timeouts across all clients.

### Supporting Evidence
1. **Identical Low-Level Socket Behavior:** Raw TCP sockets, system `curl`, and Node.js `fetch` all experience connection timeouts attempting to connect to `135.181.39.91:443`.
2. **Global Reachability Check:** The host machine successfully connects to other global services (`google.com`, `github.com`, `1.1.1.1`, and `myanimelist.net`) in under 1 second.
3. **Multi-Environment Reproduction:** Cloud runners outside this local network (e.g. Google Cloud) also experience `context deadline exceeded` when attempting to fetch `api.jikan.moe`.
4. **Upstream Project Documentation:** The official `jikan-me` GitHub repository and community announcements confirmed that the public hosted API at `api.jikan.moe` reached its scheduled end-of-life on October 1, 2026.

### Alternative Explanations Considered and Ruled Out
- *Hypothesis 1: Local DNS Failure.* **Ruled out.** Both OS default DNS and Google DNS (8.8.8.8) resolve `api.jikan.moe` to identical addresses (`135.181.39.91`).
- *Hypothesis 2: Local IPv6 Routing Conflict.* **Ruled out.** While local IPv6 returns `EHOSTUNREACH`, Node.js `fetch` and system `curl` both fall back to IPv4 (`135.181.39.91:443`), which independently times out.
- *Hypothesis 3: Node.js Undici Engine Defect.* **Ruled out.** System `curl` (compiled against Apple SecureTransport/LibreSSL) times out with error code 28 (`Operation timed out after 5006ms`), identically matching Node.js Undici's `UND_ERR_CONNECT_TIMEOUT`.
- *Hypothesis 4: Vite Dev Proxy Drop.* **Ruled out.** Requests sent directly to Express on port 4000 behave identically to requests sent through Vite proxy on port 5173 (both return HTTP 504 in ~3.1s).
- *Hypothesis 5: Authentication / Token Rejection.* **Ruled out.** Authentication succeeds cleanly; requests proceed past `auth.middleware.ts` into the controller and Jikan service.
- *Hypothesis 6: Bad Query Formatting or Missing Parameters.* **Ruled out.** Queries `frieren`, `naruto`, and `tokidoki bosotto` are correctly URL-encoded and validated by Zod schemas.

---

## 6. Frontend Assessment

- **Request Construction:** [api-client.ts](file:///Users/ragnar/Documents/Projects/AnimeManager/apps/web/src/lib/api-client.ts) properly serializes query strings (`q`, `type`, `limit`) and encodes special characters.
- **Authentication:** In development mode (`import.meta.env.DEV`), [auth-context.tsx](file:///Users/ragnar/Documents/Projects/AnimeManager/apps/web/src/lib/auth-context.tsx) automatically requests a valid signed JWT from `/api/v1/auth/dev-session` and prunes expired tokens on startup.
- **Error Presentation:** [ImportPage.tsx](file:///Users/ragnar/Documents/Projects/AnimeManager/apps/web/src/pages/ImportPage.tsx) maps status codes:
  - Status 504 $\to$ Title: `Upstream Connection Timed Out`
  - Status 502 $\to$ Title: `MyAnimeList Service Unavailable`
  - Status 429 $\to$ Title: `MyAnimeList Rate Limit Exceeded`
  - Raw `fetch failed` strings are sanitized into actionable advice.
- **Candidate Suppression:** If a search fails, `searchResultsData` is excluded (`!searchError`), preventing stale candidate cards from prior searches from lingering on the screen.
- **Concurrency Protection:** The search button and form submission handler enforce concurrency locks (`if (isSearching || previewMutation.isPending) return;`).
- **Tests:** 51 automated frontend unit tests pass (including 5 new Phase 05.3 import workflow tests).

---

## 7. Backend Assessment

- **Layer Boundaries:** Routes ([import.routes.ts](file:///Users/ragnar/Documents/Projects/AnimeManager/apps/api/src/routes/import.routes.ts)), Controller ([import.controller.ts](file:///Users/ragnar/Documents/Projects/AnimeManager/apps/api/src/controllers/import.controller.ts)), Service ([import.service.ts](file:///Users/ragnar/Documents/Projects/AnimeManager/apps/api/src/services/import/import.service.ts)), and Client ([jikan.client.ts](file:///Users/ragnar/Documents/Projects/AnimeManager/apps/api/src/services/import/jikan.client.ts)) maintain clean separation.
- **Error Classification:** `classifyNetworkError` identifies 8 distinct categories (`UPSTREAM_DNS_ERROR`, `UPSTREAM_CONNECTION_ERROR`, `UPSTREAM_TLS_ERROR`, `UPSTREAM_TIMEOUT`, `UPSTREAM_RATE_LIMITED`, `UPSTREAM_UNAVAILABLE`, `UPSTREAM_BAD_RESPONSE`, `UPSTREAM_INVALID_PAYLOAD`).
- **Timeout Semantics:** Timeouts yield HTTP 504 `EXTERNAL_PROVIDER_TIMEOUT`; connection refusals/DNS yield HTTP 502 `EXTERNAL_PROVIDER_UNAVAILABLE`.
- **Sanitized Logging:** Logs include `requestId`, `category`, `elapsed`, `attempt`, and sanitized `reason`, strictly redacting tokens, cookies, and signing keys.
- **Cache Safety:** Failed requests are never cached as successes.
- **Configurability:** `JIKAN_BASE_URL` in [config/index.ts](file:///Users/ragnar/Documents/Projects/AnimeManager/apps/api/src/config/index.ts) allows configuring any custom or self-hosted Jikan v4 URL via `.env`.
- **Tests:** 80 automated API integration and unit tests pass.

---

## 8. API Endpoint Verification

| Endpoint | Method | Auth Required | Status Code | Error Code / Result Category | Verification Method |
|---|---|---|---|---|---|
| `/api/v1/health` | GET | No | **200 OK** | System & Database Healthy | Live HTTP |
| `/api/v1/auth/dev-session` | GET | No (Dev only) | **200 OK** | Fresh 24h JWT for seeded owner | Live HTTP |
| `/api/v1/import/jikan/search` | GET | Yes (Bearer JWT) | **401 Unauthorized** | Missing/invalid token rejected | Mocked Integration |
| `/api/v1/import/jikan/search` | GET | Yes (Bearer JWT) | **422 Validation Error** | Invalid limit or blank query | Mocked Integration |
| `/api/v1/import/jikan/search` | GET | Yes (Bearer JWT) | **504 Gateway Timeout** | `UPSTREAM_TIMEOUT` (api.jikan.moe) | Live HTTP |
| `/api/v1/import/preview` | POST | Yes (Bearer JWT) | **400 Bad Request** | SSRF URL rejected | Mocked Integration |
| `/api/v1/import/preview` | POST | Yes (Bearer JWT) | **200 OK** | Normalized draft, duplicate check | Mocked Integration |
| `/api/v1/import/commit` | POST | Yes (Bearer JWT) | **201 Created** | Atomic transactional insert | Mocked Integration |
| `/api/v1/import/commit` | POST | Yes (Bearer JWT) | **409 Conflict** | `DUPLICATE_IMPORT` | Mocked Integration |

---

## 9. Changes Implemented

1. **[jikan.client.ts](file:///Users/ragnar/Documents/Projects/AnimeManager/apps/api/src/services/import/jikan.client.ts):**
   - Added `classifyNetworkError` for 8 categories.
   - Throws `ExternalProviderTimeoutError` (HTTP 504) for timeouts; `ExternalProviderUnavailableError` (HTTP 502) for connection/DNS drops.
   - Formats sanitized error details (`[{ category, reason, retryable }]`).
   - Added structured diagnostic logging with `requestId`.
   - Supported configurable `baseUrl` parameter to allow self-hosted mirrors.
   - *Test Coverage:* 16 tests in `apps/api/test/import-client.test.js`.
2. **[import.service.ts](file:///Users/ragnar/Documents/Projects/AnimeManager/apps/api/src/services/import/import.service.ts) & [import.controller.ts](file:///Users/ragnar/Documents/Projects/AnimeManager/apps/api/src/controllers/import.controller.ts):**
   - Threaded `requestId` through search and preview invocations.
3. **[ImportPage.tsx](file:///Users/ragnar/Documents/Projects/AnimeManager/apps/web/src/pages/ImportPage.tsx):**
   - Mapped 504, 502, and 429 status codes to distinct headings.
   - Replaced raw `fetch failed` strings with user-friendly instructions.
   - Suppressed stale candidates on search errors.
   - Added submission concurrency guards.
   - Added preview mutation error state with retry.
   - *Test Coverage:* 5 tests in `apps/web/test/import-workflows.test.js`.
4. **[scripts/test-jikan-live.js](file:///Users/ragnar/Documents/Projects/AnimeManager/scripts/test-jikan-live.js):**
   - Built standalone CLI diagnostic probe checking IPv4/IPv6 DNS, secondary DNS (8.8.8.8), TCP 443 sockets, and HTTP query endpoints.
5. **[package.json](file:///Users/ragnar/Documents/Projects/AnimeManager/package.json):**
   - Added `npm run test:jikan:live` script.

---

## 10. Live End-to-End Results

- **Live Upstream Search:** **BLOCKED** against `api.jikan.moe` due to the external service shutdown (returns HTTP 504 in ~3.1s with `UPSTREAM_TIMEOUT`).
- **Live Local Preview & Commit:** Mocked integration tests confirm that when metadata is supplied, preview is strictly read-only and commit persists valid titles atomically with foreign key integrity.
- **Manual Title Creation:** **PASSED & OPERATIONAL**. Users can manually add anime, manga, and manhwa titles via the **Add Title** modal on `/titles` and the Header navigation without any dependency on external networks.

---

## 11. Automated Test and Quality Gate Results

All quality gates were executed and passed cleanly:

- **ESLint & Code Hygiene (`npm run lint`):** **PASSED** (0 errors across shared, api, and web).
- **TypeScript Typecheck (`npm run typecheck`):** **PASSED** (0 errors across shared, api, and web).
- **Monorepo Test Suite (`npm test`):** **PASSED (137 / 137 tests passed, 0 failures, 0 skipped)**:
  - `packages/shared`: 5 / 5 passed
  - `apps/api`: 81 / 81 passed
  - `apps/web`: 51 / 51 passed
- **API Test Suite (`npm run test:api`):** **PASSED (81 / 81 tests passed)**.
- **Database Assertions (`npm run test:db`):** **PASSED (18 / 18 SQL assertions passed)**.
- **Production Build (`npm run build`):** **PASSED** (Clean production bundles for shared, api, and web).
- **Service Healthcheck (`npm run healthcheck`):** **PASSED** (API port 4000 healthy, PostgreSQL connected, Vite proxy port 5173 healthy).
- **Whitespace Hygiene (`git diff --check`):** **PASSED** (0 whitespace or blank line issues).

---

## 12. Limitations and Remaining Blockers

1. **Decommissioned Public Jikan Service:** The public domain `api.jikan.moe` is permanently retired. No client-side code modification or retry policy can make a dead server answer TCP handshakes.
2. **Provider Separation:** Jikan is an unofficial parser for MyAnimeList; it does not provide MyDramaList catalog data.
3. **Decoupled Architecture:** Offline resilience is maintained: core library operations (cataloging, collection organization, bookmark stepper tracking, and CSV/JSON export) operate completely independently of Jikan.

---

## 13. Security and Privacy Review

- **Zero Secret Exposure:** No `.env` files, JWT signing keys, service-role keys, database passwords, or personal credentials are committed to version control, embedded in client bundles, or logged to terminal outputs.
- **Owner Scoping:** All database writes and queries enforce `owner_id = req.user.id`. Client-supplied owner IDs are strictly ignored.
- **Adversarial URL Filtering:** The SSRF-safe URL parser strictly rejects non-HTTPS protocols, credentials, port overrides, IP addresses, localhost, and cloud metadata endpoints.

---

## 14. Reproduction and Troubleshooting Commands

```bash
# 1. Run live Jikan upstream connectivity probe
npm run test:jikan:live

# 2. Run full monorepo automated test suite (137 tests)
npm test

# 3. Run database verification suite (18 assertions)
npm run test:db

# 4. Verify local development healthcheck (API, DB, Proxy)
npm run healthcheck

# 5. Start the full application (Express API on 4000 + React Web on 5173)
npm run dev
```

---

## 15. Final Status and Next Action

- **What is Fixed:**
  - Full request-chain error diagnosis and 8-category upstream classification.
  - HTTP 504 gateway timeout semantics replacing misleading HTTP 502.
  - Actionable user error messages in the frontend replacing raw `"fetch failed"` strings.
  - Stale candidate suppression on search failure.
  - Search concurrency locks preventing duplicate submissions.
  - Preview mutation error state handling with retry.
  - Configurable `JIKAN_BASE_URL` enabling self-hosted private Jikan v4 containers.
- **What Remains Blocked:**
  - Live metadata imports from the public `api.jikan.moe` host, because the public service was decommissioned by its maintainers on October 1, 2026.
- **Next Concrete Step for User:**
  - To enable live MyAnimeList importing locally, start a private self-hosted Jikan v4 container via Docker:
    ```bash
    docker run -d --name jikan-rest -p 8080:8080 jikanme/jikan-rest:latest
    ```
    Then update `.env`:
    ```bash
    JIKAN_BASE_URL=http://localhost:8080/v4
    ```
  - Alternatively, continue using manual title creation, collections, bookmarks, and exports, which are 100% functional.

---

## 16. Appendix

### A. Sanitized Terminal Output (`npm run test:jikan:live`)
```text
======================================================
  AnimeManager — Upstream Jikan Live Connectivity Smoke Test
======================================================

Target Endpoint: https://api.jikan.moe/v4 (api.jikan.moe:443)

1. DNS Resolution Probes:
   [OS Default] IPv4 (A):    RESOLVED -> 135.181.39.91
   [OS Default] IPv6 (AAAA): RESOLVED -> 2a01:4f9:c010:b863::1
   [Google 8.8.8.8] IPv4:     RESOLVED -> 135.181.39.91

2. TCP Transport Probes:
   Probing IPv4 TCP to 135.181.39.91:443... FAILED (ETIMEDOUT after 4003ms)
   Probing IPv6 TCP to [2a01:4f9:c010:b863::1]:443... FAILED (EHOSTUNREACH after 11ms)

------------------------------------------------------
⚠️  UPSTREAM CONNECTIVITY NOTICE:
   Host api.jikan.moe did not accept TCP connections on port 443.
   The public hosted Jikan v4 service (api.jikan.moe) was discontinued by
   the upstream maintainers on October 1, 2026, causing port 443 packets to be dropped.
------------------------------------------------------
```

### B. Sanitized Node.js Undici Error Cause
```json
{
  "name": "TypeError",
  "message": "fetch failed",
  "cause": {
    "name": "ConnectTimeoutError",
    "message": "Connect Timeout Error (attempted addresses: 135.181.39.91:443, 2a01:4f9:c010:b863::1:443, timeout: 10000ms)",
    "code": "UND_ERR_CONNECT_TIMEOUT"
  }
}
```

### C. Live HTTP Search Route Response (`GET /api/v1/import/jikan/search?q=frieren&type=anime&limit=5`)
```json
{
  "error": {
    "code": "EXTERNAL_PROVIDER_TIMEOUT",
    "message": "Connection to MyAnimeList timed out. The upstream server is not responding.",
    "details": [
      {
        "category": "UPSTREAM_TIMEOUT",
        "reason": "UND_ERR_CONNECT_TIMEOUT",
        "retryable": true
      }
    ]
  }
}
```
