import { app } from './app.js';
import { config } from './config/index.js';
import { pool, db } from './repositories/db.js';

const server = app.listen(config.PORT, '0.0.0.0', async () => {
  console.log(`[AnimeManager API] Server listening on http://localhost:${config.PORT} (env: ${config.NODE_ENV})`);
  console.log(`[AnimeManager API] Target database: [${config.databaseTarget}] ${config.sanitizedDbHost}`);

  try {
    const health = await db.checkHealthDetailed();
    if (health.connected && health.schemaReady) {
      console.log(`[AnimeManager API] Database connection & schema verified successfully (${health.tablesCount} public tables).`);
    } else if (health.connected && !health.schemaReady) {
      console.warn(`[AnimeManager API] WARNING: Database connected but schema incomplete! Missing tables: ${health.missingTables?.join(', ')}`);
    } else {
      console.warn(`[AnimeManager API] WARNING: Database connection failed. API operating in degraded state.`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[AnimeManager API] WARNING: Database check failed (${msg}). API operating in degraded state.`);
  }
});

const gracefulShutdown = async (signal: string) => {
  console.log(`[AnimeManager API] Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    try {
      await pool.end();
      console.log('[AnimeManager API] Database pool closed. Process terminating cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('[AnimeManager API] Error during database pool shutdown:', err);
      process.exit(1);
    }
  });

  // Force exit after 10 seconds if shutdown hangs
  setTimeout(() => {
    console.error('[AnimeManager API] Forcefully shutting down after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
