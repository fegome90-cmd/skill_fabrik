import { type Signal, type ScoreInput } from '../types.js';

export interface SignalCost {
  name: string;
  estimatedLatency: number; // ms
  memoryUsage: number; // MB
  cacheHitRate: number; // 0..1
  complexity: 'low' | 'medium' | 'high';
}

export interface OptimizationConfig {
  enableCostOrdering: boolean;
  enableEarlyTermination: boolean;
  earlyTerminationThreshold: number; // score threshold for early termination
  maxTotalLatency: number; // ms
  cacheHitRateThreshold: number; // minimum cache hit rate to prefer
  enableParallelEvaluation: boolean;
  maxParallelSignals: number;
}

export class SignalOptimizer {
  private readonly config: OptimizationConfig;
  private signalCosts: Map<string, SignalCost> = new Map();
  private performanceHistory: Map<string, number[]> = new Map();

  constructor(config?: Partial<OptimizationConfig>) {
    this.config = {
      enableCostOrdering: true,
      enableEarlyTermination: true,
      earlyTerminationThreshold: 0.9,
      maxTotalLatency: 100, // 100ms
      cacheHitRateThreshold: 0.7,
      enableParallelEvaluation: false, // disabled by default for consistency
      maxParallelSignals: 3,
      ...config
    };

    this.initializeDefaultCosts();
  }

  private initializeDefaultCosts(): void {
    const defaultCosts: SignalCost[] = [
      {
        name: 'keywordMatch',
        estimatedLatency: 5, // Very fast - just string matching
        memoryUsage: 1,
        cacheHitRate: 0.8,
        complexity: 'low'
      },
      {
        name: 'historicalAccuracy',
        estimatedLatency: 10, // Fast - cache lookup or simple calculation
        memoryUsage: 2,
        cacheHitRate: 0.9,
        complexity: 'low'
      },
      {
        name: 'intentMatch',
        estimatedLatency: 15, // Medium - regex matching
        memoryUsage: 3,
        cacheHitRate: 0.6,
        complexity: 'medium'
      },
      {
        name: 'filePathMatch',
        estimatedLatency: 20, // Medium - glob matching and file path analysis
        memoryUsage: 4,
        cacheHitRate: 0.7,
        complexity: 'medium'
      },
      {
        name: 'contentMatch',
        estimatedLatency: 50, // High - file content analysis
        memoryUsage: 10,
        cacheHitRate: 0.8,
        complexity: 'high'
      },
      {
        name: 'recentActivity',
        estimatedLatency: 25, // Medium - activity tracking and temporal analysis
        memoryUsage: 5,
        cacheHitRate: 0.5,
        complexity: 'medium'
      },
      {
        name: 'contextRelevance',
        estimatedLatency: 40, // High - project context analysis
        memoryUsage: 8,
        cacheHitRate: 0.9,
        complexity: 'high'
      }
    ];

    defaultCosts.forEach(cost => {
      this.signalCosts.set(cost.name, cost);
    });
  }

  // Optimize signal evaluation order based on costs and performance history
  optimizeSignalOrder(signals: Signal[]): Signal[] {
    if (!this.config.enableCostOrdering) {
      return signals;
    }

    return signals.sort((a, b) => {
      const costA = this.signalCosts.get(a.name) || this.getDefaultCost(a.name);
      const costB = this.signalCosts.get(b.name) || this.getDefaultCost(b.name);

      // Primary sort: by estimated latency (fastest first)
      const latencyDiff = costA.estimatedLatency - costB.estimatedLatency;
      if (Math.abs(latencyDiff) > 5) { // Only if difference is significant
        return latencyDiff;
      }

      // Secondary sort: by cache hit rate (highest first)
      const cacheDiff = costB.cacheHitRate - costA.cacheHitRate;
      if (Math.abs(cacheDiff) > 0.1) {
        return cacheDiff;
      }

      // Tertiary sort: by complexity (low to high)
      const complexityOrder = { low: 0, medium: 1, high: 2 };
      return complexityOrder[costA.complexity] - complexityOrder[costB.complexity];
    });
  }

  // Evaluate signals with optimization strategies
  async evaluateSignalsOptimized(
    signals: Signal[],
    input: ScoreInput,
    weights: Record<string, number>
  ): Promise<{ scores: Record<string, number>; totalLatency: number }> {
    const optimizedSignals = this.optimizeSignalOrder(signals);
    const scores: Record<string, number> = {};
    let totalLatency = 0;

    for (const signal of optimizedSignals) {
      const startTime = Date.now();

      // Check early termination conditions
      if (this.config.enableEarlyTermination && this.shouldTerminateEarly(scores, weights)) {
        break;
      }

      // Check latency budget
      if (totalLatency > this.config.maxTotalLatency) {
        break;
      }

      try {
        const score = await signal.score(input);
        scores[signal.name] = score;
        totalLatency += Date.now() - startTime;

        // Record performance for future optimization
        this.recordPerformance(signal.name, Date.now() - startTime);
      } catch (error) {
        console.warn(`Signal ${signal.name} evaluation failed:`, error);
        scores[signal.name] = 0; // Default to 0 on error
      }
    }

    return { scores, totalLatency };
  }

