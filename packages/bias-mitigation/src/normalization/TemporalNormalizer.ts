/**
 * Temporal Normalizer
 *
 * Normalizes activation metrics across different time periods to account for
 * temporal variations and ensure fair comparison across time.
 */

import { ActivationMetrics, SkillWeights } from '../types/index.js';
import { EventEmitter } from 'events';

export interface NormalizationConfig {
  /** Time window for baseline calculation */
  baselineWindow: {
    value: number;
    unit: 'hours' | 'days' | 'weeks';
  };

  /** Normalization method */
  method: 'z-score' | 'min-max' | 'robust' | 'quantile';

  /** Enable seasonal adjustment */
  enableSeasonalAdjustment: boolean;

  /** Enable trend adjustment */
  enableTrendAdjustment: boolean;

  /** Outlier detection and handling */
  outlierHandling: {
    enabled: boolean;
    method: 'iqr' | 'z-score' | 'isolation-forest';
    threshold: number;
    action: 'remove' | 'cap' | 'transform';
  };

  /** Smoothing configuration */
  smoothing: {
    enabled: boolean;
    method: 'exponential' | 'moving-average' | 'lowess';
    alpha?: number; // for exponential smoothing
    windowSize?: number; // for moving average
  };

  /** Minimum sample size for reliable normalization */
  minSampleSize: number;

  /** Confidence interval for normalization */
  confidenceInterval: number;
}

export interface NormalizationResult {
  /** Original metrics */
  original: ActivationMetrics;

  /** Normalized metrics */
  normalized: ActivationMetrics;

  /** Normalization factors applied */
  factors: {
    latency: { mean: number; std: number; factor: number };
    successRate: { mean: number; std: number; factor: number };
    throughput: { mean: number; std: number; factor: number };
  };

  /** Quality indicators */
  quality: {
    sampleSize: number;
    reliability: number; // 0-1
    outlierCount: number;
    seasonalAdjustment: boolean;
    trendAdjustment: boolean;
  };

  /** Normalization timestamp */
  normalizedAt: Date;

  /** Confidence bounds */
  confidenceBounds: {
    latency: { lower: number; upper: number };
    successRate: { lower: number; upper: number };
    throughput: { lower: number; upper: number };
  };
}

export interface TemporalBaseline {
  /** Time period for this baseline */
  period: {
    start: Date;
    end: Date;
  };

  /** Baseline statistics */
  statistics: {
    latency: { mean: number; median: number; std: number; min: number; max: number };
    successRate: { mean: number; median: number; std: number; min: number; max: number };
    throughput: { mean: number; median: number; std: number; min: number; max: number };
  };

  /** Seasonal factors */
  seasonalFactors?: {
    hourly: number[];
    daily: number[];
    weekly: number[];
  };

  /** Trend information */
  trend?: {
    slope: number;
    correlation: number;
    significance: number;
  };

  /** Sample size */
  sampleSize: number;

  /** Quality score */
  quality: number;

  /** Creation timestamp */
  createdAt: Date;
}

export interface NormalizationReport {
  /** Total metrics normalized */
  totalNormalized: number;

  /** Average reliability score */
  averageReliability: number;

  /** Distribution of normalization methods used */
  methodUsage: Record<string, number>;

  /** Outlier statistics */
  outlierStats: {
    detected: number;
    removed: number;
    capped: number;
    transformed: number;
  };

  /** Performance metrics */
  processingTime: number;

  /** Quality distribution */
  qualityDistribution: {
    high: number; // > 0.8
    medium: number; // 0.5 - 0.8
    low: number; // < 0.5
  };
}

/**
 * Normalizes activation metrics across temporal dimensions
 */
export class TemporalNormalizer extends EventEmitter {
  private config: NormalizationConfig;
  private baselines: Map<string, TemporalBaseline> = new Map();
  private metrics: NormalizationReport;

