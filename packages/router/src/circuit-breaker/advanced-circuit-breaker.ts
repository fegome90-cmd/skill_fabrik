/**
 * Advanced Circuit Breaker with Smart Recovery
 * Prevents cascade failures with intelligent state management
 * Task: SF-RELIABILITY-2025-T2.2
 * Date: 2025-11-14
 */

import { logger } from '../logger.js';
import { MetricsCollector } from '../metrics/metrics-collector.js';

export enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Circuit is open, calls fail fast
  HALF_OPEN = 'half-open' // Testing if system has recovered
}

export enum FailureType {
  TIMEOUT = 'timeout',
  CONNECTION_ERROR = 'connection_error',
  HTTP_ERROR = 'http_error',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown'
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;          // Number of failures before opening
  successThreshold?: number;          // Number of successes to close circuit
  resetTimeout?: number;              // Time before attempting to close (ms)
  monitoringPeriod?: number;          // Time window for failure counting (ms)
  minimumCalls?: number;              // Minimum calls before calculating failure rate
  failureRateThreshold?: number;      // Failure rate threshold (0-1)
  timeoutMs?: number;                 // Individual call timeout (ms)
  enableMetrics?: boolean;            // Enable metrics collection
  adaptiveThreshold?: boolean;        // Enable adaptive thresholds
  halfOpenMaxCalls?: number;          // Max calls in half-open state
}

export interface CallResult {
  success: boolean;
  duration: number;
  error?: Error;
  failureType?: FailureType;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  currentFailures: number;
  currentSuccesses: number;
  failureRate: number;
  averageCallDuration: number;
  lastStateChange: number;
  lastFailureTime: number;
  nextAttemptTime: number;
  adaptiveThreshold: number;
  circuitOpens: number;
  circuitCloses: number;
}

export interface CircuitBreakerMetrics {
  [key: string]: CircuitBreakerStats;
}

/**
 * Advanced Circuit Breaker with adaptive thresholds and smart recovery
 */
