import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../dist/app.js';
import { db, pool } from '../dist/repositories/db.js';
import { createToken, TEST_OWNER_A, resetTestDatabase } from './helpers.js';

before(() => {
  resetTestDatabase();
});

test('Health Liveness: GET /api/v1/health/liveness returns HTTP 200 with alive status', async () => {
  const res = await request(app).get('/api/v1/health/liveness');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, 'alive');
  assert.equal(res.body.data.liveness, 'alive');
  assert.ok(typeof res.body.data.uptime === 'number');
  assert.ok(res.body.meta.requestId);
});

test('Health Readiness: GET /api/v1/health distinguishes liveness from readiness', async () => {
  const res = await request(app).get('/api/v1/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.liveness, 'alive');
  assert.equal(res.body.data.readiness, 'ready');
  assert.equal(res.body.data.database, 'connected');
  assert.equal(res.body.data.schema, 'ready');
});

test('Database Connectivity Failure: Titles API returns structured HTTP 503 on connection failure', async () => {
  const token = createToken(TEST_OWNER_A);
  const originalQuery = db.query;

  try {
    // Simulate connection failure (ECONNREFUSED)
    db.query = async () => {
      const err = new Error('connect ECONNREFUSED 127.0.0.1:5432');
      err.code = 'ECONNREFUSED';
      throw err;
    };

    const res = await request(app)
      .get('/api/v1/titles')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 503);
    assert.equal(res.body.error.code, 'DATABASE_UNAVAILABLE');
    assert.ok(res.body.error.message.toLowerCase().includes('database service is temporarily unavailable'));
    assert.ok(res.body.meta.requestId);
    assert.equal(res.body.error.details.length, 0);
  } finally {
    db.query = originalQuery;
  }
});

test('Database Connectivity Failure: Collections API returns structured HTTP 503 on connection failure', async () => {
  const token = createToken(TEST_OWNER_A);
  const originalQuery = db.query;

  try {
    // Simulate host unreachable (EHOSTUNREACH)
    db.query = async () => {
      const err = new Error('connect EHOSTUNREACH 2406:da14:18fe:3101::9ecd:5432');
      err.code = 'EHOSTUNREACH';
      throw err;
    };

    const res = await request(app)
      .get('/api/v1/collections')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 503);
    assert.equal(res.body.error.code, 'DATABASE_UNAVAILABLE');
    assert.ok(res.body.error.message.toLowerCase().includes('database service is temporarily unavailable'));
    assert.ok(res.body.meta.requestId);
  } finally {
    db.query = originalQuery;
  }
});

test('Database Connectivity Failure: Bookmarks API returns structured HTTP 503 on connection failure', async () => {
  const token = createToken(TEST_OWNER_A);
  const originalQuery = db.query;

  try {
    // Simulate pool client error / auth failure
    db.query = async () => {
      const err = new Error('password authentication failed for user "postgres"');
      err.code = '28P01';
      throw err;
    };

    const res = await request(app)
      .get('/api/v1/bookmarks')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 503);
    assert.equal(res.body.error.code, 'DATABASE_UNAVAILABLE');
    assert.ok(res.body.error.message.toLowerCase().includes('database service is temporarily unavailable'));
  } finally {
    db.query = originalQuery;
  }
});

test('Database Connectivity Failure: Preview returns HTTP 503 when duplicate lookup fails due to DB outage', async () => {
  const token = createToken(TEST_OWNER_A);
  const originalQuery = db.query;

  try {
    // When duplicate check query fails due to DB connection loss
    db.query = async () => {
      const err = new Error('Connection terminated unexpectedly');
      err.code = '08006';
      throw err;
    };

    const res = await request(app)
      .get('/api/v1/import/preview?id=52991&type=anime')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 503);
    assert.equal(res.body.error.code, 'DATABASE_UNAVAILABLE');
    assert.ok(res.body.error.message.toLowerCase().includes('database service is temporarily unavailable'));
    // Ensure no stack trace or connection credentials leaked in body
    assert.equal(res.body.error.stack, undefined);
    assert.ok(!JSON.stringify(res.body).includes('password'));
    assert.ok(!JSON.stringify(res.body).includes('5432'));
  } finally {
    db.query = originalQuery;
  }
});

