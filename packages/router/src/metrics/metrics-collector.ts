/**
 * Metrics Collection System for Router
 * Real-time performance monitoring and analytics
 * Task: SF-OBSERVABILITY-2025-T3.1
 * Date: 2025-11-14
 */

import { logger } from '../logger.js';

export interface MetricValue {
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface CounterMetric extends MetricValue {
  type: 'counter';
}

export interface GaugeMetric extends MetricValue {
  type: 'gauge';
}

export interface HistogramMetric {
  type: 'histogram';
  buckets: number[];
  counts: number[];
  sum: number;
  count: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface TimerMetric {
  type: 'timer';
  duration: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface MetricsSnapshot {
  counters: Map<string, CounterMetric>;
  gauges: Map<string, GaugeMetric>;
  histograms: Map<string, HistogramMetric>;
  timers: Map<string, TimerMetric[]>;
  timestamp: number;
}

export interface MetricsOptions {
  retentionPeriod?: number; // How long to keep metrics (ms)
  cleanupInterval?: number; // Cleanup interval (ms)
  maxHistogramBuckets?: number;
  enablePrometheusFormat?: boolean;
}

/**
 * Comprehensive Metrics Collection System
 */
export class MetricsCollector {
  private counters = new Map<string, CounterMetric>();
  private gauges = new Map<string, GaugeMetric>();
  private histograms = new Map<string, HistogramMetric>();
  private timers = new Map<string, TimerMetric[]>();
  private metricsHistory: Array<{ timestamp: number; snapshot: MetricsSnapshot }> = [];

  private cleanupTimer: NodeJS.Timeout | null = null;
  private retentionPeriod: number;
  private cleanupInterval: number;
  private maxHistogramBuckets: number;
  private enablePrometheusFormat: boolean;

  constructor(options: MetricsOptions = {}) {
    this.retentionPeriod = options.retentionPeriod || 3600000; // 1 hour default
    this.cleanupInterval = options.cleanupInterval || 60000; // 1 minute default
    this.maxHistogramBuckets = options.maxHistogramBuckets || 100;
    this.enablePrometheusFormat = options.enablePrometheusFormat || true;

    // Start cleanup timer
    this.startCleanup();

    // Initialize default metrics
    this.initializeDefaultMetrics();

    logger.info({
      retentionPeriod: this.retentionPeriod,
      cleanupInterval: this.cleanupInterval
    }, 'Metrics collector initialized');
  }

  /**
   * Increment a counter metric
   */
  public incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    const existing = this.counters.get(key);

    if (existing) {
      existing.value += value;
      existing.timestamp = Date.now();
    } else {
      this.counters.set(key, {
        type: 'counter',
        value,
        timestamp: Date.now(),
        labels
      });
    }

    logger.trace({ metric: name, value, labels }, 'Counter incremented');
  }

  /**
   * Set a gauge metric value
   */
  public setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);

    this.gauges.set(key, {
      type: 'gauge',
      value,
      timestamp: Date.now(),
      labels
    });

    logger.trace({ metric: name, value, labels }, 'Gauge set');
  }

  /**
   * Record a value in a histogram
   */
  public recordHistogram(name: string, value: number, buckets?: number[], labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    const existing = this.histograms.get(key);

    const defaultBuckets = buckets || [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60, 120, 300];
    const bucketIndex = this.findBucketIndex(value, defaultBuckets);

    if (existing) {
      // Update existing histogram
      for (let i = bucketIndex; i < existing.buckets.length; i++) {
        existing.counts[i]++;
      }
      existing.sum += value;
      existing.count++;
      existing.timestamp = Date.now();
    } else {
      // Create new histogram
      const counts = new Array(defaultBuckets.length).fill(0);
      for (let i = bucketIndex; i < counts.length; i++) {
        counts[i]++;
      }

      this.histograms.set(key, {
        type: 'histogram',
        buckets: defaultBuckets,
        counts,
        sum: value,
        count: 1,
        timestamp: Date.now(),
        labels
      });
    }

    logger.trace({ metric: name, value, bucketIndex }, 'Histogram recorded');
  }

  /**
   * Record a timer metric
   */
  public recordTimer(name: string, duration: number, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    const timers = this.timers.get(key) || [];

    timers.push({
      type: 'timer',
      duration,
      timestamp: Date.now(),
      labels
    });

    // Keep only recent timers (last 1000)
    if (timers.length > 1000) {
      timers.splice(0, timers.length - 1000);
    }

    this.timers.set(key, timers);

    logger.trace({ metric: name, duration }, 'Timer recorded');
  }

