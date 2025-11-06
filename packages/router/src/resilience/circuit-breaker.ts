/**
 * Circuit Breaker Pattern Implementation
 * Task: SF-STABILITY-2025-T1.4
 * Date: 2025-11-05
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export class CircuitBreakerError extends Error {
  constructor(message: string, public state: CircuitState) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export interface CircuitBreakerOptions {
  name: string;
  failureThreshold: number;
  successThreshold: number;
  resetTimeout: number;
  timeout: number;
}

export interface CircuitBreakerStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  timeouts: number;
  circuitOpened: number;
  state: CircuitState;
  failureCount: number;
  successCount: number;
  nextAttempt: number | null;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = Date.now();
  private stats = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    timeouts: 0,
    circuitOpened: 0
  };
  
  constructor(private options: CircuitBreakerOptions) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.stats.totalCalls++;
    
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        this.stats.circuitOpened++;
        throw new CircuitBreakerError(
          `Circuit breaker '${this.options.name}' is OPEN`,
          this.state
        );
      }
      // Try to close circuit
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }
    
    try {
      // Execute with timeout
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            this.stats.timeouts++;
            reject(new Error('Circuit breaker timeout'));
          }, this.options.timeout)
        )
      ]);
      
      // Success
      this.onSuccess();
      return result;
    } catch (error) {
      // Failure
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.stats.successfulCalls++;
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }
  
  private onFailure(): void {
    this.stats.failedCalls++;
    this.failureCount++;
    this.successCount = 0;
    
    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.options.resetTimeout;
      this.stats.circuitOpened++;
    }
  }
  
  getState(): CircuitState {
    return this.state;
  }
  
  getStats(): CircuitBreakerStats {
    return {
      ...this.stats,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.state === CircuitState.OPEN ? this.nextAttempt : null
    };
  }
  
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
  }
  
  /**
   * Force circuit to open (for testing or manual intervention)
   */
  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.options.resetTimeout;
  }
  
  /**
   * Force circuit to close (for testing or manual intervention)
   */
  forceClose(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
  }
}

