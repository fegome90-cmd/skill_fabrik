import { CircuitBreaker } from './circuit-breaker.js';
export interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    jitterFactor: number;
    retryableErrors?: string[];
    nonRetryableErrors?: string[];
}
export interface RetryMetrics {
    attempts: number;
    totalDelay: number;
    errors: string[];
    successOnAttempt?: number;
}
export declare class RetryManager {
    private config;
    private circuitBreaker?;
    constructor(config?: Partial<RetryConfig>, circuitBreaker?: CircuitBreaker);
    executeWithRetry<T>(operation: () => Promise<T>, _context?: Record<string, unknown>): Promise<T>;
    private calculateBackoff;
    private isRetryable;
    private isNonRetryable;
    private sleep;
}
//# sourceMappingURL=retry.d.ts.map