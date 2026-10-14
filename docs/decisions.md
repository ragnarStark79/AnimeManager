# AnimeManager — Architecture Decision Records (ADRs)

**Document Version:** 1.0  
**Status:** Approved Baseline Decisions for Phase 00 / Phase 01  

---

### ADR-001: Private-First Access Model & Authentication

- **Status:** Approved
- **Context:**
  AnimeManager is a personal media library meant for individual cataloging and tracking. The master prompt requires keeping the site private-first and implementing access controls suitable for public internet deployment.
- **Decision:**
  Use **Supabase Auth** for authentication (email/password with a single permitted owner account). Database tables enforce Row Level Security (RLS) linked to `auth.uid()`. When the Express API connects via a service role key, it authenticates the caller's JWT/session before executing database queries. Public anonymous access is blocked on write and read routes.
- **Consequences:**
  - Prevents unauthorized internet users from viewing or modifying personal collections.
  - Keeps service-role keys restricted to the backend server.
  - Prepares the database for future multi-user support without architectural rewrites.

---

### ADR-002: Monorepo Workspace Structure

- **Status:** Approved
- **Context:**
  The project requires both a React/Vite frontend and an Express/Node backend, alongside shared validation schemas, database migrations, and documentation.
- **Decision:**
  Adopt an **npm workspaces** monorepo layout:
  - `apps/web`: React + Vite + TypeScript frontend.
  - `apps/api`: Express + Node.js + TypeScript backend.
  - `packages/shared`: Shared TypeScript types, Zod schemas, and constants.
  - `supabase/`: Versioned migrations and seed SQL.
  - `docs/`: Persistent project tracking and documentation.
- **Consequences:**
  - Code reuse: Zod schemas and TypeScript interfaces are shared between frontend and backend without duplication.
  - Single lockfile and unified root scripts (`npm run build`, `npm test`, `npm run lint`).
  - Clear separation of backend and frontend boundaries.

---

### ADR-003: Backend Hosting Model & Express Portability

- **Status:** Approved
- **Context:**
  Frontend will deploy to Vercel. The backend requires a compatible hosting model. Serverless functions on Vercel have execution timeouts and potential stateless connection pooling considerations, while dedicated containers (Render, Railway, Fly.io) provide continuous long-running processes.
- **Decision:**
  Build the backend as a standard Express application with clear separation between the HTTP server (`server.ts`) and the Express app configuration (`app.ts`). This allows:
  1. Standard container deployment on platforms like Render or Railway.
  2. Direct packaging as a Vercel Serverless Function using a lightweight handler wrapper if a unified Vercel deployment is desired.
- **Consequences:**
  - Avoids platform lock-in.
  - Works consistently in local development via standard `tsx`/`node`.

---

### ADR-004: Styling Architecture & Glassmorphism Design System

- **Status:** Approved
- **Context:**
  The application requires a stunning visual presentation inspired by the Flix.id reference: cool blue/gray atmosphere, translucent frosted surfaces, rounded cards, and responsive layouts. Web application development guidelines advise using Vanilla CSS for maximum flexibility and control, avoiding Tailwind unless requested.
- **Decision:**
  Implement the design system using **Vanilla CSS with CSS Custom Properties (Design Tokens)**.
  - Central token file (`styles/tokens.css`) defining colors, blur intensities, translucent surfaces, borders, radiuses, and shadows.
  - Responsive grid layouts with container queries and flexbox.
  - Solid/semi-opaque fallbacks for browsers lacking `backdrop-filter` or when reduced motion is preferred (`prefers-reduced-motion`).
- **Consequences:**
  - Zero heavy CSS framework dependencies.
  - Precision control over glassmorphism optical contrast, typography, and animations.
  - Strict compliance with project design instructions.

---

### ADR-005: MAL Manga vs. Manhwa Disambiguation

- **Status:** Approved
- **Context:**
  MyAnimeList classifies both Japanese manga and Korean manhwa under its `/manga/` endpoint. However, AnimeManager requires three distinct media types: `anime`, `manga`, and `manhwa`.
