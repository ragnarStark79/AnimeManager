# AnimeManager — Local Development & Startup Guide

**Document Version:** 1.0  
**Phase:** Phase 05.1 (Local Startup, API Connectivity & Runtime Verification)  
**Status:** Verified & Operational

---

## 1. System Requirements & Software Prerequisites

Before starting local development, ensure your environment has the following software installed:

| Software | Required Version | Verification Command | Purpose |
|---|---|---|---|
| **Node.js** | `>= 20.0.0` (Recommended: Node 20+ LTS or Node 22+) | `node -v` | JavaScript runtime for API and Web apps |
| **npm** | `>= 10.0.0` | `npm -v` | Package manager and workspace orchestrator |
| **PostgreSQL** | `>= 14.0` (Postgres.app or Homebrew on port 5432) | `psql --version` | Relational database engine |
| **psql CLI** | Any standard client | `which psql` | Database migration and verification runner |

---

## 2. Initial Dependency Installation

AnimeManager is structured as an npm monorepo with workspaces (`packages/*`, `apps/*`). Install all dependencies once from the **repository root**:

```bash
cd ~/Documents/Projects/AnimeManager
npm install
```

This installs dependencies across the root, `packages/shared`, `apps/api`, and `apps/web` while establishing workspace symlinks.

---

## 3. Local Environment Configuration

Copy the documented environment template to create your local `.env` file:

```bash
cp .env.example .env
```

### Environment Variable Partitioning

Variables are strictly partitioned between the Express REST API backend and the Vite frontend:

#### Backend Only (Server-Side Secrets)
These variables must **never** be exposed to the client bundle:
- `PORT`: Port Express listens on (default: `4000`).
- `HOST`: Host interface to bind to (default: `0.0.0.0`).
- `NODE_ENV`: Set to `development` for local work.
- `DATABASE_URL`: PostgreSQL connection string (default: `postgresql://<user>@localhost:5432/animemanager_test`).
- `SUPABASE_URL`: Supabase project URL (optional in local development when using local PostgreSQL).
- `SUPABASE_SERVICE_ROLE_KEY`: Service-role key for backend administrative access.
- `JWT_SECRET`: Signing secret for local auth tokens (must match between client dev token and API).
- `CORS_ORIGIN`: Allowed origins (default: `http://localhost:5173`).

#### Frontend Safe Variables (`VITE_` Prefix)
Only variables prefixed with `VITE_` are embedded into the client bundle by Vite:
- `VITE_API_BASE_URL`: Set to `/api/v1` in local development so the browser sends requests through the Vite development proxy (`http://localhost:5173/api/v1/...`) to avoid CORS issues and match production routing.
- `VITE_APP_TITLE`: Optional application title (default: `AnimeManager`).
- `VITE_SUPABASE_URL`: Public Supabase endpoint for client-side storage CDN access (if configured).
- `VITE_SUPABASE_ANON_KEY`: Public anonymous key.

> [!NOTE]
> In local development mode (`npm run dev`), the frontend automatically acquires a fresh, properly signed JWT session for the local development owner (`00000000-0000-0000-0000-000000000001`) from the API at `GET /api/v1/auth/dev-session`. You do **not** need to generate or configure a static JWT in environment variables.

> [!IMPORTANT]
> Never commit `.env` to Git. The `.gitignore` file is configured to exclude all `.env` files.

---

## 4. PostgreSQL Database Setup & Verification

AnimeManager relies on PostgreSQL for library catalog persistence, custom collections, bookmarks, and foreign key relations.

### A. Verifying Local PostgreSQL Availability
Check if your local PostgreSQL server is active:

```bash
# Check if PostgreSQL is accepting connections on port 5432
nc -z 127.0.0.1 5432 && echo "PostgreSQL is running" || echo "PostgreSQL is NOT running"
```

If using macOS Postgres.app, ensure the elephant icon in the menu bar is running. If using Homebrew:
```bash
brew services start postgresql@16
```

### B. Running Database Verification & Migrations
The repository includes a safe database verification runner that applies migrations and seeds to the isolated test database:

