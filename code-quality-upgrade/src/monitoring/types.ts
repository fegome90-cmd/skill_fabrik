/**
 * Performance Monitoring Types - T1.2.0
 *
 * Defines interfaces and types for comprehensive performance monitoring
 * during ESLint migration operations.
 */

export interface PerformanceMetrics {
  /** Execution time in milliseconds */
  executionTime: number;

  /** Peak memory usage in bytes */
  peakMemoryUsage: number;

  /** Average memory usage in bytes */
  averageMemoryUsage: number;

  /** Number of files processed */
  filesProcessed: number;

  /** Success rate (0-1) */
  successRate: number;

  /** CPU utilization percentage */
  cpuUtilization: number;

  /** Timestamp when metrics were captured */
  timestamp: Date;
}

export interface PhaseMetrics {
  /** Phase identifier */
  phase: string;

  /** Start time */
  startTime: Date;

  /** End time */
  endTime?: Date;

  /** Duration in milliseconds */
  duration?: number;

  /** Memory usage at start */
  memoryAtStart: number;

  /** Memory usage at end */
  memoryAtEnd?: number;

  /** Peak memory during this phase */
  peakMemoryDuring: number;

  /** Files processed in this phase */
  filesProcessed: number;

  /** Success status */
  success: boolean;

  /** Error message if failed */
  error?: string;
}

export interface MigrationProfile {
  /** Migration operation name */
  operation: string;

  /** Overall metrics for the migration */
  overallMetrics: PerformanceMetrics;

  /** Phase-by-phase breakdown */
  phaseMetrics: PhaseMetrics[];

  /** Performance regression detected */
  regressionDetected: boolean;

  /** Baseline metrics for comparison */
  baselineMetrics?: PerformanceMetrics;

  /** Bottlenecks identified */
  bottlenecks: Bottleneck[];
}

export interface Bottleneck {
  /** Bottleneck phase or operation */
  phase: string;

  /** Impact severity (1-10) */
  severity: number;

  /** Description of the bottleneck */
  description: string;

  /** Recommended optimization */
  recommendation: string;

  /** Estimated improvement potential */
  improvementPotential: number;
}

export interface PerformanceBaseline {
  /** Baseline identifier */
  id: string;

  /** Environment information */
  environment: {
    nodeVersion: string;
    platform: string;
    arch: string;
    memory: number;
  };

  /** Baseline metrics */
  metrics: PerformanceMetrics;

  /** Creation date */
  createdAt: Date;

  /** Source (manual, auto-generated, etc.) */
  source: 'manual' | 'auto-generated' | 'benchmark';
}

export interface PerformanceConfig {
  /** Enable/disable monitoring */
  enabled: boolean;

  /** Sampling rate (0-1) for expensive operations */
  samplingRate: number;

  /** Memory tracking interval in milliseconds */
  memoryTrackingInterval: number;

  /** Enable CPU profiling */
  enableCpuProfiling: boolean;

  /** Enable memory profiling */
  enableMemoryProfiling: boolean;

  /** Performance regression threshold (percentage) */
  regressionThreshold: number;

  /** Baseline comparison enabled */
  compareWithBaseline: boolean;

  /** Output directory for performance reports */
  outputDir: string;

  /** Generate JSON reports */
  generateJsonReports: boolean;

  /** Generate human-readable reports */
  generateHumanReports: boolean;
}

export interface PerformanceReporter {
  /** Report performance metrics */
  report(metrics: MigrationProfile): Promise<void>;

  /** Generate baseline report */
  generateBaseline(baseline: PerformanceBaseline): Promise<void>;

  /** Compare with existing baseline */
  compareWithBaseline(
    actual: PerformanceMetrics,
    baseline: PerformanceBaseline
  ): RegressionResult;
}

export interface RegressionResult {
  /** Regression detected */
  detected: boolean;

  /** Severity of regression (1-10) */
  severity: number;

  /** Performance degradation percentage */
  degradationPercentage: number;

  /** Affected metrics */
  affectedMetrics: string[];

  /** Recommendations */
  recommendations: string[];
}
