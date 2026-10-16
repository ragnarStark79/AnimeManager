# AnimeManager — Deployment & Operations Guide

**Document Version:** 3.0  
**Phase:** Phase 07 (Deployment Preparation, Production Readiness & Verification)  
**Status:** Ready After Manual Configuration  

---

## 1. Hosting Architecture & Target Infrastructure

AnimeManager is prepared for deployment as a **unified monorepo application on Vercel**, backed by **Supabase** for database persistence and storage, and **Tenrai v1** for external anime, manga, and manhwa metadata:

```mermaid
graph TD
    User([End User / Library Owner])
    subgraph VercelEdge ["Vercel Edge Platform"]
        Frontend["Frontend SPA<br/>(React 18 + Vite + TanStack Query)<br/>outputDirectory: apps/web/dist"]
        APIFunction["API Serverless Function<br/>(Node.js 20+ / Express 4.21)<br/>api/index.js (Rewrites: /api/*)"]
    end
    subgraph SupabaseCloud ["Supabase Managed Cloud (Tokyo ap-northeast-1)"]
        Pooler["Supavisor Transaction Pooler<br/>aws-0-ap-northeast-1.pooler.supabase.com:6543"]
        Database[("PostgreSQL 17.11<br/>10 Domain Tables + 3 Triggers + 35 RLS Policies")]
        Storage[("Supabase Storage<br/>'covers' Bucket (5MB limit)")]
    end
    Tenrai["Tenrai Metadata API v1<br/>api.tenrai.org/v1 (Dual-Stack Cloudflare)"]

    User -->|HTTPS GET /| Frontend
    User -->|HTTPS /api/v1/*| APIFunction
    Frontend -->|Same-Origin AJAX /api/v1/*| APIFunction
    APIFunction -->|SSL Transaction Pool (port 6543)| Pooler
    Pooler --> Database
    APIFunction -->|Signed Uploads| Storage
    APIFunction -->|Throttled HTTPS GET| Tenrai
    User -.->|Direct Public Image Fetch| Storage
```

### Infrastructure Summary:
1. **Frontend:** Deployed to **Vercel** as a high-performance static SPA build with client-side route rewrites.
2. **Backend API:** Executed as a **Vercel Serverless Function** (`api/index.js`) wrapping the production-hardened Express application. Same-origin routing (`/api/*`) eliminates cross-origin CORS preflight latency.
3. **Database:** Hosted on **Supabase PostgreSQL 17.11** in the Tokyo region (`ap-northeast-1`), accessed through the **Supavisor Transaction Pooler** on port `6543` for optimal serverless connection lifecycle and dual-stack IPv4/IPv6 compatibility.
4. **Object Storage:** Hosted on **Supabase Storage** (`covers` bucket) for title cover artwork.
5. **Metadata Provider:** **Tenrai API v1** (`https://api.tenrai.org/v1`), configured with DNS/TLS validation, bounded TTL caching, and sliding-window rate limiting.

---

## 2. Vercel Configuration & Serverless Function Setup

The repository uses a single root `vercel.json` and serverless adapter `api/index.js` to build and serve both the frontend static bundle and the backend API within a single Vercel project:

### 2.1 `vercel.json`
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "apps/web/dist",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api"
    },
    {
      "source": "/((?!api/|assets/|favicon\\.svg).*)",
      "destination": "/index.html"
    }
  ]
}
```

- **Build Command:** `npm run build` runs across all npm workspaces (`@animemanager/shared`, `@animemanager/api`, `@animemanager/web`).
- **Output Directory:** Static frontend assets are compiled into `apps/web/dist`.
- **API Rewrite:** All requests targeting `/api/:path*` route directly to the serverless function `api/index.js`.
- **SPA Fallback:** All non-API, non-asset requests rewrite to `/index.html`, enabling seamless client-side routing with `react-router-dom`.

### 2.2 Serverless Adapter (`api/index.js`)
```javascript
import { app } from '../apps/api/dist/app.js';

export default function handler(req, res) {
  return app(req, res);
}
```

The Express application is exported as a standard request listener. Route mounting in `apps/api/src/app.ts` supports both `/api/v1` and rewritten `/v1` paths.

### 2.3 Serverless Database Pool Tuning (`apps/api/src/repositories/db.ts`)
To prevent connection exhaustion across concurrent Vercel serverless function invocations:
- When `process.env.VERCEL` is active, `pg.Pool` caps active connections at `max: 3` per function instance (compared to 20 for persistent servers).
- `idleTimeoutMillis` is set to `10000` (10 seconds) to promptly release idle connections back to the Supavisor pooler.
- Port `6543` (Transaction mode) pools connections per query/transaction, preventing connection leaks across serverless warm/cold cycles.

---

## 3. Environment Variables & Secret Configuration

### 3.1 Frontend (`apps/web`)
Because the frontend and backend are deployed to the same Vercel origin, **no public environment variables are strictly required**. The API client defaults to `/api/v1`:
- `VITE_API_BASE_URL` (optional): Defaults to `/api/v1`. Only set if pointing to an external domain.

> [!NOTE]
> Client-side environment variables prefixed with `VITE_` are embedded in the browser bundle. Never place database passwords, service-role keys, or JWT secrets in `VITE_` variables.

### 3.2 Backend Serverless Environment Variables (Vercel Project Settings)
Configure the following variables in the **Vercel Project Settings > Environment Variables** tab (check **Production** and **Preview**):

| Variable Name | Required | Recommended Production Value | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | `production` | Enables production security guards and optimizations. |
| `DATABASE_URL` | Yes | `postgresql://postgres.[REF]:[PASS]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres` | Supabase Supavisor Transaction Pooler connection string. |
| `SUPABASE_DATABASE_URL` | Optional | *(Same as DATABASE_URL)* | Explicit Supabase connection string (takes precedence if set). |
| `SUPABASE_URL` | Yes | `https://[PROJECT_REF].supabase.co` | Supabase API endpoint for Auth and Storage. |
| `SUPABASE_JWT_SECRET` | Yes | `[YOUR_SUPABASE_PROJECT_JWT_SECRET]` | Secret used to verify user tokens (HS256). Must NOT be dev fallback string. |
| `ENABLE_DEV_AUTH` | Yes | `false` | Must be `false`. Startup fails if set to `true` in production. |
| `METADATA_API_BASE_URL` | No | `https://api.tenrai.org/v1` | Tenrai v1 metadata provider endpoint. |
| `CORS_ORIGIN` | Yes | `https://[YOUR_VERCEL_DOMAIN].vercel.app` | Production origin. Comma-separated domains supported. |
| `IMPORT_RATE_LIMIT_MAX` | No | `20` | Max import searches/previews per minute per user. |
| `IMPORT_RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit sliding window (1 minute). |
| `REQUEST_TIMEOUT_MS` | No | `10000` | Timeout for external metadata requests (10 seconds). |
| `COVER_MAX_BYTES` | No | `5242880` | Upload size ceiling (5 MB). |

---

## 4. Supabase Setup Checklist

### 4.1 Database Migrations
Migrations have been executed and verified. For a new environment, apply:
```bash
# Verify connection
node scripts/verify-db.js

