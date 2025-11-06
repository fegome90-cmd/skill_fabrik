/**
 * Weight Decay Applier
 *
 * Applies temporal decay to skill activation weights and performance metrics
 * to ensure historical biases don't affect current recommendations.
 */

import { SkillWeights, ActivationMetrics } from '../types/index.js';
import { TemporalDecayManager, DecayConfig } from './TemporalDecayManager.js';
import { EventEmitter } from 'events';

export interface WeightDecayConfig extends DecayConfig {
  /** Decay settings for different weight types */
  weightTypeSettings: {
    successRate: Partial<DecayConfig>;
    performance: Partial<DecayConfig>;
    frequency: Partial<DecayConfig>;
    relevance: Partial<DecayConfig>;
    recency: Partial<DecayConfig>;
  };

  /** Enable cross-weight decay correlation */
  enableCorrelationDecay: boolean;

  /** Minimum weight threshold for active skills */
  minActiveWeight: number;

  /** Enable weight rebalancing after decay */
  enableRebalancing: boolean;

  /** Rebalancing strategy */
  rebalancingStrategy: 'proportional' | 'equal' | 'priority';
}

export interface DecayedSkillWeights extends SkillWeights {
  /** Decay information for each weight */
  decayInfo: {
    successRate: { original: number; decayed: number; weight: number };
    performance: { original: number; decayed: number; weight: number };
    frequency: { original: number; decayed: number; weight: number };
    relevance: { original: number; decayed: number; weight: number };
    recency: { original: number; decayed: number; weight: number };
  };

  /** Overall decay factor */
  overallDecay: number;

  /** Whether skill is still considered active */
  isActive: boolean;

  /** Decay timestamp */
  decayedAt: Date;
}

export interface DecayReport {
  /** Total skills processed */
  totalSkills: number;

  /** Skills still active after decay */
  activeSkills: number;

  /** Skills deactivated due to decay */
  deactivatedSkills: number;

  /** Average decay factor */
  averageDecay: number;

  /** Weight-specific decay statistics */
  weightDecayStats: {
    successRate: { min: number; max: number; avg: number };
    performance: { min: number; max: number; avg: number };
    frequency: { min: number; max: number; avg: number };
    relevance: { min: number; max: number; avg: number };
    recency: { min: number; max: number; avg: number };
  };

  /** Processing performance */
  processingTime: number;
}

/**
 * Applies temporal decay to skill weights and metrics
 */
export class WeightDecayApplier extends EventEmitter {
  private decayManager: TemporalDecayManager;
  private config: WeightDecayConfig;

  constructor(config: Partial<WeightDecayConfig> = {}) {
    super();

    this.config = {
      defaultFunction: 'exponential',
      halfLife: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      minWeight: 0.01,
      typeSpecificParams: {},
      adaptiveDecay: true,
      batchProcessing: {
        enabled: true,
        batchSize: 100,
        flushInterval: 5000
      },
      weightTypeSettings: {
        successRate: { halfLife: 14 * 24 * 60 * 60 * 1000 }, // 14 days
        performance: { halfLife: 7 * 24 * 60 * 60 * 1000 },   // 7 days
        frequency: { halfLife: 3 * 24 * 60 * 60 * 1000 },    // 3 days
        relevance: { halfLife: 1 * 24 * 60 * 60 * 1000 },    // 1 day
        recency: { halfLife: 1 * 24 * 60 * 60 * 1000 }      // 1 day
      },
      enableCorrelationDecay: true,
      minActiveWeight: 0.1,
      enableRebalancing: true,
      rebalancingStrategy: 'proportional',
      ...config
    };

    this.decayManager = new TemporalDecayManager(this.config);
  }