```bash
npm run test:db
```

This executes `scripts/verify-db.js`, which:
1. Connects to `animemanager_test` (safely refusing any database not ending in `_test`).
2. Applies `supabase/migrations/20261014000001_initial_schema.sql`.
3. Applies `supabase/migrations/20261014000002_security_policies.sql`.
4. Applies `supabase/seed.sql`.
5. Runs 18 automated SQL assertions verifying multi-collection mapping, cascade rules, and RLS policies.

---

## 5. Development Server Startup

### A. Start Both Frontend and Backend Concurrently (Recommended)

Run the single root development command:

```bash
npm run dev
```

This executes `scripts/dev.js`, which:
1. Validates that ports `4000` and `5173` are ready.
2. Compiles the API TypeScript workspace to ensure fresh build artifacts.
3. Spawns the Express REST API (`node --watch dist/server.js`) on `http://localhost:4000`.
4. Spawns the Vite development server (`npm run dev` in `apps/web`) on `http://localhost:5173`.
5. Streams unified, color-coded terminal logs:
   - `[api]` (cyan) for Express API output.
   - `[web]` (magenta) for Vite frontend output.
   - `[api:err]` and `[web:err]` (red) for process errors.
6. Handles `SIGINT` (Ctrl+C) and `SIGTERM` to cleanly terminate both child processes without leaving orphaned background tasks.

### B. Starting Services Individually

If you need to isolate logs or debug a single workspace:

- **Start Express API only:**
  ```bash
  npm run dev:api
  ```
  *(Runs `node --watch dist/server.js` on port `4000`)*

- **Start Vite Frontend only:**
  ```bash
  npm run dev:web
  ```
  *(Runs Vite on port `5173`)*

---

## 6. Accessing the Application & Verified Ports

Once started, access the following URLs in your browser or HTTP client:

| Component | Verified Local URL | Description |
|---|---|---|
| **Frontend UI** | `http://localhost:5173` | React application shell and interactive catalog |
| **Vite Dev Proxy** | `http://localhost:5173/api/v1/...` | Proxies directly to the Express backend |
| **Express REST API** | `http://localhost:4000/api/v1` | Direct backend API endpoints |
| **API Healthcheck** | `http://localhost:4000/api/v1/health` | Service and database readiness endpoint |

---

## 7. Testing Health and Connectivity

Run the automated healthcheck script from the root repository:

```bash
npm run healthcheck
```

This verifies:
1. **API Process Reachability:** Sends an HTTP request to `http://localhost:4000/api/v1/health`.
2. **Database Connectivity:** Evaluates whether PostgreSQL responded to the backend health probe (`database: "connected"`).
3. **Vite Proxy Verification:** Sends an HTTP request through `http://localhost:5173/api/v1/health` to confirm the proxy route succeeds.

### Manual Verification via cURL

**1. Direct API Health Check:**
```bash
curl -s http://localhost:4000/api/v1/health
```
*Expected response (HTTP 200):*
```json
{"data":{"status":"healthy","uptime":12,"timestamp":"...","version":"1.0.0","database":"connected"}}
```

**2. Vite Proxy Health Check:**
```bash
curl -s http://localhost:5173/api/v1/health
```
*Expected response (HTTP 200 matching direct API).*

**3. Authenticated Endpoint Verification:**
```bash
# Unauthenticated request (must return HTTP 401)
curl -s -i http://localhost:5173/api/v1/titles

# Authenticated request using the local development session endpoint (must return HTTP 200)
AUTH_TOKEN=$(curl -s http://localhost:5173/api/v1/auth/dev-session | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).data.token))")
curl -s -H "Authorization: Bearer $AUTH_TOKEN" http://localhost:5173/api/v1/titles
```

---

## 8. Stopping the Development Servers

To stop the development environment:
1. In the terminal where `npm run dev` is running, press **Ctrl + C**.
2. `scripts/dev.js` will intercept the signal, send `SIGINT` to both children, and wait up to 1.5s for clean shutdown before terminating.

