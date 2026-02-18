import { Request, Response, NextFunction } from 'express';
import { logRequest } from '../utils/logger';

/**
 * Middleware to log all API requests and responses
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Capture the original end function
  const originalEnd = res.end;

  // Override res.end to log after response is sent
  res.end = function (chunk?: any, encoding?: any, callback?: any): any {
    // Calculate request duration
    const duration = Date.now() - startTime;

    // Get user ID if authenticated
    const userId = (req as any).user?.userId;

    // Log the request
    logRequest(req.method, req.path, res.statusCode, duration, userId);

    // Call the original end function
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
}
