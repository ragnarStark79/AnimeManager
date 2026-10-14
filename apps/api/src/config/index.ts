import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').default('postgresql://ragnar@localhost:5432/animemanager_test'),
  SUPABASE_JWT_SECRET: z.string().min(16, 'SUPABASE_JWT_SECRET must be at least 16 characters').default('development-jwt-secret-min-16-chars-long!'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  COVER_MAX_BYTES: z.coerce.number().int().positive().default(5242880),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missingKeys = result.error.errors.map((e) => e.path.join('.')).join(', ');
    throw new Error(`[Config Error] Invalid or missing environment configuration: ${missingKeys}`);
  }
  return result.data;
}

export type Config = z.infer<typeof envSchema>;
export const config: Config = loadConfig();
