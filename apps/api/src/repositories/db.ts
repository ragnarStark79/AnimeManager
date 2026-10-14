import pg, { type PoolClient, type QueryResult } from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: config.NODE_ENV === 'test' ? 5 : 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

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

  checkHealth: async (): Promise<boolean> => {
    try {
      const res = await pool.query('SELECT 1 as healthy');
      return res.rows.length === 1 && res.rows[0].healthy === 1;
    } catch {
      return false;
    }
  },

  close: async (): Promise<void> => {
    await pool.end();
  },
};