If a process was orphaned by an unhandled shell exit:
```bash
# Check if port 4000 or 5173 are still listening
lsof -i :4000
lsof -i :5173

# Terminate process by PID if needed
kill -9 <PID>
```

---

## 9. Troubleshooting & Diagnostics

### Problem 1: `ECONNREFUSED` / HTTP 500 in Browser
- **Symptom:** The browser console displays `500 (Internal Server Error)` on requests to `/api/v1/...`, and Vite terminal logs show `[vite] http proxy error: Error: connect ECONNREFUSED 127.0.0.1:4000`.
- **Root Cause:** The Express API backend is not running on port 4000.
- **Solution:** Always start the full stack using `npm run dev` from the repository root instead of starting `apps/web` alone. Run `npm run healthcheck` to verify the API process.

### Problem 2: Port Conflict (`EADDRINUSE`) on Port 4000 or 5173
- **Symptom:** Startup fails with `Error: listen EADDRINUSE: address already in use :::4000`.
- **Root Cause:** A previous API instance or another service is already bound to port 4000.
- **Solution:** Identify and stop the occupying process:
  ```bash
  lsof -i :4000
  kill -15 <PID>
  ```

### Problem 3: Database Disconnected / Degraded Healthcheck
- **Symptom:** `npm run healthcheck` reports `✖ Database Connection: DISCONNECTED (degraded state)`.
- **Root Cause:** PostgreSQL is not running locally on port 5432, or `DATABASE_URL` in `.env` is incorrect.
- **Solution:**
  1. Check PostgreSQL service: `psql -U ragnar -d animemanager_test -c "SELECT 1;"`
  2. Ensure `.env` contains: `DATABASE_URL=postgresql://<user>@localhost:5432/animemanager_test`
  3. Run `npm run test:db` to initialize the database tables if they do not exist.

### Problem 4: Remote Supabase Connection Refused (`EHOSTUNREACH`)
- **Symptom:** Backend logs show `getaddrinfo ENOTFOUND` or `connect EHOSTUNREACH 2406:da14:...:5432`.
- **Root Cause:** Certain remote Supabase project domains resolve exclusively via IPv6 (`AAAA` records). If the local network or macOS interface lacks an active IPv6 default route, outgoing connections fail.
- **Solution:** Use the local PostgreSQL database for local development (`DATABASE_URL=postgresql://<user>@localhost:5432/animemanager_test`).

### Problem 5: Unauthorized (HTTP 401: Invalid or expired authentication token)
- **Symptom:** Browser shows `401 Unauthorized — Invalid or expired authentication token` when saving titles or fetching collections.
- **Root Cause:** Stale or expired token in the browser's `localStorage` (`animemanager_auth_token`), or backend signing key discrepancy.
- **Solution:**
  1. Go to `Settings` in the UI and click **Refresh Dev Session** or **Clear Token**.
  2. Alternatively, in the browser DevTools Console, run: `localStorage.removeItem('animemanager_auth_token')` and reload.
  3. In development mode (`import.meta.env.DEV`), the application automatically detects expired tokens and refreshes a fresh development session from `GET /api/v1/auth/dev-session`.
  4. In production, development sessions are strictly disabled (`ENABLE_DEV_AUTH=false`), and callers must provide valid authenticated Supabase session tokens.

---

## 10. Safe Troubleshooting Procedure (No Data Loss)

If you encounter unexpected runtime issues, follow this safe diagnostic workflow:

```text
Step 1: Inspect Logs
  └── Check [api:err] and [web:err] prefixes in the terminal.

Step 2: Run Healthcheck
  └── Execute 'npm run healthcheck' to isolate process vs database vs proxy failures.

Step 3: Recompile Workspaces
  └── Run 'npm run build' from repository root to confirm all TypeScript packages compile.

Step 4: Check Quality Gates
  └── Run 'npm run typecheck' and 'npm test' to verify codebase invariants.

Step 5: Verify Database State Safely
  └── Run 'npm run test:db' against 'animemanager_test'. Never run destructive drops on production.
```
