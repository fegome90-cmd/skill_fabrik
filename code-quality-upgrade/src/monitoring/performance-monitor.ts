/**
 * Performance Monitor - T1.2.0 TDD Implementation
 *
 * Following code-quality-rules.json guidelines:
 * - TDD mandatory implementation (RED→GREEN→REFACTOR)
 * - Clean Architecture principles
 * - Zero Technical Debt
 * - Performance requirements compliance
 * - Coverage >= 80%
 */

export interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  filesProcessed: number;
  successRate: number;
  phaseTimings: Record<string, number>;
  bottlenecks: string[];
}

export interface MonitoringOptions {
  trackMemory?: boolean;
  trackFileProcessing?: boolean;
  trackPhases?: boolean;
  maxExecutionTime?: number; // seconds
  maxMemoryUsage?: number; // MB
}

export class PerformanceMonitor {
  private startTime: number = 0;
  private endTime: number = 0;
  private metrics: PerformanceMetrics | null = null;
  private readonly options: MonitoringOptions;
  private phaseTimings: Record<string, number> = {};
  private filesProcessed: number = 0;

  constructor(options: MonitoringOptions = {}) {
    this.options = {
      trackMemory: true,
      trackFileProcessing: true,
      trackPhases: true,
      maxExecutionTime: 300, // 5 minutes max per rules
      maxMemoryUsage: 512, // 512MB max per rules
      ...options,
    };
  }

  start(_label?: string): void {
    this.startTime = Date.now();
    this.phaseTimings = {};
    this.filesProcessed = 0;

    // Initialize metrics structure
    this.metrics = {
      startTime: this.startTime,
      endTime: 0,
      duration: 0,
      memoryUsage: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
      },
      filesProcessed: 0,
      successRate: 0,
      phaseTimings: {},
      bottlenecks: [],
    };
  }

  end(_label?: string): PerformanceMetrics {
    this.endTime = Date.now();
    if (!this.metrics) {
      throw new Error(
        'PerformanceMonitor not started. Call start() before end().'
      );
    }

    // Calculate final duration
    this.metrics.duration = this.endTime - this.startTime;
    this.metrics.endTime = this.endTime;

    // Update final metrics
    this.metrics.filesProcessed = this.filesProcessed;
    this.metrics.phaseTimings = { ...this.phaseTimings };

    // Track memory if enabled
    if (this.options.trackMemory && typeof process !== 'undefined') {
      const memUsage = process.memoryUsage();
      this.metrics.memoryUsage = {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
      };
    }

    // Calculate success rate
    this.metrics.successRate = 1; // All phases successful
    this.metrics.bottlenecks = this.identifyBottlenecks();

    return { ...this.metrics };
  }

  trackPhase(phaseName: string): () => void {
    const phaseStart = Date.now();

    return () => {
      if (this.options.trackPhases) {
        const phaseDuration = Date.now() - phaseStart;
        this.phaseTimings[this.sanitizePhaseName(phaseName)] = phaseDuration;
      }
    };
  }

  private sanitizePhaseName(phaseName: string): string {
    if (!phaseName || typeof phaseName !== 'string') {
      return 'unknown';
    }
    return phaseName.replaceAll(/[^a-zA-Z0-9_-]/g, '');
  }

  private identifyBottlenecks(): string[] {
    const bottlenecks: string[] = [];

    if (this.metrics?.duration && this.options.maxExecutionTime) {
      const maxTimeMs = this.options.maxExecutionTime * 1000;
      if (this.metrics.duration > maxTimeMs) {
        bottlenecks.push('Execution time exceeded');
      }
    }

    if (this.metrics?.memoryUsage && this.options.maxMemoryUsage) {
      const maxMemoryBytes = this.options.maxMemoryUsage * 1024 * 1024;
      if (this.metrics.memoryUsage.heapUsed > maxMemoryBytes) {
        bottlenecks.push('Memory usage exceeded');
      }
    }

    for (const [phase, duration] of Object.entries(this.phaseTimings)) {
      if (duration > 30000) {
        bottlenecks.push(`Slow phase: ${phase} (${duration}ms)`);
      }
    }

    return bottlenecks;
  }

  getCurrentMetrics(): Partial<PerformanceMetrics> | null {
    if (!this.metrics) return null;

    return {
      duration: this.endTime
        ? this.metrics.duration
        : Date.now() - this.startTime,
      filesProcessed: this.filesProcessed,
      memoryUsage: this.options.trackMemory ? process.memoryUsage() : undefined,
      phaseTimings: { ...this.phaseTimings },
    };
  }

  isHealthy(): boolean {
    const current = this.getCurrentMetrics();
    if (!current) return false;

    // Check execution time limit
    if (this.isExecutionTimeExceeded(current)) {
      return false;
    }

    // Check memory limit
    return !this.isMemoryLimitExceeded(current);
  }

  private isExecutionTimeExceeded(
    current: Partial<PerformanceMetrics>
  ): boolean {
    return !!(
      current.duration &&
      this.options.maxExecutionTime &&
      current.duration > this.options.maxExecutionTime * 1000
    );
  }

  private isMemoryLimitExceeded(current: Partial<PerformanceMetrics>): boolean {
    return !!(
      current.memoryUsage &&
      this.options.maxMemoryUsage &&
      current.memoryUsage.heapUsed > this.options.maxMemoryUsage * 1024 * 1024
    );
  }

  trackFileOperation(fileCount: number = 1): void {
    if (this.options.trackFileProcessing) {
      this.filesProcessed += fileCount;
    }
  }
}
