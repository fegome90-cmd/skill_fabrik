import { CircuitState } from './circuit-breaker.js';
export class RetryManager {
    config;
    circuitBreaker;
    constructor(config = {}, circuitBreaker) {
        this.config = {
            maxRetries: config.maxRetries || 3,
            baseDelay: config.baseDelay || 1000,
            maxDelay: config.maxDelay || 30000,
            jitterFactor: config.jitterFactor || 0.3,
            retryableErrors: config.retryableErrors || [],
            nonRetryableErrors: config.nonRetryableErrors || []
        };
        this.circuitBreaker = circuitBreaker;
    }
    async executeWithRetry(operation, _context) {
        const metrics = {
            attempts: 0,
            totalDelay: 0,
            errors: []
        };
        let lastError = null;
        for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
            metrics.attempts++;
            try {
                if (this.circuitBreaker && this.circuitBreaker.getState() === CircuitState.OPEN) {
                    throw new Error('Circuit breaker is OPEN - failing fast without retry');
                }
                if (this.circuitBreaker) {
                    return await this.circuitBreaker.execute(operation);
                }
                else {
                    return await operation();
                }
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                const errorMessage = lastError.message || String(error);
                if (this.isNonRetryable(errorMessage)) {
                    metrics.errors.push(`Non-retryable: ${errorMessage}`);
                    throw lastError;
                }
                if (!this.isRetryable(errorMessage)) {
                    metrics.errors.push(`Not retryable: ${errorMessage}`);
                    throw lastError;
                }
                if (attempt < this.config.maxRetries) {
                    const delay = this.calculateBackoff(attempt);
                    metrics.totalDelay += delay;
                    metrics.errors.push(`Attempt ${attempt + 1} failed: ${errorMessage}`);
                    await this.sleep(delay);
                }
                else {
                    metrics.errors.push(`All ${attempt + 1} attempts failed`);
                }
            }
        }
        if (lastError) {
            throw lastError;
        }
        throw new Error('Retry strategy exhausted without result');
    }
    calculateBackoff(attempt) {
        const exponentialDelay = this.config.baseDelay * Math.pow(2, attempt);
        const cappedDelay = Math.min(exponentialDelay, this.config.maxDelay);
        const jitter = Math.random() * this.config.jitterFactor * cappedDelay;
        return Math.floor(cappedDelay + jitter);
    }
    isRetryable(errorMessage) {
        if (this.config.retryableErrors && this.config.retryableErrors.length > 0) {
            return this.config.retryableErrors.some(pattern => errorMessage.toLowerCase().includes(pattern.toLowerCase()));
        }
        const retryablePatterns = [
            'timeout',
            'network',
            'econnrefused',
            'econnreset',
            'etimedout',
            'temporary',
            '503',
            '502',
            '500'
        ];
        return retryablePatterns.some(pattern => errorMessage.toLowerCase().includes(pattern));
    }
    isNonRetryable(errorMessage) {
        if (this.config.nonRetryableErrors && this.config.nonRetryableErrors.length > 0) {
            return this.config.nonRetryableErrors.some(pattern => errorMessage.toLowerCase().includes(pattern.toLowerCase()));
        }
        const nonRetryablePatterns = [
            'unauthorized',
            'forbidden',
            'bad request',
            'not found',
            '401',
            '403',
            '404',
            '400'
        ];
        return nonRetryablePatterns.some(pattern => errorMessage.toLowerCase().includes(pattern));
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=retry.js.map