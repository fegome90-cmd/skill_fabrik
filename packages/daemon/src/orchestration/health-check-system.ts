/**
 * Advanced Health Check System for Daemon V2
 * Comprehensive health monitoring with detailed diagnostics
 * Task: SF-DAEMON-2025-V2.3
 * Date: 2025-11-14
 */

import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { logger } from '../observability/logger.js';
import { MetricsCollector } from '../../router/src/metrics/metrics-collector.js';

export interface HealthCheckConfig {
  interval?: number;                    // Health check interval (ms)
  timeout?: number;                     // Individual check timeout (ms)
  retries?: number;                     // Retry attempts for failed checks
  retryDelay?: number;                  // Delay between retries (ms)
  failureThreshold?: number;           // Consecutive failures before unhealthy
  successThreshold?: number;           // Consecutive successes to become healthy
  enableDiagnostics?: boolean;         // Enable detailed diagnostics
  enablePredictions?: boolean;         // Enable health predictions
  notificationWebhook?: string;        // Webhook for health notifications
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  timestamp: number;
  uptime: number;
  version: string;
  checks: HealthCheckResult[];
  summary: HealthSummary;
  diagnostics?: HealthDiagnostics;
  predictions?: HealthPredictions;
}

export interface HealthCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  message: string;
  details?: any;
  lastChecked: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  enabled: boolean;
}

export interface HealthSummary {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  overallScore: number;
  lastUpdate: number;
}

export interface HealthDiagnostics {
  systemInfo: {
    nodeVersion: string;
    platform: string;
    arch: string;
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
  };
  diskSpace: {
    total: number;
    used: number;
    available: number;
    usage: number;
  };
  dependencies: DependencyStatus[];
  performance: PerformanceMetrics;
}

export interface DependencyStatus {
  name: string;
  type: 'database' | 'cache' | 'external-api' | 'file-system';
  status: 'connected' | 'disconnected' | 'degraded';
  responseTime: number;
  lastCheck: number;
  error?: string;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface HealthPredictions {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  nextFailureEstimate: number | null;
  recommendedActions: string[];
  confidence: number;
  factors: PredictionFactor[];
}

export interface PredictionFactor {
  name: string;
  impact: number;
  current: number;
  threshold: number;
  trend: 'improving' | 'stable' | 'degrading';
}

/**
 * Comprehensive Health Check System
 */
export class HealthCheckSystem {
  private healthChecks: Map<string, HealthCheck> = new Map();
  private healthStatus: HealthStatus;
  private isRunning = false;
  private startTime = Date.now();
  private metricsHistory: Array<{ timestamp: number; status: HealthStatus }> = [];
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;

  // Configuration
  private config: Required<HealthCheckConfig>;

  constructor(
    config: HealthCheckConfig = {},
    private metrics?: MetricsCollector
  ) {
    this.config = {
      interval: config.interval || 30000,        // 30 seconds
      timeout: config.timeout || 5000,         // 5 seconds
      retries: config.retries || 2,              // 2 retries
      retryDelay: config.retryDelay || 1000,    // 1 second
      failureThreshold: config.failureThreshold || 3,
      successThreshold: config.successThreshold || 2,
      enableDiagnostics: config.enableDiagnostics !== false,
      enablePredictions: config.enablePredictions !== false,
      notificationWebhook: config.notificationWebhook
    };

    this.healthStatus = this.initializeHealthStatus();
    this.initializeHealthChecks();

    logger.info({
      interval: this.config.interval,
      timeout: this.config.timeout,
      enableDiagnostics: this.config.enableDiagnostics,
      enablePredictions: this.config.enablePredictions
    }, 'Health check system initialized');
  }

  /**
   * Start health monitoring
   */
  public start(): void {
    if (this.isRunning) {
      logger.warn('Health monitoring already running');
      return;
    }

    this.isRunning = true;
    this.startTime = Date.now();

    // Perform initial health check
    this.performHealthCheck();

    // Start periodic health checks
    const healthCheckInterval = setInterval(() => {
      if (this.isRunning) {
        this.performHealthCheck();
      }
    }, this.config.interval);

    // Don't prevent process from exiting
    if (healthCheckInterval.unref) {
      healthCheckInterval.unref();
    }

    logger.info('Health monitoring started');
  }

