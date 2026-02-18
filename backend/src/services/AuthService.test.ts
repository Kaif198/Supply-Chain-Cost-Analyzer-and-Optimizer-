import { describe, test, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { AuthService } from './AuthService';
import { authenticate } from '../middleware/auth';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Property 41: Authentication enforcement
 * For any protected API endpoint, requests without valid JWT tokens should be rejected with 401 status.
 * Validates: Requirements 7.1, 7.4
 * 
 * Feature: supply-chain-intelligence-platform, Property 41: Authentication enforcement
 */
describe('Property 41: Authentication enforcement', () => {
  test('requests without valid JWT tokens are rejected with 401', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(undefined), // No header
          fc.constant(''), // Empty header
          fc.string(), // Random string
          fc.string().map(s => `Bearer ${s}`), // Invalid token with Bearer prefix
          fc.string().map(s => `Token ${s}`), // Wrong auth scheme
        ),
        (authHeader) => {
          const req = {
            headers: authHeader ? { authorization: authHeader } : {},
          } as Request;

          let statusCode: number | undefined;
          let responseBody: any;

          const res = {
            status: (code: number) => {
              statusCode = code;
              return res;
            },
            json: (body: any) => {
              responseBody = body;
            },
          } as unknown as Response;

          const next = () => {
            // Should not be called for invalid tokens
            throw new Error('next() should not be called for invalid auth');
          };

          authenticate(req, res, next);

          // Should return 401 for invalid/missing tokens
          expect(statusCode).toBe(401);
          expect(responseBody).toHaveProperty('error');
          expect(responseBody.error.code).toBe('UNAUTHORIZED');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('requests with valid JWT tokens are allowed through', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          username: fc.string({ minLength: 3, maxLength: 20 }),
          email: fc.emailAddress(),
          role: fc.constantFrom('user', 'admin'),
        }),
        (payload) => {
          // Generate a valid token
          const token = AuthService.generateToken(payload);

          const req = {
            headers: { authorization: `Bearer ${token}` },
          } as Request;

          let nextCalled = false;

          const res = {
            status: () => {
              throw new Error('res.status should not be called for valid tokens');
            },
            json: () => {
              throw new Error('res.json should not be called for valid tokens');
            },
          } as unknown as Response;

          const next = () => {
            nextCalled = true;
          };

          authenticate(req, res, next);

          // Should call next() for valid tokens
          expect(nextCalled).toBe(true);
          expect(req.user).toBeDefined();
          expect(req.user?.userId).toBe(payload.userId);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 42: Token issuance on valid credentials
 * For any login request with valid credentials, the API should return a JWT token with 24-hour expiration.
 * Validates: Requirements 7.2
 * 
 * Feature: supply-chain-intelligence-platform, Property 42: Token issuance on valid credentials
 */
describe('Property 42: Token issuance on valid credentials', () => {
  test('valid credentials return JWT token with 24-hour expiration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          username: fc.string({ minLength: 3, maxLength: 20 }),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 50 }),
          role: fc.constantFrom('user', 'admin'),
        }),
        async (userData) => {
          // Hash the password
          const hashedPassword = await AuthService.hashPassword(userData.password);

          // Mock user lookup function
          const findUser = async (username: string) => {
            if (username === userData.username) {
              return {
                id: userData.userId,
                username: userData.username,
                email: userData.email,
                password: hashedPassword,
                role: userData.role,
              };
            }
            return null;
          };

          // Attempt login
          const result = await AuthService.loginWithUser(
            { username: userData.username, password: userData.password },
            findUser
          );

          // Should return a token
          expect(result.token).toBeDefined();
          expect(typeof result.token).toBe('string');

          // Decode token to check expiration
          const decoded = jwt.decode(result.token) as any;
          expect(decoded).toBeDefined();
          expect(decoded.userId).toBe(userData.userId);
          expect(decoded.username).toBe(userData.username);
          expect(decoded.email).toBe(userData.email);

          // Check expiration is approximately 24 hours (86400 seconds)
          const now = Math.floor(Date.now() / 1000);
          const expiresIn = decoded.exp - now;
          
          // Allow some tolerance (23.5 to 24.5 hours)
          expect(expiresIn).toBeGreaterThan(23.5 * 3600);
          expect(expiresIn).toBeLessThan(24.5 * 3600);

          // Should return user info
          expect(result.user.id).toBe(userData.userId);
          expect(result.user.username).toBe(userData.username);
          expect(result.user.email).toBe(userData.email);
        }
      ),
      { numRuns: 20 } // Reduced from 100 due to bcrypt hashing being slow
    );
  });
});

/**
 * Property 43: Invalid credentials rejection
 * For any login request with invalid credentials, the API should return 401 status with error message.
 * Validates: Requirements 7.3
 * 
 * Feature: supply-chain-intelligence-platform, Property 43: Invalid credentials rejection
 */
