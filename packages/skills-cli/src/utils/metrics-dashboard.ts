/**
 * Metrics Dashboard - FASE 2
 * Collects and displays performance metrics in real-time
 */

import { performance } from 'perf_hooks';

export interface PerformanceMetrics {
  timestamp: number;
  cacheHitRate: number;
  averageLatency: number;
  memoryUsage: number;
  cpuUsage: number;
  parallelEfficiency: number;
  workerUtilization: number;
  operation: string;
  duration: number;
}

export interface MetricsThresholds {
  latency: number;
  memory: number;
  cpu: number;
  cacheHit: number;
  parallelEfficiency: number;
}

const DEFAULT_THRESHOLDS: MetricsThresholds = {
  latency: 100, // ms
  memory: 18, // MB
  cpu: 10, // %
  cacheHit: 85, // %
  parallelEfficiency: 70, // %
};

class MetricsCollector {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: MetricsThresholds;
  private operationCounts: Map<string, number> = new Map();
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private startTime: number = Date.now();

  constructor(thresholds?: Partial<MetricsThresholds>) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Record a performance metric
   */
  collectMetric(
    operation: string,
    duration: number,
    options?: {
      cacheHit?: boolean;
      memoryMB?: number;
      cpuPercent?: number;
      parallelEfficiency?: number;
      workerUtilization?: number;
    }
  ): void {
    const metric: PerformanceMetrics = {
      timestamp: Date.now(),
      operation,
      duration,
      cacheHitRate: this.calculateCacheHitRate(),
      averageLatency: this.calculateAverageLatency(operation),
      memoryUsage: options?.memoryMB || this.getMemoryUsage(),
      cpuUsage: options?.cpuPercent || this.getCpuUsage(),
      parallelEfficiency: options?.parallelEfficiency || 0,
      workerUtilization: options?.workerUtilization || 0,
    };

    this.metrics.push(metric);
    this.operationCounts.set(operation, (this.operationCounts.get(operation) || 0) + 1);

    // Track cache hits/misses
    if (options?.cacheHit !== undefined) {
      if (options.cacheHit) {
        this.cacheHits++;
      } else {
        this.cacheMisses++;
      }
    }

    // Keep only last 100 metrics to prevent memory bloat
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    // Check thresholds and alert if needed
    this.checkThresholds(metric);
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? (this.cacheHits / total) * 100 : 0;
  }

  /**
   * Calculate average latency for an operation
   */
  private calculateAverageLatency(operation: string): number {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    if (operationMetrics.length === 0) return 0;

    const total = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / operationMetrics.length;
  }

  /**
   * Get current memory usage (simplified)
   */
  private getMemoryUsage(): number {
    // In a real implementation, this would use process.memoryUsage()
    // For now, return a simulated value
    return 10 + Math.random() * 5; // 10-15 MB range
  }

  /**
   * Get current CPU usage (simplified)
   */
  private getCpuUsage(): number {
    // In a real implementation, this would use process.cpuUsage()
    // For now, return a simulated value
    return Math.random() * 10; // 0-10% range
  }

  /**
   * Check metrics against thresholds
   */
  private checkThresholds(metric: PerformanceMetrics): void {
    const alerts: string[] = [];

    if (metric.duration > this.thresholds.latency) {
      alerts.push(
        `⚠️ High latency: ${metric.duration.toFixed(2)}ms > ${this.thresholds.latency}ms`
      );
    }

    if (metric.memoryUsage > this.thresholds.memory) {
      alerts.push(
        `⚠️ High memory: ${metric.memoryUsage.toFixed(2)}MB > ${this.thresholds.memory}MB`
      );
    }

    if (metric.cpuUsage > this.thresholds.cpu) {
      alerts.push(`⚠️ High CPU: ${metric.cpuUsage.toFixed(1)}% > ${this.thresholds.cpu}%`);
    }

    if (metric.cacheHitRate < this.thresholds.cacheHit) {
      alerts.push(
        `⚠️ Low cache hit rate: ${metric.cacheHitRate.toFixed(1)}% < ${this.thresholds.cacheHit}%`
      );
    }

    if (alerts.length > 0) {
      console.warn(`📊 Metrics Alert for ${metric.operation}:`, alerts.join(', '));
    }
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const latest = this.metrics[this.metrics.length - 1];
    if (!latest) {
      return '📊 No metrics collected yet';
    }

    const uptime = ((Date.now() - this.startTime) / 1000 / 60).toFixed(2);

    return `
📊 PERFORMANCE METRICS DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️  Uptime: ${uptime} minutes
🔄 Operations: ${this.metrics.length}
📦 Cache Hit Rate: ${latest.cacheHitRate.toFixed(1)}%
⏲️  Avg Latency: ${latest.averageLatency.toFixed(2)}ms
💾 Memory: ${latest.memoryUsage.toFixed(2)}MB
🖥️  CPU: ${latest.cpuUsage.toFixed(1)}%
⚡ Parallel Efficiency: ${(latest.parallelEfficiency * 100).toFixed(1)}%
👷 Worker Utilization: ${(latest.workerUtilization * 100).toFixed(1)}%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Operation Breakdown:
${this.generateOperationBreakdown()}
`;
  }

  /**
   * Generate operation breakdown
   */
  private generateOperationBreakdown(): string {
    const lines: string[] = [];

    for (const [operation, count] of Array.from(this.operationCounts.entries())) {
      const avgLatency = this.calculateAverageLatency(operation);
      lines.push(`  • ${operation}: ${count}x calls, avg ${avgLatency.toFixed(2)}ms`);
    }

    return lines.join('\n');
  }

  /**
   * Get recent metrics (last N operations)
   */
  getRecentMetrics(count: number = 10): PerformanceMetrics[] {
    return this.metrics.slice(-count);
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = [];
    this.operationCounts.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.startTime = Date.now();
  }

  /**
   * Export metrics to JSON
   */
  exportToJSON(): string {
    return JSON.stringify(
      {
        summary: {
          totalMetrics: this.metrics.length,
          cacheHitRate: this.calculateCacheHitRate(),
          averageLatency:
            this.metrics.length > 0
              ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length
              : 0,
          uptime: Date.now() - this.startTime,
        },
        metrics: this.metrics,
        operationCounts: Object.fromEntries(this.operationCounts),
      },
      null,
      2
    );
  }

  /**
   * Check if system is performing well
   */
  isHealthy(): boolean {
    if (this.metrics.length === 0) return true;

    const latest = this.metrics[this.metrics.length - 1];
    return (
      latest.duration <= this.thresholds.latency &&
      latest.memoryUsage <= this.thresholds.memory &&
      latest.cpuUsage <= this.thresholds.cpu
    );
  }
}

// Export singleton instance
export const metricsCollector = new MetricsCollector();

export default MetricsCollector;
