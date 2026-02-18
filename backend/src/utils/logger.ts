import winston from 'winston';

/**
 * Custom format to exclude sensitive data from logs
 */
const sanitizeFormat = winston.format((info) => {
  // Create a copy to avoid mutating the original
  const sanitized = { ...info };

  // Recursively sanitize object properties
  const sanitizeObject = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const sanitizedObj: any = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      const lowerKey = key.toLowerCase();
      
      // Exclude sensitive fields
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('authorization') ||
        lowerKey.includes('cookie')
      ) {
        sanitizedObj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizedObj[key] = sanitizeObject(obj[key]);
      } else {
        sanitizedObj[key] = obj[key];
      }
    }

    return sanitizedObj;
  };

  // Sanitize the message if it's an object
  if (typeof sanitized.message === 'object') {
    sanitized.message = sanitizeObject(sanitized.message);
  }

  // Sanitize metadata
  if (sanitized.metadata) {
    sanitized.metadata = sanitizeObject(sanitized.metadata);
  }

  // Sanitize any other properties
  for (const key in sanitized) {
    if (key !== 'level' && key !== 'timestamp' && typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }

  return sanitized;
});

/**
 * Winston logger configuration
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    sanitizeFormat(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'supply-chain-backend' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If not in production, also log to console with colorized output
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

/**
 * Helper function to log API requests
 */
export function logRequest(method: string, path: string, statusCode: number, duration: number, userId?: string): void {
  logger.info('API Request', {
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
    userId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Helper function to log errors with context
 */
export function logError(error: Error, context?: Record<string, any>): void {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    ...context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Helper function to log warnings
 */
export function logWarning(message: string, context?: Record<string, any>): void {
  logger.warn(message, {
    ...context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Helper function to log info
 */
export function logInfo(message: string, context?: Record<string, any>): void {
  logger.info(message, {
    ...context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Helper function to log debug information
 */
export function logDebug(message: string, context?: Record<string, any>): void {
  logger.debug(message, {
    ...context,
    timestamp: new Date().toISOString(),
  });
}

export default logger;
