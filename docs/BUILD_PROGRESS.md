# AnimeManager — Project Build Progress Tracker

## 1. Project Overview & Current Status

**Project Name:** AnimeManager (Personal Media Library)  
**Description:** A private-first personal catalog and tracking application for anime, manga, and manhwa. The application strictly distinguishes between **My List** (user-defined collections/folders) and **Bookmarks** (watch/read tracking status and progress). It integrates with MyAnimeList via the Jikan API for metadata import with preview and editing before saving, storing local copies in Supabase PostgreSQL and cover images in Supabase Storage. The visual aesthetic follows a modern, responsive glassmorphism design.

- **Current Project Status:** Initialization & Planning
- **Current Active Phase:** **Phase 00: Workspace Inspection & Project Setup**
- **Phase 00 Status:** COMPLETED (Pending User Review & Sign-Off)
- **Next Phase:** **Phase 01: Repository Foundation & Database Schema** (Awaiting user authorization)

---

## 2. Phase Tracker & Completion Summary

| Phase | Description | Status | Completion Criteria / Gate |
|---|---|---|---|
| **Phase 00** | Workspace Inspection & Project Setup | **COMPLETED** | Workspace verified clean; technical specs thoroughly reviewed; tracking and architecture documentation created; baseline commands inspected; git and safety practices established. |
| **Phase 01** | Repository Foundation & Database Schema | **NOT STARTED** | Monorepo/package scaffold initialized; root package scripts & TypeScript config established; Supabase schema, versioned migrations, RLS policies, triggers, and seed scripts implemented; database tests verify relational constraints and security policies. |
| **Phase 02** | Backend Foundation & Core CRUD APIs | **NOT STARTED** | Express API initialized with TypeScript, Zod validation, structured error handling, request ID logging, and rate limiting; CRUD endpoints for titles, collections, memberships, and bookmarks implemented and verified with integration tests. |
| **Phase 03** | Jikan Metadata Importer & Resilient Adapter | **NOT STARTED** | Resilient Jikan v4 adapter implemented with MAL URL/ID parsing, search, normalization, draft preview, duplicate detection, field selection, timeouts, rate limiting, and caching; unit/integration tests with mocked payloads pass. |
| **Phase 04** | Frontend Foundation & Glassmorphism Design System | **NOT STARTED** | Vite + React + TypeScript shell configured; custom CSS design tokens, glassmorphism surface utilities, typography, responsive layout shell (desktop/mobile), route structure, and shared UI components established; verified responsive across viewports. |
| **Phase 05** | Product Workflows & End-to-End Integration | **NOT STARTED** | UI connected to backend APIs; manual title creation/editing, collection management, bookmark tracking with progress, cover upload/URL, search/filter/sort, import preview/commit, and JSON/CSV export operational. |
| **Phase 06** | Hardening: Security, Accessibility, & Performance | **NOT STARTED** | Server-side SSRF safeguards, image upload signature verification, accessibility audit (keyboard nav, ARIA, color contrast), glassmorphism performance optimization, and backup/restore rehearsal completed. |
| **Phase 07** | Deployment Preparation & Production Verification | **NOT STARTED** | Frontend deployed to Vercel; Express API deployed to compatible Node host; Supabase production instance configured with RLS and Storage policies; smoke tests pass; rollback plan verified. |

---

## 3. Work Completed vs. Work Not Yet Started

### Completed Work (Phase 00)
- [x] Workspace inspection performed: confirmed clean workspace containing only `Documentations/`.
- [x] Environment inspection completed: verified Node.js v26.10.0, npm 11.19.1, and Git 2.55.0.
- [x] Full review of `Documentations/Antigravity_Master_Build_Prompt.txt`, `Personal_Media_Library_Full_Technical_Specification.md`, and `.docx`.
- [x] Reconciled requirements, clarified architectural boundaries, and identified open decision points.
- [x] Created documentation suite:
  - `docs/BUILD_PROGRESS.md`
  - `docs/architecture.md`
  - `docs/api-contracts.md`
  - `docs/decisions.md`
  - `docs/test-report.md`
  - `docs/requirements-traceability.md`
  - `docs/deployment.md`
  - `docs/known-limitations.md`
- [x] Established baseline verification commands and recorded their pre-scaffold statuses.
- [x] Formulated detailed roadmap, completion criteria, and acceptance criteria for Phase 01.

### Work Not Yet Started (Phases 01–07)
- [ ] Git repository initialization and `.gitignore` setup.
- [ ] Monorepo package workspace configuration (`apps/web`, `apps/api`, `packages/shared`, `supabase`).
- [ ] Database schema DDL, SQL migrations, RLS policies, and seed data.
- [ ] Express backend API, routing, validation schemas, controllers, and services.
- [ ] Jikan API provider adapter, URL parsers, and normalization logic.
- [ ] React frontend, Vite configuration, glassmorphism CSS design system, and route pages.
- [ ] End-to-end integration of collections, bookmarks, title details, and import workflows.
- [ ] Automated testing suites (unit, integration, component, E2E).
- [ ] Production deployments on Vercel and Node host with Supabase.