test('Error Differentiation: Non-database unexpected errors preserve HTTP 500 INTERNAL_ERROR', async () => {
  const token = createToken(TEST_OWNER_A);
  const originalQuery = db.query;

  try {
    // Simulate an unexpected internal TypeError (not database connectivity)
    db.query = async () => {
      throw new TypeError('Cannot read properties of undefined (reading foo)');
    };

    const res = await request(app)
      .get('/api/v1/titles')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 500);
    assert.equal(res.body.error.code, 'INTERNAL_ERROR');
    assert.equal(res.body.error.message, 'An unexpected internal server error occurred');
    assert.equal(res.body.error.stack, undefined);
  } finally {
    db.query = originalQuery;
  }
});

test('Working Database: Preview and duplicate detection succeed with clean test database', async () => {
  const token = createToken(TEST_OWNER_A);

  const res = await request(app)
    .get('/api/v1/import/preview?id=52991&type=anime')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.externalId, '52991');
  assert.equal(res.body.data.mediaType, 'anime');
  assert.ok(res.body.data.englishTitle || res.body.data.originalTitle);
  // Duplicate check passed (not duplicated yet)
  assert.ok(!res.body.data.duplicateExistingTitleId);
});

test('Working Database: Atomic commit creates title and subsequent preview detects duplicate', async () => {
  const token = createToken(TEST_OWNER_A);

  // 1. Commit title 52991 with valid structure
  const commitPayload = {
    draft: {
      provider: 'myanimelist',
      externalId: '52991',
      sourceUrl: 'https://myanimelist.net/anime/52991',
      mediaType: 'anime',
      englishTitle: 'Sousou no Frieren (Regression Test)',
      originalTitle: '葬送のフリーレン',
      aliases: [],
      synopsis: 'Elven mage Frieren journey after the defeat of the Demon King.',
      background: 'Winner of manga awards.',
      coverUrl: 'https://example.com/frieren.jpg',
      releaseYear: 2023,
      publicationStatus: 'Finished Airing',
      startDate: '2023-09-29',
      endDate: '2024-03-22',
      episodeCount: 28,
      sourceScore: 9.24,
      genres: ['Adventure', 'Drama', 'Fantasy'],
      tags: [],
      sourceRetrievedAt: new Date().toISOString(),
      warnings: [],
    },
    selectedFields: {
      englishTitle: true,
      originalTitle: true,
      aliases: true,
      synopsis: true,
      background: true,
      coverUrl: true,
      releaseYear: true,
      publicationStatus: true,
      startDate: true,
      endDate: true,
      episodeCount: true,
      sourceScore: true,
      genres: true,
      tags: true,
    },
    collectionIds: [],
  };

  const commitRes = await request(app)
    .post('/api/v1/import/commit')
    .set('Authorization', `Bearer ${token}`)
    .send(commitPayload);

  assert.equal(commitRes.status, 201);
  const createdId = commitRes.body.data.id;
  assert.ok(createdId);

  // 2. Preview 52991 again: must detect duplicate!
  const previewRes = await request(app)
    .get('/api/v1/import/preview?id=52991&type=anime')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(previewRes.status, 200);
  assert.equal(previewRes.body.data.duplicateExistingTitleId, createdId);
  assert.ok(previewRes.body.data.warnings.some((w) => w.includes('already been imported')));

  // 3. Repeated commit of same title fails with 409 DUPLICATE_IMPORT
  const dupCommitRes = await request(app)
    .post('/api/v1/import/commit')
    .set('Authorization', `Bearer ${token}`)
    .send(commitPayload);

  assert.equal(dupCommitRes.status, 409);
  assert.equal(dupCommitRes.body.error.code, 'DUPLICATE_IMPORT');
});

test('Preview Safety: Failed commit or preview never causes partial writes', async () => {
  const token = createToken(TEST_OWNER_A);
  const countBefore = (await db.query('SELECT count(*)::int as c FROM titles')).rows[0].c;

  // Intentionally invalid commit payload (missing required draft)
  const invalidRes = await request(app)
    .post('/api/v1/import/commit')
    .set('Authorization', `Bearer ${token}`)
    .send({ draft: { externalId: '99999' } });

  assert.equal(invalidRes.status, 422);

  const countAfter = (await db.query('SELECT count(*)::int as c FROM titles')).rows[0].c;
  assert.equal(countAfter, countBefore, 'Database titles count must remain unchanged after rejected commit');
});

test('Database Pool Safety: Idle client error handler is registered', () => {
  assert.ok(pool.listenerCount('error') >= 1, 'pg.Pool must have at least one error listener');
});