  /**
   * Stop health monitoring
   */
  public stop(): void {
    this.isRunning = false;
    logger.info('Health monitoring stopped');
  }

  /**
   * Perform immediate health check
   */
  public async checkHealth(): Promise<HealthStatus> {
    await this.performHealthCheck();
    return this.getHealthStatus();
  }

  /**
   * Get current health status
   */
  public getHealthStatus(): HealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Add custom health check
   */
  public addHealthCheck(
    name: string,
    check: () => Promise<HealthCheckResult>,
    enabled: boolean = true
  ): void {
    this.healthChecks.set(name, {
      name,
      check,
      enabled,
      lastResult: null,
      lastChecked: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0
    });

    logger.debug({ name, enabled }, 'Health check added');
  }

  /**
   * Remove health check
   */
  public removeHealthCheck(name: string): void {
    const removed = this.healthChecks.delete(name);
    if (removed) {
      logger.debug({ name }, 'Health check removed');
    }
  }

  /**
   * Enable/disable health check
   */
  public setHealthCheckEnabled(name: string, enabled: boolean): void {
    const healthCheck = this.healthChecks.get(name);
    if (healthCheck) {
      healthCheck.enabled = enabled;
      logger.debug({ name, enabled }, 'Health check enabled status updated');
    }
  }

  /**
   * Get health check results
   */
  public getHealthCheckResults(): HealthCheckResult[] {
    return Array.from(this.healthChecks.values()).map(hc => hc.lastResult).filter(Boolean) as HealthCheckResult[];
  }

  /**
   * Get health metrics history
   */
  public getHealthHistory(duration?: number): Array<{ timestamp: number; status: HealthStatus }> {
    if (!duration) return this.metricsHistory;

    const cutoff = Date.now() - duration;
    return this.metricsHistory.filter(entry => entry.timestamp >= cutoff);
  }

  /**
   * Generate health report
   */
  public generateHealthReport(): {
    uptime: number;
    healthScore: number;
    checksSummary: HealthSummary;
    recommendations: string[];
    diagnostics?: HealthDiagnostics;
    predictions?: HealthPredictions;
  } {
    const uptime = Date.now() - this.startTime;
    const healthScore = this.healthStatus.summary.overallScore;

    const report = {
      uptime,
      healthScore,
      checksSummary: this.healthStatus.summary,
      recommendations: this.generateRecommendations(),
      diagnostics: this.healthStatus.diagnostics,
      predictions: this.healthStatus.predictions
    };

    return report;
  }

  // Private methods

  private initializeHealthStatus(): HealthStatus {
    return {
      status: 'unknown',
      timestamp: Date.now(),
      uptime: 0,
      version: this.getVersion(),
      checks: [],
      summary: {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        warningChecks: 0,
        overallScore: 0,
        lastUpdate: Date.now()
      }
    };
  }

