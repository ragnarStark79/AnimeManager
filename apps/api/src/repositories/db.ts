import pg, { type PoolClient, type QueryResult } from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

const isRemote =
  config.DATABASE_URL.includes('supabase.co') ||
  config.DATABASE_URL.includes('supabase.com') ||
  config.DATABASE_URL.includes('sslmode=require');

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: config.NODE_ENV === 'test' ? 5 : 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
});

export interface DbHealthDetailed {
  connected: boolean;
  schemaReady: boolean;
  target: 'supabase' | 'local_postgres' | 'remote_postgres';
  sanitizedHost: string;
  tablesCount: number;
  missingTables?: string[];
}

const REQUIRED_CORE_TABLES = ['titles', 'collections', 'bookmarks', 'external_sources'];

export const db = {
  query: async <T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> => {
    return pool.query<T>(text, params);
  },

  getClient: async (): Promise<PoolClient> => {
    return pool.connect();
  },

  transaction: async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  checkHealthDetailed: async (): Promise<DbHealthDetailed> => {
    try {
      const ping = await pool.query('SELECT 1 as healthy');
      const connected = ping.rows.length === 1 && ping.rows[0].healthy === 1;
      if (!connected) {
        return {
          connected: false,
          schemaReady: false,
          target: config.databaseTarget,
          sanitizedHost: config.sanitizedDbHost,
          tablesCount: 0,
        };
      }

      const tableCheck = await pool.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
      );
      const existingTables = new Set(tableCheck.rows.map((r) => r.table_name));
      const missing = REQUIRED_CORE_TABLES.filter((t) => !existingTables.has(t));

      return {
        connected: true,
        schemaReady: missing.length === 0,
        target: config.databaseTarget,
        sanitizedHost: config.sanitizedDbHost,
        tablesCount: tableCheck.rows.length,
        missingTables: missing.length > 0 ? missing : undefined,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (config.NODE_ENV !== 'test') {
        console.warn(`[AnimeManager DB] Health check failed: ${msg}`);
      }
      return {
        connected: false,
        schemaReady: false,
        target: config.databaseTarget,
        sanitizedHost: config.sanitizedDbHost,
        tablesCount: 0,
      };
    }
  },

  checkHealth: async (): Promise<boolean> => {
    const detailed = await db.checkHealthDetailed();
    return detailed.connected && detailed.schemaReady;
  },

  close: async (): Promise<void> => {
    await pool.end();
  },
};
