import { type SignalCache, type CacheMetrics } from '../cache/SignalCache.js';
import { type RedisL2Adapter, type RedisMetrics } from '../integration/RedisL2Adapter.js';

export interface MetricsCollectorConfig {
  enabled: boolean;
  collectionInterval: number; // ms
  retentionPeriod: number; // ms
  aggregationWindow: number; // ms
  exportFormats: ('prometheus' | 'json' | 'csv')[];
  alerts: {
    enabled: boolean;
    thresholds: {
      hitRate: { min: number; max: number };
      latency: { max: number }; // ms
      memoryUsage: { max: number }; // percentage
      errorRate: { max: number }; // percentage
      evictionRate: { max: number }; // percentage
    };
    channels: ('console' | 'log' | 'webhook')[];
  };
  dashboard: {
    enabled: boolean;
    refreshInterval: number; // ms
    port: number;
    path: string;
  };
}

export interface AggregatedMetrics {
  timestamp: number;
  window: number; // aggregation window in ms
  cache: {
    hitRate: number;
    avgLatency: number;
    totalOperations: number;
    errorRate: number;
    memoryUsage: number;
    evictions: number;
  };
  redis?: {
    connected: boolean;
    hitRate: number;
    avgLatency: number;
    memoryUsage: number;
    throughput: number;
  };
  system: {
    uptime: number;
    timestamp: number;
  };
}

export interface MetricsAlert {
  id: string;
  type: 'hit_rate' | 'latency' | 'memory' | 'error_rate' | 'eviction_rate';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  currentValue: number;
  threshold: number;
  timestamp: number;
  resolved: boolean;
}

export interface PrometheusMetrics {
  [metricName: string]: {
    type: 'counter' | 'gauge' | 'histogram' | 'summary';
    help: string;
    value: number | { [label: string]: number };
    labels?: Record<string, string>;
  };
}

export class CacheMetricsCollector {
  private readonly config: MetricsCollectorConfig;
  private readonly signalCache: SignalCache;
  private readonly redisAdapter?: RedisL2Adapter;