  constructor(config: Partial<NormalizationConfig> = {}) {
    super();

    this.config = {
      baselineWindow: {
        value: 7,
        unit: 'days'
      },
      method: 'z-score',
      enableSeasonalAdjustment: true,
      enableTrendAdjustment: true,
      outlierHandling: {
        enabled: true,
        method: 'iqr',
        threshold: 1.5,
        action: 'cap'
      },
      smoothing: {
        enabled: true,
        method: 'exponential',
        alpha: 0.3,
        windowSize: 10
      },
      minSampleSize: 10,
      confidenceInterval: 0.95,
      ...config
    };

    this.metrics = this.initializeMetrics();
  }

  /**
   * Normalize activation metrics
   */
  public async normalizeMetrics(
    metrics: ActivationMetrics,
    historicalData?: ActivationMetrics[]
  ): Promise<NormalizationResult> {
    const startTime = Date.now();

    // Get or create baseline
    const baseline = await this.getOrCreateBaseline(metrics.skillId, historicalData);

    if (baseline.sampleSize < this.config.minSampleSize) {
      throw new Error(`Insufficient sample size for normalization: ${baseline.sampleSize} < ${this.config.minSampleSize}`);
    }

    // Handle outliers
    const cleanMetrics = this.handleOutliers(metrics, baseline);

    // Apply seasonal adjustment
    const seasonallyAdjusted = this.config.enableSeasonalAdjustment
      ? this.applySeasonalAdjustment(cleanMetrics, baseline)
      : cleanMetrics;

    // Apply trend adjustment
    const trendAdjusted = this.config.enableTrendAdjustment
      ? this.applyTrendAdjustment(seasonallyAdjusted, baseline)
      : seasonallyAdjusted;

    // Apply smoothing
    const smoothed = this.config.smoothing.enabled
      ? this.applySmoothing(trendAdjusted, baseline)
      : trendAdjusted;

    // Perform normalization
    const normalized = this.performNormalization(smoothed, baseline);

    // Calculate confidence bounds
    const confidenceBounds = this.calculateConfidenceBounds(normalized, baseline);

    // Assess quality
    const quality = this.assessNormalizationQuality(metrics, baseline);

    const result: NormalizationResult = {
      original: metrics,
      normalized,
      factors: {
        latency: {
          mean: baseline.statistics.latency.mean,
          std: baseline.statistics.latency.std,
          factor: normalized.averageLatency / metrics.averageLatency
        },
        successRate: {
          mean: baseline.statistics.successRate.mean,
          std: baseline.statistics.successRate.std,
          factor: normalized.successRate / metrics.successRate
        },
        throughput: {
          mean: baseline.statistics.throughput.mean,
          std: baseline.statistics.throughput.std,
          factor: normalized.throughput / metrics.throughput
        }
      },
      quality,
      normalizedAt: new Date(),
      confidenceBounds
    };

    // Update metrics
    this.updateMetrics(result);

    // Emit event
    this.emit('metrics-normalized', {
      skillId: metrics.skillId,
      result,
      processingTime: Date.now() - startTime
    });

    return result;
  }

  /**
   * Normalize multiple metrics
   */
  public async normalizeMultiple(
    metricsList: ActivationMetrics[],
    historicalData?: Record<string, ActivationMetrics[]>
  ): Promise<NormalizationResult[]> {
    const startTime = Date.now();

    const results = await Promise.all(
      metricsList.map(async (metrics) => {
        const skillHistory = historicalData?.[metrics.skillId];
        return this.normalizeMetrics(metrics, skillHistory);
      })
    );

    // Generate report
    const report = this.generateReport(results);

    this.emit('batch-normalization-completed', {
      totalMetrics: metricsList.length,
      report,
      processingTime: Date.now() - startTime
    });

    return results;
  }

  /**
   * Get baseline for a skill
   */
  public getBaseline(skillId: string): TemporalBaseline | null {
    return this.baselines.get(skillId) || null;
  }

