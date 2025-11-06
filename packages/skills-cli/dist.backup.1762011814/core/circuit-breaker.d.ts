export declare enum CircuitState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
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
export declare class CircuitBreaker {
    private state;
    private failureCount;
    private successCount;
    private lastFailureTime?;
    private lastSuccessTime?;
    private totalCalls;
    private config;
    constructor(config: CircuitBreakerConfig);
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    private checkReset;
    getState(): CircuitState;
    getMetrics(): CircuitBreakerMetrics;
    isHealthy(): boolean;
    reset(): void;
}
export declare class CircuitBreakerManager {
    private defaultConfig;
    private breakers;
    constructor(defaultConfig: CircuitBreakerConfig);
    getBreaker(serviceName: string, config?: CircuitBreakerConfig): CircuitBreaker;
    getMetrics(): Record<string, CircuitBreakerMetrics>;
    resetAll(): void;
    getHealthStatus(): Record<string, boolean>;
}
//# sourceMappingURL=circuit-breaker.d.ts.map