export class AdvancedCircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private totalCalls: number = 0;
  private lastStateChange: number = Date.now();
  private lastFailureTime: number = 0;
  private nextAttemptTime: number = 0;
  private halfOpenCalls: number = 0;
  private circuitOpens: number = 0;
  private circuitCloses: number = 0;

  // Adaptive thresholds
  private adaptiveFailureThreshold: number;
  private historicalFailureRate: number = 0;
  private performanceHistory: Array<{ timestamp: number; success: boolean; duration: number }> = [];

  // Configuration
  private options: Required<CircuitBreakerOptions>;

  constructor(
    private name: string,
    private metrics: MetricsCollector,
    options: CircuitBreakerOptions = {}
  ) {
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      successThreshold: options.successThreshold || 3,
      resetTimeout: options.resetTimeout || 30000,
      monitoringPeriod: options.monitoringPeriod || 60000,
      minimumCalls: options.minimumCalls || 10,
      failureRateThreshold: options.failureRateThreshold || 0.5,
      timeoutMs: options.timeoutMs || 5000,
      enableMetrics: options.enableMetrics !== false,
      adaptiveThreshold: options.adaptiveThreshold !== false,
      halfOpenMaxCalls: options.halfOpenMaxCalls || 5
    };

    this.adaptiveFailureThreshold = this.options.failureThreshold;

    // Initialize metrics
    if (this.options.enableMetrics) {
      this.initializeMetrics();
    }

    logger.info({
      name,
      failureThreshold: this.options.failureThreshold,
      resetTimeout: this.options.resetTimeout,
      adaptiveThreshold: this.options.adaptiveThreshold
    }, 'Advanced circuit breaker initialized');
  }

  /**
   * Execute a function with circuit breaker protection
   */
  public async execute<T>(
    fn: () => Promise<T>,
    context?: { [key: string]: string }
  ): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        const error = new Error(`Circuit breaker '${this.name}' is OPEN`);
        this.recordFailure(error, FailureType.UNKNOWN, 0);
        throw error;
      } else {
        // Try to transition to half-open
        this.transitionToHalfOpen();
      }
    }

    const startTime = Date.now();
    const labels = { circuit_breaker: this.name, ...context };

    try {
      // Set up timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Circuit breaker '${this.name}' timeout after ${this.options.timeoutMs}ms`));
        }, this.options.timeoutMs);
      });

      // Execute the function with timeout
      const result = await Promise.race([fn(), timeoutPromise]);

      const duration = Date.now() - startTime;
      this.recordSuccess(duration);

      if (this.options.enableMetrics) {
        this.metrics.recordTimer('circuit_breaker_call_duration', duration, labels);
        this.metrics.incrementCounter('circuit_breaker_success_total', 1, labels);
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const failureType = this.classifyError(error as Error);
      this.recordFailure(error as Error, failureType, duration);

      if (this.options.enableMetrics) {
        this.metrics.recordTimer('circuit_breaker_call_duration', duration, labels);
        this.metrics.incrementCounter('circuit_breaker_failure_total', 1, labels);
        this.metrics.incrementCounter(`circuit_breaker_failure_${failureType}_total`, 1, labels);
      }

      throw error;
    }
  }

  /**
   * Get current circuit breaker statistics
   */
  public getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      totalCalls: this.totalCalls,
      successfulCalls: this.successes,
      failedCalls: this.failures,
      currentFailures: this.failures,
      currentSuccesses: this.successes,
      failureRate: this.calculateFailureRate(),
      averageCallDuration: this.calculateAverageCallDuration(),
      lastStateChange: this.lastStateChange,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      adaptiveThreshold: this.adaptiveFailureThreshold,
      circuitOpens: this.circuitOpens,
      circuitCloses: this.circuitCloses
    };
  }

  /**
   * Force circuit breaker to open
   */
  public forceOpen(reason?: string): void {
    this.transitionToOpen(reason || 'Manually forced open');
  }

  /**
   * Force circuit breaker to close
   */
  public forceClose(reason?: string): void {
    this.transitionToClosed(reason || 'Manually forced closed');
  }

  /**
   * Reset circuit breaker to initial state
   */
  public reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.halfOpenCalls = 0;
    this.lastStateChange = Date.now();
    this.adaptiveFailureThreshold = this.options.failureThreshold;
    this.performanceHistory = [];

    logger.info({ name: this.name }, 'Circuit breaker reset');
  }

  /**
   * Update circuit breaker configuration
   */
  public updateConfig(newOptions: Partial<CircuitBreakerOptions>): void {
    Object.assign(this.options, newOptions);

    if (newOptions.failureThreshold) {
      this.adaptiveFailureThreshold = newOptions.failureThreshold;
    }

    logger.info({
      name: this.name,
      newConfig: newOptions
    }, 'Circuit breaker configuration updated');
  }

  // Private methods

  private recordSuccess(duration: number): void {
    this.successes++;
    this.totalCalls++;

    // Add to performance history
    this.performanceHistory.push({
      timestamp: Date.now(),
      success: true,
      duration
    });

    // Keep only recent history
    const cutoff = Date.now() - this.options.monitoringPeriod;
    this.performanceHistory = this.performanceHistory.filter(p => p.timestamp >= cutoff);

    // State transitions
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenCalls++;
      if (this.successes >= this.options.successThreshold) {
        this.transitionToClosed('Recovery successful');
      }
    }

    this.updateAdaptiveThreshold();

    if (this.options.enableMetrics) {
      this.metrics.setGauge(`circuit_breaker_${this.name}_failures`, this.failures);
      this.metrics.setGauge(`circuit_breaker_${this.name}_successes`, this.successes);
    }
  }

  private recordFailure(error: Error, failureType: FailureType, duration: number): void {
    this.failures++;
    this.totalCalls++;
    this.lastFailureTime = Date.now();

    // Add to performance history
    this.performanceHistory.push({
      timestamp: Date.now(),
      success: false,
      duration
    });

    // Keep only recent history
    const cutoff = Date.now() - this.options.monitoringPeriod;
    this.performanceHistory = this.performanceHistory.filter(p => p.timestamp >= cutoff);

    logger.debug({
      name: this.name,
      error: error.message,
      failureType,
      currentFailures: this.failures,
      state: this.state
    }, 'Circuit breaker failure recorded');

    // State transitions
    if (this.state === CircuitState.CLOSED) {
      if (this.shouldOpenCircuit()) {
        this.transitionToOpen(`Failure threshold reached: ${this.failures} failures`);
      }
    } else if (this.state === CircuitState.HALF_OPEN) {
      this.transitionToOpen('Failure in half-open state');
    }

    this.updateAdaptiveThreshold();

    if (this.options.enableMetrics) {
      this.metrics.setGauge(`circuit_breaker_${this.name}_failures`, this.failures);
      this.metrics.setGauge(`circuit_breaker_${this.name}_successes`, this.successes);
    }
  }

  private shouldOpenCircuit(): boolean {
    const failureRate = this.calculateFailureRate();
    const minCallsReached = this.totalCalls >= this.options.minimumCalls;

    return (
      minCallsReached && (
        this.failures >= this.adaptiveFailureThreshold ||
        failureRate >= this.options.failureRateThreshold
      )
    );
  }

  private transitionToOpen(reason: string): void {
    this.state = CircuitState.OPEN;
    this.lastStateChange = Date.now();
    this.nextAttemptTime = Date.now() + this.options.resetTimeout;
    this.circuitOpens++;

    logger.warn({
      name: this.name,
      reason,
      failures: this.failures,
      totalCalls: this.totalCalls,
      failureRate: this.calculateFailureRate(),
      nextAttemptTime: new Date(this.nextAttemptTime).toISOString()
    }, 'Circuit breaker opened');

    if (this.options.enableMetrics) {
      this.metrics.incrementCounter('circuit_breaker_opens_total', 1, { circuit_breaker: this.name });
      this.metrics.setGauge(`circuit_breaker_${this.name}_state`, 1); // 1 = OPEN
    }
  }

  private transitionToHalfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.lastStateChange = Date.now();
    this.successes = 0;
    this.halfOpenCalls = 0;

    logger.info({
      name: this.name,
      attemptsAllowed: this.options.halfOpenMaxCalls
    }, 'Circuit breaker transitioned to half-open');

    if (this.options.enableMetrics) {
      this.metrics.setGauge(`circuit_breaker_${this.name}_state`, 2); // 2 = HALF_OPEN
    }
  }

  private transitionToClosed(reason: string): void {
    this.state = CircuitState.CLOSED;
    this.lastStateChange = Date.now();
    this.failures = 0;
    this.successes = 0;
    this.halfOpenCalls = 0;
    this.circuitCloses++;

    logger.info({
      name: this.name,
      reason
    }, 'Circuit breaker closed');

    if (this.options.enableMetrics) {
      this.metrics.incrementCounter('circuit_breaker_closes_total', 1, { circuit_breaker: this.name });
      this.metrics.setGauge(`circuit_breaker_${this.name}_state`, 0); // 0 = CLOSED
    }
  }

  private calculateFailureRate(): number {
    if (this.totalCalls === 0) return 0;
    return this.failures / this.totalCalls;
  }

  private calculateAverageCallDuration(): number {
    if (this.performanceHistory.length === 0) return 0;

    const totalDuration = this.performanceHistory.reduce((sum, p) => sum + p.duration, 0);
    return totalDuration / this.performanceHistory.length;
  }

  private classifyError(error: Error): FailureType {
    if (error.message.includes('timeout')) {
      return FailureType.TIMEOUT;
    }

    if (error.message.includes('ECONNREFUSED') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('ECONNRESET')) {
      return FailureType.CONNECTION_ERROR;
    }

    if (error.message.includes('HTTP') && error.message.includes('429')) {
      return FailureType.RATE_LIMIT;
    }

    if (error.message.includes('HTTP') || error.message.includes('status')) {
      return FailureType.HTTP_ERROR;
    }

    return FailureType.UNKNOWN;
  }

  private updateAdaptiveThreshold(): void {
    if (!this.options.adaptiveThreshold) return;

    // Calculate recent failure rate
    const recentHistory = this.performanceHistory.slice(-50); // Last 50 calls
    if (recentHistory.length < this.options.minimumCalls) return;

    const recentFailureRate = recentHistory.filter(p => !p.success).length / recentHistory.length;

    // Adjust threshold based on recent performance
    if (recentFailureRate > this.options.failureRateThreshold) {
      // Performance is degrading, lower threshold
      this.adaptiveFailureThreshold = Math.max(
        1,
        Math.floor(this.adaptiveFailureThreshold * 0.9)
      );
    } else if (recentFailureRate < this.options.failureRateThreshold * 0.5) {
      // Performance is improving, raise threshold
      this.adaptiveFailureThreshold = Math.min(
        this.options.failureThreshold * 2,
        Math.ceil(this.adaptiveFailureThreshold * 1.1)
      );
    }

    logger.debug({
      name: this.name,
      recentFailureRate,
      newThreshold: this.adaptiveFailureThreshold,
      originalThreshold: this.options.failureThreshold
    }, 'Adaptive threshold updated');
  }

  private initializeMetrics(): void {
    // State gauge (0=CLOSED, 1=OPEN, 2=HALF_OPEN)
    this.metrics.setGauge(`circuit_breaker_${this.name}_state`, 0);

    // Counters
    this.metrics.setGauge(`circuit_breaker_${this.name}_failures`, 0);
    this.metrics.setGauge(`circuit_breaker_${this.name}_successes`, 0);
    this.metrics.setGauge(`circuit_breaker_${this.name}_adaptive_threshold`, this.adaptiveFailureThreshold);

    logger.debug({ name: this.name }, 'Circuit breaker metrics initialized');
  }
}