  /**
   * Apply decay to skill weights
   */
  public decaySkillWeights(
    skillId: string,
    weights: SkillWeights,
    lastUpdated: Date,
    skillType?: string
  ): DecayedSkillWeights {
    const startTime = Date.now();

    // Apply decay to each weight type with specific settings
    const successRateDecay = this.decayManager.decayValue(
      weights.successRate,
      lastUpdated,
      `successRate-${skillType}`
    );

    const performanceDecay = this.decayManager.decayValue(
      weights.performance,
      lastUpdated,
      `performance-${skillType}`
    );

    const frequencyDecay = this.decayManager.decayValue(
      weights.frequency,
      lastUpdated,
      `frequency-${skillType}`
    );

    const relevanceDecay = this.decayManager.decayValue(
      weights.relevance,
      lastUpdated,
      `relevance-${skillType}`
    );

    const recencyDecay = this.decayManager.decayValue(
      weights.recency,
      lastUpdated,
      `recency-${skillType}`
    );

    // Calculate overall decay
    const decayFactors = [
      successRateDecay.weight,
      performanceDecay.weight,
      frequencyDecay.weight,
      relevanceDecay.weight,
      recencyDecay.weight
    ];

    const overallDecay = decayFactors.reduce((sum, factor) => sum + factor, 0) / decayFactors.length;

    // Apply correlation decay if enabled
    let correlationFactor = 1;
    if (this.config.enableCorrelationDecay) {
      correlationFactor = this.calculateCorrelationDecay(decayFactors);
    }

    // Build decayed weights
    const decayedWeights: DecayedSkillWeights = {
      skillId: weights.skillId || skillId,
      successRate: successRateDecay.decayedValue * correlationFactor,
      performance: performanceDecay.decayedValue * correlationFactor,
      frequency: frequencyDecay.decayedValue * correlationFactor,
      relevance: relevanceDecay.decayedValue * correlationFactor,
      recency: recencyDecay.decayedValue * correlationFactor,
      decayInfo: {
        successRate: {
          original: weights.successRate,
          decayed: successRateDecay.decayedValue,
          weight: successRateDecay.weight
        },
        performance: {
          original: weights.performance,
          decayed: performanceDecay.decayedValue,
          weight: performanceDecay.weight
        },
        frequency: {
          original: weights.frequency,
          decayed: frequencyDecay.decayedValue,
          weight: frequencyDecay.weight
        },
        relevance: {
          original: weights.relevance,
          decayed: relevanceDecay.decayedValue,
          weight: relevanceDecay.weight
        },
        recency: {
          original: weights.recency,
          decayed: recencyDecay.decayedValue,
          weight: recencyDecay.weight
        }
      },
      overallDecay: overallDecay * correlationFactor,
      isActive: overallDecay >= this.config.minActiveWeight,
      decayedAt: new Date()
    };

    // Apply rebalancing if enabled
    if (this.config.enableRebalancing) {
      this.rebalanceWeights(decayedWeights);
    }

    // Emit event
    this.emit('weights-decayed', {
      skillId,
      originalWeights: weights,
      decayedWeights,
      processingTime: Date.now() - startTime
    });

    return decayedWeights;
  }

  /**
   * Apply decay to multiple skill weights
   */
  public decayMultipleWeights(
    skillsData: Array<{
      skillId: string;
      weights: SkillWeights;
      lastUpdated: Date;
      skillType?: string;
    }>
  ): Array<{ skillId: string; decayedWeights: DecayedSkillWeights }> {
    const startTime = Date.now();

    const results = skillsData.map(({ skillId, weights, lastUpdated, skillType }) => ({
      skillId,
      decayedWeights: this.decaySkillWeights(skillId, weights, lastUpdated, skillType)
    }));

    // Generate report
    const report = this.generateDecayReport(results);

    this.emit('batch-decay-completed', {
      totalSkills: skillsData.length,
      report,
      processingTime: Date.now() - startTime
    });

    return results;
  }

  /**
   * Apply decay to activation metrics
   */
  public decayActivationMetrics(
    metrics: ActivationMetrics,
    timestamp: Date,
    context?: string
  ): ActivationMetrics {
    const startTime = Date.now();

    // Decay each metric component
    const avgLatencyDecay = this.decayManager.decayValue(
      metrics.averageLatency,
      timestamp,
      'latency',
      context
    );

    const successRateDecay = this.decayManager.decayValue(
      metrics.successRate,
      timestamp,
      'success-rate',
      context
    );

    const throughputDecay = this.decayManager.decayValue(
      metrics.throughput,
      timestamp,
      'throughput',
      context
    );

    const decayedMetrics: ActivationMetrics = {
      skillId: metrics.skillId,
      averageLatency: avgLatencyDecay.decayedValue,
      successRate: successRateDecay.decayedValue,
      throughput: throughputDecay.decayedValue,
      sampleSize: metrics.sampleSize,
      lastUpdated: new Date()
    };

    this.emit('metrics-decayed', {
      skillId: metrics.skillId,
      originalMetrics: metrics,
      decayedMetrics,
      processingTime: Date.now() - startTime
    });

    return decayedMetrics;
  }

  /**
   * Get decay manager for advanced operations
   */
  public getDecayManager(): TemporalDecayManager {
    return this.decayManager;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<WeightDecayConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.decayManager.updateConfig(this.config);
    this.emit('config-updated', this.config);
  }

  /**
   * Get current configuration
   */
  public getConfig(): WeightDecayConfig {
    return { ...this.config };
  }

  /**
   * Get decay metrics
   */
  public getDecayMetrics() {
    return this.decayManager.getMetrics();
  }

  /**
   * Reset decay metrics
   */
  public resetMetrics(): void {
    this.decayManager.resetMetrics();
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.decayManager.destroy();
    this.removeAllListeners();
  }

  // Private methods

