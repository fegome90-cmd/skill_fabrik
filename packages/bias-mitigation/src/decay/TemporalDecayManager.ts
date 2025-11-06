/**
 * Temporal Decay Manager
 *
 * Implements various decay functions to reduce the influence of historical data
 * based on age, preventing bias from outdated information.
 */

import { TimeWindow, DecayFunction } from '../types/index.js';
import { EventEmitter } from 'events';

export interface DecayConfig {
  /** Default decay function to use */
  defaultFunction: DecayFunction;

  /** Half-life for exponential decay (in milliseconds) */
  halfLife: number;

  /** Maximum age before data is completely decayed (in milliseconds) */
  maxAge: number;

  /** Minimum weight to apply (prevents complete decay) */
  minWeight: number;

  /** Custom decay parameters for different data types */
  typeSpecificParams: Record<string, Partial<DecayConfig>>;

  /** Enable adaptive decay based on data volatility */
  adaptiveDecay: boolean;

  /** Batch processing configuration */
  batchProcessing: {
    enabled: boolean;
    batchSize: number;
    flushInterval: number;
  };
}

export interface DecayedValue<T> {
  /** Original value */
  originalValue: T;

  /** Decayed weight (0-1) */
  weight: number;

  /** Timestamp when decay was calculated */
  decayedAt: Date;

  /** Age of the data at decay time */
  age: number;

  /** Decay function used */
  decayFunction: DecayFunction;

  /** Final decayed value (value * weight) */
  decayedValue: number;
}

export interface TimeSeriesPoint<T = number> {
  /** Timestamp of the data point */
  timestamp: Date;

  /** Original value */
  value: T;

  /** Optional metadata */
  metadata?: Record<string, any>;

  /** Data type/category */
  type?: string;

  /** User/context identifier */
  context?: string;
}

export interface DecayMetrics {
  /** Total data points processed */
  totalProcessed: number;

  /** Average decay weight applied */
  averageWeight: number;

  /** Distribution of decay weights */
  weightDistribution: {
    high: number; // > 0.8
    medium: number; // 0.3 - 0.8
    low: number; // < 0.3
  };

  /** Processing performance */
  processingTime: number;

  /** Memory usage statistics */
  memoryUsage: {
    retained: number;
    decayed: number;
    purged: number;
  };

  /** Decay function usage statistics */
  functionUsage: Record<DecayFunction, number>;
}

/**
 * Manages temporal decay of historical data to prevent bias
 */
export class TemporalDecayManager extends EventEmitter {
  private config: DecayConfig;
  private metrics: DecayMetrics;
  private processingQueue: TimeSeriesPoint[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private memoryStore: Map<string, TimeSeriesPoint> = new Map();

  constructor(config: Partial<DecayConfig> = {}) {
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
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.startBatchProcessor();
  }

  /**
   * Apply decay to a single value
   */
  public decayValue<T>(
    value: T,
    timestamp: Date,
    type?: string,
    context?: string
  ): DecayedValue<T> {
    const now = new Date();
    const age = now.getTime() - timestamp.getTime();
    const config = this.getTypeConfig(type);

    // Check if data is too old
    if (age > config.maxAge) {
      return {
        originalValue: value,
        weight: config.minWeight,
        decayedAt: now,
        age,
        decayFunction: config.defaultFunction,
        decayedValue: this.toNumber(value) * config.minWeight
      };
    }

    // Calculate decay weight
    let weight: number;

    if (config.adaptiveDecay && context) {
      weight = this.calculateAdaptiveDecay(age, config, context);
    } else {
      weight = this.calculateDecay(age, config);
    }

    // Apply minimum weight
    weight = Math.max(weight, config.minWeight);

    const decayedValue = this.toNumber(value) * weight;

    // Update metrics
    this.updateMetrics(weight, age);

    return {
      originalValue: value,
      weight,
      decayedAt: now,
      age,
      decayFunction: config.defaultFunction,
      decayedValue
    };
  }

  /**
   * Apply decay to multiple values (batch processing)
   */
  public decayValues<T>(points: TimeSeriesPoint<T>[]): DecayedValue<T>[] {
    if (this.config.batchProcessing.enabled) {
      return this.processBatch(points);
    } else {
      return points.map(point =>
        this.decayValue(point.value, point.timestamp, point.type, point.context)
      );
    }
  }

  /**
   * Process time series data with sliding window decay
   */
  public processTimeSeries<T>(
    points: TimeSeriesPoint<T>[],
    windowSize: TimeWindow
  ): {
    decayedPoints: DecayedValue<T>[];
    windowMetrics: {
      totalWeight: number;
      averageAge: number;
      decayRate: number;
    };
  } {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.parseTimeWindow(windowSize));

    // Filter points within window
    const windowPoints = points.filter(p => p.timestamp >= windowStart);

    // Apply decay
    const decayedPoints = windowPoints.map(point =>
      this.decayValue(point.value, point.timestamp, point.type, point.context)
    );

    // Calculate window metrics
    const totalWeight = decayedPoints.reduce((sum, p) => sum + p.weight, 0);
    const averageAge = decayedPoints.reduce((sum, p) => sum + p.age, 0) / decayedPoints.length;
    const decayRate = 1 - (totalWeight / decayedPoints.length);

    return {
      decayedPoints,
      windowMetrics: {
        totalWeight,
        averageAge,
        decayRate
      }
    };
  }

