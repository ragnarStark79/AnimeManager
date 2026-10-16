# AnimeManager — Phase 06.1: Security Evidence Review and Release Blocker Resolution Report

**Date:** 2026-10-16  
**Auditor:** AntiGravity Pair Programming Agent  
**Target Repository:** `ragnarStark79/AnimeManager`  
**Current HEAD:** `806455e5a2b04a478987d88cb3a8e93bb02de3ec`  
**Remote Target:** `git@github.com:ragnarStark79/AnimeManager.git` (`refs/heads/main`)  
**Release Decision:** **CONDITIONALLY READY** (Blocked from Production Deployment until Credential Rotation and Connection Pooler Configuration are completed)

---

## Executive Summary

Phase 06.1 was conducted as an exhaustive, evidence-based security audit and verification review following Phase 06 hardening. All claims made in `PHASE_06_HARDENING_REPORT.md` were independently audited against the actual source code, database scripts, build artifacts, test suites, and live endpoints.

### Key Audit Findings:
1. **Secret Exposure Response:** Plaintext database connection credentials appeared in earlier terminal command history. A comprehensive regex search across all tracked files, commit history, and frontend bundles confirmed that **zero secrets have been committed to Git or embedded in client assets**. A safe credential-rotation protocol has been established.
2. **Supabase JWT Verification Hardened:** Supabase Auth tokens signed via HMAC-SHA256 (`HS256`) are strictly enforced. Algorithm confusion attacks (`none`, asymmetric substitution) are completely blocked. Added UUID regex verification for `sub` and explicit rejection of anonymous (`role: 'anon'`) tokens.
3. **Authorization & Boundary Isolation:** All database queries across titles, collections, bookmarks, and exports strictly enforce `owner_id = $x` parameterized scoping. Cross-owner mutation, relationship attachment, and traversal attacks fail.
4. **Rate Limiting & Input Protection:** In-memory rate limiting with bounded capacity (5,000 entries with LRU eviction) protects external import endpoints. Payload sizes exceeding 1MB are cleanly rejected with HTTP 413 `PAYLOAD_TOO_LARGE`.
5. **Quality & Verification Metrics:**
   - **Automated Tests:** 148 passing across shared (5), web (51), and API (92, including 9 hardening tests).
   - **Local Database Assertions:** 18 passing against PostgreSQL with RLS and cascade rules.
   - **Production Build:** Clean bundle splitting with 0 chunks exceeding 320 kB and 0 secret leaks.
   - **Live External Diagnostics:** 8/8 live Tenrai v1 API checks passing.
   - **Browser Automation:** Documented honestly as **UNVERIFIED** due to sandbox Playwright driver download limitations.

---

## 1. Repository and Working-Tree State

### 1.1 Git Revision & Remote Synchronization
- **Local HEAD Commit:** `806455e5a2b04a478987d88cb3a8e93bb02de3ec`
- **Remote `origin/main`:** `806455e5a2b04a478987d88cb3a8e93bb02de3ec`
- **Branch Tracking:** `main` is strictly up to date with `origin/main`.
- **Commit History Integrity:** Historical commits (14 original commits from Phase 01–05.6 plus the push verification documentation commit) remain unmodified. No historical commits have been amended, squashed, or rebased.

### 1.2 Working-Tree Status
The working tree contains uncommitted hardening changes and updated documentation from Phase 06 and Phase 06.1. In accordance with hard stop rules, these changes remain uncommitted awaiting explicit user authorization.

```
## main...origin/main
 M apps/api/src/app.ts
 M apps/api/src/config/index.ts
 M apps/api/src/errors/index.ts
 M apps/api/src/middleware/auth.middleware.ts
 M apps/api/src/middleware/error.middleware.ts
 M apps/api/src/routes/import.routes.ts
 M apps/api/test/helpers.js
 M apps/web/src/components/layout/AppShell.css
 M apps/web/src/components/layout/AppShell.tsx
 M apps/web/vite.config.ts
 M docs/BUILD_PROGRESS.md
 M docs/architecture.md
 M docs/deployment.md
 M docs/known-limitations.md
 M docs/requirements-traceability.md
 M docs/test-report.md
?? PHASE_06_HARDENING_REPORT.md
?? PHASE_06_1_VERIFICATION_REPORT.md
?? apps/api/src/middleware/rate-limit.middleware.ts
?? apps/api/test/hardening.test.js
```

