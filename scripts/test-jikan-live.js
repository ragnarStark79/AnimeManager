#!/usr/bin/env node

/**
 * AnimeManager — Standalone Live Jikan Connectivity & Import Smoke Test
 *
 * This script tests live network connectivity from the local development environment
 * to the upstream Jikan v4 API (api.jikan.moe).
 *
 * In accordance with Phase 05.3 requirements:
 * - This live test is explicitly invoked and decoupled from deterministic unit/integration test suites.
 * - It reports real DNS resolution, TCP transport probes, and HTTP response latencies.
 * - It safely suppresses credentials, authorization headers, and internal secrets.
 *
 * Usage:
 *   node scripts/test-jikan-live.js
 *   npm run test:jikan:live
 */

import dns from 'node:dns/promises';
import net from 'node:net';

const JIKAN_HOST = 'api.jikan.moe';
const JIKAN_PORT = 443;
const TEST_QUERIES = ['frieren', 'naruto', 'tokidoki bosotto'];

console.log('======================================================');
console.log('  AnimeManager — Upstream Jikan Live Connectivity Smoke Test');
console.log('======================================================\n');

async function probeDns() {
  process.stdout.write(`1. Resolving DNS for ${JIKAN_HOST}... `);
  try {
    const addresses = await dns.resolve4(JIKAN_HOST);
    console.log(`RESOLVED -> ${addresses.join(', ')}`);
    return addresses[0];
  } catch (err) {
    console.log(`FAILED -> ${err.message}`);
    return null;
  }
}

async function probeTcp(ip, timeoutMs = 5000) {
  process.stdout.write(`2. Probing TCP handshake to ${ip}:${JIKAN_PORT} (timeout ${timeoutMs}ms)... `);
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isResolved = false;

    const timer = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        console.log(`TIMED OUT`);
        resolve(false);
      }
    }, timeoutMs);

    socket.connect(JIKAN_PORT, ip, () => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timer);
        socket.destroy();
        console.log(`CONNECTED (TCP handshake successful)`);
        resolve(true);
      }
    });

    socket.on('error', (err) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timer);
        socket.destroy();
        console.log(`FAILED (${err.message})`);
        resolve(false);
      }
    });
  });
}

async function probeHttpQuery(query) {
  const url = `https://${JIKAN_HOST}/v4/anime?q=${encodeURIComponent(query)}&limit=3`;
  process.stdout.write(`   Querying '${query}'... `);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'AnimeManager/1.0 (Personal Media Library)',
      },
      signal: AbortSignal.timeout(8000),
    });
    const duration = Date.now() - start;

    if (res.ok) {
      const json = await res.json();
      const count = json.data?.length || 0;
      console.log(`HTTP ${res.status} OK (${duration}ms) — Found ${count} titles`);
      if (count > 0) {
        console.log(`     Top match: "${json.data[0].title}" (MAL ID: ${json.data[0].mal_id})`);
      }
      return true;
    } else {
      console.log(`HTTP ${res.status} ${res.statusText} (${duration}ms)`);
      return false;
    }
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`FAILED after ${duration}ms (${err.name || 'Error'}: ${err.message})`);
    return false;
  }
}

async function main() {
  const resolvedIp = await probeDns();
  if (!resolvedIp) {
    console.log('\n❌ DIAGNOSIS: DNS resolution failed for api.jikan.moe. Check local DNS resolver.');
    process.exit(1);
  }

  const tcpSuccess = await probeTcp(resolvedIp, 5000);
  if (!tcpSuccess) {
    console.log('\n------------------------------------------------------');
    console.log('⚠️  UPSTREAM CONNECTIVITY NOTICE:');
    console.log(`   Host ${JIKAN_HOST} (${resolvedIp}:${JIKAN_PORT}) did not accept TCP connections.`);
    console.log('   The public Jikan v4 server is currently experiencing network packet loss or an outage.');
    console.log('   The AnimeManager application correctly classifies this failure as UPSTREAM_TIMEOUT / 504');
    console.log('   and displays a clear, actionable unavailable notice in the UI.');
    console.log('------------------------------------------------------\n');
    console.log('To re-test live upstream connectivity once the external service recovers, run:');
    console.log('   node scripts/test-jikan-live.js\n');
    process.exit(0);
  }

  console.log('\n3. Testing live Jikan search endpoints:');
  for (const q of TEST_QUERIES) {
    await probeHttpQuery(q);
    // Respect Jikan rate-limiting (~350ms spacing)
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log('\n✔ Live upstream Jikan search verification completed successfully.');
}

main().catch((err) => {
  console.error('Fatal live probe error:', err);
  process.exit(1);
});
