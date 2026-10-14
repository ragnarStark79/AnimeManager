export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: unknown[];

  constructor(message: string, statusCode = 500, errorCode = 'INTERNAL_ERROR', details?: unknown[]) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details?: unknown[]) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access', details?: unknown[]) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden operation', details?: unknown[]) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown[]) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: unknown[]) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown[]) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', details?: unknown[]) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

export class ExternalProviderUnavailableError extends AppError {
  constructor(message = 'External metadata provider is temporarily unavailable', details?: unknown[]) {
    super(message, 502, 'EXTERNAL_PROVIDER_UNAVAILABLE', details);
  }
}

export class ExternalProviderTimeoutError extends AppError {
  constructor(message = 'External metadata provider request timed out', details?: unknown[]) {
    super(message, 504, 'EXTERNAL_PROVIDER_TIMEOUT', details);
  }
}

export class ExternalProviderRateLimitError extends AppError {
  constructor(message = 'External metadata provider rate limit exceeded', details?: unknown[]) {
    super(message, 429, 'RATE_LIMITED', details);
  }
}

export class ExternalResourceNotFoundError extends AppError {
  constructor(message = 'External metadata resource not found', details?: unknown[]) {
    super(message, 404, 'EXTERNAL_RESOURCE_NOT_FOUND', details);
  }
}

export class DuplicateImportError extends AppError {
  constructor(message = 'This title has already been imported from the external provider', details?: unknown[]) {
    super(message, 409, 'DUPLICATE_IMPORT', details);
  }
}

