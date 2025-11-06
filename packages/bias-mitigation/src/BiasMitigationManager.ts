/**
 * Bias Mitigation Manager
 *
 * Main orchestrator for all bias mitigation components.
 * Coordinates detection, decay, normalization, and correction systems.
 */

import { EventEmitter } from 'events';
import { TemporalBiasDetector } from './detection/TemporalBiasDetector.js';
import { BiasedPatternDetector, BiasPattern } from './detection/BiasedPatternDetector.js';
import { TemporalDecayManager, WeightDecayApplier } from './decay/index.js';
import { TemporalNormalizer } from './normalization/index.js';
import { BiasCorrectionEngine } from './correction/index.js';
import { SkillWeights, ActivationMetrics } from './types/index.js';

export interface BiasMitigationConfig {
  /** Enable/disable different components */
  components: {
    detection: boolean;
    decay: boolean;
    normalization: boolean;
    correction: boolean;
  };

  /** Analysis intervals */
  analysis: {
    patternDetection: number; // ms
    biasAnalysis: number; // ms
    normalizationUpdate: number; // ms
    correctionValidation: number; // ms
  };

  /** Data retention settings */
  retention: {
    biasHistory: number; // ms
    correctionHistory: number; // ms
    metricsHistory: number; // ms
  };

  /** Alert settings */
  alerts: {
    enabled: boolean;
    channels: ('console' | 'log' | 'webhook')[];
    thresholds: {
      criticalBias: number;
      correctionFailure: number;
      performanceDegradation: number;
    };
  };

  /** Global settings */
  global: {
    dryRun: boolean; // If true, don't apply corrections
    maxCorrectionsPerHour: number;
    requireApprovalForCritical: boolean;
  };
}

export interface BiasMitigationStatus {
  /** Component status */
  components: {
    detector: { active: boolean; lastRun?: Date };
    patternDetector: { active: boolean; lastRun?: Date };
    decayManager: { active: boolean; lastRun?: Date };
    normalizer: { active: boolean; lastRun?: Date };
    correctionEngine: { active: boolean; lastRun?: Date };
  };

  /** Current metrics */
  metrics: {
    totalBiasesDetected: number;
    activeBiases: number;
    correctionsApplied: number;
    averageBiasReduction: number;
    systemHealth: number; // 0-1
  };

