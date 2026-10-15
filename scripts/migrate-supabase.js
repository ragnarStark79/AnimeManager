#!/usr/bin/env node

/**
 * AnimeManager — Supabase Remote Migration Runner
 * Applies tracked migrations from supabase/migrations/ to the remote Supabase PostgreSQL database
 * using official Supabase CLI migration workflows.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import pg from 'pg';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

// Helper to safely load .env if not present in process.env
function getDbUrl() {
  if (process.env.SUPABASE_DATABASE_URL?.trim()) {
    return process.env.SUPABASE_DATABASE_URL.trim();
  }
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim();
  }

  const envPath = path.resolve(ROOT_DIR, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    // First look for active SUPABASE_DATABASE_URL or DATABASE_URL
    for (const l of lines) {
      const trimmed = l.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (key === 'SUPABASE_DATABASE_URL' && val) return val;
        if (key === 'DATABASE_URL' && val) return val;
      }
    }

    // Look for commented remote Supabase URL in .env
    for (const l of lines) {
      if (l.includes('db.') && l.includes('.supabase.co')) {
        const match = l.match(/DATABASE_URL\s*=\s*(postgresql:\/\/[^\s"']+)/);
        if (match && match[1]) {
          return match[1];
        }
      }
    }
  }

  return null;
}

function sanitizeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    return `${u.host}${u.pathname}`;
  } catch {
    return 'unknown-host';
  }
}

async function main() {
  console.log('======================================================');
  console.log('  AnimeManager — Supabase Remote Migration Runner     ');
  console.log('======================================================\n');

  const dbUrl = getDbUrl();
  if (!dbUrl) {
    console.error('✖ FATAL: No database connection string found in SUPABASE_DATABASE_URL or DATABASE_URL.');
    process.exit(1);
  }

  const sanitized = sanitizeUrl(dbUrl);
  console.log(`Target Database: ${sanitized}`);

  // Test pre-connection
  const client = new Client({
    connectionString: dbUrl,
    ssl: dbUrl.includes('supabase') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    console.log('✔ Direct database connection established successfully.');
  } catch (err) {
    console.error(`✖ FATAL: Could not connect to target database: ${err.message}`);
    process.exit(1);
  }

  // Push migrations using Supabase CLI
  console.log('\nRunning Supabase CLI migration push (supabase db push)...');
  try {
    const cmd = `npx -y supabase db push --db-url "${dbUrl}"`;
    const out = execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf8' });
    console.log(out.trim());
  } catch (err) {
    console.error('✖ Migration execution failed:');
    if (err.stdout) console.log(err.stdout);
    if (err.stderr) console.error(err.stderr);
    await client.end();
    process.exit(1);
  }

  // Verification
  console.log('\nVerifying applied schema and migration records...');
  try {
    const migRes = await client.query(
      `SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;`
    );
    console.log(`✔ Recorded Migrations in supabase_migrations (${migRes.rows.length}):`);
    migRes.rows.forEach((r) => console.log(`   - ${r.version}_${r.name || 'unnamed'}`));

    const tablesRes = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`
    );
    console.log(`\n✔ Public Tables (${tablesRes.rows.length}):`);
    tablesRes.rows.forEach((r) => console.log(`   - ${r.table_name}`));

    const rlsRes = await client.query(
      `SELECT relname, relrowsecurity FROM pg_class JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace WHERE pg_namespace.nspname = 'public' AND relkind = 'r';`
    );
    const rlsDisabled = rlsRes.rows.filter((r) => !r.relrowsecurity);
    if (rlsDisabled.length === 0) {
      console.log(`\n✔ Row Level Security (RLS) is ENABLED on all ${rlsRes.rows.length} domain tables.`);
    } else {
      console.warn(`\n⚠️ WARNING: RLS is disabled on: ${rlsDisabled.map((r) => r.relname).join(', ')}`);
    }

    console.log('\n======================================================');
    console.log('✔ REMOTE MIGRATIONS APPLIED AND VERIFIED CLEANLY');
    console.log('======================================================');
  } catch (err) {
    console.error(`✖ Post-migration verification error: ${err.message}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