# Apply migrations if initializing a fresh database
npx supabase db push
```

### 4.2 Storage Bucket (`covers`)
In the **Supabase Dashboard**:
1. Go to **Storage > New Bucket**.
2. Name: `covers`.
3. Set **Public Bucket** to **Enabled** (for public read access to cover artwork).
4. Set **File Size Limit** to `5242880` bytes (5 MB).
5. Allowed MIME Types: `image/jpeg, image/png, image/webp`.
6. Ensure RLS policies restrict file insertion and deletion to authenticated users.

---

## 5. Step-by-Step Vercel Deployment Procedure

### Option A: Via Vercel Web Dashboard (Recommended)
1. Push the verified repository to your GitHub repository:
   ```bash
   git push origin main
   ```
2. Log in to [vercel.com](https://vercel.com) and click **Add New > Project**.
3. Import the `AnimeManager` repository.
4. **Project Settings:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (Leave as repository root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `apps/web/dist`
   - **Install Command:** `npm install`
5. **Environment Variables:**
   - Add all required backend environment variables listed in Section 3.2.
6. Click **Deploy**.
7. Once deployed, note your production URL (e.g., `https://animemanager.vercel.app`).
8. Add your production URL to `CORS_ORIGIN` in Vercel Environment Variables.
9. Redeploy the latest commit to activate the updated CORS origin.

### Option B: Via Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link and build
vercel link

# Add environment variables
vercel env add DATABASE_URL production
vercel env add SUPABASE_JWT_SECRET production
vercel env add NODE_ENV production
vercel env add ENABLE_DEV_AUTH production

# Deploy to production
vercel --prod
```

---

## 6. Post-Deployment Verification & Smoke Tests

After deployment, perform these verification checks on the live production URL:

1. **System Health Liveness:**
   ```bash
   curl -i https://[YOUR_VERCEL_DOMAIN].vercel.app/api/v1/health/liveness
   # Expected: HTTP 200 { "status": "alive" }
   ```

2. **System Health & Database Readiness:**
   ```bash
   curl -i https://[YOUR_VERCEL_DOMAIN].vercel.app/api/v1/health
   # Expected: HTTP 200 { "database": "connected", "schema": "ready", "readiness": "ready" }
   ```

3. **Frontend SPA Navigation:**
   - Open `https://[YOUR_VERCEL_DOMAIN].vercel.app/` in your browser.
   - Verify that the Flix.id atmospheric dark design loads smoothly.
   - Navigate to `/titles`, `/collections`, `/bookmarks`, and `/import`.
   - Refresh `/collections` directly to verify client-side routing fallback works without 404.

4. **Authentication Flow:**
   - Log in using your Supabase credentials or authentication session.
   - Verify token persistence in localStorage and header injection.

5. **Metadata Import & Duplicate Detection:**
   - Open `/import` and search for an anime title (e.g. `Frieren`).
   - Click Preview and verify synopsis, cover poster, and metadata render.
   - If importing, verify atomic database commit and duplicate warning if re-previewed.

6. **Library Export:**
   - Navigate to Settings / Export and download both JSON and CSV backups.
   - Confirm exported JSON contains titles, collections, and bookmarks.

---

## 7. Rollback & Disaster Recovery Procedures

### 7.1 Instant Frontend & API Rollback (Vercel)
Because frontend and API are deployed together within the same Vercel project:
1. In the **Vercel Dashboard**, open the **Deployments** tab.
2. Locate the previous working deployment.
3. Click the three dots (`...`) and select **Instant Rollback** (or **Promote to Production**).
4. Vercel immediately points traffic to the previous deployment within seconds.

### 7.2 Database Recovery (Supabase)
1. **Automated Backups:** Supabase projects feature daily automated backups available in **Project Settings > Database > Backups**.
2. **Point-in-Time Recovery (PITR):** If enabled on Pro tier, restore to any minute prior to an incident.
3. **Manual JSON Snapshot Restore:** If an accidental deletion occurs, import the latest JSON library backup exported from AnimeManager via the Export API.
4. **Migration Rollback:** If a migration requires rollback, apply the corresponding down-migration script using the Supabase CLI (`npx supabase db push`).
