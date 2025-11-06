/**
 * Interface Divergence Monitor
 *
 * Monitors interface implementations for divergence and drift over time,
 * providing early warning system for compatibility issues.
 */

import { EventEmitter } from 'events';
import { InterfaceDefinition, ValidationResult } from '../validation/index.js';
import { InterfaceSchema } from '../schemas/index.js';

export interface DivergenceMetrics {
  /** Interface identifier */
  interfaceId: string;

  /** Metrics timestamp */
  timestamp: Date;

  /** Schema divergence score */
  schemaDivergence: {
    score: number; // 0-100, higher = more divergent
    issues: DivergenceIssue[];
    driftRate: number; // change rate over time
  };

  /** Operational divergence score */
  operationalDivergence: {
    score: number;
    issues: DivergenceIssue[];
    missingOperations: string[];
    incompatibleChanges: string[];
  };

  /** Performance divergence score */
  performanceDivergence: {
    score: number;
    issues: DivergenceIssue[];
    latencyDrift: number;
    throughputDrift: number;
    resourceDrift: number;
  };

  /** Behavioral divergence score */
  behavioralDivergence: {
    score: number;
    issues: DivergenceIssue[];
    outputInconsistencies: string[];
    errorHandlingDifferences: string[];
  };

  /** Overall divergence score */
  overallScore: number;

  /** Divergence trend */
  trend: {
    direction: 'improving' | 'stable' | 'degrading';
    rate: number; // rate of change
    confidence: number; // confidence in trend detection
  };
}

export interface DivergenceIssue {
  /** Issue identifier */
  id: string;

  /** Issue type */
  type: 'schema' | 'operation' | 'performance' | 'behavior' | 'security';

  /** Issue severity */
  severity: 'low' | 'medium' | 'high' | 'critical';

  /** Issue description */
  description: string;

  /** Issue location */
  location: {
    interface: string;
    operation?: string;
    schema?: string;
    field?: string;
  };

  /** Issue details */
  details: {
    expected?: any;
    actual?: any;
    difference?: number;
    threshold?: number;
  };

  /** First detected */
  firstDetected: Date;

  /** Last detected */
  lastDetected: Date;

  /** Detection frequency */
  frequency: number;

  /** Suggested resolution */
  resolution?: {
    type: 'immediate' | 'scheduled' | 'optional';
    priority: 'low' | 'medium' | 'high';
    estimatedEffort: string;
    description: string;
  };
}

export interface DivergenceAlert {
  /** Alert identifier */
  id: string;

  /** Alert type */
  type: 'threshold-exceeded' | 'trend-detected' | 'critical-divergence' | 'compatibility-risk';

  /** Alert severity */
  severity: 'info' | 'warning' | 'error' | 'critical';

  /** Alert title */
  title: string;

  /** Alert description */
  description: string;

  /** Affected interfaces */
  affectedInterfaces: string[];

  /** Alert metrics */
  metrics: {
    divergenceScore: number;
    threshold: number;
    actualValue: number;
    trend: string;
  };

  /** Alert context */
  context: {
    timeWindow: string;
    comparison: string;
    baseline: string;
  };

  /** Recommended actions */
  recommendations: string[];

  /** Alert timestamp */
  createdAt: Date;

  /** Alert acknowledgment */
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;

  /** Alert resolution */
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
}

export interface MonitoringConfiguration {
  /** Monitoring intervals */
  intervals: {
    realtime: number; // ms
    periodic: number; // ms
    deepAnalysis: number; // ms
  };

  /** Divergence thresholds */
  thresholds: {
    schema: { warning: number; critical: number };
    operational: { warning: number; critical: number };
    performance: { warning: number; critical: number };
    behavioral: { warning: number; critical: number };
    overall: { warning: number; critical: number };
  };

  /** Alert settings */
  alerts: {
    enabled: boolean;
    channels: ('log' | 'webhook' | 'email' | 'slack')[];
    throttling: {
      enabled: boolean;
      maxAlertsPerHour: number;
      cooldownPeriod: number; // ms
    };
    escalation: {
      enabled: boolean;
      levels: Array<{
        threshold: number;
        severity: DivergenceAlert['severity'];
        delay: number; // ms before escalation
      }>;
    };
  };

  /** Data retention */
  retention: {
    metrics: number; // days
    alerts: number; // days
    history: number; // days
  };

