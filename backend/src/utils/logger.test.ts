import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import logger, { logError, logInfo, logWarning, logDebug } from './logger';

/**
 * Property 47: Sensitive data logging prevention
 * For any log entry, it should not contain passwords, JWT tokens, or other sensitive credentials
 * Validates: Requirements 14.5
 */
describe('Property 47: Sensitive data logging prevention', () => {
  let logSpy: any;

  beforeEach(() => {
    // Spy on logger methods
    logSpy = vi.spyOn(logger, 'error');
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('should redact passwords from log messages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 3, maxLength: 20 }),
          password: fc.string({ minLength: 8, maxLength: 50 }),
          email: fc.emailAddress(),
        }),
        async (userData) => {
          // Log data containing password
          logError(new Error('Test error'), {
            user: userData,
          });

          // Verify password was redacted
          expect(logSpy).toHaveBeenCalled();
          const loggedData = JSON.stringify(logSpy.mock.calls[0]);
          
          // Password should be redacted
          expect(loggedData).not.toContain(userData.password);
          expect(loggedData).toContain('[REDACTED]');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should redact JWT tokens from log messages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 20, maxLength: 200 }),
        async (token) => {
          // Log data containing token
          logError(new Error('Test error'), {
            authorization: `Bearer ${token}`,
            token: token,
          });

          // Verify token was redacted
          expect(logSpy).toHaveBeenCalled();
          const loggedData = JSON.stringify(logSpy.mock.calls[0]);
          
          // Token should be redacted
          expect(loggedData).not.toContain(token);
          expect(loggedData).toContain('[REDACTED]');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should redact sensitive fields regardless of case', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          Password: fc.string({ minLength: 8 }),
          TOKEN: fc.string({ minLength: 20 }),
          Secret: fc.string({ minLength: 10 }),
          authorization: fc.string({ minLength: 20 }),
        }),
        async (sensitiveData) => {
          // Log data with various case sensitive fields
          logError(new Error('Test error'), sensitiveData);

          // Verify all sensitive fields were redacted
          expect(logSpy).toHaveBeenCalled();
          const loggedData = JSON.stringify(logSpy.mock.calls[0]);
          
          // All sensitive values should be redacted
          expect(loggedData).not.toContain(sensitiveData.Password);
          expect(loggedData).not.toContain(sensitiveData.TOKEN);
          expect(loggedData).not.toContain(sensitiveData.Secret);
          expect(loggedData).not.toContain(sensitiveData.authorization);
          
          // Should contain redaction markers
          const redactedCount = (loggedData.match(/\[REDACTED\]/g) || []).length;
          expect(redactedCount).toBeGreaterThanOrEqual(4);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should redact nested sensitive data', async () => {
    const sensitiveData = {
      user: {
        username: 'testuser',
        password: 'super-secret-password',
        profile: {
          email: 'test@example.com',
          token: 'jwt-token-12345',
        },
      },
      auth: {
        secret: 'api-secret-key',
      },
    };

    logError(new Error('Test error'), sensitiveData);

    expect(logSpy).toHaveBeenCalled();
    const loggedData = JSON.stringify(logSpy.mock.calls[0]);
    
    // Sensitive values should be redacted
    expect(loggedData).not.toContain('super-secret-password');
    expect(loggedData).not.toContain('jwt-token-12345');
    expect(loggedData).not.toContain('api-secret-key');
    
    // Non-sensitive values should remain
    expect(loggedData).toContain('testuser');
    expect(loggedData).toContain('test@example.com');
  });

  it('should redact cookies from log messages', async () => {
    const cookieData = {
      cookie: 'session=abc123; token=xyz789',
      headers: {
        cookie: 'auth=secret-value',
      },
    };

    logError(new Error('Test error'), cookieData);

    expect(logSpy).toHaveBeenCalled();
    const loggedData = JSON.stringify(logSpy.mock.calls[0]);
    
    // Cookie values should be redacted
    expect(loggedData).toContain('[REDACTED]');
    expect(loggedData).not.toContain('abc123');
    expect(loggedData).not.toContain('xyz789');
    expect(loggedData).not.toContain('secret-value');
  });

  it('should preserve non-sensitive data while redacting sensitive fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          username: fc.string({ minLength: 3, maxLength: 20 }),
          password: fc.string({ minLength: 8, maxLength: 50 }),
          email: fc.emailAddress(),
          token: fc.string({ minLength: 20, maxLength: 100 }),
          timestamp: fc.date().map(d => d.toISOString()),
        }),
        async (data) => {
          logError(new Error('Test error'), data);

          expect(logSpy).toHaveBeenCalled();
          const loggedData = JSON.stringify(logSpy.mock.calls[0]);
          
          // Non-sensitive data should be preserved
          expect(loggedData).toContain(data.userId);
          expect(loggedData).toContain(data.username);
          expect(loggedData).toContain(data.email);
          expect(loggedData).toContain(data.timestamp);
          
          // Sensitive data should be redacted
          expect(loggedData).not.toContain(data.password);
          expect(loggedData).not.toContain(data.token);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle arrays with sensitive data', async () => {
    const dataWithArray = {
      users: [
        { username: 'user1', password: 'pass1' },
        { username: 'user2', password: 'pass2' },
        { username: 'user3', password: 'pass3' },
      ],
    };

    logError(new Error('Test error'), dataWithArray);

    expect(logSpy).toHaveBeenCalled();
    const loggedData = JSON.stringify(logSpy.mock.calls[0]);
    
    // Passwords should be redacted
    expect(loggedData).not.toContain('pass1');
    expect(loggedData).not.toContain('pass2');
    expect(loggedData).not.toContain('pass3');
    
    // Usernames should remain
    expect(loggedData).toContain('user1');
    expect(loggedData).toContain('user2');
    expect(loggedData).toContain('user3');
  });
});
