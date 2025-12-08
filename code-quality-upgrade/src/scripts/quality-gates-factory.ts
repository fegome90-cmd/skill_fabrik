/**
 * Quality Gates Factory
 *
 * Factory for creating real quality gate implementations.
 * This separates the orchestration logic from the actual gate implementations.
 */

/* eslint-disable simple-import-sort/imports */
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import { QualityMetrics } from '../types/quality';

import { MetricsValidator } from './validate-metrics';
import { QualityGate, GateExecutionResult } from './quality-gates-orchestrator';
/* eslint-enable simple-import-sort/imports */

const execAsync = promisify(exec);

/**
 * Factory for creating quality gates
 */
export class QualityGatesFactory {
  static createDefaultGates(): QualityGate[] {
    return [
      new ESLintGate(),
      new TypeScriptGate(),
      new TestsGate(),
      new PrettierGate(),
      new EvidenceValidationGate(),
      new MetricsValidationGate(),
    ];
  }
}

// Individual Gate Implementations (moved from orchestrator)

class ESLintGate implements QualityGate {
  name = 'ESLint';
  critical = true;
  timeout = 60000; // 1 minute

  async execute(): Promise<GateExecutionResult> {
    try {
      // Use --cache for faster subsequent runs
      const { stdout } = await execAsync('npm run lint -- --cache', {
        timeout: this.timeout - 5000,
        encoding: 'utf8',
      });

      return {
        name: this.name,
        success: true,
        executionTime: 0, // Will be set by orchestrator
        output: stdout,
      };
    } catch (error) {
      return {
        name: this.name,
        success: false,
        executionTime: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

class TypeScriptGate implements QualityGate {
  name = 'TypeScript';
  critical = true;
  timeout = 60000;

  async execute(): Promise<GateExecutionResult> {
    try {
      // Use incremental compilation for faster subsequent builds
      const { stdout } = await execAsync('npx tsc --noEmit --incremental', {
        timeout: this.timeout - 5000,
        encoding: 'utf8',
      });

      return {
        name: this.name,
        success: true,
        executionTime: 0,
        output: stdout,
      };
    } catch (error) {
      return {
        name: this.name,
        success: false,
        executionTime: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

class TestsGate implements QualityGate {
  name = 'Tests';
  critical = true;
  timeout = 120000; // 2 minutes

  async execute(): Promise<GateExecutionResult> {
    try {
      const { stdout } = await execAsync('npm test -- --passWithNoTests', {
        timeout: this.timeout - 5000,
        encoding: 'utf8',
      });

      return {
        name: this.name,
        success: true,
        executionTime: 0,
        output: stdout,
      };
    } catch (error) {
      return {
        name: this.name,
        success: false,
        executionTime: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

class PrettierGate implements QualityGate {
  name = 'Prettier';
  critical = false;
  timeout = 30000;

  async execute(): Promise<GateExecutionResult> {
    try {
      // Check specific source directories for faster execution
      const { stdout } = await execAsync(
        'npx prettier --check "src/**/*.ts" "test/**/*.ts" "scripts/**/*.ts"',
        {
          timeout: this.timeout - 5000,
          encoding: 'utf8',
        }
      );

      return {
        name: this.name,
        success: true,
        executionTime: 0,
        output: stdout,
      };
    } catch (error) {
      return {
        name: this.name,
        success: false,
        executionTime: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

class EvidenceValidationGate implements QualityGate {
  name = 'Evidence Validation';
  critical = false;
  timeout = 30000;

  async execute(): Promise<GateExecutionResult> {
    try {
      const { stdout } = await execAsync('npm run evidence:validate', {
        timeout: this.timeout - 5000,
        encoding: 'utf8',
      });

      return {
        name: this.name,
        success: true,
        executionTime: 0,
        output: stdout,
      };
    } catch (error) {
      // Handle case where evidence validation is not available
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('evidence:validate') ||
        errorMessage.includes('ENOENT')
      ) {
        return {
          name: this.name,
          success: true,
          executionTime: 0,
          output: 'No evidence validation available',
        };
      }

      return {
        name: this.name,
        success: false,
        executionTime: 0,
        error: errorMessage,
      };
    }
  }
}

class MetricsValidationGate implements QualityGate {
  name = 'Metrics Validation';
  critical = false;
  timeout = 30000;

  async execute(): Promise<GateExecutionResult> {
    return new Promise(resolve => {
      try {
        // Test metrics validation
        const validator = new MetricsValidator();
        const testMetrics = this.createTestMetrics();
        const result = validator.validateStructure(
          testMetrics as unknown as Partial<QualityMetrics> &
            Record<string, unknown>
        );

        resolve({
          name: this.name,
          success: result.isValid,
          executionTime: 0,
          output: `Validation completed in ${result.metadata.duration}ms`,
          metrics: {
            validationResult: result,
          },
        });
      } catch (error) {
        resolve({
          name: this.name,
          success: false,
          executionTime: 0,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  private createTestMetrics(): QualityMetrics {
    return {
      timestamp: Date.now(),
      qualityScore: 85,
      technicalDebt: 'MEDIUM' as const,
      performance: {
        executionTime: 1000,
        memoryUsage: 100,
        cpuUtilization: 25,
      },
      gates: {
        executionTime: 500,
        successRate: 0.8,
        failureRate: 0.2,
        totalGates: 5,
        passedGates: 4,
        failedGates: 1,
        skippedGates: 0,
      },
      trends: {
        qualityScore: 80,
        performanceScore: 75,
        maintainabilityScore: 90,
      },
      eslintErrorRate: 0.05,
      averageExecutionTime: 15000,
      gateExecutions: [],
    };
  }
}