/**
 * Circuit Breaker Manager for multiple breakers
 */
export class CircuitBreakerManager {
  private breakers: Map<string, AdvancedCircuitBreaker> = new Map();

  constructor(private metrics: MetricsCollector) {}

  /**
   * Create or get a circuit breaker
   */
  public getBreaker(name: string, options?: CircuitBreakerOptions): AdvancedCircuitBreaker {
    let breaker = this.breakers.get(name);

    if (!breaker) {
      breaker = new AdvancedCircuitBreaker(name, this.metrics, options);
      this.breakers.set(name, breaker);
    }

    return breaker;
  }

  /**
   * Get all circuit breaker statistics
   */
  public getAllStats(): CircuitBreakerMetrics {
    const stats: CircuitBreakerMetrics = {};

    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }

    return stats;
  }

  /**
   * Get all breaker names
   */
  public getBreakerNames(): string[] {
    return Array.from(this.breakers.keys());
  }

  /**
   * Force all breakers to open
   */
  public forceAllOpen(reason?: string): void {
    for (const breaker of this.breakers.values()) {
      breaker.forceOpen(reason);
    }
  }

  /**
   * Force all breakers to close
   */
  public forceAllClose(reason?: string): void {
    for (const breaker of this.breakers.values()) {
      breaker.forceClose(reason);
    }
  }

  /**
   * Reset all breakers
   */
  public resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Shutdown all breakers
   */
  public shutdown(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
    this.breakers.clear();
  }
}