---

## 2. Findings Classification

| Finding ID | Title | Severity | Status | Remediation Summary |
|---|---|---|---|---|
| **SEC-01** | Plaintext DB Password in Terminal History | **Critical** | Remediation Required | Credential treated as compromised. Rotation checklist prepared; confirmed 0 secrets in Git. |
| **SEC-02** | Unchecked JWT `sub` and Anonymous Role Bypass | **High** | **Resolved** | Added UUID regex validation and explicit rejection of `role: 'anon'` in `auth.middleware.ts`. |
| **SEC-03** | In-Memory Rate Limiter Unbounded Memory Growth | **Medium** | **Resolved** | Implemented `maxEntries: 5000` with LRU-style eviction of oldest keys upon reaching capacity. |
| **SEC-04** | Rate Limiter Multi-Instance Process-Local Scope | **Medium** | **Documented** | Process-local scope clearly documented; Redis/reverse-proxy required for multi-replica clustering. |
| **SEC-05** | Test DB Helper Working-Directory Path Sensitivity | **Low** | **Resolved** | Updated `apps/api/test/helpers.js` to use `path.resolve` for migration scripts. |
| **SEC-06** | Vite Monolithic Bundle Size | **Low** | **Resolved** | Configured Rollup `manualChunks` splitting React, TanStack Query, and Lucide icons. |
| **SEC-07** | Browser Automation Unavailable in Sandbox | **Informational** | **Documented** | Sandbox driver download constraint documented; browser checks marked as UNVERIFIED. |
| **SEC-08** | Tenrai v1 Provider Active & Discontinued Jikan | **Informational** | **Verified** | Tenrai v1 verified operational; documentation updated to reflect Tenrai as active provider. |

---

## 3. Secret Exposure Response

### 3.1 Incident Analysis
A database connection string containing a plaintext password was passed as a command-line argument in a prior terminal session. Under standard operating conditions, shell history records command invocations, rendering the credential potentially visible to local processes.

### 3.2 Git & Codebase Inspection
- **Tracked Files:** Ripgrep executed across all tracked repository files for database connection strings and passwords. **Result: 0 plaintext credentials found.**
- **Commit History:** Inspected `git log -p` across all 15 commits on `main`. **Result: 0 secrets committed.**
- **Environment Handling:** Confirmed that `apps/api/src/config/index.ts` strictly loads database credentials from `process.env.DATABASE_URL` or `process.env.SUPABASE_DATABASE_URL`. Default test values are blocked in production mode.
- **Frontend Assets:** Inspected `apps/web/dist/assets/*.js`. Confirmed no database credentials, service-role keys, or JWT secrets are bundled into client code.

### 3.3 Safe Credential-Rotation Checklist for Project Owner
> [!IMPORTANT]
> Because the database password appeared in command history, the project owner should execute the following rotation steps:

1. **Supabase Dashboard Password Reset:**
   - Navigate to: `https://supabase.com/dashboard/project/wbukfeqpsjwyaixwmpnc`
   - Go to **Project Settings** -> **Database** -> **Database Password**.
   - Click **Reset database password** and generate a strong random password.
2. **Update Local Environment:**
   - Update `.env` in the repository root:
     ```bash
     SUPABASE_DATABASE_URL="postgresql://postgres:[NEW_PASSWORD]@db.wbukfeqpsjwyaixwmpnc.supabase.co:5432/postgres"
     DATABASE_URL="postgresql://postgres:[NEW_PASSWORD]@db.wbukfeqpsjwyaixwmpnc.supabase.co:5432/postgres"
     ```
   - For environments experiencing direct IPv4/IPv6 connection issues to port 5432, use the Supabase Transaction Pooler connection string (port 6543):
     ```bash
     DATABASE_URL="postgresql://postgres.wbukfeqpsjwyaixwmpnc:[NEW_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
     ```
3. **Sanitize Local Shell History:**
   - In terminal: remove offending commands from `~/.zsh_history` or run `history -d <event_number>`.
   - Never paste connection strings directly into CLI commands; reference environment variables (e.g. `psql "$DATABASE_URL"`).