  private metricsHistory: AggregatedMetrics[] = [];
  private alerts: MetricsAlert[] = [];
  private collectionTimer?: NodeJS.Timeout;
  private aggregationTimer?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    signalCache: SignalCache,
    redisAdapter?: RedisL2Adapter,
    config?: Partial<MetricsCollectorConfig>
  ) {
    this.signalCache = signalCache;
    this.redisAdapter = redisAdapter;
    this.config = this.mergeConfig(config);
  }

  // Collection management
  start(): void {
    if (this.isRunning) {
      console.warn('Metrics collector already running');
      return;
    }

    this.isRunning = true;

    if (this.config.enabled) {
      this.collectionTimer = setInterval(() => {
        this.collectMetrics();
      }, this.config.collectionInterval);

      this.aggregationTimer = setInterval(() => {
        this.aggregateMetrics();
      }, this.config.aggregationWindow);
    }

    if (this.config.dashboard.enabled) {
      this.startDashboard();
    }

    console.log('📊 Cache metrics collector started');
    console.log(`   Collection interval: ${this.config.collectionInterval}ms`);
    console.log(`   Aggregation window: ${this.config.aggregationWindow}ms`);
    console.log(`   Retention period: ${this.config.retentionPeriod}ms`);
  }

  stop(): void {
    this.isRunning = false;

    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = undefined;
    }

    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
      this.aggregationTimer = undefined;
    }

    console.log('📊 Cache metrics collector stopped');
  }

  // Metrics collection
  private async collectMetrics(): Promise<void> {
    try {
      const timestamp = Date.now();

      // Collect L1 cache metrics
      const l1Metrics = this.signalCache.getMetrics();

      // Collect L2 cache metrics if available
      let l2Metrics: RedisMetrics | undefined;
      if (this.redisAdapter) {
        l2Metrics = this.redisAdapter.getMetrics();
      }

      // Store raw metrics for aggregation
      this.storeRawMetrics(timestamp, l1Metrics, l2Metrics);

      // Check for alerts
      if (this.config.alerts.enabled) {
        this.checkAlerts(l1Metrics, l2Metrics);
      }

    } catch (error) {
      console.error('Metrics collection failed:', error);
    }
  }

  private storeRawMetrics(timestamp: number, l1Metrics: CacheMetrics, l2Metrics?: RedisMetrics): void {
    // Store raw metrics for aggregation
    // In a real implementation, this would store to a time-series database
    console.log(`📈 Metrics collected at ${new Date(timestamp).toISOString()}`);
    console.log(`   L1 Hit Rate: ${(l1Metrics.hitRate * 100).toFixed(1)}%`);
    console.log(`   L1 Latency: ${l1Metrics.performance.avgGetTime.toFixed(1)}ms`);

    if (l2Metrics) {
      console.log(`   L2 Hit Rate: ${(l2Metrics.performance.hitRate * 100).toFixed(1)}%`);
      console.log(`   L2 Latency: ${l2Metrics.performance.avgGetTime.toFixed(1)}ms`);
    }
  }

  // Metrics aggregation
  private aggregateMetrics(): void {
    const now = Date.now();
    const windowStart = now - this.config.aggregationWindow;

    // In a real implementation, this would aggregate from stored raw metrics
    // For now, create aggregated metrics from current values
    const l1Metrics = this.signalCache.getMetrics();
    let l2Metrics: RedisMetrics | undefined;
    if (this.redisAdapter) {
      l2Metrics = this.redisAdapter.getMetrics();
    }

    const aggregated: AggregatedMetrics = {
      timestamp: now,
      window: this.config.aggregationWindow,
      cache: {
        hitRate: l1Metrics.hitRate,
        avgLatency: l1Metrics.performance.avgGetTime,
        totalOperations: l1Metrics.operations.get + l1Metrics.operations.set,
        errorRate: this.calculateErrorRate(l1Metrics),
        memoryUsage: this.calculateMemoryUsage(l1Metrics),
        evictions: l1Metrics.evictions.L1 + l1Metrics.evictions.L2
      },
      redis: l2Metrics ? {
        connected: this.redisAdapter.getHealthStatus().connected,
        hitRate: l2Metrics.performance.hitRate,
        avgLatency: l2Metrics.performance.avgGetTime,
        memoryUsage: l2Metrics.memory.cacheSize,
        throughput: l2Metrics.performance.throughput
      } : undefined,
      system: {
        uptime: now, // Would be actual system uptime
        timestamp: now
      }
    };

    this.metricsHistory.push(aggregated);

    // Apply retention policy
    this.applyRetentionPolicy();

    console.log(`📊 Aggregated metrics: hit rate ${(aggregated.cache.hitRate * 100).toFixed(1)}%, latency ${aggregated.cache.avgLatency.toFixed(1)}ms`);
  }

  private calculateErrorRate(metrics: CacheMetrics): number {
    const totalOperations = metrics.operations.get + metrics.operations.set +
                          metrics.operations.delete + metrics.operations.clear;
    const totalErrors = (metrics.hits.L1 + metrics.hits.L2) * 0; // No error tracking in current implementation
    return totalOperations > 0 ? totalErrors / totalOperations : 0;
  }

  private calculateMemoryUsage(metrics: CacheMetrics): number {
    // Calculate memory usage percentage
    const totalMemory = metrics.size.L1.bytes + (metrics.size.L2.bytes || 0);
    const maxMemory = 100 * 1024 * 1024; // 100MB assumption
    return (totalMemory / maxMemory) * 100;
  }

  private applyRetentionPolicy(): void {
    const cutoff = Date.now() - this.config.retentionPeriod;
    this.metricsHistory = this.metricsHistory.filter(m => m.timestamp >= cutoff);
  }

  // Alerting
  private checkAlerts(l1Metrics: CacheMetrics, l2Metrics?: RedisMetrics): void {
    const alerts: MetricsAlert[] = [];

    // Hit rate alert
    if (l1Metrics.hitRate < this.config.alerts.thresholds.hitRate.min) {
      alerts.push({
        id: `hit_rate_${Date.now()}`,
        type: 'hit_rate',
        severity: l1Metrics.hitRate < this.config.alerts.thresholds.hitRate.min * 0.5 ? 'critical' : 'warning',
        message: `Cache hit rate is ${(l1Metrics.hitRate * 100).toFixed(1)}% (threshold: ${(this.config.alerts.thresholds.hitRate.min * 100).toFixed(1)}%)`,
        currentValue: l1Metrics.hitRate,
        threshold: this.config.alerts.thresholds.hitRate.min,
        timestamp: Date.now(),
        resolved: false
      });
    }

    // Latency alert
    if (l1Metrics.performance.avgGetTime > this.config.alerts.thresholds.latency.max) {
      alerts.push({
        id: `latency_${Date.now()}`,
        type: 'latency',
        severity: l1Metrics.performance.avgGetTime > this.config.alerts.thresholds.latency.max * 2 ? 'critical' : 'warning',
        message: `Cache latency is ${l1Metrics.performance.avgGetTime.toFixed(1)}ms (threshold: ${this.config.alerts.thresholds.latency.max}ms)`,
        currentValue: l1Metrics.performance.avgGetTime,
        threshold: this.config.alerts.thresholds.latency.max,
        timestamp: Date.now(),
        resolved: false
      });
    }

    // Memory usage alert
    const memoryUsage = this.calculateMemoryUsage(l1Metrics);
    if (memoryUsage > this.config.alerts.thresholds.memoryUsage.max) {
      alerts.push({
        id: `memory_${Date.now()}`,
        type: 'memory',
        severity: memoryUsage > this.config.alerts.thresholds.memoryUsage.max * 1.2 ? 'critical' : 'warning',
        message: `Memory usage is ${memoryUsage.toFixed(1)}% (threshold: ${this.config.alerts.thresholds.memoryUsage.max}%)`,
        currentValue: memoryUsage,
        threshold: this.config.alerts.thresholds.memoryUsage.max,
        timestamp: Date.now(),
        resolved: false
      });
    }

    // L2 specific alerts
    if (l2Metrics && !this.redisAdapter?.isConnected()) {
      alerts.push({
        id: `redis_connection_${Date.now()}`,
        type: 'latency', // Using existing type
        severity: 'critical',
        message: 'Redis L2 cache is disconnected',
        currentValue: 0,
        threshold: 1,
        timestamp: Date.now(),
        resolved: false
      });
    }

    // Process new alerts
    for (const alert of alerts) {
      this.processAlert(alert);
    }

    // Check for resolved alerts
    this.checkResolvedAlerts(l1Metrics, l2Metrics);
  }

  private processAlert(alert: MetricsAlert): void {
    // Check if alert already exists
    const existingAlert = this.alerts.find(a => a.type === alert.type && !a.resolved);
    if (existingAlert) {
      // Update existing alert
      existingAlert.currentValue = alert.currentValue;
      existingAlert.timestamp = alert.timestamp;
      return;
    }

    // Add new alert
    this.alerts.push(alert);
    this.sendAlert(alert);
  }

  private sendAlert(alert: MetricsAlert): void {
    const message = `[${alert.severity.toUpperCase()}] ${alert.message}`;

    for (const channel of this.config.alerts.channels) {
      switch (channel) {
        case 'console':
          console.log(`🚨 ${message}`);
          break;
        case 'log':
          // Would log to file or logging service
          console.log(`[ALERT] ${message}`);
          break;
        case 'webhook':
          // Would send to webhook endpoint
          console.log(`[WEBHOOK] ${message}`);
          break;
      }
    }
  }

  private checkResolvedAlerts(l1Metrics: CacheMetrics, l2Metrics?: RedisMetrics): void {
    for (const alert of this.alerts) {
      if (alert.resolved) continue;

      let resolved = false;

      switch (alert.type) {
        case 'hit_rate':
          resolved = l1Metrics.hitRate >= this.config.alerts.thresholds.hitRate.min;
          break;
        case 'latency':
          resolved = l1Metrics.performance.avgGetTime <= this.config.alerts.thresholds.latency.max;
          break;
        case 'memory':
          resolved = this.calculateMemoryUsage(l1Metrics) <= this.config.alerts.thresholds.memoryUsage.max;
          break;
      }

      if (resolved) {
        alert.resolved = true;
        console.log(`✅ Alert resolved: ${alert.message}`);
      }
    }

    // Clean up resolved old alerts
    const cutoff = Date.now() - (60 * 60 * 1000); // 1 hour
    this.alerts = this.alerts.filter(a => !a.resolved || a.timestamp > cutoff);
  }

  // Dashboard
  private startDashboard(): void {
    console.log(`🌐 Cache metrics dashboard would be available at http://localhost:${this.config.dashboard.port}${this.config.dashboard.path}`);
    // In a real implementation, this would start an HTTP server
  }

  // Export functions
  exportPrometheusMetrics(): PrometheusMetrics {
    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    if (!latest) {
      return {};
    }

    const metrics: PrometheusMetrics = {
      cache_hit_rate: {
        type: 'gauge',
        help: 'Cache hit rate (0-1)',
        value: latest.cache.hitRate
      },
      cache_avg_latency: {
        type: 'gauge',
        help: 'Average cache latency in milliseconds',
        value: latest.cache.avgLatency
      },
      cache_total_operations: {
        type: 'counter',
        help: 'Total cache operations',
        value: latest.cache.totalOperations
      },
      cache_memory_usage: {
        type: 'gauge',
        help: 'Cache memory usage percentage',
        value: latest.cache.memoryUsage
      }
    };

    if (latest.redis) {
      metrics.redis_connected = {
        type: 'gauge',
        help: 'Redis L2 cache connection status (1=connected, 0=disconnected)',
        value: latest.redis.connected ? 1 : 0
      };
      metrics.redis_hit_rate = {
        type: 'gauge',
        help: 'Redis L2 cache hit rate (0-1)',
        value: latest.redis.hitRate
      };
      metrics.redis_throughput = {
        type: 'gauge',
        help: 'Redis L2 cache throughput (operations/sec)',
        value: latest.redis.throughput
      };
    }

    return metrics;
  }

  exportJSON(): string {
    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    return JSON.stringify({
      timestamp: Date.now(),
      metrics: latest,
      alerts: this.alerts.filter(a => !a.resolved),
      config: {
        collectionInterval: this.config.collectionInterval,
        aggregationWindow: this.config.aggregationWindow
      }
    }, null, 2);
  }

  exportCSV(): string {
    if (this.metricsHistory.length === 0) {
      return '';
    }

    const headers = ['timestamp', 'hit_rate', 'avg_latency', 'total_operations', 'memory_usage', 'evictions'];
    const rows = this.metricsHistory.map(m => [
      m.timestamp,
      m.cache.hitRate,
      m.cache.avgLatency,
      m.cache.totalOperations,
      m.cache.memoryUsage,
      m.cache.evictions
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  // Public API
  getMetricsHistory(minutes?: number): AggregatedMetrics[] {
    if (!minutes) {
      return [...this.metricsHistory];
    }

    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.metricsHistory.filter(m => m.timestamp >= cutoff);
  }

  getCurrentMetrics(): AggregatedMetrics | null {
    return this.metricsHistory.length > 0 ? this.metricsHistory[this.metricsHistory.length - 1] : null;
  }

  getActiveAlerts(): MetricsAlert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  getMetricsStats(): {
    totalDataPoints: number;
    dataPointsPerHour: number;
    oldestDataPoint: number | null;
    newestDataPoint: number | null;
    activeAlerts: number;
    collectionUptime: number;
  } {
    const now = Date.now();
    const totalPoints = this.metricsHistory.length;
    const hoursSinceStart = this.isRunning ? (now - (this.metricsHistory[0]?.timestamp || now)) / (1000 * 60 * 60) : 0;

    return {
      totalDataPoints: totalPoints,
      dataPointsPerHour: hoursSinceStart > 0 ? totalPoints / hoursSinceStart : 0,
      oldestDataPoint: this.metricsHistory.length > 0 ? this.metricsHistory[0].timestamp : null,
      newestDataPoint: this.metricsHistory.length > 0 ? this.metricsHistory[this.metricsHistory.length - 1].timestamp : null,
      activeAlerts: this.alerts.filter(a => !a.resolved).length,
      collectionUptime: this.isRunning ? now - (this.metricsHistory[0]?.timestamp || now) : 0
    };
  }

  isRunning(): boolean {
    return this.isRunning;
  }

  // Utility methods
  private mergeConfig(userConfig?: Partial<MetricsCollectorConfig>): MetricsCollectorConfig {
    const defaultConfig: MetricsCollectorConfig = {
      enabled: true,
      collectionInterval: 30000, // 30 seconds
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      aggregationWindow: 5 * 60 * 1000, // 5 minutes
      exportFormats: ['json', 'prometheus'],
      alerts: {
        enabled: true,
        thresholds: {
          hitRate: { min: 0.7, max: 1.0 },
          latency: { max: 50 }, // 50ms
          memoryUsage: { max: 80 }, // 80%
          errorRate: { max: 0.05 }, // 5%
          evictionRate: { max: 0.1 } // 10%
        },
        channels: ['console']
      },
      dashboard: {
        enabled: false,
        refreshInterval: 5000, // 5 seconds
        port: 3001,
        path: '/metrics'
      }
    };

    return this.deepMerge(defaultConfig, userConfig || {});
  }

  private deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
      if (source[key] !== undefined) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key] || {}, source[key] as any);
        } else {
          result[key] = source[key] as any;
        }
      }
    }

    return result;
  }

  // Cleanup
  cleanup(): void {
    this.stop();
    this.metricsHistory = [];
    this.alerts = [];
  }
}