import { type Signal, type ScoreInput, type ActivationDecision } from '../types.js';
import { type SignalOptimizer } from '../optimization/SignalOptimizer.js';

export interface PerformanceMetrics {
  signalMetrics: Record<string, SignalMetrics>;
  systemMetrics: SystemMetrics;
  evaluationHistory: EvaluationRecord[];
}

export interface SignalMetrics {
  name: string;
  totalEvaluations: number;
  successfulEvaluations: number;
  failedEvaluations: number;
  averageLatency: number; // ms
  minLatency: number;
  maxLatency: number;
  p95Latency: number; // 95th percentile
  p99Latency: number; // 99th percentile
  cacheHitRate: number;
  memoryUsage: number; // MB
  errorRate: number;
  lastEvaluation: number; // timestamp
  recentPerformance: number[]; // last 10 evaluation times
}

export interface SystemMetrics {
  totalActivations: number;
  successfulActivations: number;
  averageActivationLatency: number;
  cacheUtilization: number;
  memoryUsage: number;
  uptime: number; // ms since start
  evaluationRate: number; // evaluations per second
  errorRate: number;
}

export interface EvaluationRecord {
  id: string;
  timestamp: number;
  skillName: string;
  prompt: string;
  signalScores: Record<string, number>;
  latency: number;
  success: boolean;
  error?: string;
  activationDecision?: ActivationDecision;
  optimizationUsed: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  maxHistorySize: number;
  metricsUpdateInterval: number; // ms
  enableDetailedLogging: boolean;
  alertThresholds: {
    latency: number; // ms
    errorRate: number; // 0..1
    memoryUsage: number; // MB
  };
}

