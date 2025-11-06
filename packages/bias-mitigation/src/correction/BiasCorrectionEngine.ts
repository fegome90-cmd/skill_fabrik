/**
 * Bias Correction Engine
 *
 * Applies corrective actions to mitigate detected biases in skill activation,
 * user behavior, and system performance through various correction strategies.
 */

import { BiasPattern } from '../detection/BiasedPatternDetector.js';
import { SkillWeights, ActivationMetrics } from '../types/index.js';
import { EventEmitter } from 'events';

export interface CorrectionStrategy {
  /** Unique identifier for the strategy */
  id: string;

  /** Name of the strategy */
  name: string;

  /** Description of what the strategy does */
  description: string;

  /** Types of bias this strategy can handle */
  applicableBiasTypes: BiasPattern['type'][];

  /** Correction function */
  apply: (context: CorrectionContext) => CorrectionResult;
}

export interface CorrectionContext {
  /** The bias pattern being corrected */
  pattern: BiasPattern;

  /** Current skill weights */
  skillWeights?: Record<string, SkillWeights>;

  /** Current activation metrics */
  activationMetrics?: Record<string, ActivationMetrics>;

  /** Historical data for context */
  historicalData?: {
    skillActivations: any[];
    userBehavior: any[];
    systemPerformance: any[];
  };

  /** Configuration parameters */
  config: CorrectionConfig;

  /** Metadata for correction */
  metadata: Record<string, any>;
}

export interface CorrectionResult {
  /** Unique identifier for this correction */
  id: string;

  /** Strategy that was applied */
  strategyId: string;

  /** Whether the correction was successful */
  success: boolean;

  /** Changes made by the correction */
  changes: {
    skillWeights?: Record<string, Partial<SkillWeights>>;
    activationMetrics?: Record<string, Partial<ActivationMetrics>>;
    systemSettings?: Record<string, any>;
  };

  /** Effectiveness metrics */
  effectiveness: {
    biasReduction: number; // 0-1, how much bias was reduced
    performanceImpact: number; // -1 to 1, impact on overall performance
    userExperienceImpact: number; // -1 to 1, impact on user experience
  };

  /** Correction timestamp */
  appliedAt: Date;

  /** Confidence in the correction */
  confidence: number;

  /** Side effects or warnings */
  sideEffects: string[];

  /** Recommendations for monitoring */
  monitoringRecommendations: string[];

  /** Metadata */
  metadata: Record<string, any>;
}

export interface CorrectionConfig {
  /** Maximum correction factor to apply */
  maxCorrectionFactor: number;

  /** Minimum confidence threshold for auto-correction */
  minConfidence: number;

  /** Enable automatic correction */
  autoCorrection: boolean;

  /** Require confirmation for corrections above threshold */
  confirmationThreshold: number;

  /** Graceful degradation settings */
  gracefulDegradation: {
    enabled: boolean;
    maxReduction: number;
    fallbackStrategies: string[];
  };

  /** Correction validation */
  validation: {
    enabled: boolean;
    postCorrectionDelay: number; // ms to wait before validation
    minImprovementThreshold: number;
  };

  /** Monitoring settings */
  monitoring: {
    enabled: boolean;
    windowSize: number; // time window for monitoring
    alertThresholds: {
      biasRebound: number;
      performanceDegradation: number;
    };
  };

  /** Experimentation settings */
  experimentation: {
    enabled: boolean;
    rolloutPercentage: number;
    controlGroupSize: number;
    experimentDuration: number; // ms
  };
}

export interface CorrectionReport {
  /** Total corrections applied */
  totalCorrections: number;

  /** Corrections by strategy */
  correctionsByStrategy: Record<string, number>;

  /** Corrections by bias type */
  correctionsByBiasType: Record<string, number>;

  /** Average effectiveness */
  averageEffectiveness: {
    biasReduction: number;
    performanceImpact: number;
    userExperienceImpact: number;
  };

  /** Success rate */
  successRate: number;

  /** Side effects summary */
  sideEffectsSummary: Record<string, number>;

