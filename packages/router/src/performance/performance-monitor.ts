/**
 * Real-time Performance Monitoring System
 * Advanced analytics and alerting for Router performance
 * Task: SF-PERFORMANCE-2025-T2.3
 * Date: 2025-11-14
 */

import { logger } from '../logger.js';
import { MetricsCollector, type PerformanceSummary } from '../metrics/metrics-collector.js';

export interface PerformanceAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  timestamp: number;
  value: number;
  threshold: number;
  resolved?: boolean;
  resolvedAt?: number;
}

export interface PerformanceThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration?: number; // How long threshold must be exceeded before alerting (ms)
  cooldown?: number;  // Minimum time between alerts (ms)
}

export interface PerformanceReport {
  timestamp: number;
  summary: PerformanceSummary;
  alerts: PerformanceAlert[];
  trends: PerformanceTrends;
  recommendations: string[];
}

export interface PerformanceTrends {
  responseTime: TrendAnalysis;
  errorRate: TrendAnalysis;
  throughput: TrendAnalysis;
  memoryUsage: TrendAnalysis;
  cpuUsage: TrendAnalysis;
}

export interface TrendAnalysis {
  current: number;
  average1m: number;
  average5m: number;
  average15m: number;
  direction: 'increasing' | 'decreasing' | 'stable';
  changeRate: number; // Percentage change from 15m average
}

export interface PerformanceMonitorOptions {
  checkInterval?: number;      // Performance check interval (ms)
  alertCooldown?: number;     // Default alert cooldown (ms)
  historyRetention?: number;  // History retention period (ms)
  enablePredictions?: boolean; // Enable performance predictions
  enableAutoTuning?: boolean;  // Enable automatic performance tuning
}

/**
 * Advanced Real-time Performance Monitor
 */
export class PerformanceMonitor {
  private alerts: Map<string, PerformanceAlert> = new Map();
  private thresholds: Map<string, PerformanceThreshold> = new Map();
  private metricsHistory: Array<{ timestamp: number; metrics: PerformanceSummary }> = [];
  private lastCheck: number = Date.now();

  private checkTimer: NodeJS.Timeout | null = null;
  private alertCooldowns: Map<string, number> = new Map();

  // Configuration
  private options: Required<PerformanceMonitorOptions>;

  constructor(
    private metrics: MetricsCollector,
    options: PerformanceMonitorOptions = {}
  ) {
    this.options = {
      checkInterval: options.checkInterval || 10000, // 10 seconds
      alertCooldown: options.alertCooldown || 60000, // 1 minute
      historyRetention: options.historyRetention || 3600000, // 1 hour
      enablePredictions: options.enablePredictions || false,
      enableAutoTuning: options.enableAutoTuning || false
    };

    // Initialize default thresholds
    this.initializeDefaultThresholds();

    // Start monitoring
    this.startMonitoring();

    logger.info({
      checkInterval: this.options.checkInterval,
      historyRetention: this.options.historyRetention,
      enablePredictions: this.options.enablePredictions
    }, 'Performance monitor initialized');
  }

  /**
   * Add custom performance threshold
   */
  public addThreshold(
    name: string,
    metric: string,
    operator: PerformanceThreshold['operator'],
    threshold: number,
    severity: PerformanceThreshold['severity'],
    options?: { duration?: number; cooldown?: number }
  ): void {
    const thresholdConfig: PerformanceThreshold = {
      metric,
      operator,
      threshold,
      severity,
      duration: options?.duration || 30000, // 30 seconds default
      cooldown: options?.cooldown || this.options.alertCooldown
    };

    this.thresholds.set(name, thresholdConfig);

    logger.info({
      name,
      metric,
      threshold,
      operator,
      severity
    }, 'Performance threshold added');
  }

  /**
   * Remove performance threshold
   */
  public removeThreshold(name: string): void {
    this.thresholds.delete(name);
    logger.info({ name }, 'Performance threshold removed');
  }

  /**
   * Get current performance report
   */
  public getReport(): PerformanceReport {
    const summary = this.metrics.getPerformanceSummary();
    const trends = this.analyzeTrends();
    const activeAlerts = Array.from(this.alerts.values()).filter(alert => !alert.resolved);
    const recommendations = this.generateRecommendations(summary, trends, activeAlerts);

    return {
      timestamp: Date.now(),
      summary,
      alerts: activeAlerts,
      trends,
      recommendations
    };
  }