- **Decision:**
  During Jikan metadata import:
  1. Parse MAL manga responses and inspect source type fields (e.g. `type: "Manhwa"` or published country).
  2. If type is explicitly "Manhwa", pre-select `manhwa` in the import preview draft.
  3. If ambiguous, flag a prompt in the interactive import preview for the user to confirm whether the title is `manga` or `manhwa` before saving.
  4. Never silently label all MAL manga entries as manga.
- **Consequences:**
  - Guarantees accuracy for the user's manhwa catalog.
  - User retains full editorial control prior to committing.

---

### ADR-006: Collection Name Uniqueness Policy

- **Status:** Approved
- **Context:**
  Users can create custom collections (e.g. "Favorites", "Romance"). The system needs a defined policy on duplicate or similar names.
- **Decision:**
  Enforce **case-insensitive uniqueness per owner** after trimming whitespace:
  - Database constraint: `UNIQUE (owner_id, lower(name))`.
  - Empty or whitespace-only names are rejected at schema validation.
  - User is given an immediate, actionable error if a duplicate name is attempted.
- **Consequences:**
  - Prevents confusing duplicate folders (e.g. "Romance" and "romance").
  - Clean collection browsing in the UI.

---

### ADR-007: Deletion Semantics & Cascade Rules

- **Status:** Approved
- **Context:**
  Title, collection, and bookmark lifecycles intersect. A clear policy is required for when resources are deleted.
- **Decision:**
  1. **Title Deletion:** Explicit user confirmation dialog. Permanently deletes title and cascades to aliases, tags, collection memberships, external sources, and bookmarks.
  2. **Collection Deletion:** Deletes the collection record and removes entries from `title_collections`. **Does NOT delete the titles themselves**.
  3. **Bookmark Deletion:** Removes tracking status, progress, and rating. **Does NOT delete the title record**.
  4. **Export Prior to Deletion:** UI reminds users of the export feature if performing mass deletions.
- **Consequences:**
  - Independent lifecycles for titles, collections, and bookmarks.
  - Zero accidental title loss when organizing or deleting collections.

---

### ADR-008: Canonical Location of Personal Rating

- **Status:** Approved
- **Context:**
  The technical specification notes that `personal_rating` could reside on `titles` or `bookmarks`.
- **Decision:**
  Store `personal_rating` canonically on the **`bookmarks`** table. The title record stores objective source community metrics (`source_score`, `source_rank`, `source_popularity`), while personal evaluation belongs to the user's tracking bookmark.
- **Consequences:**
  - Clean separation between source catalog metadata and user's personal engagement.
  - When titles are listed, the backend joins with the user's bookmark to display personal rating badges where available.

---

### ADR-009: Jikan Import Scope for Release 1

- **Status:** Approved
- **Context:**
  Jikan v4 provides rich data including titles, synopses, covers, episodes, characters, staff, relations, and user reviews.
- **Decision:**
  - **Included in v1 Import:** English/original/alternate titles, synopsis, background, cover URL, release year, status, episode/chapter counts, source score/rank, genres, tags.
  - **Excluded in v1:** Community user reviews (strictly excluded as per Master Prompt).
  - **On-Demand Only:** Character, staff, and relations data are not imported into the core title record during initial import. They can be fetched on demand on the title detail page if needed.
- **Consequences:**
  - Dramatically faster import times.
  - Less strain on Jikan rate limits.
  - Lean local database footprint.

---

### ADR-010: SSRF Prevention & Safe Import URL Parsing

- **Status:** Approved
- **Context:**
  Allowing users to input URLs for metadata import presents Server-Side Request Forgery (SSRF) risks if the server makes arbitrary outbound HTTP requests.
- **Decision:**
  The server **never** fetches arbitrary user-supplied URLs.
  1. User input is validated against a strict regex allowlist for MyAnimeList URLs (`https://myanimelist.net/anime/:id/...` or `https://myanimelist.net/manga/:id/...`).
  2. The parser extracts the ID and type only.
  3. Outbound HTTP requests are made strictly to predefined Jikan endpoints (`https://api.jikan.moe/v4/...`).
  4. Any non-conforming URL is rejected immediately with HTTP 400.
- **Consequences:**
  - Complete mitigation of SSRF vulnerabilities.
  - Predictable, secure API behavior.
