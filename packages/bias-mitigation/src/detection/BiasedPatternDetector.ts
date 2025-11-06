/**
 * Biased Pattern Detector
 *
 * Automatically detects biased patterns in skill activation, user behavior,
 * and system performance to identify and mitigate systemic biases.
 */

import { EventEmitter } from 'events';

export interface BiasPattern {
  /** Unique identifier for the pattern */
  id: string;

  /** Type of bias */
  type: 'recency' | 'frequency' | 'popularity' | 'context' | 'temporal' | 'user-specific' | 'skill-specific';

  /** Severity level (0-1) */
  severity: number;

  /** Description of the bias */
  description: string;

  /** Affected skills or users */
  affectedEntities: string[];

  /** Pattern metrics */
  metrics: {
    deviation: number;
    confidence: number;
    persistence: number;
    impact: number;
  };

  /** Detection timestamp */
  detectedAt: Date;

  /** Recommended actions */
  recommendations: string[];

  /** Historical occurrences */
  occurrences: number;

  /** Pattern metadata */
  metadata: Record<string, any>;
}

export interface PatternDetectionConfig {
  /** Detection sensitivity (0-1) */
  sensitivity: number;

  /** Minimum confidence threshold */
  minConfidence: number;

  /** Pattern persistence threshold */
  persistenceThreshold: number;

  /** Enable different detection methods */
  detectionMethods: {
    statistical: boolean;
    mlBased: boolean;
    ruleBased: boolean;
    hybrid: boolean;
  };

  /** Time windows for analysis */
  timeWindows: {
    short: { value: number; unit: 'hours' | 'days' };
    medium: { value: number; unit: 'days' | 'weeks' };
    long: { value: number; unit: 'weeks' | 'months' };
  };

  /** Pattern types to detect */
  enabledPatternTypes: BiasPattern['type'][];

  /** Alert thresholds */
  alertThresholds: {
    severity: number;
    confidence: number;
    impact: number;
  };

  /** Auto-correction settings */
  autoCorrection: {
    enabled: boolean;
    maxCorrectionFactor: number;
    confirmationRequired: boolean;
  };
}

export interface SkillActivationData {
  skillId: string;
  userId?: string;
  context?: string;
  timestamp: Date;
  success: boolean;
  latency: number;
  score: number;
  metadata?: Record<string, any>;
}

export interface UserBehaviorData {
  userId: string;
  action: string;
  target: string;
  timestamp: Date;
  context: string;
  metadata?: Record<string, any>;
}

export interface SystemPerformanceData {
  metric: string;
  value: number;
  timestamp: Date;
  context: string;
  metadata?: Record<string, any>;
}

export interface DetectionReport {
  /** Total patterns detected */
  totalPatterns: number;

  /** Patterns by type */
  patternsByType: Record<string, number>;

  /** Severity distribution */
  severityDistribution: {
    critical: number; // > 0.8
    high: number;     // 0.6 - 0.8
    medium: number;   // 0.4 - 0.6
    low: number;      // < 0.4
  };

  /** Processing statistics */
  processingStats: {
    dataPointsProcessed: number;
    processingTime: number;
    memoryUsage: number;
    patternsPerSecond: number;
  };

  /** Top patterns by impact */
  topPatterns: BiasPattern[];

  /** Recommendations summary */
  recommendationsSummary: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

/**
 * Detects biased patterns in skill activation and system behavior
 */
export class BiasedPatternDetector extends EventEmitter {
  private config: PatternDetectionConfig;
  private patterns: Map<string, BiasPattern> = new Map();
  private detectionHistory: BiasPattern[] = [];
  private isRunning = false;