  /** Recent activity */
  recentActivity: Array<{
    timestamp: Date;
    type: 'bias-detected' | 'correction-applied' | 'alert-triggered';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export interface BiasMitigationReport {
  /** Report metadata */
  metadata: {
    generatedAt: Date;
    timeRange: { start: Date; end: Date };
    dataPoints: number;
  };

  /** Executive summary */
  summary: {
    overallBiasLevel: number; // 0-1
    systemHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    criticalIssues: number;
    recommendations: string[];
  };

  /** Component reports */
  components: {
    detection: any;
    decay: any;
    normalization: any;
    correction: any;
  };

  /** Trend analysis */
  trends: {
    biasTrend: 'improving' | 'stable' | 'degrading';
    performanceTrend: 'improving' | 'stable' | 'degrading';
    correctionEffectiveness: number;
  };
}

/**
 * Main manager for bias mitigation system
 */
export class BiasMitigationManager extends EventEmitter {
  private config: BiasMitigationConfig;
  private components: {
    temporalBiasDetector: TemporalBiasDetector;
    patternDetector: BiasedPatternDetector;
    decayManager: TemporalDecayManager;
    weightDecayApplier: WeightDecayApplier;
    normalizer: TemporalNormalizer;
    correctionEngine: BiasCorrectionEngine;
  };

  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isActive = false;
  private status: BiasMitigationStatus;

  constructor(config: Partial<BiasMitigationConfig> = {}) {
    super();

    this.config = {
      components: {
        detection: true,
        decay: true,
        normalization: true,
        correction: false // Disabled by default for safety
      },
      analysis: {
        patternDetection: 300000, // 5 minutes
        biasAnalysis: 600000,     // 10 minutes
        normalizationUpdate: 900000, // 15 minutes
        correctionValidation: 1200000 // 20 minutes
      },
      retention: {
        biasHistory: 7 * 24 * 60 * 60 * 1000,    // 7 days
        correctionHistory: 30 * 24 * 60 * 60 * 1000, // 30 days
        metricsHistory: 90 * 24 * 60 * 60 * 1000    // 90 days
      },
      alerts: {
        enabled: true,
        channels: ['console', 'log'],
        thresholds: {
          criticalBias: 0.8,
          correctionFailure: 0.3,
          performanceDegradation: 0.2
        }
      },
      global: {
        dryRun: true,
        maxCorrectionsPerHour: 10,
        requireApprovalForCritical: true
      },
      ...config
    };

    this.initializeComponents();
    this.setupEventHandlers();
    this.initializeStatus();
  }

  /**
   * Start the bias mitigation system
   */
  public async start(): Promise<void> {
    if (this.isActive) {
      throw new Error('Bias mitigation system is already active');
    }

    this.isActive = true;
    this.emit('system-started');

    // Start periodic analysis
    this.startPeriodicAnalysis();

    // Run initial analysis
    await this.runInitialAnalysis();

    this.emit('system-ready');
  }

  /**
   * Stop the bias mitigation system
   */
  public stop(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;

    // Clear all timers
    this.timers.forEach(timer => clearInterval(timer));
    this.timers.clear();

    this.emit('system-stopped');
  }

  /**
   * Analyze skill activation data for biases
   */
  public async analyzeSkillData(data: {
    activations: any[];
    weights: Record<string, SkillWeights>;
    metrics: Record<string, ActivationMetrics>;
  }): Promise<BiasPattern[]> {
    if (!this.config.components.detection) {
      throw new Error('Detection component is disabled');
    }

    // Detect biased patterns
    const patterns = await this.components.patternDetector.analyzeSkillActivations(data.activations);

    // Analyze temporal bias
    const temporalBias = await this.components.temporalBiasDetector.analyzeTemporalBias(data.activations);

    // Update status
    this.status.components.patternDetector.lastRun = new Date();
    this.status.components.detector.lastRun = new Date();
    this.status.metrics.totalBiasesDetected += patterns.length;
    this.status.metrics.activeBiases = patterns.filter(p => p.severity > 0.5).length;

    this.emit('analysis-completed', { patterns, temporalBias });

    return patterns;
  }

  /**
   * Apply decay to skill weights
   */
  public applyDecay(
    skillsData: Array<{
      skillId: string;
      weights: SkillWeights;
      lastUpdated: Date;
      skillType?: string;
    }>
  ): Promise<Array<{ skillId: string; decayedWeights: any }>> {
    if (!this.config.components.decay) {
      throw new Error('Decay component is disabled');
    }

    const result = this.components.weightDecayApplier.decayMultipleWeights(skillsData);

    this.status.components.decayManager.lastRun = new Date();

    this.emit('decay-applied', { skillsProcessed: skillsData.length });

    return result;
  }

  /**
   * Normalize activation metrics
   */
  public async normalizeMetrics(
    metrics: ActivationMetrics[],
    historicalData?: Record<string, ActivationMetrics[]>
  ): Promise<any[]> {
    if (!this.config.components.normalization) {
      throw new Error('Normalization component is disabled');
    }

    const result = await this.components.normalizer.normalizeMultiple(metrics, historicalData);

    this.status.components.normalizer.lastRun = new Date();

    this.emit('normalization-completed', { metricsProcessed: metrics.length });

    return result;
  }

  /**
   * Apply bias corrections
   */
  public async applyCorrections(patterns: BiasPattern[], context?: any): Promise<any[]> {
    if (!this.config.components.correction) {
      throw new Error('Correction component is disabled');
    }

    if (this.config.global.dryRun) {
      this.emit('dry-run-correction', { patterns });
      return [];
    }

    const corrections = await this.components.correctionEngine.applyMultipleCorrections(patterns, context);

    this.status.components.correctionEngine.lastRun = new Date();
    this.status.metrics.correctionsApplied += corrections.length;

    this.emit('corrections-applied', { corrections });

    return corrections;
  }

  /**
   * Get current system status
   */
  public getStatus(): BiasMitigationStatus {
    return { ...this.status };
  }

  /**
   * Generate comprehensive report
   */
  public async generateReport(): Promise<BiasMitigationReport> {
    const now = new Date();
    const timeRange = {
      start: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: now
    };

    // Collect component reports
    const detectionReport = this.components.patternDetector.getDetectionReport();
    const decayReport = this.components.decayManager.getMetrics();
    const normalizationReport = this.components.normalizer.getMetrics();
    const correctionReport = this.components.correctionEngine.getCorrectionReport();

    // Calculate overall metrics
    const totalBiases = detectionReport.totalPatterns;
    const criticalBiases = detectionReport.severityDistribution.critical;
    const overallBiasLevel = Math.min(1, totalBiases / 10); // Normalize to 0-1

    // Determine system health
    let systemHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    if (criticalBiases === 0 && overallBiasLevel < 0.2) systemHealth = 'excellent';
    else if (criticalBiases <= 1 && overallBiasLevel < 0.4) systemHealth = 'good';
    else if (criticalBiases <= 3 && overallBiasLevel < 0.6) systemHealth = 'fair';
    else if (criticalBiases <= 5 && overallBiasLevel < 0.8) systemHealth = 'poor';
    else systemHealth = 'critical';

    // Generate recommendations
    const recommendations = this.generateRecommendations(detectionReport, correctionReport);

    // Analyze trends
    const trends = this.analyzeTrends(detectionReport, correctionReport);

    return {
      metadata: {
        generatedAt: now,
        timeRange,
        dataPoints: totalBiases
      },
      summary: {
        overallBiasLevel,
        systemHealth,
        criticalIssues: criticalBiases,
        recommendations
      },
      components: {
        detection: detectionReport,
        decay: decayReport,
        normalization: normalizationReport,
        correction: correctionReport
      },
      trends
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<BiasMitigationConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update component configurations
    if (newConfig.components) {
      this.updateComponentConfigurations();
    }

    this.emit('config-updated', this.config);
  }

  /**
   * Enable/disable components
   */
  public toggleComponent(component: keyof BiasMitigationConfig['components'], enabled: boolean): void {
    this.config.components[component] = enabled;
    this.emit('component-toggled', { component, enabled });
  }

  /**
   * Force immediate analysis
   */
  public async forceAnalysis(): Promise<void> {
    if (!this.isActive) {
      throw new Error('System is not active');
    }

    await this.runBiasAnalysis();
  }

  /**
   * Clear all history and reset
   */
  public reset(): void {
    // Clear component histories
    this.components.patternDetector.clearPatterns();
    this.components.decayManager.resetMetrics();
    this.components.normalizer.resetMetrics();
    this.components.correctionEngine.clearHistory();

    // Reset status
    this.initializeStatus();

    this.emit('system-reset');
  }

  /**
   * Destroy the manager
   */
  public destroy(): void {
    this.stop();

    // Destroy components
    this.components.temporalBiasDetector.destroy();
    this.components.decayManager.destroy();
    this.components.correctionEngine.destroy();

    this.removeAllListeners();
  }

  // Private methods

  private initializeComponents(): void {
    this.components = {
      temporalBiasDetector: new TemporalBiasDetector(),
      patternDetector: new BiasedPatternDetector({
        autoCorrection: {
          enabled: false
        }
      }),
      decayManager: new TemporalDecayManager(),
      weightDecayApplier: new WeightDecayApplier(),
      normalizer: new TemporalNormalizer(),
      correctionEngine: new BiasCorrectionEngine({
        autoCorrection: false,
        maxCorrectionFactor: 0.3
      })
    };
  }

  private setupEventHandlers(): void {
    // Pattern detection events
    this.components.patternDetector.on('critical-patterns-detected', (data) => {
      this.handleCriticalPatterns(data.patterns);
    });

    // Correction engine events
    this.components.correctionEngine.on('correction-applied', (data) => {
      this.handleCorrectionApplied(data);
    });

    // Performance monitoring
    this.components.patternDetector.on('analysis-completed', (data) => {
      this.updateSystemHealth();
    });
  }

  private initializeStatus(): void {
    this.status = {
      components: {
        detector: { active: false },
        patternDetector: { active: false },
        decayManager: { active: false },
        normalizer: { active: false },
        correctionEngine: { active: false }
      },
      metrics: {
        totalBiasesDetected: 0,
        activeBiases: 0,
        correctionsApplied: 0,
        averageBiasReduction: 0,
        systemHealth: 1
      },
      recentActivity: []
    };
  }

  private startPeriodicAnalysis(): void {
    if (this.config.components.detection) {
      this.timers.set('patternDetection', setInterval(() => {
        this.runPatternDetection();
      }, this.config.analysis.patternDetection));

      this.timers.set('biasAnalysis', setInterval(() => {
        this.runBiasAnalysis();
      }, this.config.analysis.biasAnalysis));
    }

    if (this.config.components.normalization) {
      this.timers.set('normalizationUpdate', setInterval(() => {
        this.updateNormalization();
      }, this.config.analysis.normalizationUpdate));
    }

    if (this.config.components.correction) {
      this.timers.set('correctionValidation', setInterval(() => {
        this.validateCorrections();
      }, this.config.analysis.correctionValidation));
    }
  }

  private async runInitialAnalysis(): Promise<void> {
    try {
      await this.runPatternDetection();
      await this.runBiasAnalysis();
      this.emit('initial-analysis-completed');
    } catch (error) {
      this.emit('initial-analysis-failed', error);
    }
  }

  private async runPatternDetection(): Promise<void> {
    if (!this.config.components.detection) return;

    try {
      this.status.components.patternDetector.active = true;
      // In a real implementation, this would analyze current data
      // For now, just update the status
      this.status.components.patternDetector.lastRun = new Date();
    } finally {
      this.status.components.patternDetector.active = false;
    }
  }

  private async runBiasAnalysis(): Promise<void> {
    if (!this.config.components.detection) return;

    try {
      this.status.components.detector.active = true;
      // In a real implementation, this would run comprehensive bias analysis
      this.status.components.detector.lastRun = new Date();
    } finally {
      this.status.components.detector.active = false;
    }
  }

  private async updateNormalization(): Promise<void> {
    if (!this.config.components.normalization) return;

    try {
      this.status.components.normalizer.active = true;
      // Update normalization baselines
      this.status.components.normalizer.lastRun = new Date();
    } finally {
      this.status.components.normalizer.active = false;
    }
  }

  private async validateCorrections(): Promise<void> {
    if (!this.config.components.correction) return;

    try {
      this.status.components.correctionEngine.active = true;
      // Validate existing corrections
      this.status.components.correctionEngine.lastRun = new Date();
    } finally {
      this.status.components.correctionEngine.active = false;
    }
  }

  private handleCriticalPatterns(patterns: BiasPattern[]): void {
    const activity = {
      timestamp: new Date(),
      type: 'bias-detected' as const,
      description: `${patterns.length} critical bias patterns detected`,
      severity: 'critical' as const
    };

    this.addRecentActivity(activity);
    this.triggerAlert(activity);
  }

  private handleCorrectionApplied(data: { pattern: BiasPattern; correction: any }): void {
    const activity = {
      timestamp: new Date(),
      type: 'correction-applied' as const,
      description: `Correction applied for ${data.pattern.type} bias`,
      severity: data.pattern.severity > 0.7 ? 'high' as const : 'medium' as const
    };

    this.addRecentActivity(activity);
  }

  private addRecentActivity(activity: any): void {
    this.status.recentActivity.unshift(activity);

    // Keep only last 50 activities
    if (this.status.recentActivity.length > 50) {
      this.status.recentActivity = this.status.recentActivity.slice(0, 50);
    }
  }

  private triggerAlert(activity: any): void {
    if (!this.config.alerts.enabled) return;

    const alert = {
      ...activity,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.config.alerts.channels.forEach(channel => {
      if (channel === 'console') {
        console.warn(`🚨 BIAS ALERT: ${activity.description}`);
      } else if (channel === 'log') {
        this.emit('alert', alert);
      }
    });

    this.emit('alert-triggered', alert);
  }

  private updateSystemHealth(): void {
    // Calculate system health based on various metrics
    const patterns = this.components.patternDetector.getPatterns();
    const corrections = this.components.correctionEngine.getCorrectionHistory();

    const criticalPatterns = patterns.filter(p => p.severity > 0.8).length;
    const failedCorrections = corrections.filter(c => !c.success).length;

    const healthScore = Math.max(0, 1 - (criticalPatterns * 0.2) - (failedCorrections * 0.1));
    this.status.metrics.systemHealth = healthScore;
  }

  private updateComponentConfigurations(): void {
    // Update component configurations based on global config
    // This would sync settings across all components
  }

  private generateRecommendations(detectionReport: any, correctionReport: any): string[] {
    const recommendations: string[] = [];

    if (detectionReport.severityDistribution.critical > 0) {
      recommendations.push('Immediate attention required for critical bias patterns');
    }

    if (correctionReport.successRate < 0.7) {
      recommendations.push('Review and improve correction strategies');
    }

    if (detectionReport.totalPatterns > 10) {
      recommendations.push('Consider increasing bias monitoring frequency');
    }

    if (recommendations.length === 0) {
      recommendations.push('System operating within normal parameters');
    }

    return recommendations;
  }

  private analyzeTrends(detectionReport: any, correctionReport: any): BiasMitigationReport['trends'] {
    // In a real implementation, this would analyze historical data
    // For now, return placeholder values
    return {
      biasTrend: 'stable',
      performanceTrend: 'stable',
      correctionEffectiveness: correctionReport.averageEffectiveness?.biasReduction || 0
    };
  }
}