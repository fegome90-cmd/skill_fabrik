/**
 * T4.1.1: E2E Happy Path de Quality Gates
 *
 * End-to-end test that verifies the happy path of quality gates using the real orchestrator,
 * without breaking contracts or modifying dev-docs/*.
 */

/* eslint-disable simple-import-sort/imports */
import { QualityGatesFactory } from '../../src/scripts/quality-gates-factory';
import { QualityGatesOrchestrator } from '../../src/scripts/quality-gates-orchestrator';
import type { QualityGate } from '../../src/scripts/quality-gates-orchestrator';
/* eslint-enable simple-import-sort/imports */

// Mock the factory to return fast test gates instead of real ones
jest.mock('../../src/scripts/quality-gates-factory');

describe('E2E – Quality Gates Happy Path', () => {
  const EXPECTED_GATES = 6;

  beforeEach(() => {
    // Setup mock gates that run fast and always succeed
    jest
      .spyOn(QualityGatesFactory, 'createDefaultGates')
      .mockReturnValue(createMockQualityGates());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('given a healthy project when quality gates run', () => {
    it('then all gates succeed and return overall success', async () => {
      const orchestrator = new QualityGatesOrchestrator();
      const report = await orchestrator.executeAllGates();

      // All gates must pass
      expect(report.success).toBe(true);
      expect(report.results).toHaveLength(EXPECTED_GATES);
      expect(report.results.every(r => r.success)).toBe(true);

      // Performance requirements
      expect(report.executionTime).toBeLessThan(300000); // < 5 minutes
      expect(report.executionTime).toBeGreaterThan(0); // Should have execution time
    });

    it('then report includes comprehensive metrics and summary', async () => {
      const orchestrator = new QualityGatesOrchestrator();
      const report = await orchestrator.executeAllGates();

      // Report structure validation
      expect(report.report).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.alertResults).toBeDefined();

      // Individual gate results validation
      expect(report.results).toHaveLength(EXPECTED_GATES);
      for (const result of report.results) {
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('executionTime');
        expect(result).toHaveProperty('success');
        expect(result.success).toBe(true);
        expect(typeof result.executionTime).toBe('number');
        expect(result.executionTime).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

/**
 * Creates mock quality gates for E2E testing
 * All gates succeed quickly to simulate a healthy project
 */
function createMockQualityGates(): QualityGate[] {
  return [
    createMockGate('ESLint', true, 100, 'ESLint passed'),
    createMockGate(
      'TypeScript',
      true,
      150,
      'TypeScript compilation successful'
    ),
    createMockGate('Prettier', true, 50, 'Prettier formatting passed'),
    createMockGate('Tests', true, 200, 'All tests passed'),
    createMockGate(
      'Evidence Validation',
      false,
      75,
      'Evidence validation passed'
    ),
    createMockGate(
      'Metrics Validation',
      false,
      25,
      'Metrics validation passed'
    ),
  ];
}

/**
 * Helper to create a single mock quality gate
 */
function createMockGate(
  name: string,
  critical: boolean,
  executionTime: number,
  output: string
): QualityGate {
  return {
    name,
    critical,
    timeout: 5000,
    execute: jest.fn().mockResolvedValue({
      name,
      success: true,
      executionTime,
      output,
    }),
  };
}
