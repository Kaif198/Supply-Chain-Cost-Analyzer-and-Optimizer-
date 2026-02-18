import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

/**
 * Rate limiter: 100 requests per 15 minutes
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded. Try again in 15 minutes.',
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded. Try again in 15 minutes.',
        timestamp: new Date().toISOString(),
        retryAfter: 900, // 15 minutes in seconds
      },
    });
  },
});

/**
 * Helmet middleware for security headers
 */
export const securityHeaders = helmet();

/**
 * CORS configuration
 */
export const corsMiddleware = cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

/**
 * Input sanitization middleware
 * Removes potentially dangerous characters from string inputs
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // Remove SQL injection patterns
      let sanitized = value
        .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi, '')
        .replace(/[;<>]/g, '');
      
      // Trim whitespace
      sanitized = sanitized.trim();
      
      return sanitized;
    } else if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    } else if (typeof value === 'object' && value !== null) {
      const sanitized: any = {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};

/**
 * Request validation middleware factory
 * Uses Zod schemas to validate request payloads
 */
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            timestamp: new Date().toISOString(),
            details: validation.error.errors.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        });
        return;
      }
      
      // Replace body with validated data
      req.body = validation.data;
      next();
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during validation',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};
