/**
 * T3.3.0: Quality Gates Orchestrator
 *
 * Central orchestrator for executing all quality gates with parallel execution,
 * performance monitoring, and comprehensive reporting.
 *
 * CLEAN ARCHITECTURE: Follows QualityGate interface, integrates with existing
 * QualityDashboard and QualityAlerts systems. Implements dependency injection
 * for testability and follows TDD methodology.
 */

/* eslint-disable simple-import-sort/imports */
import { QualityAlerts } from '../monitoring/quality-alerts';
import { QualityDashboard } from '../monitoring/quality-dashboard';
import { QualityMetrics } from '../types/quality';

import { MetricsValidator } from './validate-metrics';
import { QualityGatesFactory } from './quality-gates-factory';
/* eslint-enable simple-import-sort/imports */

/**
 * Interface for quality gate execution
 */
export interface QualityGate {
  name: string;
  critical: boolean;
  timeout: number;
  execute(): GateExecutionResult | Promise<GateExecutionResult>;
}

/**
 * Result of gate execution
 */
export interface GateExecutionResult {
  name: string;
  success: boolean;
  executionTime: number;
  error?: string;
  output?: string;
  metrics?: Record<string, unknown>;
}

/**
 * Orchestration configuration
 */
export interface OrchestrationConfig {
  parallel: boolean;
  failFast: boolean;
  continueOnError: boolean;
  timeout: number;
  maxRetries: number;
}

/**
 * Main Quality Gates Orchestrator
 */
export class QualityGatesOrchestrator {
  private readonly config: OrchestrationConfig;
  private readonly dashboard: QualityDashboard;
  private readonly alerts: QualityAlerts;
  private readonly validator: MetricsValidator;

  constructor(
    config: OrchestrationConfig = {
      parallel: true,
      failFast: true,
      continueOnError: false,
      timeout: 300000, // 5 minutes
      maxRetries: 1,
    }
  ) {
    this.config = config;
    this.dashboard = new QualityDashboard();
    this.alerts = new QualityAlerts();
    this.validator = new MetricsValidator();
  }

  /**
   * Execute all quality gates
   */
  async executeAllGates(): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const gates = this.getQualityGates();

    process.stdout.write(`🎯 Executing ${gates.length} quality gates...\n`);

    try {
      const results = this.config.parallel
        ? await this.executeParallel(gates)
        : await this.executeSequential(gates);

      const executionTime = Date.now() - startTime;
      const metrics = this.calculateMetrics(results, executionTime);
      const report = this.dashboard.generateReport(metrics);
      const alertResults = this.alerts.evaluateAlerts(metrics);

      return {
        success: results.every(r => r.success),
        results,
        executionTime,
        metrics,
        report,
        alertResults,
      };
    } catch (error) {
      return {
        success: false,
        results: [],
        executionTime: Date.now() - startTime,
        metrics: this.createEmptyMetrics(),
        report: null,
        alertResults: { critical: [], warnings: [], info: [] },
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute gates in parallel
   */
  private async executeParallel(
    gates: QualityGate[]
  ): Promise<GateExecutionResult[]> {
    const promises = gates.map(gate => this.executeGate(gate));
    const results = await Promise.allSettled(promises);

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const reason = result.reason as { message?: string };
        return {
          name: gates[index].name,
          success: false,
          executionTime: 0,
          error: reason?.message || 'Unknown error',
        };
      }
    });
  }

  /**
   * Execute gates sequentially
   */
  private async executeSequential(
    gates: QualityGate[]
  ): Promise<GateExecutionResult[]> {
    const results: GateExecutionResult[] = [];

    for (const gate of gates) {
      const result = await this.executeGate(gate);
      results.push(result);

      if (!result.success && this.config.failFast) {
        process.stdout.write(
          `❌ Gate '${gate.name}' failed, stopping execution\n`
        );
        break;
      }

      if (!result.success && !this.config.continueOnError) {
        process.stdout.write(`❌ Gate '${gate.name}' failed, continuing...\n`);
      }
    }

    return results;
  }

  /**
   * Execute a single quality gate
   */
  private async executeGate(gate: QualityGate): Promise<GateExecutionResult> {
    const startTime = Date.now();

    try {
      process.stdout.write(`🔍 Executing gate: ${gate.name}...\n`);

      const result = await Promise.race([
        gate.execute(),
        this.createTimeoutPromise(gate.timeout),
      ]);

      const executionTime = Date.now() - startTime;

      if (result.success) {
        process.stdout.write(
          `✅ Gate '${gate.name}' passed (${executionTime}ms)\n`
        );
      } else {
        process.stdout.write(
          `❌ Gate '${gate.name}' failed (${executionTime}ms)\n`
        );
      }

      return {
        ...result,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      process.stdout.write(
        `💥 Gate '${gate.name}' error: ${errorMessage} (${executionTime}ms)\n`
      );

      return {
        name: gate.name,
        success: false,
        executionTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Gate timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Get all available quality gates
   */
  private getQualityGates(): QualityGate[] {
    return QualityGatesFactory.createDefaultGates();
  }

  /**
   * Calculate aggregated metrics from gate results
   */
  private calculateMetrics(
    results: GateExecutionResult[],
    executionTime: number
  ): QualityMetrics {
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const total = results.length;

    return {
      timestamp: Date.now(),
      qualityScore: total > 0 ? (passed / total) * 100 : 0,
      technicalDebt: failed > 0 ? ('HIGH' as const) : ('LOW' as const),
      performance: {
        executionTime,
        memoryUsage: 0, // Would be collected from system
        cpuUtilization: 0, // Would be collected from system
      },
      gates: {
        executionTime,
        successRate: total > 0 ? passed / total : 0,
        failureRate: total > 0 ? failed / total : 0,
        totalGates: total,
        passedGates: passed,
        failedGates: failed,
        skippedGates: 0,
      },
      trends: {
        qualityScore: 0, // Would be calculated from historical data
        performanceScore: 0,
        maintainabilityScore: 0,
      },
      eslintErrorRate: 0,
      averageExecutionTime: executionTime / total,
      gateExecutions: results.map(result => ({
        gateName: result.name,
        executionTime: result.executionTime,
        success: result.success,
        error: result.error,
        output: result.output,
        metrics: result.metrics,
        timestamp: Date.now(),
      })),
    };
  }

  /**
   * Create empty metrics for error cases
   */
  private createEmptyMetrics(): QualityMetrics {
    return {
      timestamp: Date.now(),
      qualityScore: 0,
      technicalDebt: 'HIGH' as const,
      performance: {
        executionTime: 0,
        memoryUsage: 0,
        cpuUtilization: 0,
      },
      gates: {
        executionTime: 0,
        successRate: 0,
        failureRate: 0,
        totalGates: 0,
        passedGates: 0,
        failedGates: 0,
        skippedGates: 0,
      },
      trends: {
        qualityScore: 0,
        performanceScore: 0,
        maintainabilityScore: 0,
      },
      eslintErrorRate: 0,
      averageExecutionTime: 0,
      gateExecutions: [],
    };
  }
}

/**
 * Result of orchestration execution
 */
export interface OrchestrationResult {
  success: boolean;
  results: GateExecutionResult[];
  executionTime: number;
  metrics: QualityMetrics;
  report: ReturnType<QualityDashboard['generateReport']> | null;
  alertResults: ReturnType<QualityAlerts['evaluateAlerts']>;
  error?: string;
}