  /** Performance impact */
  performanceImpact: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

/**
 * Engine for applying bias corrections
 */
export class BiasCorrectionEngine extends EventEmitter {
  private config: CorrectionConfig;
  private strategies: Map<string, CorrectionStrategy> = new Map();
  private corrections: Map<string, CorrectionResult> = new Map();
  private activeCorrections: Map<string, CorrectionResult> = new Map();

  constructor(config: Partial<CorrectionConfig> = {}) {
    super();

    this.config = {
      maxCorrectionFactor: 0.5,
      minConfidence: 0.7,
      autoCorrection: false,
      confirmationThreshold: 0.8,
      gracefulDegradation: {
        enabled: true,
        maxReduction: 0.3,
        fallbackStrategies: ['weight-normalization', 'frequency-capping']
      },
      validation: {
        enabled: true,
        postCorrectionDelay: 5000,
        minImprovementThreshold: 0.1
      },
      monitoring: {
        enabled: true,
        windowSize: 300000, // 5 minutes
        alertThresholds: {
          biasRebound: 0.7,
          performanceDegradation: 0.2
        }
      },
      experimentation: {
        enabled: false,
        rolloutPercentage: 10,
        controlGroupSize: 5,
        experimentDuration: 86400000 // 24 hours
      },
      ...config
    };

    this.initializeStrategies();
    this.startMonitoring();
  }

  /**
   * Apply correction to a detected bias pattern
   */
  public async applyCorrection(
    pattern: BiasPattern,
    context: Partial<CorrectionContext> = {}
  ): Promise<CorrectionResult> {
    const correctionId = this.generateCorrectionId(pattern);

    // Check if correction should be applied
    if (!this.shouldApplyCorrection(pattern)) {
      throw new Error(`Correction criteria not met for pattern ${pattern.id}`);
    }

    // Select appropriate strategy
    const strategy = this.selectStrategy(pattern);
    if (!strategy) {
      throw new Error(`No suitable correction strategy found for bias type: ${pattern.type}`);
    }

    // Create correction context
    const fullContext: CorrectionContext = {
      pattern,
      config: this.config,
      metadata: {
        correctionId,
        requestedAt: new Date(),
        ...context.metadata
      },
      ...context
    };

    // Apply correction
    const result = await this.executeCorrection(strategy, fullContext);

    // Store correction
    this.corrections.set(correctionId, result);
    this.activeCorrections.set(correctionId, result);

    // Emit events
    this.emit('correction-applied', { pattern, correction: result });

    // Schedule validation if enabled
    if (this.config.validation.enabled) {
      this.scheduleValidation(correctionId, result);
    }

    return result;
  }

  /**
   * Apply multiple corrections
   */
  public async applyMultipleCorrections(
    patterns: BiasPattern[],
    context?: Partial<CorrectionContext>
  ): Promise<CorrectionResult[]> {
    const results: CorrectionResult[] = [];

    for (const pattern of patterns) {
      try {
        const result = await this.applyCorrection(pattern, context);
        results.push(result);
      } catch (error) {
        this.emit('correction-failed', { pattern, error });
        // Continue with other patterns
      }
    }

    this.emit('batch-correction-completed', {
      totalPatterns: patterns.length,
      successfulCorrections: results.length,
      results
    });

    return results;
  }

  /**
   * Get active corrections
   */
  public getActiveCorrections(): CorrectionResult[] {
    return Array.from(this.activeCorrections.values());
  }

  /**
   * Get correction history
   */
  public getCorrectionHistory(): CorrectionResult[] {
    return Array.from(this.corrections.values());
  }

  /**
   * Get correction by ID
   */
  public getCorrection(correctionId: string): CorrectionResult | null {
    return this.corrections.get(correctionId) || null;
  }

  /**
   * Rollback a correction
   */
  public async rollbackCorrection(correctionId: string): Promise<boolean> {
    const correction = this.corrections.get(correctionId);
    if (!correction) {
      return false;
    }

    try {
      // Reverse the changes made by the correction
      await this.reverseCorrection(correction);

      // Remove from active corrections
      this.activeCorrections.delete(correctionId);

      // Mark as rolled back
      correction.metadata.rolledBackAt = new Date();
      correction.metadata.rollbackReason = 'manual';

      this.emit('correction-rolled-back', { correctionId, correction });

      return true;
    } catch (error) {
      this.emit('rollback-failed', { correctionId, error });
      return false;
    }
  }

