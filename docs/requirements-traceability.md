# AnimeManager — Requirements Traceability Matrix

**Document Version:** 1.1  
**Phase:** Phase 02 (Backend Foundation & Core CRUD APIs)  
**Status:** Requirements Mapped & Progress Updated  

This matrix links every non-negotiable requirement, functional requirement (FR), and core user journey from `Personal_Media_Library_Full_Technical_Specification.md` and `Antigravity_Master_Build_Prompt.txt` to its target implementation phase, architectural component, and verification method.

---

## 1. Non-Negotiable Product Requirements

| ID | Requirement Statement | Target Phase | Implementation Component | Verification Method | Status |
|---|---|---|---|---|---|
| **NNR-01** | Primary navigation consists of **My List** and **Bookmarks**. | Phase 04 | `apps/web/src/components/layout/Navigation.tsx` | Visual QA, component tests | Planned |
| **NNR-02** | **My List** means user-created collections/folders; a title can belong to multiple collections. | Phase 01, 02, 05 | `collections`, `title_collections` DB tables & API endpoints | DB integration tests, API tests | Verified (Phase 01 & 02) |
| **NNR-03** | **Bookmarks** means tracking status and progress; independent of collection membership. | Phase 01, 02, 05 | `bookmarks` DB table & API endpoints | DB integration tests, API tests | Verified (Phase 01 & 02) |
| **NNR-04** | Explicit media types: `anime`, `manga`, and `manhwa`. | Phase 01, 02 | PostgreSQL enum/check constraint, Zod schemas | Unit & DB constraint tests | Verified (Phase 01 & 02) |
| **NNR-05** | Add titles manually or import via Jikan with preview and field editing before saving. | Phase 03, 05 | Jikan adapter, `ImportPreview.tsx`, `ManualTitleForm.tsx` | Integration & E2E tests | Verified (Phase 02 & Phase 03 API); UI in Phase 05 |
| **NNR-06** | Support English, original, alternate titles, synopsis, background, cover, genres, tags, external IDs, source score/rank, episode/chapter counts. | Phase 01, 02, 05 | Schema DDL, API DTOs, Detail view | Schema validation & API tests | Verified (Phase 01, 02, & 03) |
| **NNR-07** | **Do not import community reviews in v1.** | Phase 03 | Jikan adapter excludes review endpoints | Unit test inspecting payload | Verified (Phase 03) |
| **NNR-08** | Use Supabase PostgreSQL and Supabase Storage (`covers` bucket). | Phase 01, 02, 07 | Supabase client, SQL migrations | Database & migration tests | Schema & Migrations Verified (Phase 01 & 02) |
| **NNR-09** | Glassmorphism visual direction: cool blue/gray blurred backdrop, translucent surfaces, rounded cards, legible typography. | Phase 04 | `apps/web/src/styles/tokens.css`, UI components | Visual QA, responsive testing | Planned (Phase 04) |
| **NNR-10** | Private-first deployment; access controls suitable for public internet; never expose service-role secrets to browser. | Phase 01, 02, 06 | Supabase Auth, RLS, Express auth middleware | Security audit, integration tests | RLS & Auth Verified (Phase 01 & 02) |
| **NNR-11** | Never fetch arbitrary user-provided URLs (SSRF prevention). Parse supported MAL URL patterns, then call Jikan. | Phase 02, 03, 06 | URL parse regex validator, strict HTTP client | Unit test SSRF injection suite | Verified (Phase 03) |
| **NNR-12** | Jikan is external and can fail. Manual entry must always work. | Phase 03, 05 | Non-blocking Jikan error handling, manual title route | Mocked API failure tests | Verified (Phase 02 & Phase 03 API) |
| **NNR-13** | No fake hard-coded data as substitute for working persistence. | Phase 01–05 | Real PostgreSQL persistence across all features | Full stack E2E & API tests | Verified against DB (Phase 01, 02, & 03) |

---

## 2. Functional Requirements (FR)

| Req ID | Description | Phase | Architecture Target | Verification Criteria | Status |
|---|---|---|---|---|---|
| **FR-01** | Title Catalog CRUD | Phase 01, 02, 05 | `titles` table, `TitlesService`, `TitlesController` | Full CRUD lifecycle passes integration tests | Verified (Phase 02 API) |
| **FR-02** | Media Type Enum (`anime`, `manga`, `manhwa`) | Phase 01, 02 | `media_type` check constraint, shared Zod schema | Rejection of non-enum values in DB and API | Verified (Phase 01 & 02) |
| **FR-03** | Titles & Aliases (English, Original, Alternate) | Phase 01, 02 | `title_aliases` join table, multi-alias search | Search query returns titles by alias | Verified (Phase 02 API) |
| **FR-04** | Cover Images (URL & Upload + Fallback) | Phase 01, 02, 05 | Supabase Storage bucket, upload controller, `CoverImage.tsx` | Successful upload, URL rendering, broken fallback | API URL storage verified; Upload in Phase 05 |
| **FR-05** | Synopsis & Metadata Details | Phase 01, 02, 05 | `titles` table, detail tabs, badges | Complete field persistence and display | Verified (Phase 02 & Phase 03 API) |
| **FR-06** | Collections Management (My List) | Phase 01, 02, 05 | `collections`, `title_collections` tables | Titles link to multiple collections; delete collection preserves title | Verified (Phase 02 API) |
| **FR-07** | Bookmarks & Progress Tracking | Phase 01, 02, 05 | `bookmarks` table, `BookmarkEditor.tsx` | Status filter, progress increment, rating (0–10) | Verified (Phase 02 API) |
| **FR-08** | Search, Filtering, and Sorting | Phase 02, 05 | B-tree/trigram indexes, backend query builder, debounced search UI | Search latency < 100ms, accurate result filtering | Verified (Phase 02 API) |
| **FR-09** | Jikan Metadata Importer | Phase 03, 05 | Jikan v4 adapter, MAL regex parser, draft normalizer | Search, preview, and commit from real/mocked MAL data | Verified (Phase 03 API) |
| **FR-10** | Metadata Preview & Field Selection | Phase 03, 05 | `ImportPreview.tsx`, `ImportFieldSelector.tsx` | Selective field commit; duplicate warning dialog | Verified (Phase 03 API); UI in Phase 05 |
| **FR-11** | Backup & Data Export (JSON & CSV) | Phase 02, 05 | `ExportController`, stream generators | Export files download with complete relational integrity | Planned (Phase 05) |
| **FR-12** | Settings & Health Monitoring | Phase 02, 04, 05 | `/api/v1/health`, `SettingsPage.tsx` | System status check, theme preference switch | Health API Verified (Phase 02) |

---

## 3. Core User Journeys

| Journey | Description | Key Interaction | Acceptance Milestone |
|---|---|---|---|
| **Journey A** | Create a Collection | User creates a named collection in My List with description and icon. | Case-insensitive duplicate prevention; immediate listing. |
| **Journey B** | Add Title Manually | User creates anime/manga/manhwa title with required display title and metadata. | Saved to database; detail page opens; no forced bookmark creation. |
| **Journey C** | Import from MyAnimeList | User pastes MAL URL or enters ID; preview renders; user selects/edits fields and commits. | Backend Importer Verified (Phase 03 API); full UI in Phase 05. |
| **Journey D** | Bookmark Tracking | User tracks progress (episodes/chapters), updates status, and adds personal rating (0–10). | Progress non-negative; status update independent of collection membership. |
| **Journey E** | Multi-Collection Assignment | User adds a single title to multiple collections (e.g. "Favorites" and "Romance"). | Membership links in both collections; removing from one leaves the other intact. |