  constructor(config: Partial<PatternDetectionConfig> = {}) {
    super();

    this.config = {
      sensitivity: 0.7,
      minConfidence: 0.6,
      persistenceThreshold: 3,
      detectionMethods: {
        statistical: true,
        mlBased: false,
        ruleBased: true,
        hybrid: true
      },
      timeWindows: {
        short: { value: 1, unit: 'days' },
        medium: { value: 7, unit: 'days' },
        long: { value: 30, unit: 'days' }
      },
      enabledPatternTypes: ['recency', 'frequency', 'popularity', 'context', 'temporal', 'user-specific', 'skill-specific'],
      alertThresholds: {
        severity: 0.6,
        confidence: 0.7,
        impact: 0.5
      },
      autoCorrection: {
        enabled: false,
        maxCorrectionFactor: 0.3,
        confirmationRequired: true
      },
      ...config
    };
  }

  /**
   * Analyze skill activation data for biased patterns
   */
  public async analyzeSkillActivations(data: SkillActivationData[]): Promise<BiasPattern[]> {
    const startTime = Date.now();
    const detectedPatterns: BiasPattern[] = [];

    // Group data by different dimensions
    const bySkill = this.groupBySkill(data);
    const byUser = this.groupByUser(data);
    const byContext = this.groupByContext(data);
    const byTime = this.groupByTime(data);

    // Detect different types of bias
    if (this.config.enabledPatternTypes.includes('recency')) {
      detectedPatterns.push(...this.detectRecencyBias(data, byTime));
    }

    if (this.config.enabledPatternTypes.includes('frequency')) {
      detectedPatterns.push(...this.detectFrequencyBias(bySkill, byUser));
    }

    if (this.config.enabledPatternTypes.includes('popularity')) {
      detectedPatterns.push(...this.detectPopularityBias(bySkill));
    }

    if (this.config.enabledPatternTypes.includes('context')) {
      detectedPatterns.push(...this.detectContextBias(byContext));
    }

    if (this.config.enabledPatternTypes.includes('temporal')) {
      detectedPatterns.push(...this.detectTemporalBias(byTime));
    }

    if (this.config.enabledPatternTypes.includes('user-specific')) {
      detectedPatterns.push(...this.detectUserSpecificBias(byUser));
    }

    if (this.config.enabledPatternTypes.includes('skill-specific')) {
      detectedPatterns.push(...this.detectSkillSpecificBias(bySkill));
    }

    // Filter patterns by thresholds
    const filteredPatterns = detectedPatterns.filter(pattern =>
      pattern.metrics.confidence >= this.config.minConfidence &&
      pattern.severity >= this.config.alertThresholds.severity
    );

    // Update pattern registry
    this.updatePatternRegistry(filteredPatterns);

    // Emit events
    this.emit('analysis-completed', {
      dataPoints: data.length,
      patternsDetected: filteredPatterns.length,
      processingTime: Date.now() - startTime
    });

    // Trigger alerts for critical patterns
    this.triggerAlerts(filteredPatterns);

    return filteredPatterns;
  }

  /**
   * Analyze user behavior patterns
   */
  public async analyzeUserBehavior(data: UserBehaviorData[]): Promise<BiasPattern[]> {
    const patterns: BiasPattern[] = [];

    // Detect user behavior biases
    patterns.push(...this.detectUserActionBias(data));
    patterns.push(...this.detectUserPreferenceBias(data));
    patterns.push(...this.detectUserContextBias(data));

    return patterns;
  }

  /**
   * Analyze system performance patterns
   */
  public async analyzeSystemPerformance(data: SystemPerformanceData[]): Promise<BiasPattern[]> {
    const patterns: BiasPattern[] = [];

    // Detect performance biases
    patterns.push(...this.detectPerformanceBias(data));
    patterns.push(...this.detectResourceBias(data));
    patterns.push(...this.detectLatencyBias(data));

    return patterns;
  }

  /**
   * Get current detected patterns
   */
  public getPatterns(): BiasPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get patterns by type
   */
  public getPatternsByType(type: BiasPattern['type']): BiasPattern[] {
    return this.getPatterns().filter(pattern => pattern.type === type);
  }

  /**
   * Get patterns by severity
   */
  public getPatternsBySeverity(minSeverity: number): BiasPattern[] {
    return this.getPatterns().filter(pattern => pattern.severity >= minSeverity);
  }

