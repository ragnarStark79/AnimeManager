import type { Request, Response, NextFunction } from 'express';
import { db } from '../repositories/db.js';

export const healthController = {
  async getHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isDbHealthy = await db.checkHealth();
      const statusCode = isDbHealthy ? 200 : 503;

      res.status(statusCode).json({
        data: {
          status: isDbHealthy ? 'healthy' : 'degraded',
          database: isDbHealthy ? 'connected' : 'disconnected',
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