  /**
   * Update baseline manually
   */
  public updateBaseline(skillId: string, baseline: TemporalBaseline): void {
    this.baselines.set(skillId, baseline);
    this.emit('baseline-updated', { skillId, baseline });
  }

  /**
   * Recalculate all baselines
   */
  public async recalculateBaselines(
    historicalData: Record<string, ActivationMetrics[]>
  ): Promise<void> {
    const startTime = Date.now();

    for (const [skillId, data] of Object.entries(historicalData)) {
      await this.getOrCreateBaseline(skillId, data);
    }

    this.emit('baselines-recalculated', {
      totalBaselines: this.baselines.size,
      processingTime: Date.now() - startTime
    });
  }

  /**
   * Get normalization metrics
   */
  public getMetrics(): NormalizationReport {
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
  public updateConfig(newConfig: Partial<NormalizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config-updated', this.config);
  }

  /**
   * Clear all baselines
   */
  public clearBaselines(): void {
    this.baselines.clear();
    this.emit('baselines-cleared');
  }

  // Private methods

  private async getOrCreateBaseline(
    skillId: string,
    historicalData?: ActivationMetrics[]
  ): Promise<TemporalBaseline> {
    // Check if baseline exists and is recent enough
    const existingBaseline = this.baselines.get(skillId);
    const now = new Date();

    if (existingBaseline && this.isBaselineValid(existingBaseline, now)) {
      return existingBaseline;
    }

    // Create new baseline from historical data
    if (!historicalData || historicalData.length < this.config.minSampleSize) {
      throw new Error(`Insufficient historical data for baseline creation: ${historicalData?.length || 0} < ${this.config.minSampleSize}`);
    }

    const baseline = this.createBaseline(skillId, historicalData);
    this.baselines.set(skillId, baseline);

    return baseline;
  }

  private isBaselineValid(baseline: TemporalBaseline, now: Date): boolean {
    const windowMs = this.parseTimeWindow(this.config.baselineWindow);
    const age = now.getTime() - baseline.createdAt.getTime();
    return age < windowMs;
  }

  private parseTimeWindow(window: { value: number; unit: string }): number {
    const multipliers = {
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      weeks: 7 * 24 * 60 * 60 * 1000
    };

    return window.value * (multipliers[window.unit as keyof typeof multipliers] || 1);
  }

  private createBaseline(skillId: string, data: ActivationMetrics[]): TemporalBaseline {
    const now = new Date();
    const windowMs = this.parseTimeWindow(this.config.baselineWindow);
    const cutoffDate = new Date(now.getTime() - windowMs);

    // Filter data within baseline window
    const recentData = data.filter(d => new Date(d.lastUpdated) >= cutoffDate);

    if (recentData.length < this.config.minSampleSize) {
      throw new Error(`Insufficient recent data for baseline: ${recentData.length} < ${this.config.minSampleSize}`);
    }

    // Calculate statistics
    const latencyValues = recentData.map(d => d.averageLatency);
    const successRateValues = recentData.map(d => d.successRate);
    const throughputValues = recentData.map(d => d.throughput);

    const statistics = {
      latency: this.calculateStatistics(latencyValues),
      successRate: this.calculateStatistics(successRateValues),
      throughput: this.calculateStatistics(throughputValues)
    };

    // Calculate seasonal factors
    let seasonalFactors;
    if (this.config.enableSeasonalAdjustment) {
      seasonalFactors = this.calculateSeasonalFactors(recentData);
    }

    // Calculate trend
    let trend;
    if (this.config.enableTrendAdjustment) {
      trend = this.calculateTrend(recentData);
    }

    // Assess quality
    const quality = this.assessBaselineQuality(recentData, statistics);

    return {
      period: {
        start: cutoffDate,
        end: now
      },
      statistics,
      seasonalFactors,
      trend,
      sampleSize: recentData.length,
      quality,
      createdAt: new Date()
    };
  }

  private calculateStatistics(values: number[]) {
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    return {
      mean,
      median,
      std,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  private calculateSeasonalFactors(data: ActivationMetrics[]) {
    // Simple seasonal factor calculation
    // In a real implementation, this would use more sophisticated time series analysis

    const hourlyFactors = new Array(24).fill(0);
    const dailyFactors = new Array(7).fill(0);
    const weeklyFactors = new Array(52).fill(0);

    const hourlyCounts = new Array(24).fill(0);
    const dailyCounts = new Array(7).fill(0);
    const weeklyCounts = new Array(52).fill(0);

    // Aggregate by time periods
    data.forEach(d => {
      const date = new Date(d.lastUpdated);
      const hour = date.getHours();
      const day = date.getDay();
      const week = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));

      hourlyFactors[hour] += d.successRate;
      hourlyCounts[hour]++;

      dailyFactors[day] += d.successRate;
      dailyCounts[day]++;

      if (week >= 0 && week < 52) {
        weeklyFactors[week] += d.successRate;
        weeklyCounts[week]++;
      }
    });

    // Normalize factors
    const normalizeFactors = (factors: number[], counts: number[]) => {
      const validIndices = counts.map((count, i) => count > 0 ? i : -1).filter(i => i >= 0);
      if (validIndices.length === 0) return factors;

      const avgFactor = validIndices.reduce((sum, i) => sum + factors[i] / counts[i], 0) / validIndices.length;

      return factors.map((factor, i) =>
        counts[i] > 0 ? (factor / counts[i]) / avgFactor : 1
      );
    };

    return {
      hourly: normalizeFactors(hourlyFactors, hourlyCounts),
      daily: normalizeFactors(dailyFactors, dailyCounts),
      weekly: normalizeFactors(weeklyFactors, weeklyCounts)
    };
  }

  private calculateTrend(data: ActivationMetrics[]) {
    // Simple linear trend calculation
    const sortedData = [...data].sort((a, b) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime());

    const n = sortedData.length;
    if (n < 2) return { slope: 0, correlation: 0, significance: 0 };

    const timeValues = sortedData.map((_, i) => i);
    const successRates = sortedData.map(d => d.successRate);

    // Calculate correlation and slope
    const meanX = timeValues.reduce((sum, x) => sum + x, 0) / n;
    const meanY = successRates.reduce((sum, y) => sum + y, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = timeValues[i] - meanX;
      const dy = successRates[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const correlation = Math.sqrt(numerator * numerator / (denomX * denomY));
    const slope = numerator / denomX;

    // Simple significance test
    const significance = Math.abs(correlation) * Math.sqrt((n - 2) / (1 - correlation * correlation));

    return { slope, correlation, significance };
  }

  private handleOutliers(metrics: ActivationMetrics, baseline: TemporalBaseline): ActivationMetrics {
    if (!this.config.outlierHandling.enabled) {
      return metrics;
    }

    // Simple outlier detection based on z-scores
    const latencies = [metrics.averageLatency];
    const successRates = [metrics.successRate];
    const throughputs = [metrics.throughput];

    // Check if values are outliers based on baseline statistics
    const isOutlier = (value: number, baseline: { mean: number; std: number }) => {
      const zScore = Math.abs((value - baseline.mean) / baseline.std);
      return zScore > this.config.outlierHandling.threshold;
    };

    let processedMetrics = { ...metrics };

    if (isOutlier(metrics.averageLatency, baseline.statistics.latency)) {
      processedMetrics.averageLatency = this.handleOutlierValue(
        metrics.averageLatency,
        baseline.statistics.latency
      );
    }

    if (isOutlier(metrics.successRate, baseline.statistics.successRate)) {
      processedMetrics.successRate = this.handleOutlierValue(
        metrics.successRate,
        baseline.statistics.successRate
      );
    }

    if (isOutlier(metrics.throughput, baseline.statistics.throughput)) {
      processedMetrics.throughput = this.handleOutlierValue(
        metrics.throughput,
        baseline.statistics.throughput
      );
    }

    return processedMetrics;
  }

  private handleOutlierValue(value: number, baseline: { mean: number; std: number }): number {
    switch (this.config.outlierHandling.action) {
      case 'remove':
        return baseline.mean;
      case 'cap':
        const threshold = this.config.outlierHandling.threshold;
        const maxDeviation = threshold * baseline.std;
        return Math.max(baseline.mean - maxDeviation, Math.min(baseline.mean + maxDeviation, value));
      case 'transform':
        // Log transform for extreme values
        return baseline.mean + Math.sign(value - baseline.mean) * Math.log(1 + Math.abs(value - baseline.mean));
      default:
        return value;
    }
  }

  private applySeasonalAdjustment(metrics: ActivationMetrics, baseline: TemporalBaseline): ActivationMetrics {
    if (!baseline.seasonalFactors) {
      return metrics;
    }

    const now = new Date(metrics.lastUpdated);
    const hour = now.getHours();
    const day = now.getDay();
    const week = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));

    const hourlyFactor = baseline.seasonalFactors.hourly[hour] || 1;
    const dailyFactor = baseline.seasonalFactors.daily[day] || 1;
    const weeklyFactor = baseline.seasonalFactors.weekly[Math.min(week, 51)] || 1;

    // Combined seasonal factor (weighted average)
    const combinedFactor = (hourlyFactor * 0.5 + dailyFactor * 0.3 + weeklyFactor * 0.2);

    return {
      ...metrics,
      successRate: metrics.successRate / combinedFactor
    };
  }

  private applyTrendAdjustment(metrics: ActivationMetrics, baseline: TemporalBaseline): ActivationMetrics {
    if (!baseline.trend) {
      return metrics;
    }

    // Simple trend adjustment - remove linear trend component
    const timeSinceBaseline = (new Date(metrics.lastUpdated).getTime() - baseline.period.end.getTime()) / (24 * 60 * 60 * 1000);
    const trendComponent = baseline.trend.slope * timeSinceBaseline;

    return {
      ...metrics,
      successRate: metrics.successRate - trendComponent
    };
  }

  private applySmoothing(metrics: ActivationMetrics, baseline: TemporalBaseline): ActivationMetrics {
    // Simple exponential smoothing using baseline mean as smoothing target
    const alpha = this.config.smoothing.alpha || 0.3;

    return {
      ...metrics,
      averageLatency: alpha * metrics.averageLatency + (1 - alpha) * baseline.statistics.latency.mean,
      successRate: alpha * metrics.successRate + (1 - alpha) * baseline.statistics.successRate.mean,
      throughput: alpha * metrics.throughput + (1 - alpha) * baseline.statistics.throughput.mean
    };
  }

  private performNormalization(metrics: ActivationMetrics, baseline: TemporalBaseline): ActivationMetrics {
    switch (this.config.method) {
      case 'z-score':
        return this.zScoreNormalization(metrics, baseline);
      case 'min-max':
        return this.minMaxNormalization(metrics, baseline);
      case 'robust':
        return this.robustNormalization(metrics, baseline);
      case 'quantile':
        return this.quantileNormalization(metrics, baseline);
      default:
        return this.zScoreNormalization(metrics, baseline);
    }
  }

  private zScoreNormalization(metrics: ActivationMetrics, baseline: TemporalBaseline): ActivationMetrics {
    return {
      ...metrics,
      averageLatency: (metrics.averageLatency - baseline.statistics.latency.mean) / baseline.statistics.latency.std,
      successRate: (metrics.successRate - baseline.statistics.successRate.mean) / baseline.statistics.successRate.std,
      throughput: (metrics.throughput - baseline.statistics.throughput.mean) / baseline.statistics.throughput.std
    };
  }

  private minMaxNormalization(metrics: ActivationMetrics, baseline: TemporalBaseline): ActivationMetrics {
    const latRange = baseline.statistics.latency.max - baseline.statistics.latency.min;
    const srRange = baseline.statistics.successRate.max - baseline.statistics.successRate.min;
    const tpRange = baseline.statistics.throughput.max - baseline.statistics.throughput.min;

    return {
      ...metrics,
      averageLatency: latRange > 0 ? (metrics.averageLatency - baseline.statistics.latency.min) / latRange : 0,
      successRate: srRange > 0 ? (metrics.successRate - baseline.statistics.successRate.min) / srRange : 0,
      throughput: tpRange > 0 ? (metrics.throughput - baseline.statistics.throughput.min) / tpRange : 0
    };
  }

  private robustNormalization(metrics: ActivationMetrics, baseline: TemporalBaseline): ActivationMetrics {
    // Use median and MAD (median absolute deviation) for robust normalization
    const latMad = this.calculateMAD(baseline.statistics.latency.median, [metrics.averageLatency]);
    const srMad = this.calculateMAD(baseline.statistics.successRate.median, [metrics.successRate]);
    const tpMad = this.calculateMAD(baseline.statistics.throughput.median, [metrics.throughput]);

    return {
      ...metrics,
      averageLatency: (metrics.averageLatency - baseline.statistics.latency.median) / (latMad || 1),
      successRate: (metrics.successRate - baseline.statistics.successRate.median) / (srMad || 1),
      throughput: (metrics.throughput - baseline.statistics.throughput.median) / (tpMad || 1)
    };
  }

  private quantileNormalization(metrics: ActivationMetrics, baseline: TemporalBaseline): ActivationMetrics {
    // Simple quantile normalization - map to percentile ranks
    // In a real implementation, this would use the full baseline distribution
    return {
      ...metrics,
      averageLatency: 0.5, // Placeholder - would calculate actual percentile
      successRate: 0.5,
      throughput: 0.5
    };
  }

  private calculateMAD(median: number, values: number[]): number {
    const deviations = values.map(v => Math.abs(v - median));
    deviations.sort((a, b) => a - b);
    return deviations[Math.floor(deviations.length / 2)];
  }

  private calculateConfidenceBounds(normalized: ActivationMetrics, baseline: TemporalBaseline) {
    const zValue = 1.96; // For 95% confidence interval

    return {
      latency: {
        lower: normalized.averageLatency - zValue * baseline.statistics.latency.std,
        upper: normalized.averageLatency + zValue * baseline.statistics.latency.std
      },
      successRate: {
        lower: normalized.successRate - zValue * baseline.statistics.successRate.std,
        upper: normalized.successRate + zValue * baseline.statistics.successRate.std
      },
      throughput: {
        lower: normalized.throughput - zValue * baseline.statistics.throughput.std,
        upper: normalized.throughput + zValue * baseline.statistics.throughput.std
      }
    };
  }

  private assessNormalizationQuality(original: ActivationMetrics, baseline: TemporalBaseline) {
    // Assess quality based on sample size, baseline quality, and data characteristics
    const sampleSizeScore = Math.min(1, baseline.sampleSize / 100);
    const baselineQualityScore = baseline.quality;
    const consistencyScore = this.assessDataConsistency(original, baseline);

    const reliability = (sampleSizeScore * 0.4 + baselineQualityScore * 0.4 + consistencyScore * 0.2);

    return {
      sampleSize: baseline.sampleSize,
      reliability,
      outlierCount: this.config.outlierHandling.enabled ? 1 : 0, // Simplified
      seasonalAdjustment: this.config.enableSeasonalAdjustment && !!baseline.seasonalFactors,
      trendAdjustment: this.config.enableTrendAdjustment && !!baseline.trend
    };
  }

  private assessDataConsistency(metrics: ActivationMetrics, baseline: TemporalBaseline): number {
    // Simple consistency check based on how far metrics deviate from baseline
    const latDeviation = Math.abs(metrics.averageLatency - baseline.statistics.latency.mean) / baseline.statistics.latency.std;
    const srDeviation = Math.abs(metrics.successRate - baseline.statistics.successRate.mean) / baseline.statistics.successRate.std;
    const tpDeviation = Math.abs(metrics.throughput - baseline.statistics.throughput.mean) / baseline.statistics.throughput.std;

    const avgDeviation = (latDeviation + srDeviation + tpDeviation) / 3;

    // Lower deviation = higher consistency
    return Math.max(0, 1 - avgDeviation / 3);
  }

  private assessBaselineQuality(data: ActivationMetrics[], statistics: any): number {
    // Assess baseline quality based on data characteristics
    const sampleSizeScore = Math.min(1, data.length / 100);

    // Assess coefficient of variation (lower is better)
    const cvLatency = statistics.latency.std / statistics.latency.mean;
    const cvSuccessRate = statistics.successRate.std / (statistics.successRate.mean || 1);
    const cvThroughput = statistics.throughput.std / (statistics.throughput.mean || 1);

    const avgCV = (cvLatency + cvSuccessRate + cvThroughput) / 3;
    const variationScore = Math.max(0, 1 - avgCV);

    return (sampleSizeScore * 0.6 + variationScore * 0.4);
  }

  private initializeMetrics(): NormalizationReport {
    return {
      totalNormalized: 0,
      averageReliability: 0,
      methodUsage: {},
      outlierStats: {
        detected: 0,
        removed: 0,
        capped: 0,
        transformed: 0
      },
      processingTime: 0,
      qualityDistribution: {
        high: 0,
        medium: 0,
        low: 0
      }
    };
  }

  private updateMetrics(result: NormalizationResult): void {
    this.metrics.totalNormalized++;

    // Update average reliability
    this.metrics.averageReliability =
      (this.metrics.averageReliability * (this.metrics.totalNormalized - 1) + result.quality.reliability) /
      this.metrics.totalNormalized;

    // Update method usage
    const methodName = this.config.method;
    this.metrics.methodUsage[methodName] = (this.metrics.methodUsage[methodName] || 0) + 1;

    // Update outlier stats
    if (result.quality.outlierCount > 0) {
      this.metrics.outlierStats.detected += result.quality.outlierCount;
      if (this.config.outlierHandling.action === 'remove') {
        this.metrics.outlierStats.removed += result.quality.outlierCount;
      } else if (this.config.outlierHandling.action === 'cap') {
        this.metrics.outlierStats.capped += result.quality.outlierCount;
      } else {
        this.metrics.outlierStats.transformed += result.quality.outlierCount;
      }
    }

    // Update quality distribution
    if (result.quality.reliability > 0.8) {
      this.metrics.qualityDistribution.high++;
    } else if (result.quality.reliability >= 0.5) {
      this.metrics.qualityDistribution.medium++;
    } else {
      this.metrics.qualityDistribution.low++;
    }
  }

  private generateReport(results: NormalizationResult[]): NormalizationReport {
    const totalNormalized = results.length;
    const averageReliability = results.reduce((sum, r) => sum + r.quality.reliability, 0) / totalNormalized;

    const methodUsage: Record<string, number> = {};
    results.forEach(r => {
      const methodName = this.config.method;
      methodUsage[methodName] = (methodUsage[methodName] || 0) + 1;
    });

    const outlierStats = {
      detected: results.reduce((sum, r) => sum + r.quality.outlierCount, 0),
      removed: 0,
      capped: 0,
      transformed: 0
    };

    const qualityDistribution = results.reduce((acc, r) => {
      if (r.quality.reliability > 0.8) acc.high++;
      else if (r.quality.reliability >= 0.5) acc.medium++;
      else acc.low++;
      return acc;
    }, { high: 0, medium: 0, low: 0 });

    return {
      totalNormalized,
      averageReliability,
      methodUsage,
      outlierStats,
      processingTime: 0, // Will be set by caller
      qualityDistribution
    };
  }
}