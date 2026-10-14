import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JikanClient } from '../dist/services/import/jikan.client.js';
import { BoundedTtlCache } from '../dist/services/import/cache.js';
import { RequestThrottler } from '../dist/services/import/throttler.js';
import {
  ExternalProviderRateLimitError,
  ExternalProviderTimeoutError,
  ExternalProviderUnavailableError,
  ExternalResourceNotFoundError,
  BadRequestError,
} from '../dist/errors/index.js';

test('JikanClient: Successful search and detail calls return data', async () => {
  const mockPayload = {
    data: {
      mal_id: 5114,
      title: 'Fullmetal Alchemist: Brotherhood',
      type: 'TV',
    },
  };

  const client = new JikanClient({
    minIntervalMs: 0,
    fetchFn: async () =>
      new Response(JSON.stringify(mockPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  });

  const detail = await client.getDetail('anime', 5114);
  assert.equal(detail.data.mal_id, 5114);
  assert.equal(detail.data.title, 'Fullmetal Alchemist: Brotherhood');

  const search = await client.search('anime', 'Fullmetal');
  assert.equal(search.data.mal_id, 5114);
});

test('JikanClient: Handles HTTP 429 and retries with Retry-After header', async () => {
  let attempts = 0;
  const sleepCalls = [];

  const client = new JikanClient({
    maxRetries: 2,
    minIntervalMs: 0,
    sleepFn: async (ms) => {
      sleepCalls.push(ms);
    },
    fetchFn: async () => {
      attempts++;
      if (attempts === 1) {
        return new Response(JSON.stringify({ error: 'Rate limit' }), {
          status: 429,
          headers: { 'Retry-After': '2' },
        });
      }
      return new Response(JSON.stringify({ data: { mal_id: 100 } }), { status: 200 });
    },
  });

  const result = await client.getDetail('anime', 100);
  assert.equal(result.data.mal_id, 100);
  assert.equal(attempts, 2);
  assert.equal(sleepCalls.length, 1);
  assert.equal(sleepCalls[0], 2000); // 2 seconds from Retry-After
});

test('JikanClient: Throws ExternalProviderRateLimitError when 429 persists past max retries', async () => {
  let attempts = 0;

  const client = new JikanClient({
    maxRetries: 2,
    minIntervalMs: 0,
    sleepFn: async () => {},
    fetchFn: async () => {
      attempts++;
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
      });
    },
  });

  await assert.rejects(
    () => client.getDetail('anime', 100),
    (err) => err instanceof ExternalProviderRateLimitError && err.statusCode === 429
  );
  assert.equal(attempts, 3); // 1 initial + 2 retries
});

test('JikanClient: Retries transient HTTP 503 and succeeds on subsequent attempt', async () => {
  let attempts = 0;
  const sleepCalls = [];

  const client = new JikanClient({
    maxRetries: 2,
    minIntervalMs: 0,
    sleepFn: async (ms) => {
      sleepCalls.push(ms);
    },
    fetchFn: async () => {
      attempts++;
      if (attempts < 3) {
        return new Response(JSON.stringify({ error: 'Service Unavailable' }), { status: 503 });
      }
      return new Response(JSON.stringify({ data: { mal_id: 500 } }), { status: 200 });
    },
  });

  const result = await client.getDetail('anime', 500);
  assert.equal(result.data.mal_id, 500);
  assert.equal(attempts, 3);
  assert.equal(sleepCalls.length, 2);
});

test('JikanClient: Throws ExternalProviderUnavailableError when 503 persists', async () => {
  const client = new JikanClient({
    maxRetries: 1,
    minIntervalMs: 0,
    sleepFn: async () => {},
    fetchFn: async () => new Response('Unavailable', { status: 503 }),
  });

  await assert.rejects(
    () => client.getDetail('anime', 1),
    (err) => err instanceof ExternalProviderUnavailableError && err.statusCode === 502
  );
});

test('JikanClient: Non-retryable HTTP 404 immediately throws ExternalResourceNotFoundError', async () => {
  let attempts = 0;

  const client = new JikanClient({
    maxRetries: 3,
    minIntervalMs: 0,
    fetchFn: async () => {
      attempts++;
      return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
    },
  });

  await assert.rejects(
    () => client.getDetail('anime', 9999999),
    (err) => err instanceof ExternalResourceNotFoundError && err.statusCode === 404
  );
  assert.equal(attempts, 1); // Zero retries for 404
});

test('JikanClient: Handles network errors and abort timeouts deterministically', async () => {
  const client = new JikanClient({
    maxRetries: 1,
    minIntervalMs: 0,
    sleepFn: async () => {},
    fetchFn: async () => {
      const abortErr = new Error('The operation was aborted');
      abortErr.name = 'AbortError';
      throw abortErr;
    },
  });

  await assert.rejects(
    () => client.getDetail('anime', 1),
    (err) => err instanceof ExternalProviderTimeoutError && err.statusCode === 504
  );
});

test('BoundedTtlCache: Caches results, expires on TTL, and enforces max entry limit', async () => {
  const cache = new BoundedTtlCache(50, 3); // 50ms TTL, 3 max entries

  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  assert.equal(cache.get('a'), 1);
  assert.equal(cache.size, 3);

  // Inserting 4th item evicts oldest ('b', since 'a' was recently accessed)
  cache.set('d', 4);
  assert.equal(cache.size, 3);
  assert.equal(cache.get('b'), undefined); // Evicted!
  assert.equal(cache.get('a'), 1);
  assert.equal(cache.get('d'), 4);

  // Wait for TTL expiration
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(cache.get('a'), undefined); // Expired
});

test('RequestThrottler: Enforces inter-request minimum interval', async () => {
  const throttler = new RequestThrottler(40);
  const start = Date.now();

  await throttler.throttle();
  await throttler.throttle();

  const elapsed = Date.now() - start;
  assert.ok(elapsed >= 35, `Expected elapsed time >= 35ms, got ${elapsed}ms`);
});