  // Evaluate signals in parallel (when enabled)
  async evaluateSignalsParallel(
    signals: Signal[],
    input: ScoreInput,
    weights: Record<string, number>
  ): Promise<{ scores: Record<string, number>; totalLatency: number }> {
    if (!this.config.enableParallelEvaluation || signals.length <= 1) {
      return this.evaluateSignalsOptimized(signals, input, weights);
    }

    const optimizedSignals = this.optimizeSignalOrder(signals);
    const batchSize = Math.min(this.config.maxParallelSignals, optimizedSignals.length);
    const scores: Record<string, number> = {};
    let totalLatency = 0;

    for (let i = 0; i < optimizedSignals.length; i += batchSize) {
      const batch = optimizedSignals.slice(i, i + batchSize);
      const batchStartTime = Date.now();

      const batchPromises = batch.map(async (signal) => {
        try {
          const score = await signal.score(input);
          this.recordPerformance(signal.name, Date.now() - batchStartTime);
          return { name: signal.name, score };
        } catch (error) {
          console.warn(`Signal ${signal.name} evaluation failed:`, error);
          return { name: signal.name, score: 0 };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ name, score }) => {
        scores[name] = score;
      });

      totalLatency += Date.now() - batchStartTime;

      // Check early termination between batches
      if (this.config.enableEarlyTermination && this.shouldTerminateEarly(scores, weights)) {
        break;
      }
    }

    return { scores, totalLatency };
  }

  private shouldTerminateEarly(scores: Record<string, number>, weights: Record<string, number>): boolean {
    if (Object.keys(scores).length === 0) return false;

    // Calculate current weighted score
    let weightedSum = 0;
    let weightSum = 0;

    for (const [signalName, score] of Object.entries(scores)) {
      const weight = weights[signalName] || 0;
      weightedSum += score * weight;
      weightSum += Math.abs(weight);
    }

    const currentScore = weightSum > 0 ? weightedSum / weightSum : 0;
    return currentScore >= this.config.earlyTerminationThreshold;
  }

  private recordPerformance(signalName: string, latency: number): void {
    if (!this.performanceHistory.has(signalName)) {
      this.performanceHistory.set(signalName, []);
    }

    const history = this.performanceHistory.get(signalName)!;
    history.push(latency);

    // Keep only last 100 measurements
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    // Update estimated latency based on history
    const avgLatency = history.reduce((a, b) => a + b, 0) / history.length;
    const currentCost = this.signalCosts.get(signalName);
    if (currentCost) {
      currentCost.estimatedLatency = Math.round(avgLatency);
    }
  }

  private getDefaultCost(signalName: string): SignalCost {
    return {
      name: signalName,
      estimatedLatency: 50, // Default medium latency
      memoryUsage: 5,
      cacheHitRate: 0.5,
      complexity: 'medium'
    };
  }

  // Update signal cost configuration
  updateSignalCost(signalName: string, cost: Partial<SignalCost>): void {
    const currentCost = this.signalCosts.get(signalName) || this.getDefaultCost(signalName);
    this.signalCosts.set(signalName, { ...currentCost, ...cost });
  }

  // Get performance statistics
  getPerformanceStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [signalName, history] of this.performanceHistory.entries()) {
      if (history.length > 0) {
        const avg = history.reduce((a, b) => a + b, 0) / history.length;
        const min = Math.min(...history);
        const max = Math.max(...history);
        const recent = history.slice(-10); // Last 10 measurements
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;

        stats[signalName] = {
          avgLatency: Math.round(avg),
          minLatency: min,
          maxLatency: max,
          recentAvgLatency: Math.round(recentAvg),
          sampleCount: history.length,
          cacheHitRate: this.signalCosts.get(signalName)?.cacheHitRate || 0.5
        };
      }
    }

    return stats;
  }

  // Get optimization recommendations
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getPerformanceStats();

    // Check for slow signals
    for (const [signalName, stat] of Object.entries(stats)) {
      if (stat.avgLatency > 100) {
        recommendations.push(`Signal ${signalName} is slow (avg: ${stat.avgLatency}ms). Consider caching or optimization.`);
      }

      if (stat.cacheHitRate < 0.3 && stat.sampleCount > 10) {
        recommendations.push(`Signal ${signalName} has low cache hit rate (${Math.round(stat.cacheHitRate * 100)}%). Consider improving cache strategy.`);
      }

      if (stat.maxLatency > stat.avgLatency * 3) {
        recommendations.push(`Signal ${signalName} has high latency variance. Check for performance bottlenecks.`);
      }
    }

    // Configuration recommendations
    if (this.config.enableEarlyTermination && this.config.earlyTerminationThreshold < 0.8) {
      recommendations.push('Consider increasing early termination threshold for better performance.');
    }

    if (!this.config.enableParallelEvaluation) {
      recommendations.push('Consider enabling parallel evaluation for faster processing.');
    }

    return recommendations;
  }

  // Export performance data for analysis
  exportPerformanceData(): {
    config: OptimizationConfig;
    signalCosts: Record<string, SignalCost>;
    performanceHistory: Record<string, number[]>;
  } {
    const signalCosts: Record<string, SignalCost> = {};
    const performanceHistory: Record<string, number[]> = {};

    this.signalCosts.forEach((cost, name) => {
      signalCosts[name] = { ...cost };
    });

    this.performanceHistory.forEach((history, name) => {
      performanceHistory[name] = [...history];
    });

    return {
      config: { ...this.config },
      signalCosts,
      performanceHistory
    };
  }

  // Clear performance history
  clearPerformanceHistory(signalName?: string): void {
    if (signalName) {
      this.performanceHistory.delete(signalName);
    } else {
      this.performanceHistory.clear();
    }
  }

  // Reset to default configuration
  resetToDefaults(): void {
    this.signalCosts.clear();
    this.performanceHistory.clear();
    this.initializeDefaultCosts();
  }
}