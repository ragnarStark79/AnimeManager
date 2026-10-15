import type { Request, Response, NextFunction } from 'express';
import { db } from '../repositories/db.js';

export const healthController = {
  async getHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dbHealth = await db.checkHealthDetailed();
      const isHealthy = dbHealth.connected && dbHealth.schemaReady;
      const statusCode = isHealthy ? 200 : 503;

      res.status(statusCode).json({
        data: {
          status: isHealthy ? 'healthy' : 'degraded',
          database: dbHealth.connected ? 'connected' : 'disconnected',
          schema: dbHealth.schemaReady ? 'ready' : (dbHealth.connected ? 'incomplete' : 'unavailable'),
          databaseTarget: dbHealth.target,
          databaseHost: dbHealth.sanitizedHost,
          tablesCount: dbHealth.tablesCount,
          version: '1.0.0',
          uptime: Math.round(process.uptime()),
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
