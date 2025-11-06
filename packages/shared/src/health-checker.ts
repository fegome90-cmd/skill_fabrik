/**
 * Health Checker Utility
 *
 * Provides utilities for checking service health with retries and timeouts
 */

export interface HealthCheckOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  interval?: number;
}

export interface HealthCheckResult {
  healthy: boolean;
  responseTime: number;
  status?: number;
  error?: string;
  data?: any;
}

export class HealthChecker {
  constructor(private defaultOptions: HealthCheckOptions = {}) {}

  /**
   * Perform health check with retry logic
   */
  async checkHealth(
    url: string,
    options: HealthCheckOptions = {}
  ): Promise<HealthCheckResult> {
    const opts = { ...this.defaultOptions, ...options };
    const { timeout = 5000, retries = 3, retryDelay = 1000 } = opts;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.performHealthCheck(url, timeout);

        if (result.healthy) {
          return result;
        }

        lastError = new Error(`Service returned ${result.status || 'unknown'} status`);
      } catch (error) {
        lastError = error as Error;
      }

      if (attempt < retries) {
        await this.sleep(retryDelay);
      }
    }

    return {
      healthy: false,
      responseTime: 0,
      error: lastError?.message || 'Health check failed'
    };
  }

  /**
   * Perform single health check
   */
  private async performHealthCheck(url: string, timeout: number): Promise<HealthCheckResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Skills-Fabrik-Health-Checker/1.0.0'
        }
      });

      const responseTime = Date.now() - startTime;
      clearTimeout(timeoutId);

      let data: any = null;
      if (response.ok) {
        try {
          data = await response.json();
        } catch {
          // If JSON parsing fails, just return text
          data = await response.text();
        }
      }

      return {
        healthy: response.ok,
        responseTime,
        status: response.status,
        data
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Check if service is healthy (boolean result)
   */
  async isHealthy(url: string, options?: HealthCheckOptions): Promise<boolean> {
    const result = await this.checkHealth(url, options);
    return result.healthy;
  }

  /**
   * Check multiple services in parallel
   */
  async checkMultipleHealth(
    urls: string[],
    options?: HealthCheckOptions
  ): Promise<Map<string, HealthCheckResult>> {
    const results = new Map<string, HealthCheckResult>();

    const promises = urls.map(async (url) => {
      const result = await this.checkHealth(url, options);
      results.set(url, result);
      return { url, result };
    });

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * Continuous health monitoring
   */
  startMonitoring(
    url: string,
    onResult: (result: HealthCheckResult) => void,
    options: HealthCheckOptions = {}
  ): () => void {
    const { interval = 5000 } = options;

    const intervalId = setInterval(async () => {
      const result = await this.checkHealth(url, options);
      onResult(result);
    }, interval);

    return () => {
      clearInterval(intervalId);
    };
  }

  /**
   * Wait for service to become healthy
   */
  async waitForHealthy(
    url: string,
    options: HealthCheckOptions & { maxWaitTime?: number } = {}
  ): Promise<void> {
    const { maxWaitTime = 30000 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const isHealthy = await this.isHealthy(url, options);
      if (isHealthy) {
        return;
      }
      await this.sleep(1000);
    }

    throw new Error(`Service at ${url} did not become healthy within ${maxWaitTime}ms`);
  }

  /**
   * Parse health data from response
   */
  static parseHealthData(data: any): {
    status: string;
    healthy: boolean;
    degraded?: boolean;
    services?: Record<string, any>;
    metrics?: any;
  } {
    // Handle different response formats
    if (typeof data === 'object' && data !== null) {
      return {
        status: data.status || 'unknown',
        healthy: data.status === 'healthy' || data.status === 'ok',
        degraded: data.status === 'degraded' || data.status === 'warning',
        services: data.services || {},
        metrics: data.metrics || {}
      };
    }

    return {
      status: 'unknown',
      healthy: false
    };
  }

  /**
   * Utility function for sleeping
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}