  /**
   * Get all alerts
   */
  public getAlerts(includeResolved: boolean = false): PerformanceAlert[] {
    const alerts = Array.from(this.alerts.values());

    return includeResolved ? alerts : alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string, reason?: string): void {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();

      logger.info({
        alertId,
        reason: reason || 'Manually resolved'
      }, 'Performance alert resolved');
    }
  }

  /**
   * Get performance history
   */
  public getHistory(duration?: number): Array<{ timestamp: number; metrics: PerformanceSummary }> {
    if (!duration) return this.metricsHistory;

    const cutoff = Date.now() - duration;
    return this.metricsHistory.filter(entry => entry.timestamp >= cutoff);
  }

  /**
   * Generate performance predictions
   */
  public generatePredictions(): PerformancePrediction[] {
    if (!this.options.enablePredictions || this.metricsHistory.length < 10) {
      return [];
    }

    const predictions: PerformancePrediction[] = [];
    const recent = this.metricsHistory.slice(-10);

    // Predict response time
    const responseTimeTrend = this.calculateLinearTrend(recent, d => d.summary.averageResponseTime);
    if (responseTimeTrend.slope > 0) {
      predictions.push({
        metric: 'response_time',
        currentValue: recent[recent.length - 1].summary.averageResponseTime,
        predictedValue: responseTimeTrend.predict(300000), // 5 minutes from now
        confidence: responseTimeTrend.confidence,
        trend: 'increasing',
        impact: this.calculateImpact('response_time', responseTimeTrend.predict(300000))
      });
    }

    // Predict error rate
    const errorRateTrend = this.calculateLinearTrend(recent, d => d.summary.errorRate);
    if (errorRateTrend.slope > 0) {
      predictions.push({
        metric: 'error_rate',
        currentValue: recent[recent.length - 1].summary.errorRate,
        predictedValue: errorRateTrend.predict(300000),
        confidence: errorRateTrend.confidence,
        trend: 'increasing',
        impact: this.calculateImpact('error_rate', errorRateTrend.predict(300000))
      });
    }

    return predictions;
  }

  /**
   * Shutdown performance monitor
   */
  public shutdown(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }

    logger.info('Performance monitor shutdown');
  }

  // Private methods

  private startMonitoring(): void {
    this.checkTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.options.checkInterval);

    if (this.checkTimer.unref) {
      this.checkTimer.unref();
    }
  }

  private performHealthCheck(): void {
    try {
      const summary = this.metrics.getPerformanceSummary();
      const timestamp = Date.now();

      // Store metrics history
      this.metricsHistory.push({ timestamp, metrics: summary });

      // Clean old history
      const cutoff = timestamp - this.options.historyRetention;
      this.metricsHistory = this.metricsHistory.filter(entry => entry.timestamp >= cutoff);

      // Check thresholds
      this.checkThresholds(summary);

      // Auto-tuning if enabled
      if (this.options.enableAutoTuning) {
        this.performAutoTuning(summary);
      }

      this.lastCheck = timestamp;

    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error)
      }, 'Performance monitoring check failed');
    }
  }

  private checkThresholds(summary: PerformanceSummary): void {
    for (const [name, threshold] of this.thresholds) {
      try {
        const value = this.extractMetricValue(summary, threshold.metric);
        const violated = this.checkThreshold(value, threshold);

        if (violated) {
          this.handleThresholdViolation(name, threshold, value);
        } else {
          this.handleThresholdRecovery(name, threshold);
        }
      } catch (error) {
        logger.warn({
          threshold: name,
          metric: threshold.metric,
          error: error instanceof Error ? error.message : String(error)
        }, 'Failed to check performance threshold');
      }
    }
  }

  private checkThreshold(value: number, threshold: PerformanceThreshold): boolean {
    switch (threshold.operator) {
      case 'gt': return value > threshold.threshold;
      case 'gte': return value >= threshold.threshold;
      case 'lt': return value < threshold.threshold;
      case 'lte': return value <= threshold.threshold;
      case 'eq': return value === threshold.threshold;
      default: return false;
    }
  }

  private handleThresholdViolation(name: string, threshold: PerformanceThreshold, value: number): void {
    const now = Date.now();
    const cooldownUntil = this.alertCooldowns.get(name) || 0;

    // Check cooldown
    if (now < cooldownUntil) {
      return;
    }

    const alertId = `${name}-${now}`;
    const existingAlert = Array.from(this.alerts.values())
      .find(alert => alert.id.startsWith(name) && !alert.resolved);

    if (existingAlert) {
      // Update existing alert
      existingAlert.value = value;
      existingAlert.timestamp = now;
    } else {
      // Create new alert
      const alert: PerformanceAlert = {
        id: alertId,
        severity: threshold.severity,
        type: 'threshold_violation',
        message: `${threshold.metric} ${threshold.operator} ${threshold.threshold} (current: ${value.toFixed(2)})`,
        timestamp: now,
        value,
        threshold: threshold.threshold
      };

      this.alerts.set(alertId, alert);
      this.alertCooldowns.set(name, now + (threshold.cooldown || this.options.alertCooldown));

      logger.warn({
        alertId,
        metric: threshold.metric,
        value,
        threshold: threshold.threshold,
        severity: threshold.severity
      }, 'Performance alert triggered');

      // Trigger alerts for critical issues
      if (threshold.severity === 'critical') {
        this.handleCriticalAlert(alert);
      }
    }
  }

  private handleThresholdRecovery(name: string, threshold: PerformanceThreshold): void {
    const existingAlert = Array.from(this.alerts.values())
      .find(alert => alert.id.startsWith(name) && !alert.resolved);

    if (existingAlert) {
      existingAlert.resolved = true;
      existingAlert.resolvedAt = Date.now();

      logger.info({
        alertId: existingAlert.id,
        metric: threshold.metric
      }, 'Performance alert resolved');
    }
  }

  private handleCriticalAlert(alert: PerformanceAlert): void {
    logger.error({
      alertId: alert.id,
      message: alert.message,
      value: alert.value
    }, 'CRITICAL PERFORMANCE ALERT');

    // Here you could trigger additional actions like:
    // - Sending notifications
    // - Triggering automated responses
    // - Escalating to operations team
  }

  private extractMetricValue(summary: PerformanceSummary, metricPath: string): number {
    const parts = metricPath.split('.');
    let value: any = summary;

    for (const part of parts) {
      value = value?.[part];
    }

    return typeof value === 'number' ? value : 0;
  }

  private analyzeTrends(): PerformanceTrends {
    const history = this.metricsHistory;
    if (history.length < 2) {
      return this.getDefaultTrends();
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const fiveMinutesAgo = now - 300000;
    const fifteenMinutesAgo = now - 900000;

    const recent = history[history.length - 1];
    const oneMinute = history.filter(h => h.timestamp >= oneMinuteAgo);
    const fiveMinutes = history.filter(h => h.timestamp >= fiveMinutesAgo);
    const fifteenMinutes = history.filter(h => h.timestamp >= fifteenMinutesAgo);

    return {
      responseTime: this.analyzeMetric('averageResponseTime', recent, oneMinute, fiveMinutes, fifteenMinutes),
      errorRate: this.analyzeMetric('errorRate', recent, oneMinute, fiveMinutes, fifteenMinutes),
      throughput: this.analyzeMetric('requestsPerSecond', recent, oneMinute, fiveMinutes, fifteenMinutes),
      memoryUsage: this.analyzeMetric('memoryUsage.heapUsed', recent, oneMinute, fiveMinutes, fifteenMinutes),
      cpuUsage: this.analyzeMetric('cpuUsage.user', recent, oneMinute, fiveMinutes, fifteenMinutes)
    };
  }

  private analyzeMetric(
    path: string,
    recent: any,
    oneMinute: any[],
    fiveMinutes: any[],
    fifteenMinutes: any[]
  ): TrendAnalysis {
    const current = this.extractValue(recent.metrics, path);
    const average1m = this.calculateAverage(oneMinute, path);
    const average5m = this.calculateAverage(fiveMinutes, path);
    const average15m = this.calculateAverage(fifteenMinutes, path);

    const direction = current > average15m ? 'increasing' : current < average15m ? 'decreasing' : 'stable';
    const changeRate = average15m > 0 ? ((current - average15m) / average15m) * 100 : 0;

    return {
      current,
      average1m,
      average5m,
      average15m,
      direction,
      changeRate
    };
  }

  private extractValue(obj: any, path: string): number {
    const parts = path.split('.');
    let value = obj;

    for (const part of parts) {
      value = value?.[part];
    }

    return typeof value === 'number' ? value : 0;
  }

  private calculateAverage(data: any[], path: string): number {
    if (data.length === 0) return 0;

    const sum = data.reduce((acc, item) => acc + this.extractValue(item.metrics, path), 0);
    return sum / data.length;
  }

  private calculateLinearTrend(data: any[], extractor: (item: any) => number): LinearTrend {
    if (data.length < 2) {
      return { slope: 0, intercept: 0, confidence: 0, predict: () => 0 };
    }

    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data.map(extractor);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate confidence (simplified)
    const predictions = x.map(xi => intercept + slope * xi);
    const errors = y.map((yi, i) => Math.pow(yi - predictions[i], 2));
    const mse = errors.reduce((a, b) => a + b, 0) / n;
    const confidence = Math.max(0, 1 - mse / (Math.max(...y) - Math.min(...y)));

    return {
      slope,
      intercept,
      confidence,
      predict: (xValue: number) => intercept + slope * xValue
    };
  }

  private calculateImpact(metric: string, predictedValue: number): string {
    switch (metric) {
      case 'response_time':
        if (predictedValue > 5000) return 'critical';
        if (predictedValue > 2000) return 'high';
        if (predictedValue > 1000) return 'medium';
        return 'low';
      case 'error_rate':
        if (predictedValue > 10) return 'critical';
        if (predictedValue > 5) return 'high';
        if (predictedValue > 1) return 'medium';
        return 'low';
      default:
        return 'medium';
    }
  }

  private generateRecommendations(
    summary: PerformanceSummary,
    trends: PerformanceTrends,
    alerts: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = [];

    // Response time recommendations
    if (trends.responseTime.direction === 'increasing' && trends.responseTime.changeRate > 20) {
      recommendations.push('Response time is increasing rapidly (>20%). Consider adding more daemon instances or optimizing skill execution.');
    }

    if (summary.averageResponseTime > 2000) {
      recommendations.push('Average response time exceeds 2 seconds. Review skill performance and daemon health.');
    }

    // Error rate recommendations
    if (trends.errorRate.direction === 'increasing') {
      recommendations.push('Error rate is trending upward. Review skill configurations and daemon availability.');
    }

    if (summary.errorRate > 5) {
      recommendations.push('Error rate exceeds 5%. Immediate investigation required.');
    }

    // Memory usage recommendations
    const memoryUsagePercent = (summary.memoryUsage.heapUsed / summary.memoryUsage.heapTotal) * 100;
    if (memoryUsagePercent > 80) {
      recommendations.push('Memory usage exceeds 80%. Consider implementing memory monitoring and cleanup procedures.');
    }

    // Throughput recommendations
    if (summary.requestsPerSecond > 100) {
      recommendations.push('High request volume detected. Consider implementing rate limiting and load balancing optimizations.');
    }

    // Alert-based recommendations
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
    if (criticalAlerts.length > 0) {
      recommendations.push(`${criticalAlerts.length} critical alerts require immediate attention.`);
    }

    return recommendations;
  }

  private performAutoTuning(summary: PerformanceSummary): void {
    // Placeholder for auto-tuning logic
    // This could include:
    // - Adjusting circuit breaker thresholds
    // - Modifying cache sizes
    // - Changing load balancing strategies
    // - Scaling recommendations

    if (summary.averageResponseTime > 3000 && summary.requestsPerSecond > 10) {
      logger.info('Auto-tuning: High load detected, consider scaling daemon instances');
    }
  }

  private getDefaultTrends(): PerformanceTrends {
    const summary = this.metrics.getPerformanceSummary();

    return {
      responseTime: {
        current: summary.averageResponseTime,
        average1m: summary.averageResponseTime,
        average5m: summary.averageResponseTime,
        average15m: summary.averageResponseTime,
        direction: 'stable',
        changeRate: 0
      },
      errorRate: {
        current: summary.errorRate,
        average1m: summary.errorRate,
        average5m: summary.errorRate,
        average15m: summary.errorRate,
        direction: 'stable',
        changeRate: 0
      },
      throughput: {
        current: summary.requestsPerSecond,
        average1m: summary.requestsPerSecond,
        average5m: summary.requestsPerSecond,
        average15m: summary.requestsPerSecond,
        direction: 'stable',
        changeRate: 0
      },
      memoryUsage: {
        current: summary.memoryUsage.heapUsed,
        average1m: summary.memoryUsage.heapUsed,
        average5m: summary.memoryUsage.heapUsed,
        average15m: summary.memoryUsage.heapUsed,
        direction: 'stable',
        changeRate: 0
      },
      cpuUsage: {
        current: summary.cpuUsage.user,
        average1m: summary.cpuUsage.user,
        average5m: summary.cpuUsage.user,
        average15m: summary.cpuUsage.user,
        direction: 'stable',
        changeRate: 0
      }
    };
  }

  private initializeDefaultThresholds(): void {
    // Response time thresholds
    this.addThreshold('high_response_time', 'averageResponseTime', 'gt', 5000, 'high');
    this.addThreshold('critical_response_time', 'averageResponseTime', 'gt', 10000, 'critical');

    // Error rate thresholds
    this.addThreshold('high_error_rate', 'errorRate', 'gt', 5, 'medium');
    this.addThreshold('critical_error_rate', 'errorRate', 'gt', 10, 'critical');

    // Memory thresholds
    this.addThreshold('high_memory_usage', 'memoryUsage.heapUsed', 'gt', 1024 * 1024 * 1024, 'high'); // 1GB

    // Connection thresholds
    this.addThreshold('high_active_connections', 'activeConnections', 'gt', 100, 'medium');
  }
}

interface LinearTrend {
  slope: number;
  intercept: number;
  confidence: number;
  predict: (x: number) => number;
}

export interface PerformancePrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  impact: 'low' | 'medium' | 'high' | 'critical';
}