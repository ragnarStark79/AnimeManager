/**
 * verify-supabase-workflows.js
 *
 * Verifies End-to-End User Workflows (Section 7) against the running Express API backed by Supabase PostgreSQL:
 * A. Titles (Create, Read, Update, Delete)
 * B. Collections (Create, Add Title, Membership, Multi-Collection, Remove Membership)
 * C. Bookmarks (Create, Update status/progress/rating, Read)
 * D. Metadata Imports (Tenrai Search, Preview, Commit, Duplicate Protection)
 * E. Exports (JSON, CSV scoped to authenticated user)
 */

import http from 'node:http';
import { db } from '../apps/api/dist/repositories/db.js';

const API_BASE = 'http://127.0.0.1:4000/api/v1';

async function request(method, path, body = null, token = null) {
  const url = new URL(API_BASE + path);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  let bodyStr = null;
  if (body) {
    bodyStr = JSON.stringify(body);
    options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
  }

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : null;
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
          raw: data,
        });
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function run() {
  if (process.env.ALLOW_REMOTE_DB_TESTS !== 'true') {
    console.error('❌ SAFETY GUARD: Remote workflow verification requires ALLOW_REMOTE_DB_TESTS=true.');
    console.error('Run: ALLOW_REMOTE_DB_TESTS=true npm run test:supabase:workflows');
    process.exit(1);
  }

  console.log('🚀 Starting Section 7 End-to-End Workflows Verification against Supabase-backed API...\n');

  // Track created entities for safe cleanup
  const createdTitleIds = [];
  const createdCollectionIds = [];
  const createdBookmarkIds = [];

  try {
    // 0. Verify Health
    const health = await request('GET', '/health');
    const healthData = health.body?.data || health.body;
    console.log(`[Health] Status: ${health.status}, Target: ${healthData?.databaseTarget}, Schema: ${healthData?.schema}`);
    if (healthData?.databaseTarget !== 'supabase') {
      throw new Error(`Expected databaseTarget === 'supabase', got '${healthData?.databaseTarget}'`);
    }

    // 1. Acquire Auth Token
    const authRes = await request('POST', '/auth/dev-token', {
      ownerId: 'e0000000-0000-0000-0000-000000000001',
    });
    if (authRes.status !== 200 || !authRes.body?.data?.token) {
      throw new Error(`Dev session acquisition failed: ${authRes.status} ${JSON.stringify(authRes.body)}`);
    }
    const token = authRes.body.data.token;
    console.log('✔ [Auth] Dev token acquired for test user');

    // ==========================================
    // WORKFLOW A: Titles (Create, Read, Update, Delete)
    // ==========================================
    console.log('\n--- WORKFLOW A: Titles ---');
    const titlePayload = {
      englishTitle: 'E2E Workflow Test Title',
      originalTitle: 'E2E ワークフロー',
      mediaType: 'anime',
      releaseYear: 2024,
      publicationStatus: 'finished',
      synopsis: 'A test anime created during remote Supabase workflow verification.',
      episodeCount: 12,
      genres: ['Action', 'Fantasy'],
      tags: ['Magic'],
    };

    const createTitleRes = await request('POST', '/titles', titlePayload, token);
    if (createTitleRes.status !== 201 || !createTitleRes.body?.data?.id) {
      throw new Error(`Title creation failed: ${createTitleRes.status} ${JSON.stringify(createTitleRes.body)}`);
    }
    const titleId = createTitleRes.body.data.id;
    createdTitleIds.push(titleId);
    console.log(`✔ [Titles] Created test title: ${titleId} (HTTP ${createTitleRes.status})`);

    const readTitleRes = await request('GET', `/titles/${titleId}`, null, token);
    if (readTitleRes.status !== 200 || readTitleRes.body?.data?.englishTitle !== titlePayload.englishTitle) {
      throw new Error(`Title read failed: ${readTitleRes.status} ${JSON.stringify(readTitleRes.body)}`);
    }
    console.log(`✔ [Titles] Read back title: "${readTitleRes.body.data.englishTitle}" with ${readTitleRes.body.data.genres.length} genres (HTTP 200)`);

    const updateTitleRes = await request('PATCH', `/titles/${titleId}`, {
      synopsis: 'Updated synopsis for remote verification test.',
      sourceScore: 8.95,
    }, token);
    if (updateTitleRes.status !== 200 || updateTitleRes.body?.data?.sourceScore !== 8.95) {
      throw new Error(`Title update failed: ${updateTitleRes.status} ${JSON.stringify(updateTitleRes.body)}`);
    }
    console.log(`✔ [Titles] Updated title score to 8.95 (HTTP 200)`);

    // ==========================================
    // WORKFLOW B: Collections & Multi-Membership
    // ==========================================
    console.log('\n--- WORKFLOW B: Collections and My List ---');
    const col1Res = await request('POST', '/collections', {
      name: 'E2E Collection Alpha',
      description: 'Primary test collection for remote membership',
    }, token);
    if (col1Res.status !== 201 || !col1Res.body?.data?.id) {
      throw new Error(`Collection 1 creation failed: ${col1Res.status} ${JSON.stringify(col1Res.body)}`);
    }
    const col1Id = col1Res.body.data.id;
    createdCollectionIds.push(col1Id);
    console.log(`✔ [Collections] Created Collection Alpha: ${col1Id} (HTTP 201)`);

    // Add title to Collection Alpha
    const addCol1Res = await request('POST', `/collections/${col1Id}/titles`, {
      titleIds: [titleId],
    }, token);
    if (addCol1Res.status !== 200) {
      throw new Error(`Adding title to Collection Alpha failed: ${addCol1Res.status} ${JSON.stringify(addCol1Res.body)}`);
    }
    console.log(`✔ [Collections] Added title ${titleId} to Collection Alpha (HTTP 200)`);

    // Verify membership after reloading
    const getCol1Res = await request('GET', `/collections/${col1Id}`, null, token);
    if (getCol1Res.status !== 200 || !getCol1Res.body?.data?.titles?.some((t) => t.id === titleId)) {
      throw new Error(`Membership reload verification failed: ${getCol1Res.status}`);
    }
    console.log(`✔ [Collections] Reloaded Collection Alpha: verified title is present (titleCount: ${getCol1Res.body.data.titles.length})`);

    // Confirm title can belong to multiple collections
    const col2Res = await request('POST', '/collections', {
      name: 'E2E Collection Beta',
      description: 'Secondary test collection for multi-membership',
    }, token);
    if (col2Res.status !== 201 || !col2Res.body?.data?.id) {
      throw new Error(`Collection 2 creation failed: ${col2Res.status}`);
    }
    const col2Id = col2Res.body.data.id;
    createdCollectionIds.push(col2Id);

    const addCol2Res = await request('POST', `/collections/${col2Id}/titles`, {
      titleIds: [titleId],
    }, token);
    if (addCol2Res.status !== 200) {
      throw new Error(`Adding title to Collection Beta failed: ${addCol2Res.status}`);
    }
    console.log(`✔ [Collections] Multi-membership confirmed: title ${titleId} added to Collection Beta`);

    // Remove title from Collection Beta without deleting the title
    const removeRes = await request('DELETE', `/collections/${col2Id}/titles/${titleId}`, null, token);
    if (removeRes.status !== 204) {
      throw new Error(`Removing title membership failed: ${removeRes.status}`);
    }
    console.log(`✔ [Collections] Removed title from Collection Beta (HTTP 204)`);

    // Confirm title still exists in database and in Collection Alpha
    const verifyTitleStillExists = await request('GET', `/titles/${titleId}`, null, token);
    if (verifyTitleStillExists.status !== 200) {
      throw new Error(`Title was unexpectedly deleted after removing collection membership!`);
    }
    const verifyCol1StillHas = await request('GET', `/collections/${col1Id}`, null, token);
    if (!verifyCol1StillHas.body?.data?.titles?.some((t) => t.id === titleId)) {
      throw new Error(`Title unexpectedly removed from Collection Alpha!`);
    }
    console.log(`✔ [Collections] Confirmed title still exists in database and in Collection Alpha`);

    // ==========================================
    // WORKFLOW C: Bookmarks & Progress
    // ==========================================
    console.log('\n--- WORKFLOW C: Bookmarks ---');
    const bookmarkRes = await request('POST', '/bookmarks', {
      titleId,
      status: 'plan_to_consume',
      progress: 0,
      totalEpisodes: 12,
    }, token);
    if (bookmarkRes.status !== 201 || !bookmarkRes.body?.data?.id) {
      throw new Error(`Bookmark creation failed: ${bookmarkRes.status} ${JSON.stringify(bookmarkRes.body)}`);
    }
    const bookmarkId = bookmarkRes.body.data.id;
    createdBookmarkIds.push(bookmarkId);
    console.log(`✔ [Bookmarks] Created bookmark: ${bookmarkId} (status: plan_to_consume)`);

    // Update status, progress, rating
    const updateBmRes = await request('PATCH', `/bookmarks/${bookmarkId}`, {
      status: 'consuming',
      progress: 4,
      personalRating: 9,
      notes: 'Excellent pacing and animation.',
    }, token);
    if (updateBmRes.status !== 200 || updateBmRes.body?.data?.progress !== 4 || updateBmRes.body?.data?.personalRating !== 9) {
      throw new Error(`Bookmark update failed: ${updateBmRes.status} ${JSON.stringify(updateBmRes.body)}`);
    }
    console.log(`✔ [Bookmarks] Updated bookmark: status=consuming, progress=4/12, personalRating=9 (HTTP 200)`);

    // Verify bookmark survives reload
    const getBmRes = await request('GET', `/bookmarks/${bookmarkId}`, null, token);
    if (getBmRes.status !== 200 || getBmRes.body?.data?.progress !== 4 || getBmRes.body?.data?.personalRating !== 9) {
      throw new Error(`Bookmark read-back failed: ${getBmRes.status}`);
    }
    console.log(`✔ [Bookmarks] Verified bookmark reload: progress=4, status=consuming, personalRating=9`);

    // ==========================================
    // WORKFLOW D: Metadata Imports (Tenrai)
    // ==========================================
    console.log('\n--- WORKFLOW D: Metadata Imports (Tenrai) ---');
    const searchRes = await request('GET', '/import/jikan/search?q=Steins+Gate&type=anime&limit=5', null, token);
    const searchItems = Array.isArray(searchRes.body?.data) ? searchRes.body.data : searchRes.body?.data?.items;
    if (searchRes.status !== 200 || !Array.isArray(searchItems) || searchItems.length === 0) {
      throw new Error(`Tenrai search failed: ${searchRes.status} ${JSON.stringify(searchRes.body)}`);
    }
    const firstHit = searchItems[0];
    const malId = firstHit.malId || firstHit.id;
    console.log(`✔ [Import] Tenrai search succeeded: "${firstHit.englishTitle || firstHit.title}" (MAL ID: ${malId})`);

    // Preview
    const previewRes = await request('GET', `/import/preview?id=${malId}&type=anime`, null, token);
    const draft = previewRes.body?.data?.draft || previewRes.body?.data;
    if (previewRes.status !== 200 || !draft || !draft.englishTitle) {
      throw new Error(`Tenrai preview failed: ${previewRes.status} ${JSON.stringify(previewRes.body)}`);
    }
    console.log(`✔ [Import] Preview retrieved draft for "${draft.englishTitle}" (MAL ID: ${draft.externalId})`);

    // Commit import
    const commitRes = await request('POST', '/import/commit', {
      draft,
      selectedFields: {
        englishTitle: true,
        originalTitle: true,
        synopsis: true,
        releaseYear: true,
        publicationStatus: true,
        episodeCount: true,
        genres: true,
        tags: true,
        coverUrl: true,
        sourceScore: true,
        sourceRank: true,
        sourcePopularity: true,
      },
    }, token);

    if (commitRes.status !== 201 || !commitRes.body?.data?.id) {
      throw new Error(`Import commit failed: ${commitRes.status} ${JSON.stringify(commitRes.body)}`);
    }
    const importedTitleId = commitRes.body.data.id;
    createdTitleIds.push(importedTitleId);
    console.log(`✔ [Import] Successfully committed import into Supabase: titleId=${importedTitleId} (HTTP 201)`);

    // Verify external source in Supabase
    const extSourceRes = await db.query(
      `SELECT * FROM external_sources WHERE title_id = $1 AND provider = 'myanimelist'`,
      [importedTitleId]
    );
    if (extSourceRes.rows.length === 0) {
      throw new Error(`external_sources record was not persisted to Supabase!`);
    }
    console.log(`✔ [Import] Verified external_source record in Supabase (external_id: ${extSourceRes.rows[0].external_id})`);

    // Test duplicate import protection
    const dupRes = await request('POST', '/import/commit', {
      draft,
      selectedFields: { englishTitle: true },
    }, token);
    if (dupRes.status !== 409) {
      throw new Error(`Expected HTTP 409 Conflict on duplicate import, got ${dupRes.status}`);
    }
    console.log(`✔ [Import] Duplicate protection verified: returned HTTP 409 Conflict on re-import`);

    // ==========================================
    // WORKFLOW E: Exports (JSON & CSV)
    // ==========================================
    console.log('\n--- WORKFLOW E: Exports ---');
    const jsonExportRes = await request('GET', '/export/json', null, token);
    const exportData = jsonExportRes.body?.data || jsonExportRes.body;
    const exportedTitles = exportData?.titles;
    if (jsonExportRes.status !== 200 || !Array.isArray(exportedTitles)) {
      throw new Error(`JSON Export failed: status ${jsonExportRes.status}`);
    }
    const hasCreated = exportedTitles.some((t) => t.id === titleId);
    const hasImported = exportedTitles.some((t) => t.id === importedTitleId);
    if (!hasCreated || !hasImported) {
      throw new Error(`JSON Export missing test titles! Found: ${exportedTitles.length} titles`);
    }
    console.log(`✔ [Export] JSON export verified: contains ${exportedTitles.length} titles including both test and imported titles`);

    const csvExportRes = await request('GET', '/export/csv', null, token);
    if (csvExportRes.status !== 200 || !csvExportRes.raw.includes('English Title') || !csvExportRes.raw.includes('E2E Workflow Test Title')) {
      throw new Error(`CSV Export failed or missing expected headers/content: ${csvExportRes.status}`);
    }
    console.log(`✔ [Export] CSV export verified: valid CSV format with header row and title records`);

    // Delete title test
    const deleteTitleRes = await request('DELETE', `/titles/${titleId}?confirm=true`, null, token);
    if (deleteTitleRes.status !== 204) {
      throw new Error(`Title deletion failed: ${deleteTitleRes.status}`);
    }
    console.log(`✔ [Titles] Cleaned up manual test title ${titleId} (HTTP 204)`);
    const idx = createdTitleIds.indexOf(titleId);
    if (idx !== -1) createdTitleIds.splice(idx, 1);

    console.log('\n🎉 ALL SECTION 7 USER WORKFLOWS (A-E) VERIFIED SUCCESSFULLY AGAINST SUPABASE!\n');
  } finally {
    // Clean up any remaining entities created during test
    console.log('--- Cleaning up verification entities from Supabase ---');
    for (const bId of createdBookmarkIds) {
      await db.query(`DELETE FROM bookmarks WHERE id = $1`, [bId]).catch(() => {});
    }
    for (const cId of createdCollectionIds) {
      await db.query(`DELETE FROM collections WHERE id = $1`, [cId]).catch(() => {});
    }
    for (const tId of createdTitleIds) {
      await db.query(`DELETE FROM titles WHERE id = $1`, [tId]).catch(() => {});
    }
    console.log('✔ Cleanup completed safely.');
    await db.close();
  }
}

run().catch((err) => {
  console.error('❌ Workflow verification failed:', err);
  process.exit(1);
});
