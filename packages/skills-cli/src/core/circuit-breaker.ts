export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxCalls?: number;
  monitoringPeriod?: number;
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failures: number;
  success: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  totalCalls: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private totalCalls: number = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      halfOpenMaxCalls: 3,
      monitoringPeriod: 30000,
      ...config
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalCalls++;
    this.checkReset();

    if (this.state === CircuitState.OPEN) {
      throw new Error('Circuit breaker is OPEN - service unavailable');
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      this.failureCount = 0;
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
    } else if (this.state === CircuitState.CLOSED) {
      if (this.failureCount >= this.config.failureThreshold) {
        this.state = CircuitState.OPEN;
      }
    }
  }

  private checkReset(): void {
    if (this.state === CircuitState.OPEN) {
      const timeSinceLastFailure = this.lastFailureTime
        ? Date.now() - this.lastFailureTime.getTime()
        : Infinity;

      if (timeSinceLastFailure >= this.config.resetTimeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      }
    }

    if (this.state === CircuitState.CLOSED && this.lastFailureTime && this.config.monitoringPeriod) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
      if (timeSinceLastFailure > this.config.monitoringPeriod) {
        this.failureCount = 0;
        this.successCount = 0;
      }
    }
  }

  getState(): CircuitState {
    this.checkReset();
    return this.state;
  }

  getMetrics(): CircuitBreakerMetrics {
    this.checkReset();
    return {
      state: this.state,
      failures: this.failureCount,
      success: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalCalls: this.totalCalls
    };
  }

  isHealthy(): boolean {
    return this.getState() === CircuitState.CLOSED;
  }

  reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.state = CircuitState.CLOSED;
  }
}

export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();

  constructor(private defaultConfig: CircuitBreakerConfig) {}

  getBreaker(serviceName: string, config?: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      this.breakers.set(serviceName, new CircuitBreaker(config || this.defaultConfig));
    }
    return this.breakers.get(serviceName)!;
  }

  getMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    this.breakers.forEach((breaker, serviceName) => {
      metrics[serviceName] = breaker.getMetrics();
    });
    return metrics;
  }

  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }

  getHealthStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.breakers.forEach((breaker, serviceName) => {
      status[serviceName] = breaker.isHealthy();
    });
    return status;
  }
}


