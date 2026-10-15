# AnimeManager

> Personal Media Library for Anime, Manga, and Manhwa.

AnimeManager is a private-first personal media catalog and progress tracker built with modern web standards, featuring an atmospheric dark glassmorphism design system inspired by cinematic media libraries.

---

## Architecture Overview

- **Frontend (`apps/web`):** React 18, Vite 5, TypeScript, TanStack Query, and Vanilla CSS with custom glassmorphism design tokens.
- **Backend API (`apps/api`):** Node.js, Express, TypeScript, Zod schema validation, and PostgreSQL connection pooling.
- **Shared (`packages/shared`):** Shared domain models, enums, validation schemas, and API contracts.
- **Database (`supabase/`):** PostgreSQL relational schema, Row-Level Security (RLS) policies, and verification test suites.

---

## Quickstart & Local Development

For complete setup requirements, environment variable partitioning, database instructions, and troubleshooting, consult the [Local Development Guide](file:///Users/ragnar/Documents/Projects/AnimeManager/docs/LOCAL_DEVELOPMENT.md).

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
*(Ensure local PostgreSQL is accessible on port 5432 and configure `DATABASE_URL` in `.env`)*

### 3. Initialize & Verify Database
```bash
npm run test:db
```

### 4. Start Development Environment (API + Web)
```bash
npm run dev
```
- **Web UI:** [http://localhost:5173](http://localhost:5173)
- **API Backend:** [http://localhost:4000/api/v1](http://localhost:4000/api/v1)

### 5. Check Health & Connectivity
```bash
npm run healthcheck
```

---

## Quality Gates & Verification

Run all repository quality gates from the monorepo root:

```bash
# Typecheck all workspaces
npm run typecheck

# Lint all workspaces
npm run lint

# Run monorepo test suite (113 automated tests)
npm test

# Build production bundles
npm run build

# Run API integration tests
npm run test:api

# Run live database constraint tests
npm run test:db
```

---

## Documentation

Detailed architectural and operational documentation is located in [`docs/`](file:///Users/ragnar/Documents/Projects/AnimeManager/docs):
- [Local Development Guide](file:///Users/ragnar/Documents/Projects/AnimeManager/docs/LOCAL_DEVELOPMENT.md)
- [System Architecture](file:///Users/ragnar/Documents/Projects/AnimeManager/docs/architecture.md)
- [API Contracts](file:///Users/ragnar/Documents/Projects/AnimeManager/docs/api-contracts.md)
- [Build Progress](file:///Users/ragnar/Documents/Projects/AnimeManager/docs/BUILD_PROGRESS.md)
- [Test Report](file:///Users/ragnar/Documents/Projects/AnimeManager/docs/test-report.md)
- [Known Limitations](file:///Users/ragnar/Documents/Projects/AnimeManager/docs/known-limitations.md)
