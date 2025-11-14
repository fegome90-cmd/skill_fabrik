/**
 * Structured Logger Configuration
 * Task: SF-STABILITY-2025-T2.4
 * Date: 2025-11-05
 */

import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

/**
 * Create logger instance with structured logging
 */
export const logger = pino({
  level: logLevel,

  // Base configuration
  base: {
    service: 'skills-fabrik-router',
    env: process.env.NODE_ENV || 'development',
  },

  // Timestamp
  timestamp: pino.stdTimeFunctions.isoTime,

  // Pretty print in development
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,

  // Serializers for common objects
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },

  // Redact sensitive information
  redact: {
    paths: ['req.headers.authorization', 'req.headers["x-api-key"]', 'apiKey', 'password', 'token'],
    censor: '[REDACTED]',
  },
});

/**
 * Create child logger with additional context
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Log levels
 */
export const LogLevel = {
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
} as const;

/**
 * Helper to log with request ID
 */
export function logWithRequestId(requestId: string) {
  return logger.child({ requestId });
}

/**
 * Helper to log errors with full context
 */
export function logError(error: Error | unknown, context?: Record<string, any>) {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  logger.error(
    {
      err: errorObj,
      stack: errorObj.stack,
      ...context,
    },
    errorObj.message
  );
}

/**
 * Helper to log performance metrics
 */
export function logPerformance(
  operation: string,
  durationMs: number,
  context?: Record<string, any>
) {
  logger.info(
    {
      operation,
      durationMs,
      ...context,
    },
    `${operation} completed in ${durationMs}ms`
  );
}

/**
 * Middleware to add request ID to all logs
 */
export function requestIdMiddleware() {
  return (request: any, reply: any, done: () => void) => {
    const requestId =
      request.headers['x-request-id'] ||
      `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    request.requestId = requestId;
    request.log = logWithRequestId(requestId);

    // Add request ID to response headers
    reply.header('x-request-id', requestId);

    done();
  };
}

/**
 * Middleware to log all requests
 */
export function requestLoggingMiddleware() {
  return (request: any, reply: any, done: () => void) => {
    const startTime = Date.now();

    request.log.info(
      {
        method: request.method,
        url: request.url,
        headers: request.headers,
        query: request.query,
      },
      'Incoming request'
    );

    // Store start time for duration calculation in onSend hook
    request.startTime = startTime;

    done();
  };
}

/**
 * Hook to log response completion
 * To be registered at the server level for Fastify 5 compatibility
 */
export function onResponseLogging(request: any, reply: any, payload: any, done: () => void) {
  const duration = Date.now() - request.startTime;

  request.log.info(
    {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      durationMs: duration,
    },
    'Request completed'
  );

  done();
}

export default logger;
