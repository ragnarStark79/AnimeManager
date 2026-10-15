import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function tryLoadEnv(): void {
  const candidatePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../.env'),
  ];

  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
            if (!(key in process.env)) {
              process.env[key] = val;
            }
          }
        }
        break;
      } catch {
        // Fall back to existing process.env
      }
    }
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').default('postgresql://ragnar@localhost:5432/animemanager_test'),
  SUPABASE_JWT_SECRET: z.string().min(16, 'SUPABASE_JWT_SECRET must be at least 16 characters').default('development-jwt-secret-min-16-chars-long!'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  COVER_MAX_BYTES: z.coerce.number().int().positive().default(5242880),
  JIKAN_BASE_URL: z.string().url().default('https://api.jikan.moe/v4'),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  IMPORT_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  IMPORT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  JIKAN_CACHE_TTL_MS: z.coerce.number().int().positive().default(300000),
  JIKAN_CACHE_MAX_ENTRIES: z.coerce.number().int().positive().default(200),
  JIKAN_MIN_REQUEST_INTERVAL_MS: z.coerce.number().int().positive().default(350),
});

function loadConfig() {
  tryLoadEnv();
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missingKeys = result.error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
    console.error(`\n[Config Error] Invalid or missing environment configuration:\n${missingKeys}\n`);
    throw new Error(`[Config Error] Invalid or missing environment configuration: ${result.error.errors.map((e) => e.path.join('.')).join(', ')}`);
  }
  return result.data;
}

export type Config = z.infer<typeof envSchema>;
export const config: Config = loadConfig();