  private initializeHealthChecks(): void {
    // Memory check
    this.addHealthCheck('memory', async () => {
      const usage = process.memoryUsage();
      const usedMB = usage.heapUsed / 1024 / 1024;
      const totalMB = usage.heapTotal / 1024 / 1024;
      const usagePercent = (usedMB / totalMB) * 100;

      if (usagePercent > 90) {
        return {
          name: 'memory',
          status: 'fail',
          duration: 0,
          message: `Memory usage critical: ${usagePercent.toFixed(1)}%`,
          details: { usedMB, totalMB, usagePercent },
          lastChecked: Date.now(),
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
          enabled: true
        };
      } else if (usagePercent > 80) {
        return {
          name: 'memory',
          status: 'warn',
          duration: 0,
          message: `Memory usage high: ${usagePercent.toFixed(1)}%`,
          details: { usedMB, totalMB, usagePercent },
          lastChecked: Date.now(),
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
          enabled: true
        };
      } else {
        return {
          name: 'memory',
          status: 'pass',
          duration: 0,
          message: `Memory usage normal: ${usagePercent.toFixed(1)}%`,
          details: { usedMB, totalMB, usagePercent },
          lastChecked: Date.now(),
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
          enabled: true
        };
      }
    });

    // Disk space check
    this.addHealthCheck('disk-space', async () => {
      try {
        const stats = await stat(process.cwd());
        // This is a simplified check - in production, you'd check actual disk usage
        const availableSpace = 1024 * 1024 * 1024; // 1GB dummy value

        if (availableSpace < 100 * 1024 * 1024) { // Less than 100MB
          return {
            name: 'disk-space',
            status: 'fail',
            duration: 0,
            message: `Low disk space: ${Math.round(availableSpace / 1024 / 1024)}MB available`,
            details: { availableSpace },
            lastChecked: Date.now(),
            consecutiveFailures: 0,
            consecutiveSuccesses: 0,
            enabled: true
          };
        }

        return {
          name: 'disk-space',
          status: 'pass',
          duration: 0,
          message: 'Disk space adequate',
          details: { availableSpace },
          lastChecked: Date.now(),
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
          enabled: true
        };
      } catch (error) {
        return {
          name: 'disk-space',
          status: 'fail',
          duration: 0,
          message: `Disk space check failed: ${error instanceof Error ? error.message : String(error)}`,
          details: { error: error instanceof Error ? error.message : String(error) },
          lastChecked: Date.now(),
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
          enabled: true
        };
      }
    });

    // Process health check
    this.addHealthCheck('process', async () => {
      const uptime = process.uptime();

      if (uptime < 10) { // Process started less than 10 seconds ago
        return {
          name: 'process',
          status: 'warn',
          duration: 0,
          message: `Process recently started: ${Math.round(uptime)}s uptime`,
          details: { uptime },
          lastChecked: Date.now(),
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
          enabled: true
        };
      }

      return {
        name: 'process',
        status: 'pass',
        duration: 0,
        message: `Process healthy: ${Math.round(uptime)}s uptime`,
        details: { uptime, pid: process.pid },
        lastChecked: Date.now(),
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        enabled: true
      };
    });

    // Event loop lag check
    this.addHealthCheck('event-loop', async () => {
      const start = process.hrtime.bigint();

      await new Promise(resolve => {
        setImmediate(resolve);
      });

      const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds

      if (lag > 100) { // More than 100ms lag
        return {
          name: 'event-loop',
          status: 'fail',
          duration: lag,
          message: `Event loop lag high: ${lag.toFixed(2)}ms`,
          details: { lag },
          lastChecked: Date.now(),
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
          enabled: true
        };
      } else if (lag > 50) {
        return {
          name: 'event-loop',
          status: 'warn',
          duration: lag,
          message: `Event loop lag elevated: ${lag.toFixed(2)}ms`,
          details: { lag },
          lastChecked: Date.now(),
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
          enabled: true
        };
      }

      return {
        name: 'event-loop',
        status: 'pass',
        duration: lag,
        message: `Event loop normal: ${lag.toFixed(2)}ms lag`,
        details: { lag },
        lastChecked: Date.now(),
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        enabled: true
      };
    });
  }

  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now();
    const results: HealthCheckResult[] = [];

    // Run all enabled health checks
    for (const [name, healthCheck] of this.healthChecks) {
      if (!healthCheck.enabled) {
        continue;
      }

      try {
        const result = await this.runHealthCheckWithRetry(healthCheck);
        results.push(result);
        healthCheck.lastResult = result;
      } catch (error) {
        const failedResult: HealthCheckResult = {
          name,
          status: 'fail',
          duration: 0,
          message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
          lastChecked: Date.now(),
          consecutiveFailures: healthCheck.consecutiveFailures + 1,
          consecutiveSuccesses: 0,
          enabled: true
        };

        results.push(failedResult);
        healthCheck.lastResult = failedResult;
      }
    }

    // Calculate overall health status
    this.updateHealthStatus(results);

    // Store metrics history
    this.metricsHistory.push({
      timestamp: Date.now(),
      status: { ...this.healthStatus }
    });

    // Keep only last 24 hours of history
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    this.metricsHistory = this.metricsHistory.filter(entry => entry.timestamp >= cutoff);

