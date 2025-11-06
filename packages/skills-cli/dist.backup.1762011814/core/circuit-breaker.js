export var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (CircuitState = {}));
export class CircuitBreaker {
    state = CircuitState.CLOSED;
    failureCount = 0;
    successCount = 0;
    lastFailureTime;
    lastSuccessTime;
    totalCalls = 0;
    config;
    constructor(config) {
        this.config = {
            halfOpenMaxCalls: 3,
            monitoringPeriod: 30000,
            ...config
        };
    }
    async execute(operation) {
        this.totalCalls++;
        this.checkReset();
        if (this.state === CircuitState.OPEN) {
            throw new Error('Circuit breaker is OPEN - service unavailable');
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (err) {
            this.onFailure();
            throw err;
        }
    }
    onSuccess() {
        this.successCount++;
        this.lastSuccessTime = new Date();
        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.CLOSED;
            this.failureCount = 0;
        }
        else if (this.state === CircuitState.CLOSED) {
            this.failureCount = 0;
        }
    }
    onFailure() {
        this.failureCount++;
        this.lastFailureTime = new Date();
        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.OPEN;
        }
        else if (this.state === CircuitState.CLOSED) {
            if (this.failureCount >= this.config.failureThreshold) {
                this.state = CircuitState.OPEN;
            }
        }
    }
    checkReset() {
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
    getState() {
        this.checkReset();
        return this.state;
    }
    getMetrics() {
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
    isHealthy() {
        return this.getState() === CircuitState.CLOSED;
    }
    reset() {
        this.failureCount = 0;
        this.successCount = 0;
        this.state = CircuitState.CLOSED;
    }
}
export class CircuitBreakerManager {
    defaultConfig;
    breakers = new Map();
    constructor(defaultConfig) {
        this.defaultConfig = defaultConfig;
    }
    getBreaker(serviceName, config) {
        if (!this.breakers.has(serviceName)) {
            this.breakers.set(serviceName, new CircuitBreaker(config || this.defaultConfig));
        }
        return this.breakers.get(serviceName);
    }
    getMetrics() {
        const metrics = {};
        this.breakers.forEach((breaker, serviceName) => {
            metrics[serviceName] = breaker.getMetrics();
        });
        return metrics;
    }
    resetAll() {
        this.breakers.forEach(breaker => breaker.reset());
    }
    getHealthStatus() {
        const status = {};
        this.breakers.forEach((breaker, serviceName) => {
            status[serviceName] = breaker.isHealthy();
        });
        return status;
    }
}
//# sourceMappingURL=circuit-breaker.js.map