  private calculateCorrelationDecay(decayFactors: number[]): number {
    // Calculate correlation between different weight decays
    // If weights decay at different rates, apply correlation factor

    const variance = this.calculateVariance(decayFactors);

    // Lower variance = more consistent decay = higher correlation factor
    // Higher variance = inconsistent decay = lower correlation factor
    const correlationFactor = Math.max(0.5, 1 - (variance / 0.25));

    return correlationFactor;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  private rebalanceWeights(decayedWeights: DecayedSkillWeights): void {
    switch (this.config.rebalancingStrategy) {
      case 'proportional':
        this.rebalanceProportional(decayedWeights);
        break;
      case 'equal':
        this.rebalanceEqual(decayedWeights);
        break;
      case 'priority':
        this.rebalancePriority(decayedWeights);
        break;
    }
  }

  private rebalanceProportional(decayedWeights: DecayedSkillWeights): void {
    // Rebalance weights proportionally to their original ratios
    const totalOriginal =
      decayedWeights.decayInfo.successRate.original +
      decayedWeights.decayInfo.performance.original +
      decayedWeights.decayInfo.frequency.original +
      decayedWeights.decayInfo.relevance.original +
      decayedWeights.decayInfo.recency.original;

    if (totalOriginal === 0) return;

    const totalDecayed =
      decayedWeights.decayInfo.successRate.decayed +
      decayedWeights.decayInfo.performance.decayed +
      decayedWeights.decayInfo.frequency.decayed +
      decayedWeights.decayInfo.relevance.decayed +
      decayedWeights.decayInfo.recency.decayed;

    if (totalDecayed === 0) return;

    const scaleFactor = totalOriginal / totalDecayed;

    decayedWeights.successRate *= scaleFactor;
    decayedWeights.performance *= scaleFactor;
    decayedWeights.frequency *= scaleFactor;
    decayedWeights.relevance *= scaleFactor;
    decayedWeights.recency *= scaleFactor;
  }

  private rebalanceEqual(decayedWeights: DecayedSkillWeights): void {
    // Rebalance all weights to equal values
    const avgWeight = (
      decayedWeights.successRate +
      decayedWeights.performance +
      decayedWeights.frequency +
      decayedWeights.relevance +
      decayedWeights.recency
    ) / 5;

    decayedWeights.successRate = avgWeight;
    decayedWeights.performance = avgWeight;
    decayedWeights.frequency = avgWeight;
    decayedWeights.relevance = avgWeight;
    decayedWeights.recency = avgWeight;
  }

  private rebalancePriority(decayedWeights: DecayedSkillWeights): void {
    // Rebalance with priority to performance and success rate
    const priorityWeights = {
      performance: 0.3,
      successRate: 0.25,
      relevance: 0.2,
      frequency: 0.15,
      recency: 0.1
    };

    const totalCurrent =
      decayedWeights.performance +
      decayedWeights.successRate +
      decayedWeights.relevance +
      decayedWeights.frequency +
      decayedWeights.recency;

    if (totalCurrent === 0) return;

    // Scale weights to match priority distribution while preserving total
    const targetTotal = totalCurrent;

    decayedWeights.performance = targetTotal * priorityWeights.performance;
    decayedWeights.successRate = targetTotal * priorityWeights.successRate;
    decayedWeights.relevance = targetTotal * priorityWeights.relevance;
    decayedWeights.frequency = targetTotal * priorityWeights.frequency;
    decayedWeights.recency = targetTotal * priorityWeights.recency;
  }

  private generateDecayReport(
    results: Array<{ skillId: string; decayedWeights: DecayedSkillWeights }>
  ): DecayReport {
    const totalSkills = results.length;
    const activeSkills = results.filter(r => r.decayedWeights.isActive).length;
    const deactivatedSkills = totalSkills - activeSkills;

    const averageDecay = results.reduce((sum, r) => sum + r.decayedWeights.overallDecay, 0) / totalSkills;

    // Calculate weight-specific statistics
    const weightStats = {
      successRate: this.calculateWeightStats(results, 'successRate'),
      performance: this.calculateWeightStats(results, 'performance'),
      frequency: this.calculateWeightStats(results, 'frequency'),
      relevance: this.calculateWeightStats(results, 'relevance'),
      recency: this.calculateWeightStats(results, 'recency')
    };

    return {
      totalSkills,
      activeSkills,
      deactivatedSkills,
      averageDecay,
      weightDecayStats: weightStats,
      processingTime: 0 // Will be set by caller
    };
  }

  private calculateWeightStats(
    results: Array<{ skillId: string; decayedWeights: DecayedSkillWeights }>,
    weightType: keyof DecayedSkillWeights['decayInfo']
  ): { min: number; max: number; avg: number } {
    const values = results.map(r => r.decayedWeights.decayInfo[weightType].weight);

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, val) => sum + val, 0) / values.length
    };
  }
}