---

## 4. Verification & Testing Log

| Target | Command | Status | Result / Notes |
|---|---|---|---|
| **Linting** | `npm run lint` | **NOT RUN / NOT APPLICABLE** | Application package structure not yet created. |
| **Type Checking** | `npm run typecheck` | **NOT RUN / NOT APPLICABLE** | TypeScript configuration and source files not yet created. |
| **Automated Tests** | `npm test` | **NOT RUN / NOT APPLICABLE** | Test runners and test suites not yet created. |
| **Production Build** | `npm run build` | **NOT RUN / NOT APPLICABLE** | Build configuration and application code not yet created. |
| **Workspace Inspection** | `ls -la && git status` | **PASS** | Confirmed clean directory; detected non-git status. |
| **Environment Check** | `node -v && npm -v && git --version`| **PASS** | Node v26.10.0, npm 11.19.1, Git 2.55.0 present and verified. |

---

## 5. Outstanding Decisions, Required Credentials, & Dependencies

### External Service Dependencies
1. **Supabase PostgreSQL & Storage:**
   - Requires Supabase project URL, Anon/Publishable Key, and Service Role Secret (for backend migrations/server queries).
   - Storage bucket `covers` needs to be created with size and MIME restrictions.
2. **Jikan REST API v4:**
   - Free, public, read-only API (`https://api.jikan.moe/v4`).
   - Rate limit: ~3 requests per second / 60 requests per minute.
   - Needs server-side caching, timeouts (8–12s), and bounded retries.
3. **Vercel (Frontend Hosting):**
   - Required for static/SPA frontend deployment in Phase 07.
4. **Node.js Hosting (API):**
   - Either dedicated container/PaaS (Render, Railway, Fly.io) or Vercel Serverless Functions entry point.

### Outstanding Architectural Decisions
1. **API Hosting Model (Decision DEC-003):** Dedicated Express container vs. Vercel Serverless Functions. (Default recommendation: Express app structure compatible with both; can be run as standard Express server locally or packaged with `@vendia/serverless-express` / Vercel API routes if serverless).
2. **Authentication Gate (Decision DEC-001):** Single-user personal access gate (Supabase Auth vs. session token/password gate). Default recommendation: Supabase Auth single-user with email/password, ensuring tables are protected with RLS referencing `auth.uid()`.
3. **Manga vs. Manhwa Source Mapping (Decision DEC-005):** MAL classifies both manga and manhwa under the `manga` endpoint. The import preview UI will prompt the user to confirm/adjust when publication type indicates Manhwa or Webtoon.

---

## 6. Next Approved Task & Acceptance Criteria

### Next Task: Phase 01 — Repository Foundation & Database Schema
**Prerequisite:** User review and formal approval of Phase 00 findings.

### Phase 01 Acceptance Criteria:
1. Git repository initialized with appropriate `.gitignore` and initial baseline commit.
2. Monorepo directory structure established (`apps/api`, `apps/web`, `packages/shared`, `supabase`, `docs`).
3. Root `package.json` with workspace configuration and scripts (`dev`, `build`, `test`, `lint`, `typecheck`).
4. Complete SQL migrations in `supabase/migrations/` covering:
   - `titles`, `title_aliases`, `collections`, `title_collections`, `bookmarks`, `genres`, `title_genres`, `tags`, `title_tags`, `external_sources`.
   - Appropriate indexes (`owner_id`, `media_type`, `status`, full-text / trigram search, composite keys).
   - Foreign keys with `ON DELETE CASCADE`.
   - Constraints (`media_type IN ('anime', 'manga', 'manhwa')`, `status IN ('plan_to_consume', 'consuming', 'completed', 'on_hold', 'dropped')`, non-negative progress, valid rating ranges).
   - Row Level Security (RLS) enabled on all tables with explicit access policies.
   - Automatic `updated_at` triggers on relevant tables.
5. Local seed script (`supabase/seed.sql`) providing mock test fixtures for development and testing.
6. Baseline lint, typecheck, and build commands established and passing cleanly.
7. Verification results recorded in `docs/test-report.md` and `docs/BUILD_PROGRESS.md`.

---

## 7. Change Log by Task

### Phase 00 Task: Workspace Inspection & Setup
- **Created:**
  - `docs/BUILD_PROGRESS.md`: Persistent master build and phase tracker.
  - `docs/architecture.md`: Complete system architecture and component designs.
  - `docs/api-contracts.md`: Detailed REST API specifications, payloads, and error codes.
  - `docs/decisions.md`: Architecture Decision Records (ADRs) and rationale.
  - `docs/test-report.md`: Verification results, test matrix, and audit logs.
  - `docs/requirements-traceability.md`: Functional requirements mapped to code & tests.
  - `docs/deployment.md`: Hosting strategy, environment configuration, and rollback procedures.
  - `docs/known-limitations.md`: Documented constraints, edge cases, and deferred scope.