describe('Property 43: Invalid credentials rejection', () => {
  test('invalid username is rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          username: fc.string({ minLength: 3, maxLength: 20 }),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 50 }),
          role: fc.constantFrom('user', 'admin'),
          wrongUsername: fc.string({ minLength: 3, maxLength: 20 }),
        }).filter(data => data.username !== data.wrongUsername),
        async (userData) => {
          // Hash the password
          const hashedPassword = await AuthService.hashPassword(userData.password);

          // Mock user lookup function
          const findUser = async (username: string) => {
            if (username === userData.username) {
              return {
                id: userData.userId,
                username: userData.username,
                email: userData.email,
                password: hashedPassword,
                role: userData.role,
              };
            }
            return null;
          };

          // Attempt login with wrong username
          await expect(
            AuthService.loginWithUser(
              { username: userData.wrongUsername, password: userData.password },
              findUser
            )
          ).rejects.toThrow('Invalid credentials');
        }
      ),
      { numRuns: 20 }
    );
  });

  test('invalid password is rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          username: fc.string({ minLength: 3, maxLength: 20 }),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 50 }),
          wrongPassword: fc.string({ minLength: 8, maxLength: 50 }),
          role: fc.constantFrom('user', 'admin'),
        }).filter(data => data.password !== data.wrongPassword),
        async (userData) => {
          // Hash the correct password
          const hashedPassword = await AuthService.hashPassword(userData.password);

          // Mock user lookup function
          const findUser = async (username: string) => {
            if (username === userData.username) {
              return {
                id: userData.userId,
                username: userData.username,
                email: userData.email,
                password: hashedPassword,
                role: userData.role,
              };
            }
            return null;
          };

          // Attempt login with wrong password
          await expect(
            AuthService.loginWithUser(
              { username: userData.username, password: userData.wrongPassword },
              findUser
            )
          ).rejects.toThrow('Invalid credentials');
        }
      ),
      { numRuns: 20 }
    );
  });
});

/**
 * Property 44: Token invalidation on logout
 * For any logout request, the token should be invalidated and subsequent requests with that token should be rejected.
 * Validates: Requirements 7.6
 * 
 * Feature: supply-chain-intelligence-platform, Property 44: Token invalidation on logout
 */
describe('Property 44: Token invalidation on logout', () => {
  beforeEach(() => {
    // Clear blacklist before each test
    AuthService.clearBlacklist();
  });

  test('token is invalidated after logout', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          username: fc.string({ minLength: 3, maxLength: 20 }),
          email: fc.emailAddress(),
          role: fc.constantFrom('user', 'admin'),
        }),
        (payload) => {
          // Generate a valid token
          const token = AuthService.generateToken(payload);

          // Token should be valid before logout
          expect(() => AuthService.verifyToken(token)).not.toThrow();

          // Logout (invalidate token)
          AuthService.logout(token);

          // Token should be blacklisted
          expect(AuthService.isTokenBlacklisted(token)).toBe(true);

          // Token should be rejected after logout
          expect(() => AuthService.verifyToken(token)).toThrow('Token has been invalidated');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('only the logged out token is invalidated, not others', () => {
    fc.assert(
      fc.property(
        fc.record({
          user1: fc.record({
            userId: fc.uuid(),
            username: fc.string({ minLength: 3, maxLength: 20 }),
            email: fc.emailAddress(),
            role: fc.constantFrom('user', 'admin'),
          }),
          user2: fc.record({
            userId: fc.uuid(),
            username: fc.string({ minLength: 3, maxLength: 20 }),
            email: fc.emailAddress(),
            role: fc.constantFrom('user', 'admin'),
          }),
        }),
        (data) => {
          // Generate tokens for two different users
          const token1 = AuthService.generateToken(data.user1);
          const token2 = AuthService.generateToken(data.user2);

          // Both tokens should be valid
          expect(() => AuthService.verifyToken(token1)).not.toThrow();
          expect(() => AuthService.verifyToken(token2)).not.toThrow();

          // Logout user1
          AuthService.logout(token1);

          // Token1 should be invalidated
          expect(() => AuthService.verifyToken(token1)).toThrow('Token has been invalidated');

          // Token2 should still be valid
          expect(() => AuthService.verifyToken(token2)).not.toThrow();
          const decoded = AuthService.verifyToken(token2);
          expect(decoded.userId).toBe(data.user2.userId);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 45: Password hashing
 * For any user creation or password update, the stored password should be a bcrypt hash, not plaintext.
 * Validates: Requirements 7.7
 * 
 * Feature: supply-chain-intelligence-platform, Property 45: Password hashing
 */
describe('Property 45: Password hashing', () => {
  test('passwords are hashed with bcrypt, not stored as plaintext', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 50 }),
        async (password) => {
          // Hash the password
          const hash = await AuthService.hashPassword(password);

          // Hash should not equal plaintext password
          expect(hash).not.toBe(password);

          // Hash should start with bcrypt prefix ($2a$, $2b$, or $2y$)
          expect(hash).toMatch(/^\$2[aby]\$/);

          // Hash should contain salt rounds (minimum 10)
          const saltRounds = parseInt(hash.split('$')[2]);
          expect(saltRounds).toBeGreaterThanOrEqual(10);

          // Hash should be verifiable with the original password
          const isValid = await AuthService.verifyPassword(password, hash);
          expect(isValid).toBe(true);

          // Hash should not verify with a different password
          const wrongPassword = password + 'wrong';
          const isInvalid = await AuthService.verifyPassword(wrongPassword, hash);
          expect(isInvalid).toBe(false);
        }
      ),
      { numRuns: 20 } // Reduced due to bcrypt being slow
    );
  });

  test('same password produces different hashes (salted)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 50 }),
        async (password) => {
          // Hash the same password twice
          const hash1 = await AuthService.hashPassword(password);
          const hash2 = await AuthService.hashPassword(password);

          // Hashes should be different (due to random salt)
          expect(hash1).not.toBe(hash2);

          // Both hashes should verify with the original password
          expect(await AuthService.verifyPassword(password, hash1)).toBe(true);
          expect(await AuthService.verifyPassword(password, hash2)).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });
});
