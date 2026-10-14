import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../dist/app.js';
import { createToken, TEST_OWNER_A, TEST_OWNER_B, resetTestDatabase } from './helpers.js';

before(() => {
  resetTestDatabase();
});

test('Authentication: Protected routes reject requests without Authorization header', async () => {
  const res = await request(app).get('/api/v1/titles');
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'UNAUTHORIZED');
  assert.ok(res.body.error.message.includes('Authentication token is required'));
  assert.ok(res.body.meta.requestId);
});

test('Authentication: Protected routes reject malformed Authorization header', async () => {
  const res = await request(app)
    .get('/api/v1/titles')
    .set('Authorization', 'Basic 123456');
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'UNAUTHORIZED');
  assert.ok(res.body.error.message.includes('Bearer'));
});

test('Authentication: Protected routes reject invalid JWT signature', async () => {
  const fakeToken = createToken(TEST_OWNER_A, { secret: 'wrong-secret-key-that-fails-verification!!' });
  const res = await request(app)
    .get('/api/v1/titles')
    .set('Authorization', `Bearer ${fakeToken}`);
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'UNAUTHORIZED');
  assert.ok(res.body.error.message.includes('Invalid or expired'));
});

test('Authentication: Protected routes reject expired JWT token', async () => {
  const expiredToken = createToken(TEST_OWNER_A, { expiresIn: '-1s' });
  const res = await request(app)
    .get('/api/v1/titles')
    .set('Authorization', `Bearer ${expiredToken}`);
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'UNAUTHORIZED');
});

test('Authentication: Valid token succeeds and accesses caller library', async () => {
  const token = createToken(TEST_OWNER_A);
  const res = await request(app)
    .get('/api/v1/titles')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.pagination);
  assert.ok(res.body.meta.requestId);
});

test('Authorization & Privacy: Owner B cannot access Owner A private title detail', async () => {
  const seedTitleAnime = '10000000-0000-0000-0000-000000000001';
  const tokenB = createToken(TEST_OWNER_B);

  const res = await request(app)
    .get(`/api/v1/titles/${seedTitleAnime}`)
    .set('Authorization', `Bearer ${tokenB}`);

  // Must return 404 NOT_FOUND to avoid revealing existence of private title
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});

test('Authorization & Privacy: Owner B cannot mutate Owner A title', async () => {
  const seedTitleAnime = '10000000-0000-0000-0000-000000000001';
  const tokenB = createToken(TEST_OWNER_B);

  const patchRes = await request(app)
    .patch(`/api/v1/titles/${seedTitleAnime}`)
    .set('Authorization', `Bearer ${tokenB}`)
    .send({ englishTitle: 'Hacked Title' });

  assert.equal(patchRes.status, 404);

  const deleteRes = await request(app)
    .delete(`/api/v1/titles/${seedTitleAnime}?confirm=true`)
    .set('Authorization', `Bearer ${tokenB}`);

  assert.equal(deleteRes.status, 404);
});

test('Authorization: Owner B cannot attach Owner A title to Owner B collection', async () => {
  const tokenB = createToken(TEST_OWNER_B);

  // 1. Owner B creates their own collection
  const colRes = await request(app)
    .post('/api/v1/collections')
    .set('Authorization', `Bearer ${tokenB}`)
    .send({ name: 'Owner B Sneaky Collection' });
  assert.equal(colRes.status, 201);
  const colBId = colRes.body.data.id;

  // 2. Owner B attempts to add Owner A's title to Owner B's collection
  const seedTitleAnime = '10000000-0000-0000-0000-000000000001';
  const addRes = await request(app)
    .post(`/api/v1/collections/${colBId}/titles`)
    .set('Authorization', `Bearer ${tokenB}`)
    .send({ titleIds: [seedTitleAnime] });

  assert.equal(addRes.status, 403);
  assert.equal(addRes.body.error.code, 'FORBIDDEN');
});

test('Authorization: Owner B cannot create a bookmark for Owner A title', async () => {
  const tokenB = createToken(TEST_OWNER_B);
  const seedTitleAnime = '10000000-0000-0000-0000-000000000001';

  const res = await request(app)
    .post('/api/v1/bookmarks')
    .set('Authorization', `Bearer ${tokenB}`)
    .send({
      titleId: seedTitleAnime,
      status: 'plan_to_consume',
    });

  assert.equal(res.status, 403);
  assert.equal(res.body.error.code, 'FORBIDDEN');
});

test('Authorization: Client-supplied owner_id in request body is strictly ignored', async () => {
  const tokenB = createToken(TEST_OWNER_B);

  const res = await request(app)
    .post('/api/v1/titles')
    .set('Authorization', `Bearer ${tokenB}`)
    .send({
      owner_id: TEST_OWNER_A,
      ownerId: TEST_OWNER_A,
      mediaType: 'anime',
      englishTitle: 'Owner B Title',
    });

  assert.equal(res.status, 201);
  // Verified: created title belongs to authenticated caller (Owner B), not injected Owner A
  assert.equal(res.body.data.ownerId, TEST_OWNER_B);
});
