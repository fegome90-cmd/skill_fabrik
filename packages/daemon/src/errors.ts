/**
 * Custom Error Classes
 * Task: SF-STABILITY-2025-T2.5
 * Date: 2025-11-05
 */

/**
 * Base error class for daemon errors
 */
export class DaemonError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'DaemonError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details
    };
  }
}

/**
 * Database related errors
 */
export class DatabaseError extends DaemonError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', 500, details);
    this.name = 'DatabaseError';
  }
}

/**
 * Skill activation errors
 */
export class SkillActivationError extends DaemonError {
  constructor(message: string, details?: any) {
    super(message, 'SKILL_ACTIVATION_ERROR', 500, details);
    this.name = 'SkillActivationError';
  }
}

/**
 * File system errors
 */
export class FileSystemError extends DaemonError {
  constructor(message: string, details?: any) {
    super(message, 'FILE_SYSTEM_ERROR', 500, details);
    this.name = 'FileSystemError';
  }
}

/**
 * Validation errors
 */
export class ValidationError extends DaemonError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Service discovery errors
 */
export class ServiceDiscoveryError extends DaemonError {
  constructor(message: string, details?: any) {
    super(message, 'SERVICE_DISCOVERY_ERROR', 503, details);
    this.name = 'ServiceDiscoveryError';
  }
}

/**
 * Quality service errors
 */
export class QualityServiceError extends DaemonError {
  constructor(message: string, details?: any) {
    super(message, 'QUALITY_SERVICE_ERROR', 500, details);
    this.name = 'QualityServiceError';
  }
}

/**
 * Helper to format error response
 */
export function formatErrorResponse(error: Error | DaemonError | unknown) {
  if (error instanceof DaemonError) {
    return {
      success: false,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        details: error.details
      }
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    };
  }

  return {
    success: false,
    error: {
      message: String(error)
    }
  };
}

/**
 * Helper to check if error is operational (expected) or programmer error
 */
export function isOperationalError(error: Error | DaemonError | unknown): boolean {
  if (error instanceof DaemonError) {
    return true;
  }

  // Known operational errors
  const operationalErrors = [
    'ENOENT',
    'EACCES',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND'
  ];

  if (error instanceof Error && 'code' in error) {
    return operationalErrors.includes((error as any).code);
  }

  return false;
}

