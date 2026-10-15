import { app } from './app.js';
import { config } from './config/index.js';
import { pool } from './repositories/db.js';

const server = app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`[AnimeManager API] Server listening on http://localhost:${config.PORT} (env: ${config.NODE_ENV})`);
  pool.query('SELECT 1').then(() => {
    console.log('[AnimeManager API] Database connection verified successfully (connected).');
  }).catch((err) => {
    console.warn(`[AnimeManager API] WARNING: Database connection failed (${err.message}). API operating in degraded state.`);
  });
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
