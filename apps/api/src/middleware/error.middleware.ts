import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/index.js';
import { config } from '../config/index.js';

interface PgDatabaseError extends Error {
  code?: string;
  detail?: string;
  constraint?: string;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId || 'req_unknown';
  const timestamp = new Date().toISOString();

  // Handled AppError instances
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details || [],
      },
      meta: {
        requestId,
        timestamp,
      },
    });
    return;
  }

  // Handle body-parser malformed JSON syntax errors
  if ('type' in err && (err as { type: string }).type === 'entity.parse.failed') {
    res.status(400).json({
      error: {
        code: 'MALFORMED_INPUT',
        message: 'Invalid JSON syntax in request body',
        details: [],
      },
      meta: { requestId, timestamp },
    });
    return;
  }

  // Handle PostgreSQL specific constraint codes
  const pgErr = err as PgDatabaseError;
  if (pgErr.code === '23505') {
    // Unique violation
    let message = 'A record with this identifier or name already exists';
    if (pgErr.constraint && pgErr.constraint.includes('collection')) {
      message = 'A collection with this name already exists in your library';
    } else if (pgErr.constraint && pgErr.constraint.includes('bookmark')) {
      message = 'A bookmark for this title already exists';
    }
    res.status(409).json({
      error: {
        code: 'DUPLICATE_RESOURCE',
        message,
        details: [],
      },
      meta: { requestId, timestamp },
    });
    return;
  }

  if (pgErr.code === '23503') {
    // Foreign key violation
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Referenced parent record does not exist or has been removed',
        details: [],
      },
      meta: { requestId, timestamp },
    });
    return;
  }

  if (pgErr.code === '23514') {
    // Check constraint violation
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Value violates database domain constraints',
        details: [],
      },
      meta: { requestId, timestamp },
    });
    return;
  }

  // Unexpected internal server error (never leak stack traces or connection strings)
  if (config.NODE_ENV !== 'test') {
    console.error(`[Unhandled Error] [${requestId}]`, err);
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal server error occurred',
      details: [],
    },
    meta: {
      requestId,
      timestamp,
    },
  });
}