  /** Analysis settings */
  analysis: {
    baselineWindow: number; // days
    trendWindow: number; // days
    seasonalityDetection: boolean;
    anomalyDetection: boolean;
    statisticalSignificance: number; // p-value threshold
  };

  /** Integration settings */
  integration: {
    schemaRegistry: boolean;
    testResults: boolean;
    performanceMetrics: boolean;
    userFeedback: boolean;
  };
}

export interface MonitoringReport {
  /** Report metadata */
  metadata: {
    generatedAt: Date;
    timeRange: { start: Date; end: Date };
    interfacesMonitored: number;
    dataPoints: number;
  };

  /** Executive summary */
  summary: {
    overallDivergence: number;
    trendDirection: 'improving' | 'stable' | 'degrading';
    criticalIssues: number;
    activeAlerts: number;
    interfacesAtRisk: number;
  };

  /** Interface-by-interface analysis */
  interfaces: {
    [interfaceId: string]: {
      currentMetrics: DivergenceMetrics;
      historicalTrend: Array<{
        date: Date;
        score: number;
        change: number;
      }>;
      topIssues: DivergenceIssue[];
      recommendations: string[];
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
    };
  };

  /** Cross-interface analysis */
  crossInterface: {
    compatibilityMatrix: Record<string, Record<string, number>>;
    divergenceClusters: Array<{
      interfaces: string[];
      commonIssues: string[];
      divergenceScore: number;
    }>;
    systemicRisks: Array<{
      type: string;
      description: string;
      affectedInterfaces: string[];
      impact: 'low' | 'medium' | 'high' | 'critical';
    }>;
  };

  /** Performance analysis */
  performance: {
    latency: {
      average: number;
      trend: 'improving' | 'stable' | 'degrading';
      outliers: string[];
    };
    throughput: {
      average: number;
      trend: 'improving' | 'stable' | 'degrading';
      outliers: string[];
    };
    resources: {
      memory: { average: number; trend: string };
      cpu: { average: number; trend: string };
    };
  };

  /** Alert analysis */
  alerts: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    trends: {
      increasing: string[];
      decreasing: string[];
      stable: string[];
    };
    meanTimeToResolution: number;
  };

  /** Recommendations */
  recommendations: Array<{
    priority: 'urgent' | 'high' | 'medium' | 'low';
    category: 'immediate' | 'short-term' | 'long-term';
    description: string;
    affectedInterfaces: string[];
    estimatedImpact: string;
    requiredActions: string[];
  }>;
}

/**
 * Monitors interface implementations for divergence and compatibility issues
 */
export class DivergenceMonitor extends EventEmitter {
  private config: MonitoringConfiguration;
  private interfaces: Map<string, InterfaceDefinition> = new Map();
  private metricsHistory: Map<string, DivergenceMetrics[]> = new Map();
  private activeAlerts: Map<string, DivergenceAlert> = new Map();
  private baselineMetrics: Map<string, DivergenceMetrics> = new Map();
  private monitoringTimer: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor(config: Partial<MonitoringConfiguration> = {}) {
    super();

    this.config = {
      intervals: {
        realtime: 60000,     // 1 minute
        periodic: 300000,    // 5 minutes
        deepAnalysis: 3600000 // 1 hour
      },
      thresholds: {
        schema: { warning: 20, critical: 40 },
        operational: { warning: 15, critical: 30 },
        performance: { warning: 25, critical: 50 },
        behavioral: { warning: 30, critical: 60 },
        overall: { warning: 20, critical: 35 }
      },
      alerts: {
        enabled: true,
        channels: ['log', 'webhook'],
        throttling: {
          enabled: true,
          maxAlertsPerHour: 10,
          cooldownPeriod: 300000 // 5 minutes
        },
        escalation: {
          enabled: true,
          levels: [
            { threshold: 25, severity: 'warning', delay: 0 },
            { threshold: 50, severity: 'error', delay: 300000 }, // 5 minutes
            { threshold: 75, severity: 'critical', delay: 900000 } // 15 minutes
          ]
        }
      },
      retention: {
        metrics: 30,      // days
        alerts: 90,       // days
        history: 365      // days
      },
      analysis: {
        baselineWindow: 7, // days
        trendWindow: 14,   // days
        seasonalityDetection: true,
        anomalyDetection: true,
        statisticalSignificance: 0.05
      },
      integration: {
        schemaRegistry: true,
        testResults: true,
        performanceMetrics: true,
        userFeedback: false
      },
      ...config
    };
  }