  /**
   * Get detection report
   */
  public getDetectionReport(): DetectionReport {
    const patterns = this.getPatterns();
    const totalPatterns = patterns.length;

    const patternsByType = patterns.reduce((acc, pattern) => {
      acc[pattern.type] = (acc[pattern.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const severityDistribution = patterns.reduce((acc, pattern) => {
      if (pattern.severity > 0.8) acc.critical++;
      else if (pattern.severity > 0.6) acc.high++;
      else if (pattern.severity > 0.4) acc.medium++;
      else acc.low++;
      return acc;
    }, { critical: 0, high: 0, medium: 0, low: 0 });

    const topPatterns = patterns
      .sort((a, b) => b.metrics.impact - a.metrics.impact)
      .slice(0, 10);

    const recommendationsSummary = this.generateRecommendationsSummary(patterns);

    return {
      totalPatterns,
      patternsByType,
      severityDistribution,
      processingStats: {
        dataPointsProcessed: 0, // Would be tracked during analysis
        processingTime: 0,
        memoryUsage: 0,
        patternsPerSecond: 0
      },
      topPatterns,
      recommendationsSummary
    };
  }

  /**
   * Acknowledge and resolve a pattern
   */
  public acknowledgePattern(patternId: string, resolution: string): void {
    const pattern = this.patterns.get(patternId);
    if (pattern) {
      pattern.metadata.resolution = resolution;
      pattern.metadata.resolvedAt = new Date();
      pattern.metadata.resolvedBy = 'user'; // Could be enhanced with user info

      this.emit('pattern-acknowledged', { patternId, resolution });
    }
  }

  /**
   * Apply auto-correction to patterns
   */
  public async applyAutoCorrection(patternId: string): Promise<boolean> {
    if (!this.config.autoCorrection.enabled) {
      return false;
    }

    const pattern = this.patterns.get(patternId);
    if (!pattern || pattern.metrics.confidence < this.config.alertThresholds.confidence) {
      return false;
    }

    // Generate correction factors
    const correctionFactor = Math.min(
      pattern.severity * this.config.autoCorrection.maxCorrectionFactor,
      this.config.autoCorrection.maxCorrectionFactor
    );

    // Apply correction (this would integrate with the actual system)
    this.emit('auto-correction-applied', {
      patternId,
      correctionFactor,
      pattern
    });

    return true;
  }

  /**
   * Clear all patterns
   */
  public clearPatterns(): void {
    this.patterns.clear();
    this.detectionHistory = [];
    this.emit('patterns-cleared');
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<PatternDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config-updated', this.config);
  }

  // Private detection methods

  private groupBySkill(data: SkillActivationData[]): Map<string, SkillActivationData[]> {
    const groups = new Map<string, SkillActivationData[]>();
    data.forEach(item => {
      const items = groups.get(item.skillId) || [];
      items.push(item);
      groups.set(item.skillId, items);
    });
    return groups;
  }

  private groupByUser(data: SkillActivationData[]): Map<string, SkillActivationData[]> {
    const groups = new Map<string, SkillActivationData[]>();
    data.forEach(item => {
      if (item.userId) {
        const items = groups.get(item.userId) || [];
        items.push(item);
        groups.set(item.userId, items);
      }
    });
    return groups;
  }

  private groupByContext(data: SkillActivationData[]): Map<string, SkillActivationData[]> {
    const groups = new Map<string, SkillActivationData[]>();
    data.forEach(item => {
      const context = item.context || 'unknown';
      const items = groups.get(context) || [];
      items.push(item);
      groups.set(context, items);
    });
    return groups;
  }

  private groupByTime(data: SkillActivationData[]): Map<string, SkillActivationData[]> {
    const groups = new Map<string, SkillActivationData[]>();
    data.forEach(item => {
      const timeKey = this.getTimeKey(item.timestamp);
      const items = groups.get(timeKey) || [];
      items.push(item);
      groups.set(timeKey, items);
    });
    return groups;
  }

  private getTimeKey(timestamp: Date): string {
    // Group by hour for temporal analysis
    return `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}-${timestamp.getHours()}`;
  }

  private detectRecencyBias(data: SkillActivationData[], timeGroups: Map<string, SkillActivationData[]>): BiasPattern[] {
    const patterns: BiasPattern[] = [];

    // Analyze recency bias in skill activation
    const timeKeys = Array.from(timeGroups.keys()).sort();
    if (timeKeys.length < 2) return patterns;

    const recentActivations = timeGroups[timeKeys[timeKeys.length - 1]] || [];
    const olderActivations = timeKeys.slice(0, -1).flatMap(key => timeGroups.get(key) || []);

    // Check if recent activations are significantly skewed
    const recentSkillCounts = this.countSkills(recentActivations);
    const olderSkillCounts = this.countSkills(olderActivations);

    const recentTopSkills = this.getTopSkills(recentSkillCounts, 5);
    const olderTopSkills = this.getTopSkills(olderSkillCounts, 5);

    // Calculate overlap between recent and older top skills
    const overlap = recentTopSkills.filter(skill => olderTopSkills.includes(skill)).length;
    const overlapRatio = overlap / Math.max(recentTopSkills.length, olderTopSkills.length);

    // Low overlap indicates recency bias
    if (overlapRatio < 0.4) {
      patterns.push(this.createBiasPattern({
        type: 'recency',
        severity: 1 - overlapRatio,
        description: `Low overlap (${(overlapRatio * 100).toFixed(1)}%) between recent and historical top skills`,
        affectedEntities: [...new Set([...recentTopSkills, ...olderTopSkills])],
        metrics: {
          deviation: 1 - overlapRatio,
          confidence: 0.8,
          persistence: 1,
          impact: 0.7
        },
        recommendations: [
          'Implement temporal decay in skill scoring',
          'Increase weight of historical performance',
          'Add diversity requirements to skill selection'
        ],
        metadata: {
          recentTopSkills,
          olderTopSkills,
          overlapRatio
        }
      }));
    }

    return patterns;
  }

  private detectFrequencyBias(skillGroups: Map<string, SkillActivationData[]>, userGroups: Map<string, SkillActivationData[]>): BiasPattern[] {
    const patterns: BiasPattern[] = [];

    // Analyze frequency bias across skills
    const skillFrequencies = Array.from(skillGroups.entries()).map(([skillId, activations]) => ({
      skillId,
      frequency: activations.length,
      avgScore: activations.reduce((sum, a) => sum + a.score, 0) / activations.length
    }));

    const totalActivations = skillFrequencies.reduce((sum, s) => sum + s.frequency, 0);
    const expectedFrequency = totalActivations / skillFrequencies.length;

    // Find skills with unusual frequency patterns
    const highFrequencySkills = skillFrequencies.filter(s => s.frequency > expectedFrequency * 3);
    const lowFrequencySkills = skillFrequencies.filter(s => s.frequency < expectedFrequency * 0.3);

    if (highFrequencySkills.length > 0) {
      patterns.push(this.createBiasPattern({
        type: 'frequency',
        severity: Math.min(1, highFrequencySkills.length / skillFrequencies.length),
        description: `${highFrequencySkills.length} skills activated at unusually high frequency`,
        affectedEntities: highFrequencySkills.map(s => s.skillId),
        metrics: {
          deviation: highFrequencySkills.reduce((sum, s) => sum + (s.frequency / expectedFrequency - 1), 0) / highFrequencySkills.length,
          confidence: 0.7,
          persistence: 1,
          impact: 0.6
        },
        recommendations: [
          'Implement frequency capping in skill selection',
          'Add negative feedback for overused skills',
          'Increase diversity in skill recommendations'
        ],
        metadata: {
          highFrequencySkills: highFrequencySkills.map(s => ({ skillId: s.skillId, frequency: s.frequency })),
          expectedFrequency
        }
      }));
    }

    return patterns;
  }

  private detectPopularityBias(skillGroups: Map<string, SkillActivationData[]>): BiasPattern[] {
    const patterns: BiasPattern[] = [];

    // Analyze popularity bias (rich-get-richer effect)
    const skillStats = Array.from(skillGroups.entries()).map(([skillId, activations]) => {
      const successRate = activations.filter(a => a.success).length / activations.length;
      const avgScore = activations.reduce((sum, a) => sum + a.score, 0) / activations.length;
      const frequency = activations.length;

      return { skillId, successRate, avgScore, frequency };
    });

    // Correlate frequency with success rate
    const frequencySuccessCorrelation = this.calculateCorrelation(
      skillStats.map(s => s.frequency),
      skillStats.map(s => s.successRate)
    );

    // High correlation indicates popularity bias
    if (Math.abs(frequencySuccessCorrelation) > 0.7) {
      patterns.push(this.createBiasPattern({
        type: 'popularity',
        severity: Math.abs(frequencySuccessCorrelation),
        description: `Strong correlation (${frequencySuccessCorrelation.toFixed(3)}) between skill frequency and success rate`,
        affectedEntities: skillStats.map(s => s.skillId),
        metrics: {
          deviation: Math.abs(frequencySuccessCorrelation),
          confidence: 0.8,
          persistence: 1,
          impact: 0.8
        },
        recommendations: [
          'Implement success rate normalization',
          'Add exploration mechanisms for less popular skills',
          'Apply frequency-based discounting to skill scores'
        ],
        metadata: {
          correlation: frequencySuccessCorrelation,
          skillCount: skillStats.length
        }
      }));
    }

    return patterns;
  }

  private detectContextBias(contextGroups: Map<string, SkillActivationData[]>): BiasPattern[] {
    const patterns: BiasPattern[] = [];

    // Analyze context bias (different contexts favoring different skills)
    const contextStats = Array.from(contextGroups.entries()).map(([context, activations]) => {
      const skillCounts = this.countSkills(activations);
      const topSkills = this.getTopSkills(skillCounts, 3);
      const avgScore = activations.reduce((sum, a) => sum + a.score, 0) / activations.length;

      return { context, topSkills, avgScore, activationCount: activations.length };
    });

    // Check if certain contexts have very narrow skill usage
    const narrowContexts = contextStats.filter(c => c.topSkills.length === 1 && c.activationCount > 5);

    if (narrowContexts.length > 0) {
      patterns.push(this.createBiasPattern({
        type: 'context',
        severity: narrowContexts.length / contextStats.length,
        description: `${narrowContexts.length} contexts show narrow skill usage patterns`,
        affectedEntities: narrowContexts.map(c => c.context),
        metrics: {
          deviation: narrowContexts.length / contextStats.length,
          confidence: 0.7,
          persistence: 1,
          impact: 0.5
        },
        recommendations: [
          'Increase skill diversity in specific contexts',
          'Add context-aware skill recommendations',
          'Implement skill variety requirements per context'
        ],
        metadata: {
          narrowContexts: narrowContexts.map(c => ({ context: c.context, topSkill: c.topSkills[0] }))
        }
      }));
    }

    return patterns;
  }

  private detectTemporalBias(timeGroups: Map<string, SkillActivationData[]>): BiasPattern[] {
    const patterns: BiasPattern[] = [];

    // Analyze temporal bias (time-based patterns)
    const timeStats = Array.from(timeGroups.entries()).map(([timeKey, activations]) => {
      const avgScore = activations.reduce((sum, a) => sum + a.score, 0) / activations.length;
      const successRate = activations.filter(a => a.success).length / activations.length;
      const avgLatency = activations.reduce((sum, a) => sum + a.latency, 0) / activations.length;

      return { timeKey, avgScore, successRate, avgLatency, activationCount: activations.length };
    });

    if (timeStats.length < 3) return patterns;

    // Check for significant temporal variations
    const scoreVariation = this.calculateVariance(timeStats.map(t => t.avgScore));
    const latencyVariation = this.calculateVariance(timeStats.map(t => t.avgLatency));

    if (scoreVariation > 0.1) {
      patterns.push(this.createBiasPattern({
        type: 'temporal',
        severity: Math.min(1, scoreVariation * 10),
        description: `Significant temporal variation in skill scores (variance: ${scoreVariation.toFixed(3)})`,
        affectedEntities: timeStats.map(t => t.timeKey),
        metrics: {
          deviation: Math.sqrt(scoreVariation),
          confidence: 0.6,
          persistence: 1,
          impact: 0.4
        },
        recommendations: [
          'Implement temporal normalization of skill scores',
          'Add time-based weighting factors',
          'Monitor performance across different time periods'
        ],
        metadata: {
          scoreVariation,
          latencyVariation,
          timePoints: timeStats.length
        }
      }));
    }

    return patterns;
  }

  private detectUserSpecificBias(userGroups: Map<string, SkillActivationData[]>): BiasPattern[] {
    const patterns: BiasPattern[] = [];

    // Analyze user-specific biases
    const userStats = Array.from(userGroups.entries()).map(([userId, activations]) => {
      const skillCounts = this.countSkills(activations);
      const uniqueSkills = Object.keys(skillCounts).length;
      const totalActivations = activations.length;
      const skillDiversity = uniqueSkills / totalActivations;

      return { userId, skillDiversity, uniqueSkills, totalActivations };
    });

    // Find users with low skill diversity
    const lowDiversityUsers = userStats.filter(u => u.skillDiversity < 0.1 && u.totalActivations > 10);

    if (lowDiversityUsers.length > 0) {
      patterns.push(this.createBiasPattern({
        type: 'user-specific',
        severity: lowDiversityUsers.length / userStats.length,
        description: `${lowDiversityUsers.length} users show low skill diversity`,
        affectedEntities: lowDiversityUsers.map(u => u.userId),
        metrics: {
          deviation: 1 - (lowDiversityUsers.reduce((sum, u) => sum + u.skillDiversity, 0) / lowDiversityUsers.length),
          confidence: 0.7,
          persistence: 1,
          impact: 0.6
        },
        recommendations: [
          'Implement skill diversity recommendations',
          'Add exploration incentives for users',
          'Monitor and address user skill monotony'
        ],
        metadata: {
          lowDiversityUsers: lowDiversityUsers.map(u => ({
            userId: u.userId,
            diversity: u.skillDiversity,
            uniqueSkills: u.uniqueSkills
          }))
        }
      }));
    }

    return patterns;
  }

  private detectSkillSpecificBias(skillGroups: Map<string, SkillActivationData[]>): BiasPattern[] {
    const patterns: BiasPattern[] = [];

    // Analyze skill-specific biases
    const skillStats = Array.from(skillGroups.entries()).map(([skillId, activations]) => {
      const avgScore = activations.reduce((sum, a) => sum + a.score, 0) / activations.length;
      const successRate = activations.filter(a => a.success).length / activations.length;
      const avgLatency = activations.reduce((sum, a) => sum + a.latency, 0) / activations.length;
      const userVariety = new Set(activations.filter(a => a.userId).map(a => a.userId)).size;

      return { skillId, avgScore, successRate, avgLatency, userVariety, activationCount: activations.length };
    });

    // Find skills with unusual performance patterns
    const avgSuccessRate = skillStats.reduce((sum, s) => sum + s.successRate, 0) / skillStats.length;
    const underperformingSkills = skillStats.filter(s => s.successRate < avgSuccessRate * 0.5 && s.activationCount > 5);

    if (underperformingSkills.length > 0) {
      patterns.push(this.createBiasPattern({
        type: 'skill-specific',
        severity: underperformingSkills.length / skillStats.length,
        description: `${underperformingSkills.length} skills underperform significantly`,
        affectedEntities: underperformingSkills.map(s => s.skillId),
        metrics: {
          deviation: 1 - (underperformingSkills.reduce((sum, s) => sum + s.successRate, 0) / underperformingSkills.length),
          confidence: 0.8,
          persistence: 1,
          impact: 0.7
        },
        recommendations: [
          'Review and improve underperforming skills',
          'Consider skill retirement or redesign',
          'Add performance warnings for problematic skills'
        ],
        metadata: {
          underperformingSkills: underperformingSkills.map(s => ({
            skillId: s.skillId,
            successRate: s.successRate,
            avgScore: s.avgScore
          })),
          avgSuccessRate
        }
      }));
    }

    return patterns;
  }

  private detectUserActionBias(data: UserBehaviorData[]): BiasPattern[] {
    // Implementation for user action bias detection
    return [];
  }

  private detectUserPreferenceBias(data: UserBehaviorData[]): BiasPattern[] {
    // Implementation for user preference bias detection
    return [];
  }

  private detectUserContextBias(data: UserBehaviorData[]): BiasPattern[] {
    // Implementation for user context bias detection
    return [];
  }

  private detectPerformanceBias(data: SystemPerformanceData[]): BiasPattern[] {
    // Implementation for performance bias detection
    return [];
  }

  private detectResourceBias(data: SystemPerformanceData[]): BiasPattern[] {
    // Implementation for resource bias detection
    return [];
  }

  private detectLatencyBias(data: SystemPerformanceData[]): BiasPattern[] {
    // Implementation for latency bias detection
    return [];
  }

  // Helper methods

  private countSkills(activations: SkillActivationData[]): Record<string, number> {
    const counts: Record<string, number> = {};
    activations.forEach(activation => {
      counts[activation.skillId] = (counts[activation.skillId] || 0) + 1;
    });
    return counts;
  }

  private getTopSkills(skillCounts: Record<string, number>, limit: number): string[] {
    return Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([skillId]) => skillId);
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    if (denomX === 0 || denomY === 0) return 0;

    return numerator / Math.sqrt(denomX * denomY);
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    return variance;
  }

  private createBiasPattern(data: {
    type: BiasPattern['type'];
    severity: number;
    description: string;
    affectedEntities: string[];
    metrics: BiasPattern['metrics'];
    recommendations: string[];
    metadata: Record<string, any>;
  }): BiasPattern {
    const id = `${data.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      type: data.type,
      severity: data.severity,
      description: data.description,
      affectedEntities: data.affectedEntities,
      metrics: data.metrics,
      detectedAt: new Date(),
      recommendations: data.recommendations,
      occurrences: 1,
      metadata: data.metadata
    };
  }

  private updatePatternRegistry(newPatterns: BiasPattern[]): void {
    newPatterns.forEach(pattern => {
      const existing = this.patterns.get(pattern.id);
      if (existing) {
        existing.occurrences++;
        existing.metrics.persistence = Math.min(1, existing.occurrences / this.config.persistenceThreshold);
      } else {
        this.patterns.set(pattern.id, pattern);
      }
    });

    // Add to history
    this.detectionHistory.push(...newPatterns);

    // Keep history size manageable
    if (this.detectionHistory.length > 1000) {
      this.detectionHistory = this.detectionHistory.slice(-500);
    }
  }

  private triggerAlerts(patterns: BiasPattern[]): void {
    const criticalPatterns = patterns.filter(p =>
      p.severity >= this.config.alertThresholds.severity &&
      p.metrics.confidence >= this.config.alertThresholds.confidence &&
      p.metrics.impact >= this.config.alertThresholds.impact
    );

    if (criticalPatterns.length > 0) {
      this.emit('critical-patterns-detected', {
        patterns: criticalPatterns,
        timestamp: new Date()
      });
    }
  }

  private generateRecommendationsSummary(patterns: BiasPattern[]) {
    const allRecommendations = patterns.flatMap(p => p.recommendations);

    // Group by priority based on pattern severity
    const criticalPatterns = patterns.filter(p => p.severity > 0.8);
    const highPatterns = patterns.filter(p => p.severity > 0.6 && p.severity <= 0.8);
    const mediumPatterns = patterns.filter(p => p.severity > 0.4 && p.severity <= 0.6);

    return {
      immediate: criticalPatterns.flatMap(p => p.recommendations).slice(0, 5),
      shortTerm: highPatterns.flatMap(p => p.recommendations).slice(0, 5),
      longTerm: mediumPatterns.flatMap(p => p.recommendations).slice(0, 5)
    };
  }
}