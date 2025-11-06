/**
 * Retry with Exponential Backoff
 * Task: SF-STABILITY-2025-T3.4
 * Date: 2025-11-05
 */

import { logger } from '../logger.js';

export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors?: string[];
}

export interface RetryStats {
  attempts: number;
  totalDelayMs: number;
  lastError: Error | null;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
  retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET']
};

/**
 * Execute function with exponential backoff retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const stats: RetryStats = {
    attempts: 0,
    totalDelayMs: 0,
    lastError: null
  };

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    stats.attempts = attempt + 1;

    try {
      const result = await fn();
      
      if (attempt > 0) {
        logger.info({
          attempts: stats.attempts,
          totalDelayMs: stats.totalDelayMs
        }, 'Operation succeeded after retries');
      }
      
      return result;
    } catch (error) {
      stats.lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is retryable
      if (!isRetryableError(error, opts.retryableErrors)) {
        logger.debug({
          error: stats.lastError.message,
          attempt: stats.attempts
        }, 'Non-retryable error, not retrying');
        throw error;
      }

      // Last attempt, throw error
      if (attempt === opts.maxRetries) {
        logger.warn({
          attempts: stats.attempts,
          totalDelayMs: stats.totalDelayMs,
          error: stats.lastError.message
        }, 'All retry attempts exhausted');
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = calculateDelay(attempt, opts);
      stats.totalDelayMs += delay;

      logger.debug({
        attempt: stats.attempts,
        delayMs: delay,
        error: stats.lastError.message
      }, 'Retrying after delay');

      // Wait before retry
      await sleep(delay);
    }
  }

  // Should never reach here
  throw stats.lastError || new Error('Retry failed');
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  // Calculate exponential delay
  let delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt);

  // Cap at max delay
  delay = Math.min(delay, options.maxDelayMs);

  // Add jitter if enabled
  if (options.jitter) {
    // Random jitter between 0% and 25% of delay
    const jitterAmount = delay * 0.25 * Math.random();
    delay += jitterAmount;
  }

  return Math.floor(delay);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown, retryableErrors?: string[]): boolean {
  if (!retryableErrors || retryableErrors.length === 0) {
    return true; // Retry all errors if no specific errors defined
  }

  if (error instanceof Error && 'code' in error) {
    const errorCode = (error as any).code;
    return retryableErrors.includes(errorCode);
  }

  // Check error message
  if (error instanceof Error) {
    return retryableErrors.some(code => 
      error.message.toLowerCase().includes(code.toLowerCase())
    );
  }

  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry decorator for async functions
 */
export function retry(options: Partial<RetryOptions> = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return withRetry(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}