  /**
   * Start monitoring
   */
  public start(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.emit('monitoring-started');

    // Start periodic monitoring
    this.startPeriodicMonitoring();

    // Run initial analysis
    this.runInitialAnalysis();
  }

  /**
   * Stop monitoring
   */
  public stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }

    this.emit('monitoring-stopped');
  }

  /**
   * Register an interface for monitoring
   */
  public registerInterface(interfaceDef: InterfaceDefinition): void {
    this.interfaces.set(interfaceDef.id, interfaceDef);
    this.initializeInterfaceMetrics(interfaceDef.id);
    this.emit('interface-registered', { interfaceId: interfaceDef.id });
  }

  /**
   * Unregister an interface
   */
  public unregisterInterface(interfaceId: string): void {
    this.interfaces.delete(interfaceId);
    this.metricsHistory.delete(interfaceId);
    this.baselineMetrics.delete(interfaceId);
    this.emit('interface-unregistered', { interfaceId });
  }

  /**
   * Get current divergence metrics for an interface
   */
  public getCurrentMetrics(interfaceId: string): DivergenceMetrics | null {
    const history = this.metricsHistory.get(interfaceId);
    return history && history.length > 0 ? history[history.length - 1] : null;
  }

  /**
   * Get metrics history for an interface
   */
  public getMetricsHistory(
    interfaceId: string,
    timeRange?: { start: Date; end: Date }
  ): DivergenceMetrics[] {
    const history = this.metricsHistory.get(interfaceId) || [];

    if (!timeRange) {
      return history;
    }

    return history.filter(metrics =>
      metrics.timestamp >= timeRange.start && metrics.timestamp <= timeRange.end
    );
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(filter?: {
    severity?: DivergenceAlert['severity'];
    type?: DivergenceAlert['type'];
    interfaceId?: string;
  }): DivergenceAlert[] {
    let alerts = Array.from(this.activeAlerts.values());

    if (filter) {
      if (filter.severity) {
        alerts = alerts.filter(alert => alert.severity === filter.severity);
      }
      if (filter.type) {
        alerts = alerts.filter(alert => alert.type === filter.type);
      }
      if (filter.interfaceId) {
        alerts = alerts.filter(alert =>
          alert.affectedInterfaces.includes(filter.interfaceId!)
        );
      }
    }

    return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string,
    notes?: string
  ): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    this.emit('alert-acknowledged', { alertId, acknowledgedBy, notes });
    return true;
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(
    alertId: string,
    resolvedBy: string,
    resolution: string
  ): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedBy = resolvedBy;
    alert.resolvedAt = new Date();
    alert.resolution = resolution;

    // Remove from active alerts
    this.activeAlerts.delete(alertId);

    this.emit('alert-resolved', { alertId, resolvedBy, resolution });
    return true;
  }

  /**
   * Force analysis of all interfaces
   */
  public async forceAnalysis(): Promise<Map<string, DivergenceMetrics>> {
    const results = new Map<string, DivergenceMetrics>();

    for (const [interfaceId, interfaceDef] of this.interfaces.entries()) {
      try {
        const metrics = await this.analyzeInterface(interfaceDef);
        results.set(interfaceId, metrics);
        this.updateMetricsHistory(interfaceId, metrics);
      } catch (error) {
        this.emit('analysis-error', { interfaceId, error });
      }
    }

    this.emit('analysis-completed', { results });
    return results;
  }

  /**
   * Generate monitoring report
   */
  public async generateReport(
    timeRange?: { start: Date; end: Date }
  ): Promise<MonitoringReport> {
    const now = new Date();
    const defaultTimeRange = {
      start: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: now
    };

    const reportTimeRange = timeRange || defaultTimeRange;

    // Collect metrics for all interfaces
    const interfaces: MonitoringReport['interfaces'] = {};
    let totalDivergence = 0;
    let interfacesAtRisk = 0;

    for (const [interfaceId, interfaceDef] of this.interfaces.entries()) {
      const currentMetrics = this.getCurrentMetrics(interfaceId);
      const historicalTrend = this.calculateHistoricalTrend(interfaceId, reportTimeRange);

      if (currentMetrics) {
        interfaces[interfaceId] = {
          currentMetrics,
          historicalTrend,
          topIssues: this.getTopIssues(interfaceId),
          recommendations: this.generateInterfaceRecommendations(interfaceId),
          riskLevel: this.calculateRiskLevel(currentMetrics.overallScore)
        };

        totalDivergence += currentMetrics.overallScore;
        if (currentMetrics.overallScore > this.config.thresholds.overall.warning) {
          interfacesAtRisk++;
        }
      }
    }

    const overallDivergence = this.interfaces.size > 0 ? totalDivergence / this.interfaces.size : 0;
    const trendDirection = this.calculateOverallTrend();

    // Generate cross-interface analysis
    const crossInterface = await this.analyzeCrossInterfaceDivergence(reportTimeRange);

    // Generate performance analysis
    const performance = this.analyzePerformanceMetrics(reportTimeRange);

    // Generate alert analysis
    const alerts = this.analyzeAlerts(reportTimeRange);

    // Generate recommendations
    const recommendations = this.generateRecommendations(interfaces, crossInterface, alerts);

    const report: MonitoringReport = {
      metadata: {
        generatedAt: now,
        timeRange: reportTimeRange,
        interfacesMonitored: this.interfaces.size,
        dataPoints: Array.from(this.metricsHistory.values())
          .reduce((sum, history) => sum + history.length, 0)
      },
      summary: {
        overallDivergence,
        trendDirection,
        criticalIssues: alerts.bySeverity.critical || 0,
        activeAlerts: this.activeAlerts.size,
        interfacesAtRisk
      },
      interfaces,
      crossInterface,
      performance,
      alerts,
      recommendations
    };

    this.emit('report-generated', { report });
    return report;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<MonitoringConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config-updated', this.config);
  }

  // Private methods

  private startPeriodicMonitoring(): void {
    this.monitoringTimer = setInterval(async () => {
      if (this.isMonitoring) {
        await this.performPeriodicAnalysis();
      }
    }, this.config.intervals.periodic);
  }

  private async runInitialAnalysis(): Promise<void> {
    try {
      await this.forceAnalysis();
      this.emit('initial-analysis-completed');
    } catch (error) {
      this.emit('initial-analysis-failed', error);
    }
  }

  private async performPeriodicAnalysis(): Promise<void> {
    try {
      const results = await this.forceAnalysis();

      // Check for threshold breaches
      for (const [interfaceId, metrics] of results.entries()) {
        this.checkThresholds(interfaceId, metrics);
      }

      // Analyze trends
      this.analyzeTrends();

      // Clean old data
      this.cleanupOldData();

    } catch (error) {
      this.emit('periodic-analysis-failed', error);
    }
  }

  private initializeInterfaceMetrics(interfaceId: string): void {
    if (!this.metricsHistory.has(interfaceId)) {
      this.metricsHistory.set(interfaceId, []);
    }
  }

  private async analyzeInterface(interfaceDef: InterfaceDefinition): Promise<DivergenceMetrics> {
    const timestamp = new Date();

    // Analyze schema divergence
    const schemaDivergence = await this.analyzeSchemaDivergence(interfaceDef);

    // Analyze operational divergence
    const operationalDivergence = await this.analyzeOperationalDivergence(interfaceDef);

    // Analyze performance divergence
    const performanceDivergence = await this.analyzePerformanceDivergence(interfaceDef);

    // Analyze behavioral divergence
    const behavioralDivergence = await this.analyzeBehavioralDivergence(interfaceDef);

    // Calculate overall score
    const overallScore = (
      schemaDivergence.score * 0.25 +
      operationalDivergence.score * 0.25 +
      performanceDivergence.score * 0.25 +
      behavioralDivergence.score * 0.25
    );

    // Analyze trend
    const trend = this.analyzeInterfaceTrend(interfaceDef.id, overallScore);

    return {
      interfaceId: interfaceDef.id,
      timestamp,
      schemaDivergence,
      operationalDivergence,
      performanceDivergence,
      behavioralDivergence,
      overallScore,
      trend
    };
  }

  private async analyzeSchemaDivergence(
    interfaceDef: InterfaceDefinition
  ): Promise<{ score: number; issues: DivergenceIssue[]; driftRate: number }> {
    const issues: DivergenceIssue[] = [];
    let score = 0;

    // Check for missing or incompatible schemas
    for (const operation of interfaceDef.operations) {
      if (operation.inputSchema) {
        // In a real implementation, this would validate against schema registry
        // For now, generate placeholder issues
        if (Math.random() < 0.1) { // 10% chance of issue
          issues.push({
            id: `schema-${operation.id}-${Date.now()}`,
            type: 'schema',
            severity: 'medium',
            description: `Input schema validation issue in operation ${operation.id}`,
            location: { interface: interfaceDef.id, operation: operation.id, schema: operation.inputSchema },
            details: { threshold: this.config.thresholds.schema.warning },
            firstDetected: new Date(),
            lastDetected: new Date(),
            frequency: 1
          });
          score += 10;
        }
      }
    }

    return { score: Math.min(100, score), issues, driftRate: 0.1 };
  }

  private async analyzeOperationalDivergence(
    interfaceDef: InterfaceDefinition
  ): Promise<{ score: number; issues: DivergenceIssue[]; missingOperations: string[]; incompatibleChanges: string[] }> {
    const issues: DivergenceIssue[] = [];
    const missingOperations: string[] = [];
    const incompatibleChanges: string[] = [];
    let score = 0;

    // Check for missing operations
    for (const operation of interfaceDef.operations) {
      if (!operation.implementation.implemented) {
        missingOperations.push(operation.id);
        issues.push({
          id: `missing-op-${operation.id}-${Date.now()}`,
          type: 'operation',
          severity: 'high',
          description: `Operation ${operation.id} is not implemented`,
          location: { interface: interfaceDef.id, operation: operation.id },
          details: { expected: 'implemented', actual: 'not implemented' },
          firstDetected: new Date(),
          lastDetected: new Date(),
          frequency: 1
        });
        score += 20;
      }
    }

    return { score: Math.min(100, score), issues, missingOperations, incompatibleChanges };
  }

  private async analyzePerformanceDivergence(
    interfaceDef: InterfaceDefinition
  ): Promise<{ score: number; issues: DivergenceIssue[]; latencyDrift: number; throughputDrift: number; resourceDrift: number }> {
    const issues: DivergenceIssue[] = [];
    let score = 0;

    // Analyze performance metrics
    for (const operation of interfaceDef.operations) {
      if (operation.performance) {
        const { averageLatency, throughput } = operation.performance;

        // Check latency
        if (averageLatency && averageLatency > 5000) { // 5 seconds
          issues.push({
            id: `latency-${operation.id}-${Date.now()}`,
            type: 'performance',
            severity: 'medium',
            description: `High latency in operation ${operation.id}: ${averageLatency}ms`,
            location: { interface: interfaceDef.id, operation: operation.id },
            details: { actual: averageLatency, threshold: 5000 },
            firstDetected: new Date(),
            lastDetected: new Date(),
            frequency: 1
          });
          score += 15;
        }

        // Check throughput
        if (throughput && throughput < 10) { // Less than 10 ops/sec
          issues.push({
            id: `throughput-${operation.id}-${Date.now()}`,
            type: 'performance',
            severity: 'medium',
            description: `Low throughput in operation ${operation.id}: ${throughput} ops/sec`,
            location: { interface: interfaceDef.id, operation: operation.id },
            details: { actual: throughput, threshold: 10 },
            firstDetected: new Date(),
            lastDetected: new Date(),
            frequency: 1
          });
          score += 10;
        }
      }
    }

    return {
      score: Math.min(100, score),
      issues,
      latencyDrift: 0.05,
      throughputDrift: -0.02,
      resourceDrift: 0.1
    };
  }

  private async analyzeBehavioralDivergence(
    interfaceDef: InterfaceDefinition
  ): Promise<{ score: number; issues: DivergenceIssue[]; outputInconsistencies: string[]; errorHandlingDifferences: string[] }> {
    const issues: DivergenceIssue[] = [];
    const outputInconsistencies: string[] = [];
    const errorHandlingDifferences: string[] = [];
    let score = 0;

    // In a real implementation, this would analyze actual behavior
    // For now, generate placeholder analysis
    if (Math.random() < 0.2) { // 20% chance of behavioral issues
      issues.push({
        id: `behavior-${interfaceDef.id}-${Date.now()}`,
        type: 'behavior',
        severity: 'medium',
        description: `Behavioral inconsistency detected in interface ${interfaceDef.id}`,
        location: { interface: interfaceDef.id },
        details: { threshold: this.config.thresholds.behavioral.warning },
        firstDetected: new Date(),
        lastDetected: new Date(),
        frequency: 1
      });
      score += 25;
    }

    return { score: Math.min(100, score), issues, outputInconsistencies, errorHandlingDifferences };
  }

  private analyzeInterfaceTrend(interfaceId: string, currentScore: number): DivergenceMetrics['trend'] {
    const history = this.metricsHistory.get(interfaceId) || [];
    if (history.length < 2) {
      return { direction: 'stable', rate: 0, confidence: 0 };
    }

    const recentScores = history.slice(-5).map(h => h.overallScore);
    const averageScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;

    let direction: 'improving' | 'stable' | 'degrading';
    let rate: number;

    if (currentScore < averageScore - 5) {
      direction = 'improving';
      rate = (averageScore - currentScore) / averageScore;
    } else if (currentScore > averageScore + 5) {
      direction = 'degrading';
      rate = (currentScore - averageScore) / averageScore;
    } else {
      direction = 'stable';
      rate = 0;
    }

    const confidence = Math.min(1, history.length / 10); // More history = higher confidence

    return { direction, rate, confidence };
  }

  private updateMetricsHistory(interfaceId: string, metrics: DivergenceMetrics): void {
    const history = this.metricsHistory.get(interfaceId) || [];
    history.push(metrics);

    // Keep only recent data based on retention policy
    const maxAge = this.config.retention.metrics * 24 * 60 * 60 * 1000; // Convert days to ms
    const cutoffTime = new Date(Date.now() - maxAge);

    const filteredHistory = history.filter(m => m.timestamp >= cutoffTime);
    this.metricsHistory.set(interfaceId, filteredHistory);
  }

  private checkThresholds(interfaceId: string, metrics: DivergenceMetrics): void {
    const thresholds = this.config.thresholds;

    // Check overall threshold
    if (metrics.overallScore > thresholds.overall.critical) {
      this.createAlert('threshold-exceeded', 'critical', {
        title: 'Critical Divergence Detected',
        description: `Interface ${interfaceId} has critical divergence score: ${metrics.overallScore.toFixed(1)}`,
        affectedInterfaces: [interfaceId],
        metrics: {
          divergenceScore: metrics.overallScore,
          threshold: thresholds.overall.critical,
          actualValue: metrics.overallScore,
          trend: metrics.trend.direction
        }
      });
    } else if (metrics.overallScore > thresholds.overall.warning) {
      this.createAlert('threshold-exceeded', 'warning', {
        title: 'Divergence Warning',
        description: `Interface ${interfaceId} has elevated divergence score: ${metrics.overallScore.toFixed(1)}`,
        affectedInterfaces: [interfaceId],
        metrics: {
          divergenceScore: metrics.overallScore,
          threshold: thresholds.overall.warning,
          actualValue: metrics.overallScore,
          trend: metrics.trend.direction
        }
      });
    }

    // Check specific category thresholds
    const categories = [
      { name: 'schema', metrics: metrics.schemaDivergence },
      { name: 'operational', metrics: metrics.operationalDivergence },
      { name: 'performance', metrics: metrics.performanceDivergence },
      { name: 'behavioral', metrics: metrics.behavioralDivergence }
    ];

    for (const category of categories) {
      const threshold = thresholds[category.name as keyof typeof thresholds];
      if (category.metrics.score > threshold.critical) {
        this.createAlert('threshold-exceeded', 'critical', {
          title: `Critical ${category.name} Divergence`,
          description: `Interface ${interfaceId} has critical ${category.name} divergence: ${category.metrics.score.toFixed(1)}`,
          affectedInterfaces: [interfaceId],
          metrics: {
            divergenceScore: category.metrics.score,
            threshold: threshold.critical,
            actualValue: category.metrics.score,
            trend: metrics.trend.direction
          }
        });
      }
    }
  }

  private createAlert(
    type: DivergenceAlert['type'],
    severity: DivergenceAlert['severity'],
    data: Partial<DivergenceAlert>
  ): void {
    if (!this.config.alerts.enabled) {
      return;
    }

    // Check alert throttling
    if (this.config.alerts.throttling.enabled) {
      const recentAlerts = Array.from(this.activeAlerts.values())
        .filter(alert => alert.type === type && alert.affectedInterfaces.some(id =>
          data.affectedInterfaces!.includes(id)
        ))
        .filter(alert =>
          Date.now() - alert.createdAt.getTime() < this.config.alerts.throttling.cooldownPeriod
        );

      if (recentAlerts.length >= this.config.alerts.throttling.maxAlertsPerHour) {
        return; // Throttled
      }
    }

    const alertId = `alert-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const alert: DivergenceAlert = {
      id: alertId,
      type,
      severity,
      title: data.title || `${type} Alert`,
      description: data.description || 'Alert triggered',
      affectedInterfaces: data.affectedInterfaces || [],
      metrics: data.metrics || {
        divergenceScore: 0,
        threshold: 0,
        actualValue: 0,
        trend: 'stable'
      },
      context: {
        timeWindow: 'last 24 hours',
        comparison: 'vs baseline',
        baseline: '7 day average'
      },
      recommendations: data.recommendations || [],
      createdAt: new Date(),
      acknowledged: false,
      resolved: false
    };

    this.activeAlerts.set(alertId, alert);
    this.emit('alert-created', { alert });

    // Send alert through configured channels
    this.sendAlert(alert);
  }

  private sendAlert(alert: DivergenceAlert): void {
    for (const channel of this.config.alerts.channels) {
      switch (channel) {
        case 'log':
          console.warn(`🚨 DIVERGENCE ALERT [${alert.severity.toUpperCase()}]: ${alert.title}`);
          console.warn(`   ${alert.description}`);
          break;
        case 'webhook':
          // In a real implementation, this would send to webhook
          this.emit('webhook-alert', { alert });
          break;
        case 'email':
          // In a real implementation, this would send email
          this.emit('email-alert', { alert });
          break;
        case 'slack':
          // In a real implementation, this would send to Slack
          this.emit('slack-alert', { alert });
          break;
      }
    }
  }

  private analyzeTrends(): void {
    for (const [interfaceId, history] of this.metricsHistory.entries()) {
      if (history.length < 3) continue;

      const recent = history.slice(-3);
      const scores = recent.map(h => h.overallScore);

      // Check for concerning trends
      const trend = this.calculateTrend(scores);
      if (trend.direction === 'degrading' && trend.rate > 0.1) {
        this.createAlert('trend-detected', 'warning', {
          title: 'Degrading Trend Detected',
          description: `Interface ${interfaceId} shows degrading divergence trend`,
          affectedInterfaces: [interfaceId],
          recommendations: ['Investigate recent changes', 'Review deployment logs', 'Consider rollback if necessary']
        });
      }
    }
  }

  private calculateTrend(values: number[]): { direction: 'improving' | 'stable' | 'degrading'; rate: number } {
    if (values.length < 2) {
      return { direction: 'stable', rate: 0 };
    }

    const first = values[0];
    const last = values[values.length - 1];
    const change = (last - first) / first;

    let direction: 'improving' | 'stable' | 'degrading';
    if (change > 0.05) {
      direction = 'degrading';
    } else if (change < -0.05) {
      direction = 'improving';
    } else {
      direction = 'stable';
    }

    return { direction, rate: Math.abs(change) };
  }

  private cleanupOldData(): void {
    const cutoffTime = new Date(Date.now() - this.config.retention.metrics * 24 * 60 * 60 * 1000);

    // Clean metrics history
    for (const [interfaceId, history] of this.metricsHistory.entries()) {
      const filtered = history.filter(m => m.timestamp >= cutoffTime);
      this.metricsHistory.set(interfaceId, filtered);
    }

    // Clean resolved alerts
    const alertCutoffTime = new Date(Date.now() - this.config.retention.alerts * 24 * 60 * 60 * 1000);
    for (const [alertId, alert] of this.activeAlerts.entries()) {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt < alertCutoffTime) {
        this.activeAlerts.delete(alertId);
      }
    }
  }

  private calculateHistoricalTrend(interfaceId: string, timeRange: { start: Date; end: Date }): MonitoringReport['interfaces'][string]['historicalTrend'] {
    const history = this.getMetricsHistory(interfaceId, timeRange);

    return history.map(metrics => {
      const previousMetrics = history[history.indexOf(metrics) - 1];
      const change = previousMetrics
        ? metrics.overallScore - previousMetrics.overallScore
        : 0;

      return {
        date: metrics.timestamp,
        score: metrics.overallScore,
        change
      };
    });
  }

  private getTopIssues(interfaceId: string): DivergenceIssue[] {
    const history = this.metricsHistory.get(interfaceId) || [];
    const allIssues = history.flatMap(h => [
      ...h.schemaDivergence.issues,
      ...h.operationalDivergence.issues,
      ...h.performanceDivergence.issues,
      ...h.behavioralDivergence.issues
    ]);

    // Group by severity and frequency
    const issueGroups = new Map<string, DivergenceIssue & { frequency: number }>();

    for (const issue of allIssues) {
      const key = `${issue.type}-${issue.location.operation || 'global'}`;
      const existing = issueGroups.get(key);

      if (existing) {
        existing.frequency++;
        if (issue.severity === 'critical' || issue.severity === 'high') {
          existing.severity = issue.severity;
        }
      } else {
        issueGroups.set(key, { ...issue, frequency: 1 });
      }
    }

    return Array.from(issueGroups.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  private generateInterfaceRecommendations(interfaceId: string): string[] {
    const metrics = this.getCurrentMetrics(interfaceId);
    if (!metrics) return [];

    const recommendations: string[] = [];

    if (metrics.overallScore > this.config.thresholds.overall.critical) {
      recommendations.push('Immediate attention required - critical divergence detected');
    }

    if (metrics.schemaDivergence.score > this.config.thresholds.schema.warning) {
      recommendations.push('Review and update schema definitions');
    }

    if (metrics.operationalDivergence.score > this.config.thresholds.operational.warning) {
      recommendations.push('Complete implementation of missing operations');
    }

    if (metrics.performanceDivergence.score > this.config.thresholds.performance.warning) {
      recommendations.push('Optimize performance characteristics');
    }

    if (metrics.trend.direction === 'degrading' && metrics.trend.rate > 0.1) {
      recommendations.push('Investigate recent changes causing divergence');
    }

    if (recommendations.length === 0) {
      recommendations.push('Interface is performing well - continue monitoring');
    }

    return recommendations;
  }

  private calculateRiskLevel(divergenceScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (divergenceScore > this.config.thresholds.overall.critical) return 'critical';
    if (divergenceScore > this.config.thresholds.overall.warning) return 'high';
    if (divergenceScore > this.config.thresholds.overall.warning / 2) return 'medium';
    return 'low';
  }

  private async analyzeCrossInterfaceDivergence(timeRange: { start: Date; end: Date }): Promise<MonitoringReport['crossInterface']> {
    // Placeholder implementation
    return {
      compatibilityMatrix: {},
      divergenceClusters: [],
      systemicRisks: []
    };
  }

  private analyzePerformanceMetrics(timeRange: { start: Date; end: Date }): MonitoringReport['performance'] {
    // Placeholder implementation
    return {
      latency: { average: 100, trend: 'stable', outliers: [] },
      throughput: { average: 50, trend: 'improving', outliers: [] },
      resources: {
        memory: { average: 256, trend: 'stable' },
        cpu: { average: 30, trend: 'stable' }
      }
    };
  }

  private analyzeAlerts(timeRange: { start: Date; end: Date }): MonitoringReport['alerts'] {
    const alerts = Array.from(this.activeAlerts.values())
      .filter(alert => alert.createdAt >= timeRange.start && alert.createdAt <= timeRange.end);

    const byType = alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: alerts.length,
      byType,
      bySeverity,
      trends: { increasing: [], decreasing: [], stable: [] },
      meanTimeToResolution: 0
    };
  }

  private generateRecommendations(
    interfaces: MonitoringReport['interfaces'],
    crossInterface: MonitoringReport['crossInterface'],
    alerts: MonitoringReport['alerts']
  ): MonitoringReport['recommendations'] {
    const recommendations: MonitoringReport['recommendations'] = [];

    // Analyze critical interfaces
    const criticalInterfaces = Object.entries(interfaces)
      .filter(([, data]) => data.riskLevel === 'critical')
      .map(([id]) => id);

    if (criticalInterfaces.length > 0) {
      recommendations.push({
        priority: 'urgent',
        category: 'immediate',
        description: `Address critical divergence in ${criticalInterfaces.length} interfaces`,
        affectedInterfaces: criticalInterfaces,
        estimatedImpact: 'High',
        requiredActions: ['Immediate investigation', 'Potential rollback', 'Hotfix deployment']
      });
    }

    // Add more recommendation logic based on analysis
    if (alerts.total > 10) {
      recommendations.push({
        priority: 'high',
        category: 'short-term',
        description: 'High alert volume detected - review monitoring thresholds',
        affectedInterfaces: [],
        estimatedImpact: 'Medium',
        requiredActions: ['Review alert configuration', 'Investigate root causes', 'Improve system stability']
      });
    }

    return recommendations;
  }

  private calculateOverallTrend(): 'improving' | 'stable' | 'degrading' {
    const allScores = Array.from(this.metricsHistory.values())
      .flatMap(history => history.slice(-5).map(m => m.overallScore));

    if (allScores.length < 2) return 'stable';

    const trend = this.calculateTrend(allScores);
    return trend.direction;
  }
}