export class PerformanceMonitor {
  private readonly config: MonitoringConfig;
  private signalMetrics: Map<string, SignalMetrics> = new Map();
  private evaluationHistory: EvaluationRecord[] = [];
  private systemStartTime: number = Date.now();
  private metricsUpdateTimer?: NodeJS.Timeout;

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      enabled: true,
      maxHistorySize: 10000,
      metricsUpdateInterval: 30000, // 30 seconds
      enableDetailedLogging: false,
      alertThresholds: {
        latency: 100, // 100ms
        errorRate: 0.05, // 5%
        memoryUsage: 500 // 500MB
      },
      ...config
    };

    if (this.config.enabled) {
      this.startMetricsCollection();
    }
  }

  // Record a signal evaluation
  recordSignalEvaluation(
    signalName: string,
    input: ScoreInput,
    latency: number,
    success: boolean,
    error?: string
  ): void {
    if (!this.config.enabled) return;

    const record: Partial<EvaluationRecord> = {
      id: this.generateId(),
      timestamp: Date.now(),
      skillName: input.skillName,
      prompt: this.config.enableDetailedLogging ? input.prompt : input.prompt.substring(0, 100),
      latency,
      success,
      error,
      optimizationUsed: false
    };

    this.updateSignalMetrics(signalName, latency, success, error);
    this.maintainHistorySize();
  }

  // Record a complete activation evaluation
  recordActivationEvaluation(
    input: ScoreInput,
    signalScores: Record<string, number>,
    totalLatency: number,
    activationDecision: ActivationDecision,
    optimizationUsed: boolean
  ): void {
    if (!this.config.enabled) return;

    const record: EvaluationRecord = {
      id: this.generateId(),
      timestamp: Date.now(),
      skillName: input.skillName,
      prompt: this.config.enableDetailedLogging ? input.prompt : input.prompt.substring(0, 100),
      signalScores: { ...signalScores },
      latency: totalLatency,
      success: true,
      activationDecision,
      optimizationUsed
    };

    this.evaluationHistory.push(record);
    this.maintainHistorySize();

    // Check for performance alerts
    this.checkPerformanceAlerts(record);
  }

  private updateSignalMetrics(signalName: string, latency: number, success: boolean, error?: string): void {
    if (!this.signalMetrics.has(signalName)) {
      this.signalMetrics.set(signalName, {
        name: signalName,
        totalEvaluations: 0,
        successfulEvaluations: 0,
        failedEvaluations: 0,
        averageLatency: 0,
        minLatency: Infinity,
        maxLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        cacheHitRate: 0,
        memoryUsage: 0,
        errorRate: 0,
        lastEvaluation: 0,
        recentPerformance: []
      });
    }

    const metrics = this.signalMetrics.get(signalName)!;
    metrics.totalEvaluations++;
    metrics.lastEvaluation = Date.now();

    if (success) {
      metrics.successfulEvaluations++;
      metrics.recentPerformance.push(latency);

      // Keep only last 10 performance measurements
      if (metrics.recentPerformance.length > 10) {
        metrics.recentPerformance.shift();
      }

      // Update latency metrics
      metrics.minLatency = Math.min(metrics.minLatency, latency);
      metrics.maxLatency = Math.max(metrics.maxLatency, latency);

      // Calculate new average
      const totalSuccessful = metrics.successfulEvaluations;
      metrics.averageLatency = ((metrics.averageLatency * (totalSuccessful - 1)) + latency) / totalSuccessful;
    } else {
      metrics.failedEvaluations++;
    }

    metrics.errorRate = metrics.failedEvaluations / metrics.totalEvaluations;
  }

  private calculatePercentiles(): void {
    for (const metrics of this.signalMetrics.values()) {
      if (metrics.recentPerformance.length >= 2) {
        const sorted = [...metrics.recentPerformance].sort((a, b) => a - b);
        metrics.p95Latency = this.calculatePercentile(sorted, 0.95);
        metrics.p99Latency = this.calculatePercentile(sorted, 0.99);
      }
    }
  }

  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  private maintainHistorySize(): void {
    if (this.evaluationHistory.length > this.config.maxHistorySize) {
      this.evaluationHistory = this.evaluationHistory.slice(-this.config.maxHistorySize);
    }
  }

  private checkPerformanceAlerts(record: EvaluationRecord): void {
    const alerts: string[] = [];

    // Check latency alert
    if (record.latency > this.config.alertThresholds.latency) {
      alerts.push(`High latency detected: ${record.latency}ms for skill ${record.skillName}`);
    }

    // Check error rate alerts for individual signals
    for (const [signalName, score] of Object.entries(record.signalScores)) {
      const metrics = this.signalMetrics.get(signalName);
      if (metrics && metrics.errorRate > this.config.alertThresholds.errorRate) {
        alerts.push(`High error rate for signal ${signalName}: ${(metrics.errorRate * 100).toFixed(1)}%`);
      }
    }

    // Log alerts if any
    if (alerts.length > 0) {
      console.warn('Performance Monitor Alerts:', alerts);
    }
  }

  private startMetricsCollection(): void {
    this.metricsUpdateTimer = setInterval(() => {
      this.calculatePercentiles();
      this.updateSystemMetrics();
    }, this.config.metricsUpdateInterval);
  }

  private updateSystemMetrics(): void {
    // This would be called periodically to update system-wide metrics
    // Implementation depends on what system metrics we want to track
  }

  // Public API methods

  getPerformanceMetrics(): PerformanceMetrics {
    const systemMetrics: SystemMetrics = {
      totalActivations: this.evaluationHistory.length,
      successfulActivations: this.evaluationHistory.filter(r => r.success).length,
      averageActivationLatency: this.calculateAverageActivationLatency(),
      cacheUtilization: this.calculateCacheUtilization(),
      memoryUsage: this.estimateMemoryUsage(),
      uptime: Date.now() - this.systemStartTime,
      evaluationRate: this.calculateEvaluationRate(),
      errorRate: this.calculateSystemErrorRate()
    };

    return {
      signalMetrics: Object.fromEntries(this.signalMetrics),
      systemMetrics,
      evaluationHistory: [...this.evaluationHistory]
    };
  }

  getSignalMetrics(signalName: string): SignalMetrics | undefined {
    return this.signalMetrics.get(signalName);
  }

  getRecentEvaluations(limit: number = 100): EvaluationRecord[] {
    return this.evaluationHistory.slice(-limit);
  }

  getEvaluationSummary(skillName?: string, timeWindow?: number): {
    totalEvaluations: number;
    averageLatency: number;
    successRate: number;
    topPerformingSignals: string[];
    slowestSignals: string[];
  } {
    let evaluations = this.evaluationHistory;

    if (skillName) {
      evaluations = evaluations.filter(e => e.skillName === skillName);
    }

    if (timeWindow) {
      const cutoff = Date.now() - timeWindow;
      evaluations = evaluations.filter(e => e.timestamp >= cutoff);
    }

    const totalEvaluations = evaluations.length;
    const successfulEvaluations = evaluations.filter(e => e.success).length;
    const averageLatency = evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + e.latency, 0) / evaluations.length
      : 0;
    const successRate = totalEvaluations > 0 ? successfulEvaluations / totalEvaluations : 0;

    // Analyze signal performance
    const signalPerformance: Record<string, { latencies: number[], count: number }> = {};

    for (const evaluation of evaluations) {
      for (const [signalName, score] of Object.entries(evaluation.signalScores)) {
        if (!signalPerformance[signalName]) {
          signalPerformance[signalName] = { latencies: [], count: 0 };
        }
        signalPerformance[signalName].latencies.push(evaluation.latency);
        signalPerformance[signalName].count++;
      }
    }

    // Find top performing and slowest signals
    const signalAverages = Object.entries(signalPerformance).map(([name, data]) => ({
      name,
      avgLatency: data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length,
      count: data.count
    })).sort((a, b) => a.avgLatency - b.avgLatency);

    const topPerformingSignals = signalAverages.slice(0, 5).map(s => s.name);
    const slowestSignals = signalAverages.slice(-5).reverse().map(s => s.name);

    return {
      totalEvaluations,
      averageLatency,
      successRate,
      topPerformingSignals,
      slowestSignals
    };
  }

  private calculateAverageActivationLatency(): number {
    if (this.evaluationHistory.length === 0) return 0;
    const totalLatency = this.evaluationHistory.reduce((sum, r) => sum + r.latency, 0);
    return totalLatency / this.evaluationHistory.length;
  }

  private calculateCacheUtilization(): number {
    // This would need to be implemented based on actual cache data from signals
    return 0.75; // Placeholder
  }

  private estimateMemoryUsage(): number {
    // Rough estimate based on history size
    const historySize = this.evaluationHistory.length * 1024; // ~1KB per record
    const signalMetricsSize = this.signalMetrics.size * 512; // ~512B per signal
    return (historySize + signalMetricsSize) / (1024 * 1024); // Convert to MB
  }

  private calculateEvaluationRate(): number {
    const recentEvaluations = this.evaluationHistory.filter(
      e => e.timestamp >= Date.now() - 60000 // Last minute
    );
    return recentEvaluations.length / 60; // Per second
  }

  private calculateSystemErrorRate(): number {
    if (this.evaluationHistory.length === 0) return 0;
    const failedEvaluations = this.evaluationHistory.filter(e => !e.success).length;
    return failedEvaluations / this.evaluationHistory.length;
  }

  private generateId(): string {
    return `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export and import methods for persistence
  exportMetrics(): {
    config: MonitoringConfig;
    metrics: PerformanceMetrics;
    exportedAt: string;
  } {
    return {
      config: this.config,
      metrics: this.getPerformanceMetrics(),
      exportedAt: new Date().toISOString()
    };
  }

  clearHistory(): void {
    this.evaluationHistory = [];
    this.signalMetrics.clear();
  }

  stop(): void {
    if (this.metricsUpdateTimer) {
      clearInterval(this.metricsUpdateTimer);
      this.metricsUpdateTimer = undefined;
    }
  }

  restart(): void {
    this.stop();
    if (this.config.enabled) {
      this.startMetricsCollection();
    }
  }
}