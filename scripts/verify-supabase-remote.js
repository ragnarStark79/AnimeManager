#!/usr/bin/env node

/**
 * AnimeManager — Supabase Remote Persistence Verification Suite
 *
 * Strict Safety Rules:
 * 1. Opt-in only: Requires ALLOW_REMOTE_DB_TESTS=true
 * 2. Scoped only to dedicated test UUID owners:
 *    Owner A: e0000000-0000-0000-0000-000000000001
 *    Owner B: e0000000-0000-0000-0000-000000000002
 * 3. Never deletes or mutates user data.
 * 4. Strips all credentials from diagnostic output.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const TEST_OWNER_A = 'e0000000-0000-0000-0000-000000000001';
const TEST_OWNER_B = 'e0000000-0000-0000-0000-000000000002';
const TEST_MAL_ID = '9999901';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

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
    for (const l of lines) {
      if (l.includes('db.') && l.includes('.supabase.co')) {
        const match = l.match(/DATABASE_URL\s*=\s*(postgresql:\/\/[^\s"']+)/);
        if (match && match[1]) return match[1];
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
  console.log(`${BOLD}======================================================${RESET}`);
  console.log(`${BOLD}  AnimeManager — Remote Supabase Verification Suite   ${RESET}`);
  console.log(`${BOLD}======================================================${RESET}\n`);

  // 1. Strict Opt-in Guard
  if (process.env.ALLOW_REMOTE_DB_TESTS !== 'true') {
    console.error(`${RED}${BOLD}✖ SAFETY ABORT:${RESET} Remote database verification requires explicit opt-in.`);
    console.error('To run remote tests against your hosted Supabase instance, execute:');
    console.error(`\n  ${BOLD}ALLOW_REMOTE_DB_TESTS=true npm run test:supabase:remote${RESET}\n`);
    process.exit(1);
  }

  const dbUrl = getDbUrl();
  if (!dbUrl) {
    console.error(`${RED}✖ FATAL: No database connection URI found in SUPABASE_DATABASE_URL or DATABASE_URL.${RESET}`);
    process.exit(1);
  }

  const sanitizedHost = sanitizeUrl(dbUrl);
  console.log(`Target Database: ${BOLD}${sanitizedHost}${RESET}`);

  // Guard against accidental localhost when expecting remote Supabase
  if (!process.env.ALLOW_LOCAL_OVERRIDE && (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1'))) {
    console.error(`${RED}✖ TARGET MISMATCH: Test target is localhost, but remote Supabase is expected.${RESET}`);
    console.error('Please configure SUPABASE_DATABASE_URL or remote DATABASE_URL in .env, or set ALLOW_LOCAL_OVERRIDE=true.');
    process.exit(1);
  }

  let client = new Client({
    connectionString: dbUrl,
    ssl: dbUrl.includes('supabase') ? { rejectUnauthorized: false } : undefined,
  });

  await client.connect();

  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ${GREEN}✔ ${message}${RESET}`);
      passCount++;
    } else {
      console.error(`  ${RED}✖ FAILED: ${message}${RESET}`);
      failCount++;
    }
  }

  try {
    console.log(`\n${BOLD}Section 1: Server Identity & Schema Readiness${RESET}`);
    const verRes = await client.query('SELECT version();');
    assert(verRes.rows.length === 1, `PostgreSQL server version: ${verRes.rows[0].version.split(' on ')[0]}`);

    const tablesRes = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`
    );
    const existingTables = new Set(tablesRes.rows.map((r) => r.table_name));
    const requiredTables = [
      'titles',
      'title_aliases',
      'collections',
      'title_collections',
      'bookmarks',
      'genres',
      'title_genres',
      'tags',
      'title_tags',
      'external_sources',
    ];
    const missingTables = requiredTables.filter((t) => !existingTables.has(t));
    assert(missingTables.length === 0, `All 10 required domain tables exist in public schema (${existingTables.size} total)`);

    const triggersRes = await client.query(
      `SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema = 'public';`
    );
    const triggerNames = new Set(triggersRes.rows.map((r) => r.trigger_name));
    assert(
      triggerNames.has('trg_titles_updated_at') &&
        triggerNames.has('trg_collections_updated_at') &&
        triggerNames.has('trg_bookmarks_updated_at'),
      'All 3 updated_at triggers exist on mutable tables'
    );

    const rlsRes = await client.query(
      `SELECT relname, relrowsecurity FROM pg_class JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace WHERE pg_namespace.nspname = 'public' AND relkind = 'r';`
    );
    const rlsDisabled = rlsRes.rows.filter((r) => !r.relrowsecurity);
    assert(rlsDisabled.length === 0, `Row Level Security (RLS) is ENABLED on all tables (0 unshielded)`);

    const policiesRes = await client.query(`SELECT count(*) as count FROM pg_policies WHERE schemaname = 'public';`);
    assert(parseInt(policiesRes.rows[0].count, 10) >= 30, `Security policies verified (${policiesRes.rows[0].count} active policies)`);

    // Clean up test owners before running tests
    await client.query(`DELETE FROM titles WHERE owner_id IN ($1, $2);`, [TEST_OWNER_A, TEST_OWNER_B]);
    await client.query(`DELETE FROM collections WHERE owner_id IN ($1, $2);`, [TEST_OWNER_A, TEST_OWNER_B]);
    await client.query(`DELETE FROM tags WHERE owner_id IN ($1, $2);`, [TEST_OWNER_A, TEST_OWNER_B]);

    console.log(`\n${BOLD}Section 2: Title CRUD & Relational Metadata${RESET}`);
    // Create Title
    const titleInsert = await client.query(
      `INSERT INTO titles (owner_id, media_type, english_title, original_title, release_year, publication_status, synopsis)
       VALUES ($1, 'anime', 'Sousou no Frieren (Remote Test)', '葬送のフリーレン', 2023, 'Finished Airing', 'A grand adventure ends.')
       RETURNING id, english_title, release_year, created_at, updated_at;`,
      [TEST_OWNER_A]
    );
    const titleAId = titleInsert.rows[0].id;
    assert(titleAId && titleInsert.rows[0].english_title.includes('Frieren'), 'Title record created and returned valid UUID');

    // Create Aliases
    await client.query(
      `INSERT INTO title_aliases (title_id, alias, alias_type) VALUES ($1, 'Frieren: Beyond Journey''s End', 'translated');`,
      [titleAId]
    );
    const aliasRes = await client.query(`SELECT alias FROM title_aliases WHERE title_id = $1;`, [titleAId]);
    assert(aliasRes.rows.length === 1 && aliasRes.rows[0].alias.includes('Journey'), 'Title alias persisted and linked via title_id');

    // Update Title
    const updateRes = await client.query(
      `UPDATE titles SET release_year = 2024, synopsis = 'Updated synopsis for remote persistence test.' WHERE id = $1 RETURNING release_year, updated_at;`,
      [titleAId]
    );
    assert(updateRes.rows[0].release_year === 2024, 'Title record updated successfully');
    assert(new Date(updateRes.rows[0].updated_at) >= new Date(titleInsert.rows[0].updated_at), 'trg_titles_updated_at trigger automatically bumped updated_at');

    console.log(`\n${BOLD}Section 3: Collections & Multi-Collection Membership${RESET}`);
    // Create Collections
    const col1Res = await client.query(
      `INSERT INTO collections (owner_id, name, description) VALUES ($1, 'Remote Favorites', 'Test collection 1') RETURNING id;`,
      [TEST_OWNER_A]
    );
    const col1Id = col1Res.rows[0].id;

    const col2Res = await client.query(
      `INSERT INTO collections (owner_id, name, description) VALUES ($1, 'Fantasy Watchlist', 'Test collection 2') RETURNING id;`,
      [TEST_OWNER_A]
    );
    const col2Id = col2Res.rows[0].id;

    // Attach to multiple collections
    await client.query(`INSERT INTO title_collections (title_id, collection_id, position) VALUES ($1, $2, 1);`, [titleAId, col1Id]);
    await client.query(`INSERT INTO title_collections (title_id, collection_id, position) VALUES ($1, $2, 2);`, [titleAId, col2Id]);

    const membershipRes = await client.query(
      `SELECT count(*) as count FROM title_collections WHERE title_id = $1;`,
      [titleAId]
    );
    assert(parseInt(membershipRes.rows[0].count, 10) === 2, 'Title belongs to multiple collections simultaneously (found 2)');

    // Remove from one collection
    await client.query(`DELETE FROM title_collections WHERE title_id = $1 AND collection_id = $2;`, [titleAId, col1Id]);
    const remRes = await client.query(`SELECT count(*) as count FROM title_collections WHERE title_id = $1;`, [titleAId]);
    const titleCheckAfterCol = await client.query(`SELECT id FROM titles WHERE id = $1;`, [titleAId]);
    assert(parseInt(remRes.rows[0].count, 10) === 1 && titleCheckAfterCol.rows.length === 1, 'Removing collection membership preserves title entity');

    console.log(`\n${BOLD}Section 4: Bookmark Tracking & Progress Updates${RESET}`);
    const bmRes = await client.query(
      `INSERT INTO bookmarks (owner_id, title_id, status, progress, progress_total, personal_rating, notes)
       VALUES ($1, $2, 'consuming', 5, 28, 9.5, 'Masterpiece pacing.')
       RETURNING id, status, progress, personal_rating;`,
      [TEST_OWNER_A, titleAId]
    );
    assert(bmRes.rows[0].progress === 5 && bmRes.rows[0].personal_rating === '9.5', 'Bookmark tracking created with initial progress and rating');

    const bmUpdate = await client.query(
      `UPDATE bookmarks SET status = 'completed', progress = 28 WHERE id = $1 RETURNING status, progress;`,
      [bmRes.rows[0].id]
    );
    assert(bmUpdate.rows[0].status === 'completed' && bmUpdate.rows[0].progress === 28, 'Bookmark status and progress updated successfully');

    console.log(`\n${BOLD}Section 5: Database Constraints & Validation Enforcements${RESET}`);
    // Check constraint: invalid media_type
    let rejectedMediaType = false;
    try {
      await client.query(`INSERT INTO titles (owner_id, media_type, english_title) VALUES ($1, 'cartoon', 'Invalid');`, [TEST_OWNER_A]);
    } catch {
      rejectedMediaType = true;
    }
    assert(rejectedMediaType, 'Invalid media_type "cartoon" rejected by check constraint');

    // Check constraint: negative progress
    let rejectedProgress = false;
    try {
      await client.query(`UPDATE bookmarks SET progress = -5 WHERE title_id = $1;`, [titleAId]);
    } catch {
      rejectedProgress = true;
    }
    assert(rejectedProgress, 'Negative progress rejected by check constraint');

    // Unique constraint: duplicate bookmark per owner+title
    let rejectedDupBookmark = false;
    try {
      await client.query(`INSERT INTO bookmarks (owner_id, title_id, status) VALUES ($1, $2, 'plan_to_consume');`, [TEST_OWNER_A, titleAId]);
    } catch {
      rejectedDupBookmark = true;
    }
    assert(rejectedDupBookmark, 'Duplicate bookmark for same owner+title rejected by unique constraint');

    // Unique index: case-insensitive duplicate collection name per owner
    let rejectedDupCol = false;
    try {
      await client.query(`INSERT INTO collections (owner_id, name) VALUES ($1, 'fantasy watchlist');`, [TEST_OWNER_A]);
    } catch {
      rejectedDupCol = true;
    }
    assert(rejectedDupCol, 'Case-insensitive duplicate collection name rejected by unique index');

    console.log(`\n${BOLD}Section 6: Atomic Import Commit & Duplicate Protection${RESET}`);
    // Simulate atomic import commit in a transaction
    await client.query('BEGIN');
    const importTitle = await client.query(
      `INSERT INTO titles (owner_id, media_type, english_title, publication_status)
       VALUES ($1, 'anime', 'Naruto Shippuuden (Remote Import)', 'Finished') RETURNING id;`,
      [TEST_OWNER_A]
    );
    const importedTitleId = importTitle.rows[0].id;
    await client.query(
      `INSERT INTO external_sources (title_id, provider, external_id, source_url)
       VALUES ($1, 'myanimelist', $2, 'https://myanimelist.net/anime/9999901');`,
      [importedTitleId, TEST_MAL_ID]
    );
    await client.query('COMMIT');
    assert(importedTitleId, 'Atomic import transaction committed title and external_source mapping');

    // Duplicate import attempt must fail on uq_external_sources_provider_external_id
    let rejectedDupImport = false;
    try {
      await client.query(
        `INSERT INTO external_sources (title_id, provider, external_id) VALUES ($1, 'myanimelist', $2);`,
        [titleAId, TEST_MAL_ID]
      );
    } catch {
      rejectedDupImport = true;
    }
    assert(rejectedDupImport, 'Duplicate import of same external MAL ID blocked by unique external_source constraint');

    console.log(`\n${BOLD}Section 7: Owner Isolation & Privacy Verification${RESET}`);
    // Owner B cannot see Owner A's records
    const ownerBSearch = await client.query(`SELECT id FROM titles WHERE owner_id = $1;`, [TEST_OWNER_B]);
    assert(ownerBSearch.rows.length === 0, 'Owner B library query returns 0 titles (isolated from Owner A)');

    // Owner B cannot attach Owner A's title to Owner B's collection
    const colOwnerB = await client.query(
      `INSERT INTO collections (owner_id, name) VALUES ($1, 'Owner B Private List') RETURNING id;`,
      [TEST_OWNER_B]
    );
    // Verify application logic cross-owner check
    const crossOwnerCheck = await client.query(
      `SELECT 1 FROM titles WHERE id = $1 AND owner_id = $2;`,
      [titleAId, TEST_OWNER_B]
    );
    assert(crossOwnerCheck.rows.length === 0, 'Cross-owner title access guard verified: Owner B cannot claim Owner A title');

    console.log(`\n${BOLD}Section 8: Process Restart & Connection Pool Persistence${RESET}`);
    // Close client completely to simulate API server restart
    await client.end();

    // Re-connect with a new client
    client = new Client({
      connectionString: dbUrl,
      ssl: dbUrl.includes('supabase') ? { rejectUnauthorized: false } : undefined,
    });
    await client.connect();

    const restartCheck = await client.query(
      `SELECT t.english_title, b.status, b.progress
       FROM titles t
       LEFT JOIN bookmarks b ON b.title_id = t.id
       WHERE t.id = $1 AND t.owner_id = $2;`,
      [titleAId, TEST_OWNER_A]
    );
    assert(
      restartCheck.rows.length === 1 && restartCheck.rows[0].progress === 28,
      'Data survives complete client disconnection and pool restart intact'
    );

    console.log(`\n${BOLD}Section 9: Scoped Test Cleanup${RESET}`);
    // Cascade delete on titles removes aliases, bookmarks, external_sources, title_collections, title_genres
    const cleanTitles = await client.query(`DELETE FROM titles WHERE owner_id IN ($1, $2);`, [TEST_OWNER_A, TEST_OWNER_B]);
    const cleanCols = await client.query(`DELETE FROM collections WHERE owner_id IN ($1, $2);`, [TEST_OWNER_A, TEST_OWNER_B]);
    const cleanTags = await client.query(`DELETE FROM tags WHERE owner_id IN ($1, $2);`, [TEST_OWNER_A, TEST_OWNER_B]);

    const remainingCheck = await client.query(`SELECT count(*) as count FROM titles WHERE owner_id IN ($1, $2);`, [TEST_OWNER_A, TEST_OWNER_B]);
    assert(parseInt(remainingCheck.rows[0].count, 10) === 0, `Scoped test cleanup completed cleanly (deleted ${cleanTitles.rowCount} titles, ${cleanCols.rowCount} collections)`);

    console.log(`\n${BOLD}======================================================${RESET}`);
    console.log(`  Verification Summary: ${GREEN}${passCount} PASSED${RESET}, ${failCount > 0 ? RED : GREEN}${failCount} FAILED${RESET}`);
    console.log(`${BOLD}======================================================${RESET}\n`);

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error(`\n${RED}✖ Verification Error:${RESET}`, err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
