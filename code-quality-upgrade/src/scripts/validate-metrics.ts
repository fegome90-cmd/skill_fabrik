import { QualityMetrics } from '../types/quality';
import {
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from '../types/validation';

/**
 * Validator for quality metrics consistency and structure
 */
export class MetricsValidator {
  /**
   * Validate the structure of a metrics object
   */
  validateStructure(
    metrics: Partial<QualityMetrics> & Record<string, unknown>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const startTime = Date.now();

    // Check required top-level fields
    const requiredFields = [
      'timestamp',
      'qualityScore',
      'technicalDebt',
      'performance',
      'gates',
      'trends',
      'eslintErrorRate',
      'averageExecutionTime',
    ];

    // Check missing fields with type-safe access
    for (const field of requiredFields) {
      const value = metrics[field as keyof QualityMetrics];
      if (value === undefined) {
        errors.push({
          code: 'MISSING_FIELD',
          message: `Missing required field: ${field}`,
          severity: 'critical',
        });
      }
    }

    const gates = metrics.gates;
    if (gates && typeof gates === 'object') {
      const gateFields = [
        'successRate',
        'failureRate',
        'totalGates',
        'passedGates',
        'failedGates',
      ];
      const gateRecord = gates as Partial<
        Record<keyof QualityMetrics['gates'], unknown>
      >;
      for (const field of gateFields) {
        // Use type-safe dynamic field access
        if (
          gateRecord[field as keyof QualityMetrics['gates']] !== undefined &&
          typeof gateRecord[field as keyof QualityMetrics['gates']] !== 'number'
        ) {
          errors.push({
            code: 'INVALID_TYPE',
            message: `Invalid type for gates.${field}: expected number`,
            severity: 'high',
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        itemsProcessed: 1,
        validatorVersion: '1.0.0',
      },
    };
  }

  /**
   * Validate logical consistency of metrics
   */
  validateConsistency(metrics: QualityMetrics): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const startTime = Date.now();

    // Check success/failure rate consistency
    const rateSum = metrics.gates.successRate + metrics.gates.failureRate;
    // Allow small floating point error
    if (Math.abs(rateSum - 1) > 0.001 && metrics.gates.totalGates > 0) {
      errors.push({
        code: 'INCONSISTENT_RATES',
        message: `Success rate (${metrics.gates.successRate}) + failure rate (${metrics.gates.failureRate}) must equal 1`,
        severity: 'high',
      });
    }

    // Check gate counts consistency
    const countSum =
      metrics.gates.passedGates +
      metrics.gates.failedGates +
      metrics.gates.skippedGates;
    if (countSum !== metrics.gates.totalGates) {
      errors.push({
        code: 'INCONSISTENT_COUNTS',
        message: `Total gates (${metrics.gates.totalGates}) does not match sum of passed, failed, and skipped (${countSum})`,
        severity: 'high',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        itemsProcessed: 1,
        validatorVersion: '1.0.0',
      },
    };
  }

  /**
   * Aggregate multiple metrics objects into one
   */
  aggregateMetrics(metricsList: QualityMetrics[]): QualityMetrics {
    if (!metricsList || metricsList.length === 0) {
      throw new Error('Cannot aggregate empty metrics list');
    }

    const count = metricsList.length;
    const latest = metricsList.reduce(
      (prev, current) => (prev.timestamp > current.timestamp ? prev : current),
      metricsList[0] // Initial value
    );

    // Average numeric values
    const avgQualityScore =
      metricsList.reduce((sum, m) => sum + m.qualityScore, 0) / count;
    const avgExecutionTime =
      metricsList.reduce((sum, m) => sum + m.averageExecutionTime, 0) / count;
    const avgEslintRate =
      metricsList.reduce((sum, m) => sum + m.eslintErrorRate, 0) / count;

    // Sum gate counts
    const totalGates = metricsList.reduce(
      (sum, m) => sum + m.gates.totalGates,
      0
    );
    const passedGates = metricsList.reduce(
      (sum, m) => sum + m.gates.passedGates,
      0
    );
    const failedGates = metricsList.reduce(
      (sum, m) => sum + m.gates.failedGates,
      0
    );
    const skippedGates = metricsList.reduce(
      (sum, m) => sum + m.gates.skippedGates,
      0
    );
    const gateExecutionTime = metricsList.reduce(
      (sum, m) => sum + m.gates.executionTime,
      0
    );

    // Recalculate rates based on sums
    const successRate = totalGates > 0 ? passedGates / totalGates : 0;
    const failureRate = totalGates > 0 ? failedGates / totalGates : 0;

    return {
      ...latest, // Preserve latest non-numeric metadata
      qualityScore: avgQualityScore,
      averageExecutionTime: avgExecutionTime,
      eslintErrorRate: avgEslintRate,
      gates: {
        executionTime: gateExecutionTime,
        successRate,
        failureRate,
        totalGates,
        passedGates,
        failedGates,
        skippedGates,
      },
      // For performance metrics, we average them
      performance: {
        executionTime:
          metricsList.reduce((sum, m) => sum + m.performance.executionTime, 0) /
          count,
        memoryUsage:
          metricsList.reduce((sum, m) => sum + m.performance.memoryUsage, 0) /
          count,
        cpuUtilization:
          metricsList.reduce(
            (sum, m) => sum + m.performance.cpuUtilization,
            0
          ) / count,
      },
    };
  }
}