  /**
   * Get decayed weight for a specific age
   */
  public getDecayWeight(age: number, type?: string): number {
    const config = this.getTypeConfig(type);

    if (age > config.maxAge) {
      return config.minWeight;
    }

    return Math.max(this.calculateDecay(age, config), config.minWeight);
  }

  /**
   * Add data point to memory store with automatic decay
   */
  public addToStore<T>(
    key: string,
    value: T,
    type?: string,
    context?: string
  ): void {
    const point: TimeSeriesPoint<T> = {
      timestamp: new Date(),
      value,
      type,
      context
    };

    this.memoryStore.set(key, point);

    // Schedule cleanup if batch processing is disabled
    if (!this.config.batchProcessing.enabled) {
      this.scheduleCleanup(key);
    }
  }

  /**
   * Get decayed value from memory store
   */
  public getFromStore<T>(key: string): DecayedValue<T> | null {
    const point = this.memoryStore.get(key);

    if (!point) {
      return null;
    }

    const decayed = this.decayValue(point.value, point.timestamp, point.type, point.context);

    // Remove if completely decayed
    if (decayed.weight <= this.config.minWeight) {
      this.memoryStore.delete(key);
      this.metrics.memoryUsage.purged++;
    }

    return decayed;
  }

  /**
   * Get current decay metrics
   */
  public getMetrics(): DecayMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<DecayConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config-updated', this.config);
  }

  /**
   * Clean up expired data from memory store
   */
  public cleanup(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [key, point] of this.memoryStore.entries()) {
      const age = now.getTime() - point.timestamp.getTime();

      if (age > this.config.maxAge) {
        this.memoryStore.delete(key);
        cleanedCount++;
        this.metrics.memoryUsage.purged++;
      }
    }

    this.emit('cleanup-completed', { cleanedCount, remainingCount: this.memoryStore.size });
  }

  /**
   * Destroy the manager and clean up resources
   */
  public destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    this.cleanup();
    this.memoryStore.clear();
    this.removeAllListeners();
  }

  // Private methods

  private initializeMetrics(): DecayMetrics {
    return {
      totalProcessed: 0,
      averageWeight: 0,
      weightDistribution: { high: 0, medium: 0, low: 0 },
      processingTime: 0,
      memoryUsage: { retained: 0, decayed: 0, purged: 0 },
      functionUsage: {
        exponential: 0,
        linear: 0,
        logarithmic: 0,
        sigmoid: 0
      }
    };
  }

  private calculateDecay(age: number, config: DecayConfig): number {
    switch (config.defaultFunction) {
      case 'exponential':
        return this.exponentialDecay(age, config.halfLife);

      case 'linear':
        return this.linearDecay(age, config.maxAge);

      case 'logarithmic':
        return this.logarithmicDecay(age, config.maxAge);

      case 'sigmoid':
        return this.sigmoidDecay(age, config.halfLife, config.maxAge);

      default:
        return this.exponentialDecay(age, config.halfLife);
    }
  }

  private exponentialDecay(age: number, halfLife: number): number {
    return Math.pow(0.5, age / halfLife);
  }

  private linearDecay(age: number, maxAge: number): number {
    return Math.max(0, 1 - (age / maxAge));
  }

  private logarithmicDecay(age: number, maxAge: number): number {
    const normalizedAge = age / maxAge;
    return Math.max(0, 1 - Math.log(1 + normalizedAge * 9) / Math.log(10));
  }

  private sigmoidDecay(age: number, halfLife: number, maxAge: number): number {
    const x = (age - halfLife) / (maxAge * 0.2);
    return 1 / (1 + Math.exp(x));
  }

  private calculateAdaptiveDecay(age: number, config: DecayConfig, context: string): number {
    // Get historical volatility for this context
    const volatility = this.getContextVolatility(context);

    // Adjust half-life based on volatility
    const adaptiveHalfLife = config.halfLife * (1 + volatility);

    return this.exponentialDecay(age, adaptiveHalfLife);
  }

  private getContextVolatility(context: string): number {
    // Simple volatility calculation based on recent metrics
    // In a real implementation, this would track historical variance
    return 0.5; // Placeholder
  }

  private getTypeConfig(type?: string): DecayConfig {
    if (type && this.config.typeSpecificParams[type]) {
      return { ...this.config, ...this.config.typeSpecificParams[type] };
    }
    return this.config;
  }

  private toNumber(value: any): number {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }

    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    if (Array.isArray(value)) {
      return value.length;
    }

    if (typeof value === 'object' && value !== null) {
      return Object.keys(value).length;
    }

    return 0;
  }

  private parseTimeWindow(window: TimeWindow): number {
    switch (window.unit) {
      case 'milliseconds': return window.value;
      case 'seconds': return window.value * 1000;
      case 'minutes': return window.value * 60 * 1000;
      case 'hours': return window.value * 60 * 60 * 1000;
      case 'days': return window.value * 24 * 60 * 60 * 1000;
      case 'weeks': return window.value * 7 * 24 * 60 * 60 * 1000;
      default: return window.value;
    }
  }

  private updateMetrics(weight: number, age: number): void {
    this.metrics.totalProcessed++;

    // Update average weight
    this.metrics.averageWeight =
      (this.metrics.averageWeight * (this.metrics.totalProcessed - 1) + weight) /
      this.metrics.totalProcessed;

    // Update weight distribution
    if (weight > 0.8) {
      this.metrics.weightDistribution.high++;
    } else if (weight >= 0.3) {
      this.metrics.weightDistribution.medium++;
    } else {
      this.metrics.weightDistribution.low++;
    }

    // Update memory usage
    if (weight > 0.5) {
      this.metrics.memoryUsage.retained++;
    } else {
      this.metrics.memoryUsage.decayed++;
    }
  }

  private processBatch<T>(points: TimeSeriesPoint<T>[]): DecayedValue<T>[] {
    const startTime = Date.now();

    const results = points.map(point => {
      const decayed = this.decayValue(point.value, point.timestamp, point.type, point.context);
      this.metrics.functionUsage[decayed.decayFunction]++;
      return decayed;
    });

    this.metrics.processingTime += Date.now() - startTime;

    return results;
  }

  private startBatchProcessor(): void {
    if (!this.config.batchProcessing.enabled) {
      return;
    }

    this.batchTimer = setInterval(() => {
      if (this.processingQueue.length > 0) {
        const batch = this.processingQueue.splice(0, this.config.batchProcessing.batchSize);
        this.processBatch(batch);
      }
    }, this.config.batchProcessing.flushInterval);
  }

  private scheduleCleanup(key: string): void {
    setTimeout(() => {
      const point = this.memoryStore.get(key);
      if (point) {
        const age = Date.now() - point.timestamp.getTime();
        if (age > this.config.maxAge) {
          this.memoryStore.delete(key);
          this.metrics.memoryUsage.purged++;
        }
      }
    }, this.config.maxAge);
  }
}