  /**
   * Start a timer and return a function to stop it
   */
  public startTimer(name: string, labels?: Record<string, string>): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.recordTimer(name, duration, labels);
      return duration;
    };
  }

  /**
   * Get current metrics snapshot
   */
  public getSnapshot(): MetricsSnapshot {
    return {
      counters: new Map(this.counters),
      gauges: new Map(this.gauges),
      histograms: new Map(this.histograms),
      timers: new Map(this.timers),
      timestamp: Date.now()
    };
  }

  /**
   * Get metrics in Prometheus format
   */
  public getPrometheusMetrics(): string {
    if (!this.enablePrometheusFormat) {
      return '';
    }

    let output = '';

    // Export counters
    for (const [key, metric] of this.counters) {
      const labels = this.formatPrometheusLabels(metric.labels);
      output += `# TYPE ${this.extractMetricName(key)} counter\n`;
      output += `${this.extractMetricName(key)}${labels} ${metric.value}\n`;
    }

    // Export gauges
    for (const [key, metric] of this.gauges) {
      const labels = this.formatPrometheusLabels(metric.labels);
      output += `# TYPE ${this.extractMetricName(key)} gauge\n`;
      output += `${this.extractMetricName(key)}${labels} ${metric.value}\n`;
    }

    // Export histograms
    for (const [key, metric] of this.histograms) {
      const labels = this.formatPrometheusLabels(metric.labels);
      const metricName = this.extractMetricName(key);

      output += `# TYPE ${metricName} histogram\n`;

      // Bucket counts
      for (let i = 0; i < metric.buckets.length; i++) {
        const bucketLabels = { ...(metric.labels || {}), le: metric.buckets[i].toString() };
        output += `${metricName}_bucket${this.formatPrometheusLabels(bucketLabels)} ${metric.counts[i]}\n`;
      }

      // +Inf bucket
      const infLabels = { ...(metric.labels || {}), le: '+Inf' };
      output += `${metricName}_bucket${this.formatPrometheusLabels(infLabels)} ${metric.count}\n`;

      // Sum and count
      output += `${metricName}_sum${labels} ${metric.sum}\n`;
      output += `${metricName}_count${labels} ${metric.count}\n`;
    }

    return output;
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): PerformanceSummary {
    const snapshot = this.getSnapshot();
    const requestCount = this.getCounterValue('router_requests_total');
    const errorCount = this.getCounterValue('router_errors_total');
    const averageResponseTime = this.getAverageTimer('router_request_duration');
    const activeConnections = this.getGaugeValue('router_active_connections');

    return {
      totalRequests: requestCount,
      totalErrors: errorCount,
      errorRate: requestCount > 0 ? (errorCount / requestCount) * 100 : 0,
      averageResponseTime: averageResponseTime || 0,
      activeConnections: activeConnections || 0,
      requestsPerSecond: this.calculateRequestsPerSecond(),
      uptime: Date.now() - (this.metricsHistory[0]?.timestamp || Date.now()),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      timestamp: Date.now()
    };
  }

  /**
   * Reset all metrics
   */
  public reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.timers.clear();
    this.metricsHistory = [];

    // Reinitialize default metrics
    this.initializeDefaultMetrics();

    logger.info('All metrics reset');
  }

  /**
   * Get metrics history
   */
  public getHistory(duration?: number): Array<{ timestamp: number; snapshot: MetricsSnapshot }> {
    if (!duration) return this.metricsHistory;

    const cutoff = Date.now() - duration;
    return this.metricsHistory.filter(entry => entry.timestamp >= cutoff);
  }

  /**
   * Shutdown metrics collector
   */
  public shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    logger.info('Metrics collector shutdown');
  }

  // Private methods

  private initializeDefaultMetrics(): void {
    // Router metrics
    this.setGauge('router_active_connections', 0);
    this.setGauge('router_uptime_seconds', 0);
    this.setGauge('router_memory_usage_bytes', 0);

    // Request metrics
    this.incrementCounter('router_requests_total', 0);
    this.incrementCounter('router_errors_total', 0);
    this.incrementCounter('router_activations_total', 0);

    logger.debug('Default metrics initialized');
  }

  private buildKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const labelPairs = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`);

    return `${name}{${labelPairs.join(',')}}`;
  }

  private extractMetricName(key: string): string {
    const match = key.match(/^([^{]+)/);
    return match ? match[1] : key;
  }

  private formatPrometheusLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }

    const pairs = Object.entries(labels).map(([k, v]) => `${k}="${v}"`);
    return `{${pairs.join(',')}}`;
  }

  private findBucketIndex(value: number, buckets: number[]): number {
    for (let i = 0; i < buckets.length; i++) {
      if (value <= buckets[i]) {
        return i;
      }
    }
    return buckets.length - 1;
  }

  private getCounterValue(name: string): number {
    for (const [key, metric] of this.counters) {
      if (key.startsWith(name)) {
        return metric.value;
      }
    }
    return 0;
  }

  private getGaugeValue(name: string): number {
    for (const [key, metric] of this.gauges) {
      if (key.startsWith(name)) {
        return metric.value;
      }
    }
    return 0;
  }

  private getAverageTimer(name: string): number {
    for (const [key, timers] of this.timers) {
      if (key.startsWith(name) && timers.length > 0) {
        const sum = timers.reduce((acc, timer) => acc + timer.duration, 0);
        return sum / timers.length;
      }
    }
    return 0;
  }

  private calculateRequestsPerSecond(): number {
    const recentTimers = Array.from(this.timers.values())
      .flat()
      .filter(timer => Date.now() - timer.timestamp < 60000); // Last minute

    return recentTimers.length / 60; // Per second
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      const cutoff = now - this.retentionPeriod;

      // Clean old timers
      for (const [key, timers] of this.timers) {
        const filtered = timers.filter(timer => timer.timestamp >= cutoff);
        if (filtered.length === 0) {
          this.timers.delete(key);
        } else if (filtered.length < timers.length) {
          this.timers.set(key, filtered);
        }
      }

      // Clean old history
      this.metricsHistory = this.metricsHistory.filter(
        entry => entry.timestamp >= cutoff
      );

    }, this.cleanupInterval);

    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }
}

export interface PerformanceSummary {
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  averageResponseTime: number;
  activeConnections: number;
  requestsPerSecond: number;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  timestamp: number;
}