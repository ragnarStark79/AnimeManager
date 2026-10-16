import jwt from 'jsonwebtoken';
import { execSync } from 'node:child_process';
import { config } from '../dist/config/index.js';

export const TEST_OWNER_A = '00000000-0000-0000-0000-000000000001';
export const TEST_OWNER_B = '00000000-0000-0000-0000-000000000002';

export function createToken(ownerId, options = {}) {
  const secret = options.secret || config.SUPABASE_JWT_SECRET;
  const payload = {
    sub: ownerId,
    email: options.email || `user_${ownerId.slice(0, 8)}@example.com`,
    role: options.role || 'authenticated',
  };
  return jwt.sign(payload, secret, {
    expiresIn: options.expiresIn || '1h',
  });
}

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../../');

export function resetTestDatabase() {
  const psql = 'psql';
  const dbName = 'animemanager_test';
  const dbUser = process.env.PGUSER || 'ragnar';

  const migration1 = path.join(repoRoot, 'supabase/migrations/20261014000001_initial_schema.sql');
  const migration2 = path.join(repoRoot, 'supabase/migrations/20261014000002_security_policies.sql');
  const seedSql = path.join(repoRoot, 'supabase/seed.sql');

  try {
    execSync(
      `${psql} -U ${dbUser} -d ${dbName} -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" ` +
      `-f "${migration1}" -f "${migration2}" -f "${seedSql}" 2>&1`,
      { stdio: 'ignore' }
    );
  } catch (err) {
    console.error('Failed to reset test database:', err);
    throw err;
  }
}
