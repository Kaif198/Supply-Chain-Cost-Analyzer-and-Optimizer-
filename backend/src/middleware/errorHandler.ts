import { Request, Response, NextFunction } from 'express';
import { logError } from '../utils/logger';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 * Handles all errors and returns consistent error format
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default error values
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  }
  // Handle Zod validation errors
  else if (err.name === 'ZodError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = (err as any).errors?.map((e: any) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Invalid authentication token';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Authentication token has expired';
  }
  // Handle Prisma errors
  else if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      statusCode = 409;
      errorCode = 'CONFLICT';
      message = 'A record with this value already exists';
      details = { field: prismaError.meta?.target };
    } else if (prismaError.code === 'P2025') {
      statusCode = 404;
      errorCode = 'NOT_FOUND';
      message = 'Record not found';
    }
  }
  // Handle rate limit errors
  else if (err.message && err.message.includes('Too many requests')) {
    statusCode = 429;
    errorCode = 'RATE_LIMIT_EXCEEDED';
    message = 'Rate limit exceeded. Try again later.';
    details = { retryAfter: 900 }; // 15 minutes in seconds
  }

  // Log error for debugging (exclude sensitive data)
  logError(err, {
    method: req.method,
    path: req.path,
    statusCode,
    errorCode,
    userId: (req as any).user?.userId,
  });

  // Send error response
  const errorResponse: any = {
    error: {
      code: errorCode,
      message,
      timestamp: new Date().toISOString(),
    },
  };

  if (details) {
    errorResponse.error.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
    },
  });
}
