/**
 * Custom error classes for the application
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    code: string = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;
    
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 Bad Request
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', code?: string) {
    super(400, message, true, code);
  }
}

// 401 Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code?: string) {
    super(401, message, true, code);
  }
}

// 403 Forbidden
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code?: string) {
    super(403, message, true, code);
  }
}

// 404 Not Found
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code?: string) {
    super(404, message, true, code);
  }
}

// 409 Conflict
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', code?: string) {
    super(409, message, true, code);
  }
}

// 422 Unprocessable Entity
export class ValidationError extends AppError {
  public readonly errors?: Record<string, string[]>;

  constructor(message: string = 'Validation failed', errors?: Record<string, string[]>) {
    super(422, message, true, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

// 429 Too Many Requests
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(429, message, true, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

// 500 Internal Server Error
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, message, false, 'INTERNAL_ERROR');
  }
}

// 502 Bad Gateway
export class BadGatewayError extends AppError {
  constructor(message: string = 'Bad gateway') {
    super(502, message, true, 'BAD_GATEWAY');
  }
}

// 503 Service Unavailable
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable') {
    super(503, message, true, 'SERVICE_UNAVAILABLE');
  }
}
