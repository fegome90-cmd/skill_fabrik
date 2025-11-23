import { MetricsValidator } from '../../../src/scripts/validate-metrics';
import { QualityMetrics } from '../../../src/types/quality';

const baseMetrics: QualityMetrics = {
  timestamp: Date.now(),
  qualityScore: 0.9,
  technicalDebt: 'LOW',
  performance: {
    executionTime: 100,
    memoryUsage: 256,
    cpuUtilization: 40,
  },
  gates: {
    executionTime: 120,
    successRate: 0.8,
    failureRate: 0.2,
    totalGates: 10,
    passedGates: 8,
    failedGates: 2,
    skippedGates: 0,
  },
  trends: {
    qualityScore: 0.9,
    performanceScore: 0.85,
    maintainabilityScore: 0.8,
  },
  eslintErrorRate: 0.1,
  averageExecutionTime: 150,
  gateExecutions: [],
};

describe('MetricsValidator', () => {
  const validator = new MetricsValidator();

  it('validates structure successfully when all fields are present', () => {
    const result = validator.validateStructure(
      baseMetrics as Partial<QualityMetrics> & Record<string, unknown>
    );
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects missing required fields', () => {
    const partialMetrics = { ...baseMetrics, qualityScore: undefined };
    const result = validator.validateStructure(
      partialMetrics as Partial<QualityMetrics> & Record<string, unknown>
    );

    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.code === 'MISSING_FIELD')).toBe(
      true
    );
  });

  it('flags invalid gate metric types', () => {
    const invalidGates = {
      ...baseMetrics,
      gates: {
        ...baseMetrics.gates,
        successRate: 'bad-value' as unknown as number,
      },
    };

    const result = validator.validateStructure(
      invalidGates as Partial<QualityMetrics> & Record<string, unknown>
    );

    expect(result.isValid).toBe(false);
    expect(
      result.errors.some(error =>
        error.message.includes('gates.successRate: expected number')
      )
    ).toBe(true);
  });

  it('validates logical consistency of gate rates', () => {
    const validConsistency = validator.validateConsistency(baseMetrics);
    expect(validConsistency.isValid).toBe(true);

    const inconsistentMetrics = {
      ...baseMetrics,
      gates: { ...baseMetrics.gates, successRate: 0.9, failureRate: 0.5 },
      gateExecutions: [
        {
          gateName: 'lint',
          executionTime: 10,
          success: true,
          timestamp: Date.now(),
        },
      ],
    };
    const invalidResult = validator.validateConsistency(inconsistentMetrics);

    expect(invalidResult.isValid).toBe(false);
    expect(
      invalidResult.errors.some(error => error.code === 'INCONSISTENT_RATES')
    ).toBe(true);
  });

  it('aggregates multiple metrics lists and keeps latest timestamp', () => {
    const older = { ...baseMetrics, timestamp: Date.now() - 1000 };
    const newer = {
      ...baseMetrics,
      timestamp: Date.now(),
      qualityScore: 0.95,
      averageExecutionTime: 200,
      eslintErrorRate: 0.05,
      gates: {
        ...baseMetrics.gates,
        totalGates: 12,
        passedGates: 10,
        failedGates: 2,
      },
    };

    const aggregated = validator.aggregateMetrics([older, newer]);

    expect(aggregated.timestamp).toBe(newer.timestamp);
    expect(aggregated.qualityScore).toBeCloseTo(
      (older.qualityScore + newer.qualityScore) / 2
    );
    expect(aggregated.gates.totalGates).toBe(
      older.gates.totalGates + newer.gates.totalGates
    );
  });

  it('throws when aggregating an empty metrics list', () => {
    expect(() => validator.aggregateMetrics([])).toThrow(
      'Cannot aggregate empty metrics list'
    );
  });
});