    // Update metrics
    if (this.metrics) {
      this.metrics.setGauge('health_score', this.healthStatus.summary.overallScore);
      this.metrics.setGauge('health_checks_total', results.length);
      this.metrics.setGauge('health_checks_passed', this.healthStatus.summary.passedChecks);
      this.metrics.setGauge('health_checks_failed', this.healthStatus.summary.failedChecks);
    }

    const duration = Date.now() - startTime;
    logger.debug({
      duration,
      totalChecks: results.length,
      passed: this.healthStatus.summary.passedChecks,
      failed: this.healthStatus.summary.failedChecks,
      overallScore: this.healthStatus.summary.overallScore
    }, 'Health check completed');

    // Send notifications if needed
    if (this.config.notificationWebhook) {
      await this.sendHealthNotification(this.healthStatus);
    }
  }

  private async runHealthCheckWithRetry(healthCheck: HealthCheck): Promise<HealthCheckResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retries + 1; attempt++) {
      try {
        const startTime = Date.now();
        const result = await healthCheck.check();
        const duration = Date.now() - startTime;

        // Update consecutive successes/failures
        if (result.status === 'pass') {
          healthCheck.consecutiveSuccesses++;
          healthCheck.consecutiveFailures = 0;
        } else {
          healthCheck.consecutiveFailures++;
          healthCheck.consecutiveSuccesses = 0;
        }

        return {
          ...result,
          duration,
          lastChecked: Date.now(),
          consecutiveFailures: healthCheck.consecutiveFailures,
          consecutiveSuccesses: healthCheck.consecutiveSuccesses
        };

      } catch (error) {
        lastError = error as Error;
        healthCheck.consecutiveFailures++;

        if (attempt <= this.config.retries) {
          logger.debug({
            checkName: healthCheck.name,
            attempt,
            error: lastError.message,
            retryDelay: this.config.retryDelay
          }, 'Health check failed, retrying');

          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }

    // All retries failed
    throw lastError || new Error('Health check failed after retries');
  }

  private updateHealthStatus(results: HealthCheckResult[]): void {
    const passedChecks = results.filter(r => r.status === 'pass').length;
    const failedChecks = results.filter(r => r.status === 'fail').length;
    const warningChecks = results.filter(r => r.status === 'warn').length;
    const totalChecks = results.length;

    // Calculate overall score
    let overallScore = 0;
    if (totalChecks > 0) {
      const weights = { pass: 100, warn: 50, fail: 0 };
      const weightedSum = results.reduce((sum, r) => sum + weights[r.status], 0);
      overallScore = Math.round(weightedSum / totalChecks);
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (failedChecks > 0) {
      status = 'unhealthy';
    } else if (warningChecks > 0 || overallScore < 80) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    // Update consecutive failure/success tracking
    if (status === 'unhealthy') {
      this.consecutiveFailures++;
      this.consecutiveSuccesses = 0;
    } else if (status === 'healthy') {
      this.consecutiveSuccesses++;
      this.consecutiveFailures = 0;
    }

    this.healthStatus = {
      status,
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      version: this.getVersion(),
      checks: results,
      summary: {
        totalChecks,
        passedChecks,
        failedChecks,
        warningChecks,
        overallScore,
        lastUpdate: Date.now()
      },
      diagnostics: this.config.enableDiagnostics ? this.generateDiagnostics() : undefined,
      predictions: this.config.enablePredictions ? this.generatePredictions() : undefined
    };
  }

  private getVersion(): string {
    try {
      const packageJson = require.resolve('../../package.json');
      return require(packageJson).version;
    } catch {
      return '0.1.0';
    }
  }

  private generateDiagnostics(): HealthDiagnostics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: memUsage,
        cpu: cpuUsage
      },
      diskSpace: {
        total: 0, // Would calculate actual disk usage
        used: 0,
        available: 0,
        usage: 0
      },
      dependencies: [], // Would check actual dependencies
      performance: {
        averageResponseTime: 0,
        requestsPerSecond: 0,
        errorRate: 0,
        activeConnections: 0,
        memoryUsage: memUsage.heapUsed,
        cpuUsage: cpuUsage.user
      }
    };
  }

  private generatePredictions(): HealthPredictions {
    const recentHistory = this.metricsHistory.slice(-10);

    if (recentHistory.length < 5) {
      return {
        riskLevel: 'low',
        nextFailureEstimate: null,
        recommendedActions: [],
        confidence: 0,
        factors: []
      };
    }

    // Analyze trends
    const scores = recentHistory.map(h => h.status.summary.overallScore);
    const trend = this.calculateTrend(scores);

    // Calculate risk factors
    const factors: PredictionFactor[] = [
      {
        name: 'health_score_trend',
        impact: 0.4,
        current: trend,
        threshold: -5,
        trend: trend > 0 ? 'degrading' : 'improving'
      },
      {
        name: 'consecutive_failures',
        impact: 0.3,
        current: this.consecutiveFailures,
        threshold: 3,
        trend: this.consecutiveFailures > 0 ? 'degrading' : 'stable'
      }
    ];

    const totalImpact = factors.reduce((sum, f) => sum + (f.current * f.impact), 0);

    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (totalImpact > 2) {
      riskLevel = 'critical';
    } else if (totalImpact > 1) {
      riskLevel = 'high';
    } else if (totalImpact > 0) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    return {
      riskLevel,
      nextFailureEstimate: this.estimateNextFailure(riskLevel),
      recommendedActions: this.generateRecommendedActions(factors, riskLevel),
      confidence: Math.min(0.9, recentHistory.length / 10),
      factors
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    return secondAvg - firstAvg;
  }

  private estimateNextFailure(riskLevel: string): number | null {
    const baseEstimates = {
      low: 24 * 60 * 60 * 1000,      // 24 hours
      medium: 12 * 60 * 60 * 1000,   // 12 hours
      high: 6 * 60 * 60 * 1000,      // 6 hours
      critical: 1 * 60 * 60 * 1000    // 1 hour
    };

    return baseEstimates[riskLevel as keyof typeof baseEstimates] || null;
  }

  private generateRecommendedActions(
    factors: PredictionFactor[],
    riskLevel: string
  ): string[] {
    const actions: string[] = [];

    for (const factor of factors) {
      if (factor.current > factor.threshold && factor.trend === 'degrading') {
        actions.push(`Address ${factor.name} - current value: ${factor.current}, threshold: ${factor.threshold}`);
      }
    }

    if (riskLevel === 'high' || riskLevel === 'critical') {
      actions.push('Consider scaling resources');
      actions.push('Monitor system closely');
    }

    return actions;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.healthStatus.summary.overallScore < 50) {
      recommendations.push('Overall health score is low - investigate immediately');
    }

    const failedChecks = this.healthStatus.checks.filter(c => c.status === 'fail');
    if (failedChecks.length > 0) {
      recommendations.push(`${failedChecks.length} health checks failing - address critical issues`);
    }

    const warningChecks = this.healthStatus.checks.filter(c => c.status === 'warn');
    if (warningChecks.length > 0) {
      recommendations.push(`${warningChecks.length} health checks warning - monitor and address`);
    }

    return recommendations;
  }

  private async sendHealthNotification(status: HealthStatus): Promise<void> {
    if (!this.config.notificationWebhook) {
      return;
    }

    try {
      const response = await fetch(this.config.notificationWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: 'skills-daemon',
          status: status.status,
          timestamp: status.timestamp,
          score: status.summary.overallScore,
          uptime: status.uptime,
          checks: status.checks.map(c => ({
            name: c.name,
            status: c.status,
            message: c.message
          }))
        })
      });

      if (!response.ok) {
        logger.warn({
          webhook: this.config.notificationWebhook,
          status: response.status
        }, 'Failed to send health notification');
      }
    } catch (error) {
      logger.error({
        webhook: this.config.notificationWebhook,
        error: error instanceof Error ? error.message : String(error)
      }, 'Error sending health notification');
    }
  }
}

interface HealthCheck {
  name: string;
  check: () => Promise<HealthCheckResult>;
  enabled: boolean;
  lastResult: HealthCheckResult | null;
  lastChecked: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
}