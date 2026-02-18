import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler, AppError } from './errorHandler';

/**
 * Property 48: JSON response format
 * For any API response, the content should be valid JSON with consistent structure
 * Validates: Requirements 8.3
 */
describe('Property 48: JSON response format', () => {
  it('should return valid JSON for all API responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          { path: '/api/test/success', shouldError: false },
          { path: '/api/test/error', shouldError: true },
          { path: '/api/test/validation', shouldError: true },
          { path: '/api/test/notfound', shouldError: true }
        ),
        async (testCase) => {
          // Create test app
          const app = express();
          app.use(express.json());

          // Add test routes
          app.get('/api/test/success', (req: Request, res: Response) => {
            res.json({ message: 'Success', data: { id: 1, name: 'Test' } });
          });

          app.get('/api/test/error', (req: Request, res: Response, next: NextFunction) => {
            next(new AppError(500, 'INTERNAL_ERROR', 'Test error'));
          });

          app.get('/api/test/validation', (req: Request, res: Response, next: NextFunction) => {
            next(new AppError(400, 'VALIDATION_ERROR', 'Validation failed', [
              { field: 'email', message: 'Invalid email' }
            ]));
          });

          // 404 handler
          app.use(notFoundHandler);

          // Error handler
          app.use(errorHandler);

          // Make request
          const response = await request(app).get(testCase.path);

          // Verify response is valid JSON
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body).toBeDefined();
          expect(typeof response.body).toBe('object');

          // Verify response can be stringified and parsed
          const jsonString = JSON.stringify(response.body);
          const parsed = JSON.parse(jsonString);
          expect(parsed).toEqual(response.body);

          // If error response, verify consistent error structure
          if (testCase.shouldError) {
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toHaveProperty('code');
            expect(response.body.error).toHaveProperty('message');
            expect(response.body.error).toHaveProperty('timestamp');
            expect(typeof response.body.error.code).toBe('string');
            expect(typeof response.body.error.message).toBe('string');
            expect(typeof response.body.error.timestamp).toBe('string');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return valid JSON for various error types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          statusCode: fc.constantFrom(400, 401, 404, 409, 429, 500),
          code: fc.constantFrom('VALIDATION_ERROR', 'UNAUTHORIZED', 'NOT_FOUND', 'CONFLICT', 'RATE_LIMIT_EXCEEDED', 'INTERNAL_ERROR'),
          message: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        async (errorData) => {
          // Create test app
          const app = express();
          app.use(express.json());

          app.get('/api/test', (req: Request, res: Response, next: NextFunction) => {
            next(new AppError(errorData.statusCode, errorData.code, errorData.message));
          });

          app.use(errorHandler);

          // Make request
          const response = await request(app).get('/api/test');

          // Verify response is valid JSON
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body).toBeDefined();
          expect(typeof response.body).toBe('object');

          // Verify error structure
          expect(response.body).toHaveProperty('error');
          expect(response.body.error.code).toBe(errorData.code);
          expect(response.body.error.message).toBe(errorData.message);
          expect(response.body.error).toHaveProperty('timestamp');
          expect(response.statusCode).toBe(errorData.statusCode);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 49: Error status codes
 * For any API error, the response should include appropriate HTTP status code matching the error type
 * Validates: Requirements 8.4
 */
describe('Property 49: Error status codes', () => {
  it('should return correct status codes for different error types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
          { statusCode: 401, code: 'UNAUTHORIZED', message: 'Authentication required' },
          { statusCode: 404, code: 'NOT_FOUND', message: 'Resource not found' },
          { statusCode: 409, code: 'CONFLICT', message: 'Resource conflict' },
          { statusCode: 429, code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded' },
          { statusCode: 500, code: 'INTERNAL_ERROR', message: 'Internal server error' }
        ),
        async (errorData) => {
          // Create test app
          const app = express();
          app.use(express.json());

          app.get('/api/test', (req: Request, res: Response, next: NextFunction) => {
            next(new AppError(errorData.statusCode, errorData.code, errorData.message));
          });

          app.use(errorHandler);

          // Make request
          const response = await request(app).get('/api/test');

          // Verify status code matches error type
          expect(response.statusCode).toBe(errorData.statusCode);
          expect(response.body.error.code).toBe(errorData.code);

          // Verify status code is in valid range
          expect(response.statusCode).toBeGreaterThanOrEqual(400);
          expect(response.statusCode).toBeLessThan(600);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should map error types to correct HTTP status codes', async () => {
    const errorMappings = [
      { error: new Error('JsonWebTokenError'), expectedStatus: 401 },
      { error: new Error('TokenExpiredError'), expectedStatus: 401 },
      { error: new AppError(400, 'VALIDATION_ERROR', 'Test'), expectedStatus: 400 },
      { error: new AppError(404, 'NOT_FOUND', 'Test'), expectedStatus: 404 },
      { error: new AppError(409, 'CONFLICT', 'Test'), expectedStatus: 409 },
      { error: new AppError(500, 'INTERNAL_ERROR', 'Test'), expectedStatus: 500 },
    ];

    for (const mapping of errorMappings) {
      const app = express();
      app.use(express.json());

      app.get('/api/test', (req: Request, res: Response, next: NextFunction) => {
        mapping.error.name = mapping.error.message; // Set error name for JWT errors
        next(mapping.error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/api/test');
      expect(response.statusCode).toBe(mapping.expectedStatus);
    }
  });
});

/**
 * Property 52: Consistent error response format
 * For any API error, the response should include error code, message, and timestamp in consistent structure
 * Validates: Requirements 20.8
 */
describe('Property 52: Consistent error response format', () => {
  it('should return consistent error format for all error types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          statusCode: fc.integer({ min: 400, max: 599 }),
          code: fc.string({ minLength: 3, maxLength: 30 }),
          message: fc.string({ minLength: 1, maxLength: 200 }),
          hasDetails: fc.boolean(),
        }),
        async (errorData) => {
          // Create test app
          const app = express();
          app.use(express.json());

          app.get('/api/test', (req: Request, res: Response, next: NextFunction) => {
            const details = errorData.hasDetails ? { field: 'test', value: 'invalid' } : undefined;
            next(new AppError(errorData.statusCode, errorData.code, errorData.message, details));
          });

          app.use(errorHandler);

          // Make request
          const response = await request(app).get('/api/test');

          // Verify consistent error structure
          expect(response.body).toHaveProperty('error');
          expect(response.body.error).toHaveProperty('code');
          expect(response.body.error).toHaveProperty('message');
          expect(response.body.error).toHaveProperty('timestamp');

          // Verify types
          expect(typeof response.body.error.code).toBe('string');
          expect(typeof response.body.error.message).toBe('string');
          expect(typeof response.body.error.timestamp).toBe('string');

          // Verify timestamp is valid ISO 8601
          const timestamp = new Date(response.body.error.timestamp);
          expect(timestamp.toISOString()).toBe(response.body.error.timestamp);

          // Verify details if present
          if (errorData.hasDetails) {
            expect(response.body.error).toHaveProperty('details');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include all required fields in error response', async () => {
    const app = express();
    app.use(express.json());

    app.get('/api/test', (req: Request, res: Response, next: NextFunction) => {
      next(new AppError(500, 'TEST_ERROR', 'Test error message'));
    });

    app.use(errorHandler);

    const response = await request(app).get('/api/test');

    // Verify all required fields are present
    const requiredFields = ['code', 'message', 'timestamp'];
    for (const field of requiredFields) {
      expect(response.body.error).toHaveProperty(field);
      expect(response.body.error[field]).toBeDefined();
      expect(response.body.error[field]).not.toBe('');
    }
  });
});