4. **Update Production Secrets:**
   - Set `DATABASE_URL` in the production hosting dashboard (e.g., Render / Fly.io / Vercel) through the platform's encrypted secret store.

---

## 4. Supabase JWT Compatibility and Authentication Verification

### 4.1 Token Format and Signing Algorithm
- **Configured Algorithm:** HMAC-SHA256 (`HS256`) signed with the Supabase Project JWT Secret (`SUPABASE_JWT_SECRET`).
- **Algorithm Enforcement:** `apps/api/src/middleware/auth.middleware.ts` passes `{ algorithms: ['HS256'] }` to `jwt.verify()`.
- **Security Protections:**
  - Tokens with `alg: "none"` are rejected with HTTP 401 (`UNAUTHORIZED`).
  - Asymmetric algorithm confusion (e.g. RS256/ES256 substituting public keys) is rejected.
  - No untrusted JWT header can select or alter the verification algorithm.

### 4.2 Claim Validation
- **Subject (`sub`):** Must be present and match UUID format (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`). Non-UUID strings are rejected with HTTP 401 instead of propagating to database queries.
- **Anonymous Role Guard:** Tokens carrying `role: 'anon'` or `aud: 'anon'` (such as Supabase public anon keys) are explicitly rejected with HTTP 401 (`anonymous role not permitted for protected resources`).
- **Expiration (`exp`):** Expired tokens are rejected with HTTP 401 and code `UNAUTHORIZED` with detail `TOKEN_EXPIRED`.
- **Malformed & Tampered Tokens:** Tokens with modified payloads or invalid HMAC signatures are rejected with HTTP 401.

### 4.3 Development Authentication Safety
- Development endpoint `GET /api/v1/auth/dev-session` is guarded by `config.ENABLE_DEV_AUTH`.
- In `config/index.ts`, `ENABLE_DEV_AUTH` is strictly prohibited when `NODE_ENV === 'production'`.
- `POST /api/v1/auth/dev-token` strictly ignores any client-supplied `owner_id` or `sub` in request bodies.

---

## 5. Authorization and Database Boundaries

### 5.1 Query Parameterization & SQL Inspection
- All data access in `titles.repository.ts`, `collections.repository.ts`, `bookmarks.repository.ts`, `export.service.ts`, and `import.service.ts` uses parameterized SQL queries (`$1, $2, ...`). Zero raw string concatenation exists in database queries.
- Every read, update, and delete query includes an explicit `WHERE owner_id = $x` clause tied to the authenticated user ID.

### 5.2 Cross-Owner Mutation and Relationship Security
- **Cross-Owner Read:** When Owner B attempts to retrieve Owner A's private title or collection, the query returns 0 rows, resulting in HTTP 404 / 403.
- **Cross-Owner Write:** Updates and deletions targeted at another user's ID return 0 affected rows, preventing data tampering.
- **Cross-Owner Relationship Attack:** In `collections.repository.ts`, attaching a title to a collection requires validating that **both** the collection and the title belong to the calling user:
  ```sql
  INSERT INTO collection_items (collection_id, title_id)
  SELECT c.id, t.id FROM collections c, titles t
  WHERE c.id = $1 AND c.owner_id = $3 AND t.id = $2 AND t.owner_id = $3
  ```
  If Owner B attempts to link Owner A's title to Owner B's collection, 0 rows are inserted.
- **Bookmark Isolation:** Bookmarks enforce a unique constraint on `(owner_id, title_id)`. Owner B cannot create or modify bookmarks for Owner A's titles.
- **Transaction Safety:** Multi-statement operations (such as import commit and cascade deletions) execute within `BEGIN ... COMMIT` blocks with automatic `ROLLBACK` on error.

### 5.3 Test Suite Classification
- **Unit Tests:** 5 shared schema tests and helper unit tests.
- **Mocked / App Integration Tests:** 92 Express/Supertest tests against test database.
- **Local PostgreSQL Database Tests:** 18 assertions verifying constraints, triggers, and RLS policies via `scripts/verify-db.js`.
- **Remote Supabase Tests:** Documented in `scripts/verify-supabase-remote.js` and `verify-supabase-workflows.js`. Opt-in only via `ALLOW_REMOTE_DB_TESTS=true` to prevent unauthorized live mutations.
- **Browser End-to-End Tests:** Marked **UNVERIFIED** due to sandbox environment constraints.

---

## 6. Rate Limiting and Input Handling

### 6.1 In-Memory Rate Limiter Verification
- **Middleware:** `RateLimiter` (`apps/api/src/middleware/rate-limit.middleware.ts`).
- **Endpoint Coverage:** Applied to all metadata import endpoints:
  - `GET /api/v1/import/jikan/search`
  - `GET /api/v1/import/preview`
  - `POST /api/v1/import/commit`
- **Configuration:** Window: 60,000ms (1 min); Max requests: 30 (configurable via `IMPORT_RATE_LIMIT_MAX`).
- **Headers Verified:**
  - `RateLimit-Limit: 30`
  - `RateLimit-Remaining: <count>`
  - `RateLimit-Reset: <seconds>`
  - `Retry-After: <seconds>` (when limit exceeded)
- **Response:** Exceeded limit returns HTTP 429 with error code `RATE_LIMITED`.
- **Keying & Spoofing Immunity:** Keys by `user:${req.user.id}` for authenticated requests. Malicious spoofing of `X-Forwarded-For` or `Client-IP` headers cannot bypass user limits because authenticated token identity takes precedence.
- **Bounded Memory:** Map size capped at 5,000 entries (`maxEntries`). When capacity is reached, expired records are purged; if still at capacity, the oldest entry is evicted.
- **Architecture Scope:** Single-process memory store. Suitable for single-instance container deployments. For multi-instance clustered deployments, an external store (Redis) or edge limiter (Cloudflare/NGINX) is required.

### 6.2 Payload & Error Handling
- **Payload Limit:** `express.json({ limit: '1mb' })` enforced globally.
- **Payload Size Handling:** Payloads > 1MB trigger `entity.too.large`, handled by error middleware returning HTTP 413 `PAYLOAD_TOO_LARGE` with structured error envelope.
- **SSRF Defenses:** `MAL URL Parser` validates domains strictly against `myanimelist.net`. Rejects IP addresses, `localhost`, cloud metadata (`169.254.169.254`), and lookalike hostnames.
- **Information Leakage Prevention:** Stack traces are suppressed in production. Database errors are translated to domain codes (`23505` -> `DUPLICATE_RESOURCE`).

---

## 7. Frontend Accessibility and Production Behavior

### 7.1 Accessibility Improvements
- **Skip to Content Link:** Added `<a href="#main-content" class="skip-to-content">Skip to main content</a>` in `AppShell.tsx` targeting `<main id="main-content">`. Styled with CSS offscreen positioning that transitions into view upon `:focus`.
- **Keyboard Navigation:** Escape key dismisses modals (`AddTitleModal`, `CollectionsPage` modal) and search inputs.
- **Focus Rings:** Accessible `:focus-visible` styling applied across interactive elements.
- **Visual Contrast & Design Tokens:** Standardized on curated Flix.id tokens (`--bg-surface`, `--accent-primary`, `--text-primary`).

### 7.2 Production Bundle Analysis
Vite production build completed in 1.49s with Rollup chunk splitting:

| Chunk Name | Output File | Size | Gzip Size | Content |
|---|---|---|---|---|
| Vendor React | `dist/assets/vendor-react-DUVVkOfe.js` | 317.84 kB | 98.72 kB | React, React DOM, React Router |
| Application Core | `dist/assets/index-DxgNxMEG.js` | 245.21 kB | 38.94 kB | App components, pages, routes |
| Vendor Query | `dist/assets/vendor-query-uFKPkIFB.js` | 82.71 kB | 25.43 kB | TanStack Query Core |
| Vendor Icons | `dist/assets/vendor-icons-B5y4Ejvm.js` | 15.70 kB | 3.55 kB | Lucide React Icons |
| Stylesheet | `dist/assets/index-DIdbJYXJ.css` | 66.79 kB | 10.91 kB | Global tokens, glassmorphism, responsive styles |
| Entry HTML | `dist/index.html` | 1.24 kB | 0.59 kB | Application mount point & meta tags |

**Result:** Zero chunks trigger Vite's 500 kB warning limit.

### 7.3 Browser Automation Status
- **Execution Result:** **UNVERIFIED (Automated Browser Level)**
- **Technical Cause:** The Playwright browser subagent requires external browser binaries. The download failed with HTTP 404 in the sandbox offline environment.
- **Mitigation:** DOM structures, accessible attributes (`aria-*`, `role`), skip links, and keyboard event handlers were independently verified via static analysis and unit tests (`apps/web/test/app.test.js`).

---

## 8. Automated vs. Live Test Evidence Matrix

| Test Suite / Tool | Test Type | Execution Target | Exit Code | Checks Passed | Result / Status |
|---|---|---|---|---|---|
| `@animemanager/shared` | Unit | Shared schema & validation | 0 | 5 / 5 | **PASSED** |
| `@animemanager/web` | Unit / DOM | UI components, tokens, router | 0 | 51 / 51 | **PASSED** |
| `@animemanager/api` (Core) | Integration | Titles, auth, export, import | 0 | 83 / 83 | **PASSED** |
| `@animemanager/api` (Hardening)| Integration | Rate limits, 413, JWT, CORS | 0 | 9 / 9 | **PASSED** |
| `scripts/verify-db.js` | Database Assertions | Local PostgreSQL (`animemanager_test`) | 0 | 18 / 18 | **PASSED** |
| `scripts/test-tenrai-live.js` | Live Provider Diagnostic | Tenrai v1 API (`api.tenrai.org/v1`) | 0 | 8 / 8 | **PASSED** |
| `npm run lint` | Static Analysis | All workspaces | 0 | 3 / 3 | **PASSED** |
| `npm run typecheck` | TypeScript Compiler | All workspaces (`tsc --noEmit`) | 0 | 3 / 3 | **PASSED** |
| `npm run build` | Bundler | Web & API production builds | 0 | 3 / 3 | **PASSED** |
| `scripts/verify-supabase-remote.js` | Remote Database Tests | Hosted Supabase PostgreSQL | N/A | Skipped | **UNVERIFIED (Opt-in safe)** |
| Playwright Browser Tests | Browser E2E | Chrome headless in sandbox | N/A | Skipped | **UNVERIFIED (Sandbox limit)** |

---

## 9. Documentation Reconciliation

The following repository documentation files were reviewed and reconciled:

1. `docs/deployment.md`: Updated to Version 2.0. Reflected Tenrai v1 (`https://api.tenrai.org/v1`) as active metadata provider. Documented `METADATA_API_BASE_URL`, `SUPABASE_DATABASE_URL`, and disabled `ENABLE_DEV_AUTH` in production.
2. `docs/BUILD_PROGRESS.md`: Recorded completion of Phase 06 hardening, Phase 06.1 security evidence review, updated test counts to 148 automated tests + 18 DB assertions.
3. `docs/architecture.md`: Documented RateLimiter middleware, 1MB payload enforcement, HS256 JWT restrictions, and frontend vendor chunk splitting.
4. `docs/known-limitations.md`: Documented in-memory rate limiter process-local scope for horizontal clustering, and sandbox browser execution constraints.
5. `docs/requirements-traceability.md`: Marked Phase 06 hardening and Phase 06.1 verification requirements as verified by cited test evidence.
6. `docs/test-report.md`: Updated total test tallies, breaking out shared (5), web (51), API (92), database assertions (18), and live Tenrai diagnostics (8).

---

## 10. Files Changed and Rationale

| File Path | Change Status | Rationale |
|---|---|---|
| `apps/api/src/app.ts` | Modified | Added 1MB payload ceiling and registered rate limit / error handlers. |
| `apps/api/src/config/index.ts` | Modified | Disallow default JWT secret and dev auth in production mode. |
| `apps/api/src/errors/index.ts` | Modified | Added `PayloadTooLargeError` (413) and `RateLimitError` (429). |
| `apps/api/src/middleware/auth.middleware.ts` | Modified | Restrict to HS256, validate UUID `sub`, reject `anon` role. |
| `apps/api/src/middleware/error.middleware.ts` | Modified | Map `entity.too.large` body-parser errors to HTTP 413 `PAYLOAD_TOO_LARGE`. |
| `apps/api/src/middleware/rate-limit.middleware.ts` | New File | In-memory bounded rate limiter with `RateLimit-*` and `Retry-After` headers. |
| `apps/api/src/routes/import.routes.ts` | Modified | Applied `importRateLimitMiddleware` to search, preview, and commit routes. |
| `apps/api/test/hardening.test.js` | New File | 9 automated assertions covering rate limiting, 413 limits, CORS, and JWT checks. |
| `apps/api/test/helpers.js` | Modified | Resolved migration SQL files via absolute paths for workspace runner portability. |
| `apps/web/src/components/layout/AppShell.css` | Modified | Accessible styling for `.skip-to-content` skip link. |
| `apps/web/src/components/layout/AppShell.tsx` | Modified | Added skip link `<a href="#main-content">` for keyboard accessibility. |
| `apps/web/vite.config.ts` | Modified | Rollup `manualChunks` splitting into vendor-react, vendor-query, and vendor-icons. |
| `docs/*.md` (6 files) | Modified | Reconciled documentation, test tallies, deployment guides, and architecture specs. |
| `PHASE_06_1_VERIFICATION_REPORT.md` | New File | Root audit deliverable for Phase 06.1 review. |

---

## 11. Exact Verification Commands and Output

```bash
# 1. Repository State & Remote Sync
git status --short --branch
# Exit: 0 (Branch main...origin/main)
git rev-parse HEAD
# Exit: 0 (806455e5a2b04a478987d88cb3a8e93bb02de3ec)
git ls-remote origin refs/heads/main
# Exit: 0 (806455e5a2b04a478987d88cb3a8e93bb02de3ec refs/heads/main)

# 2. Linting
npm run lint
# Exit: 0 (All 3 workspaces passed cleanly)

# 3. Type Checking
npm run typecheck
# Exit: 0 (tsc --noEmit passed across shared, api, web)

# 4. Automated Test Suites
npm test
# Exit: 0
# @animemanager/shared: 5 passed
# @animemanager/api: 92 passed (including 9 hardening tests)
# @animemanager/web: 51 passed
# Total: 148 passed, 0 failed

# 5. Local Database Assertions
npm run test:db
# Exit: 0 (All 18 database assertions passed cleanly)

# 6. Production Build & Chunk Splitting
npm run build
# Exit: 0 (All chunks < 320 kB, dist/ ready)

# 7. Live Metadata Diagnostic
node scripts/test-tenrai-live.js
# Exit: 0 (DNS, TLS, search, detail, and 400 validation passed)
```

---

## 12. Remaining Blockers

1. **Database Password Rotation Required:**
   The plaintext database password exposed in the local terminal command history must be rotated in the Supabase Dashboard and updated in `.env` before public deployment.
2. **Database Connection Pooler Configuration:**
   Direct connections to Supabase port 5432 timed out from this host network during healthcheck. The production and staging configurations must use the Supabase Transaction Pooler URL (port 6543, `?pgbouncer=true`).
3. **Live Browser End-to-End Validation:**
   Browser automation must be executed in an environment with full Playwright/Puppeteer browser binaries installed before finalizing production sign-off.
4. **Git Authorization Pending:**
   In accordance with the hard stop rules, all Phase 06 and Phase 06.1 changes remain uncommitted and unpushed awaiting explicit user instruction.

---

## 13. Release Decision

### Verdict: **CONDITIONALLY READY**

The AnimeManager codebase has achieved excellent architectural and security hardening:
- **Zero secrets** exist in tracked source code, Git history, or client bundles.
- **All 166 automated checks** (148 tests + 18 database assertions) pass cleanly.
- **Supabase JWT authentication** is strictly locked to `HS256` with UUID validation and anon-token rejection.
- **Cross-owner authorization boundaries** are fully enforced.
- **Tenrai v1 metadata provider** is verified operational.

**Conditions for Full Release (Phase 07):**
1. Owner completes the Supabase database password rotation checklist.
2. Staging / production `.env` is updated with the Supabase connection pooler URL.
3. Explicit user authorization is granted to commit and push Phase 06/06.1 changes.
