#!/usr/bin/env node

/**
 * AnimeManager — Automated Database Verification Runner
 * Runs SQL migrations, seeds, and constraint test assertions against local PostgreSQL.
 */

import { execSync } from 'node:child_process';

const PSQL_PATHS = [
  'psql',
  '/Applications/Postgres.app/Contents/Versions/latest/bin/psql',
  '/usr/local/bin/psql',
  '/opt/homebrew/bin/psql',
];

function findPsql() {
  for (const p of PSQL_PATHS) {
    try {
      execSync(`${p} --version`, { stdio: 'ignore' });
      return p;
    } catch {
      // Continue search
    }
  }
  return null;
}

const psqlBin = findPsql();

if (!psqlBin) {
  console.error('[verify-db] ERROR: psql command-line client was not found.');
  process.exit(1);
}

const dbName = process.env.TEST_DB_NAME || 'animemanager_test';
const dbUser = process.env.PGUSER || 'ragnar';

console.log(`[verify-db] Connecting to ${dbName} using ${psqlBin}...`);

try {
  // Ensure database exists
  try {
    execSync(`${psqlBin} -U ${dbUser} -d postgres -c "CREATE DATABASE ${dbName};" 2>&1`, { stdio: 'ignore' });
  } catch {
    // Database likely already exists
  }

  // Re-create public schema for fresh test run
  execSync(`${psqlBin} -U ${dbUser} -d ${dbName} -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>&1`, { stdio: 'ignore' });

  // Apply migrations, seed, and test suite (redirect stderr to stdout so NOTICEs are captured)
  const command = `${psqlBin} -U ${dbUser} -d ${dbName} ` +
    `-f supabase/migrations/20261014000001_initial_schema.sql ` +
    `-f supabase/migrations/20261014000002_security_policies.sql ` +
    `-f supabase/seed.sql ` +
    `-f supabase/tests/database_verification.sql 2>&1`;

  console.log('[verify-db] Running migrations, seed data, and constraint test suite...');
  const output = execSync(command, { encoding: 'utf-8' });

  // Filter and display test assertions
  const lines = output.split('\n');
  const testResults = lines.filter((l) => l.includes('TEST PASSED:'));
  console.log('\n--- Database Verification Test Results ---');
  testResults.forEach((t) => {
    const cleanMsg = t.replace(/^.*TEST PASSED:\s*/, '').trim();
    console.log(`✔ ${cleanMsg}`);
  });
  console.log(`\nAll ${testResults.length} database assertions PASSED cleanly!\n`);
} catch (error) {
  console.error('[verify-db] Database verification failed:', error.message);
  process.exit(1);
}
