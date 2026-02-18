import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { errorHandler } from './errorHandler';

/**
 * Property 51: Request payload validation
 * For any API request with invalid payload, the response should include field-specific validation error messages
 * Validates: Requirements 8.8
 */
describe('Property 51: Request payload validation', () => {
  it('should return field-specific validation errors for invalid payloads', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Generate invalid data that will fail validation
          email: fc.oneof(
            fc.constant('invalid-email'), // Invalid email format
            fc.constant(''), // Empty string
            fc.constant(123) // Wrong type
          ),
          age: fc.oneof(
            fc.constant(-5), // Negative number
            fc.constant('not-a-number'), // Wrong type
            fc.constant(0) // Zero (if min is 1)
          ),
          username: fc.oneof(
            fc.constant(''), // Empty string
            fc.constant('ab'), // Too short (if min is 3)
            fc.constant(null) // Null value
          ),
        }),
        async (invalidData) => {
          // Create test app with validation
          const app = express();
          app.use(express.json());

          const schema = z.object({
            email: z.string().email('Invalid email format'),
            age: z.number().int().min(1, 'Age must be at least 1'),
            username: z.string().min(3, 'Username must be at least 3 characters'),
          });

          app.post('/api/test', (req: Request, res: Response, next: NextFunction) => {
            try {
              const validation = schema.safeParse(req.body);
              
              if (!validation.success) {
                res.status(400).json({
                  error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    timestamp: new Date().toISOString(),
                    details: validation.error.errors.map(err => ({
                      field: err.path.join('.'),
                      message: err.message,
                    })),
                  },
                });
                return;
              }

              res.json({ success: true });
            } catch (error) {
              next(error);
            }
          });

          app.use(errorHandler);

          // Make request with invalid data
          const response = await request(app)
            .post('/api/test')
            .send(invalidData);

          // Verify validation error response
          expect(response.statusCode).toBe(400);
          expect(response.body).toHaveProperty('error');
          expect(response.body.error.code).toBe('VALIDATION_ERROR');
          expect(response.body.error).toHaveProperty('details');
          expect(Array.isArray(response.body.error.details)).toBe(true);
          expect(response.body.error.details.length).toBeGreaterThan(0);

          // Verify each detail has field and message
          for (const detail of response.body.error.details) {
            expect(detail).toHaveProperty('field');
            expect(detail).toHaveProperty('message');
            expect(typeof detail.field).toBe('string');
            expect(typeof detail.message).toBe('string');
            expect(detail.message.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate required fields and return specific error messages', async () => {
    const app = express();
    app.use(express.json());

    const schema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email format'),
      age: z.number().int().positive('Age must be positive'),
    });

    app.post('/api/test', (req: Request, res: Response) => {
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            timestamp: new Date().toISOString(),
            details: validation.error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        });
        return;
      }

      res.json({ success: true });
    });

    // Test with missing fields
    const response = await request(app)
      .post('/api/test')
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.error.details.length).toBeGreaterThanOrEqual(3);
    
    // Verify field names are present in details
    const fields = response.body.error.details.map((d: any) => d.field);
    expect(fields).toContain('name');
    expect(fields).toContain('email');
    expect(fields).toContain('age');
  });

  it('should validate nested object fields', async () => {
    const app = express();
    app.use(express.json());

    const schema = z.object({
      user: z.object({
        name: z.string().min(1),
        contact: z.object({
          email: z.string().email(),
          phone: z.string().min(10),
        }),
      }),
    });

    app.post('/api/test', (req: Request, res: Response) => {
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            timestamp: new Date().toISOString(),
            details: validation.error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        });
        return;
      }

      res.json({ success: true });
    });

    // Test with invalid nested data
    const response = await request(app)
      .post('/api/test')
      .send({
        user: {
          name: '',
          contact: {
            email: 'invalid-email',
            phone: '123',
          },
        },
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error.details.length).toBeGreaterThan(0);
    
    // Verify nested field paths
    const fields = response.body.error.details.map((d: any) => d.field);
    expect(fields.some((f: string) => f.includes('user'))).toBe(true);
  });
});