  /**
   * Register a new correction strategy
   */
  public registerStrategy(strategy: CorrectionStrategy): void {
    this.strategies.set(strategy.id, strategy);
    this.emit('strategy-registered', { strategy });
  }

  /**
   * Get available strategies
   */
  public getAvailableStrategies(): CorrectionStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Get strategies for a specific bias type
   */
  public getStrategiesForBiasType(biasType: BiasPattern['type']): CorrectionStrategy[] {
    return Array.from(this.strategies.values()).filter(strategy =>
      strategy.applicableBiasTypes.includes(biasType)
    );
  }

  /**
   * Get correction report
   */
  public getCorrectionReport(): CorrectionReport {
    const corrections = this.getCorrectionHistory();

    const totalCorrections = corrections.length;
    const successfulCorrections = corrections.filter(c => c.success).length;

    const correctionsByStrategy = corrections.reduce((acc, correction) => {
      acc[correction.strategyId] = (acc[correction.strategyId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const correctionsByBiasType = corrections.reduce((acc, correction) => {
      const biasType = correction.metadata.pattern?.type || 'unknown';
      acc[biasType] = (acc[biasType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const successfulCorrectionsList = corrections.filter(c => c.success);
    const averageEffectiveness = {
      biasReduction: successfulCorrectionsList.length > 0
        ? successfulCorrectionsList.reduce((sum, c) => sum + c.effectiveness.biasReduction, 0) / successfulCorrectionsList.length
        : 0,
      performanceImpact: successfulCorrectionsList.length > 0
        ? successfulCorrectionsList.reduce((sum, c) => sum + c.effectiveness.performanceImpact, 0) / successfulCorrectionsList.length
        : 0,
      userExperienceImpact: successfulCorrectionsList.length > 0
        ? successfulCorrectionsList.reduce((sum, c) => sum + c.effectiveness.userExperienceImpact, 0) / successfulCorrectionsList.length
        : 0
    };

    const successRate = totalCorrections > 0 ? successfulCorrections / totalCorrections : 0;

    const sideEffectsSummary = corrections.reduce((acc, correction) => {
      correction.sideEffects.forEach(effect => {
        acc[effect] = (acc[effect] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const performanceImpact = corrections.reduce((acc, correction) => {
      if (correction.effectiveness.performanceImpact > 0.1) acc.positive++;
      else if (correction.effectiveness.performanceImpact < -0.1) acc.negative++;
      else acc.neutral++;
      return acc;
    }, { positive: 0, negative: 0, neutral: 0 });

    return {
      totalCorrections,
      correctionsByStrategy,
      correctionsByBiasType,
      averageEffectiveness,
      successRate,
      sideEffectsSummary,
      performanceImpact
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<CorrectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config-updated', this.config);
  }

  /**
   * Clear correction history
   */
  public clearHistory(): void {
    this.corrections.clear();
    this.activeCorrections.clear();
    this.emit('history-cleared');
  }

  /**
   * Destroy the engine
   */
  public destroy(): void {
    this.clearHistory();
    this.strategies.clear();
    this.removeAllListeners();
  }

  // Private methods

  private initializeStrategies(): void {
    // Weight normalization strategy
    this.registerStrategy({
      id: 'weight-normalization',
      name: 'Weight Normalization',
      description: 'Normalizes skill weights to reduce bias',
      applicableBiasTypes: ['frequency', 'popularity', 'skill-specific'],
      apply: (context) => this.applyWeightNormalization(context)
    });

    // Frequency capping strategy
    this.registerStrategy({
      id: 'frequency-capping',
      name: 'Frequency Capping',
      description: 'Limits activation frequency of overused skills',
      applicableBiasTypes: ['frequency', 'recency'],
      apply: (context) => this.applyFrequencyCapping(context)
    });

    // Diversity promotion strategy
    this.registerStrategy({
      id: 'diversity-promotion',
      name: 'Diversity Promotion',
      description: 'Promotes skill diversity in recommendations',
      applicableBiasTypes: ['context', 'user-specific'],
      apply: (context) => this.applyDiversityPromotion(context)
    });

    // Temporal decay strategy
    this.registerStrategy({
      id: 'temporal-decay',
      name: 'Temporal Decay',
      description: 'Applies time-based decay to historical biases',
      applicableBiasTypes: ['recency', 'temporal'],
      apply: (context) => this.applyTemporalDecay(context)
    });

    // Success rate adjustment strategy
    this.registerStrategy({
      id: 'success-rate-adjustment',
      name: 'Success Rate Adjustment',
      description: 'Adjusts skill scores based on success rates',
      applicableBiasTypes: ['popularity', 'skill-specific'],
      apply: (context) => this.applySuccessRateAdjustment(context)
    });
  }

  private shouldApplyCorrection(pattern: BiasPattern): boolean {
    // Check minimum confidence
    if (pattern.metrics.confidence < this.config.minConfidence) {
      return false;
    }

    // Check if auto-correction is enabled
    if (!this.config.autoCorrection) {
      return false;
    }

    // Check confirmation threshold
    if (pattern.severity >= this.config.confirmationThreshold) {
      return false; // Requires manual confirmation
    }

    return true;
  }

  private selectStrategy(pattern: BiasPattern): CorrectionStrategy | null {
    const applicableStrategies = this.getStrategiesForBiasType(pattern.type);

    if (applicableStrategies.length === 0) {
      return null;
    }

    // Select strategy based on pattern severity and type
    // For now, return the first applicable strategy
    // In a real implementation, this would use more sophisticated selection logic
    return applicableStrategies[0];
  }

  private async executeCorrection(
    strategy: CorrectionStrategy,
    context: CorrectionContext
  ): Promise<CorrectionResult> {
    const startTime = Date.now();

    try {
      const result = strategy.apply(context);

      // Add metadata
      result.id = context.metadata.correctionId || this.generateCorrectionId(context.pattern);
      result.strategyId = strategy.id;
      result.appliedAt = new Date();
      result.metadata = {
        ...result.metadata,
        patternId: context.pattern.id,
        executionTime: Date.now() - startTime,
        strategyName: strategy.name
      };

      // Validate correction if enabled
      if (this.config.validation.enabled) {
        result.confidence = await this.validateCorrection(result, context);
      }

      return result;
    } catch (error) {
      return {
        id: this.generateCorrectionId(context.pattern),
        strategyId: strategy.id,
        success: false,
        changes: {},
        effectiveness: { biasReduction: 0, performanceImpact: 0, userExperienceImpact: 0 },
        appliedAt: new Date(),
        confidence: 0,
        sideEffects: [`Correction failed: ${error.message}`],
        monitoringRecommendations: [],
        metadata: {
          patternId: context.pattern.id,
          error: error.message,
          executionTime: Date.now() - startTime
        }
      };
    }
  }

  private applyWeightNormalization(context: CorrectionContext): CorrectionResult {
    const { pattern, skillWeights } = context;

    if (!skillWeights) {
      return this.createFailureResult('No skill weights provided for correction');
    }

    const changes: Record<string, Partial<SkillWeights>> = {};
    let totalReduction = 0;

    // Apply normalization to affected skills
    pattern.affectedEntities.forEach(skillId => {
      const weights = skillWeights[skillId];
      if (weights) {
        const correctionFactor = Math.min(pattern.severity * this.config.maxCorrectionFactor, this.config.maxCorrectionFactor);

        changes[skillId] = {
          successRate: weights.successRate * (1 - correctionFactor * 0.3),
          performance: weights.performance * (1 - correctionFactor * 0.2),
          frequency: weights.frequency * (1 - correctionFactor * 0.5), // Stronger reduction for frequency bias
          relevance: weights.relevance * (1 - correctionFactor * 0.1),
          recency: weights.recency * (1 - correctionFactor * 0.4)
        };

        totalReduction += correctionFactor;
      }
    });

    return {
      id: '',
      strategyId: 'weight-normalization',
      success: true,
      changes: { skillWeights: changes },
      effectiveness: {
        biasReduction: Math.min(totalReduction / pattern.affectedEntities.length, 1),
        performanceImpact: -0.1, // Slight negative impact
        userExperienceImpact: 0.2 // Positive impact through diversity
      },
      appliedAt: new Date(),
      confidence: 0.8,
      sideEffects: ['May temporarily reduce skill recommendation accuracy'],
      monitoringRecommendations: [
        'Monitor skill diversity metrics',
        'Track recommendation accuracy',
        'Observe user satisfaction'
      ],
      metadata: {
        correctionFactor: totalReduction / pattern.affectedEntities.length,
        skillsAffected: pattern.affectedEntities.length
      }
    };
  }

  private applyFrequencyCapping(context: CorrectionContext): CorrectionResult {
    const { pattern, skillWeights } = context;

    if (!skillWeights) {
      return this.createFailureResult('No skill weights provided for correction');
    }

    const changes: Record<string, Partial<SkillWeights>> = {};
    const maxFrequency = 0.1; // Maximum allowed frequency weight

    pattern.affectedEntities.forEach(skillId => {
      const weights = skillWeights[skillId];
      if (weights && weights.frequency > maxFrequency) {
        changes[skillId] = {
          frequency: maxFrequency,
          recency: weights.recency * 0.8 // Also reduce recency
        };
      }
    });

    return {
      id: '',
      strategyId: 'frequency-capping',
      success: true,
      changes: { skillWeights: changes },
      effectiveness: {
        biasReduction: 0.7,
        performanceImpact: 0.1,
        userExperienceImpact: 0.3
      },
      appliedAt: new Date(),
      confidence: 0.8,
      sideEffects: ['May reduce recommendation of frequently used skills'],
      monitoringRecommendations: [
        'Monitor skill usage distribution',
        'Track user satisfaction with variety'
      ],
      metadata: {
        maxFrequency,
        skillsCapped: Object.keys(changes).length
      }
    };
  }

  private applyDiversityPromotion(context: CorrectionContext): CorrectionResult {
    const { pattern, skillWeights } = context;

    if (!skillWeights) {
      return this.createFailureResult('No skill weights provided for correction');
    }

    const changes: Record<string, Partial<SkillWeights>> = {};
    const diversityBoost = 0.2;

    // Boost underrepresented skills
    Object.entries(skillWeights).forEach(([skillId, weights]) => {
      if (!pattern.affectedEntities.includes(skillId)) {
        // This skill is not part of the biased pattern, give it a boost
        changes[skillId] = {
          relevance: Math.min(weights.relevance + diversityBoost, 1),
          recency: Math.min(weights.recency + diversityBoost * 0.5, 1)
        };
      }
    });

    return {
      id: '',
      strategyId: 'diversity-promotion',
      success: true,
      changes: { skillWeights: changes },
      effectiveness: {
        biasReduction: 0.6,
        performanceImpact: 0.2,
        userExperienceImpact: 0.4
      },
      appliedAt: new Date(),
      confidence: 0.7,
      sideEffects: ['May promote less relevant skills'],
      monitoringRecommendations: [
        'Monitor skill diversity metrics',
        'Track overall recommendation quality'
      ],
      metadata: {
        diversityBoost,
        skillsBoosted: Object.keys(changes).length
      }
    };
  }

  private applyTemporalDecay(context: CorrectionContext): CorrectionResult {
    const { pattern, skillWeights } = context;

    if (!skillWeights) {
      return this.createFailureResult('No skill weights provided for correction');
    }

    const changes: Record<string, Partial<SkillWeights>> = {};
    const decayFactor = 0.3;

    pattern.affectedEntities.forEach(skillId => {
      const weights = skillWeights[skillId];
      if (weights) {
        changes[skillId] = {
          recency: weights.recency * (1 - decayFactor),
          frequency: weights.frequency * (1 - decayFactor * 0.5)
        };
      }
    });

    return {
      id: '',
      strategyId: 'temporal-decay',
      success: true,
      changes: { skillWeights: changes },
      effectiveness: {
        biasReduction: 0.8,
        performanceImpact: -0.1,
        userExperienceImpact: 0.1
      },
      appliedAt: new Date(),
      confidence: 0.8,
      sideEffects: ['May reduce influence of recent successful activations'],
      monitoringRecommendations: [
        'Monitor temporal bias indicators',
        'Track recommendation freshness'
      ],
      metadata: {
        decayFactor,
        skillsDecayed: pattern.affectedEntities.length
      }
    };
  }

  private applySuccessRateAdjustment(context: CorrectionContext): CorrectionResult {
    const { pattern, skillWeights } = context;

    if (!skillWeights) {
      return this.createFailureResult('No skill weights provided for correction');
    }

    const changes: Record<string, Partial<SkillWeights>> = {};
    const adjustmentFactor = 0.2;

    pattern.affectedEntities.forEach(skillId => {
      const weights = skillWeights[skillId];
      if (weights) {
        // Adjust based on success rate (lower success rate = higher adjustment)
        const adjustment = adjustmentFactor * (1 - weights.successRate);

        changes[skillId] = {
          successRate: weights.successRate + adjustment,
          performance: weights.performance + adjustment * 0.5
        };
      }
    });

    return {
      id: '',
      strategyId: 'success-rate-adjustment',
      success: true,
      changes: { skillWeights: changes },
      effectiveness: {
        biasReduction: 0.5,
        performanceImpact: 0.3,
        userExperienceImpact: 0.2
      },
      appliedAt: new Date(),
      confidence: 0.6,
      sideEffects: ['May overcorrect for skills with genuinely low success rates'],
      monitoringRecommendations: [
        'Monitor success rate distributions',
        'Track overall system performance'
      ],
      metadata: {
        adjustmentFactor,
        skillsAdjusted: pattern.affectedEntities.length
      }
    };
  }

  private createFailureResult(error: string): CorrectionResult {
    return {
      id: '',
      strategyId: '',
      success: false,
      changes: {},
      effectiveness: { biasReduction: 0, performanceImpact: 0, userExperienceImpact: 0 },
      appliedAt: new Date(),
      confidence: 0,
      sideEffects: [error],
      monitoringRecommendations: [],
      metadata: { error }
    };
  }

  private generateCorrectionId(pattern: BiasPattern): string {
    return `correction-${pattern.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async validateCorrection(result: CorrectionResult, context: CorrectionContext): Promise<number> {
    // Wait for post-correction delay
    await new Promise(resolve => setTimeout(resolve, this.config.validation.postCorrectionDelay));

    // In a real implementation, this would measure the actual impact of the correction
    // For now, return the original confidence as a placeholder
    return result.confidence;
  }

  private async reverseCorrection(correction: CorrectionResult): Promise<void> {
    // In a real implementation, this would reverse the changes made by the correction
    // For now, just emit an event
    this.emit('correction-reversed', { correction });
  }

  private scheduleValidation(correctionId: string, result: CorrectionResult): void {
    setTimeout(() => {
      this.validateCorrectionOverTime(correctionId, result);
    }, this.config.validation.postCorrectionDelay);
  }

  private async validateCorrectionOverTime(correctionId: string, result: CorrectionResult): Promise<void> {
    // In a real implementation, this would monitor the correction over time
    // and update its effectiveness metrics
    this.emit('correction-validated', { correctionId, result });
  }

  private startMonitoring(): void {
    if (!this.config.monitoring.enabled) {
      return;
    }

    setInterval(() => {
      this.monitorActiveCorrections();
    }, this.config.monitoring.windowSize);
  }

  private monitorActiveCorrections(): void {
    const activeCorrections = this.getActiveCorrections();

    activeCorrections.forEach(correction => {
      // Check for bias rebound
      if (correction.effectiveness.biasReduction < this.config.monitoring.alertThresholds.biasRebound) {
        this.emit('bias-rebound-detected', { correction });
      }

      // Check for performance degradation
      if (correction.effectiveness.performanceImpact < -this.config.monitoring.alertThresholds.performanceDegradation) {
        this.emit('performance-degradation-detected', { correction });
      }
    });
  }
}