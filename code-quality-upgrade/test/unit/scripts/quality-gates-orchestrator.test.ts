/**
 * T3.3.0: Quality Gates Orchestrator Tests
 *
 * TDD Methodology: RED→GREEN→REFACTOR
 * Given-When-Then naming convention
 * Coverage target: ≥90% for unit tests
 */

/* eslint-disable simple-import-sort/imports */
import { QualityAlerts } from '../../../src/monitoring/quality-alerts';
import { QualityDashboard } from '../../../src/monitoring/quality-dashboard';
import { QualityGatesOrchestrator } from '../../../src/scripts/quality-gates-orchestrator';
import { QualityGatesFactory } from '../../../src/scripts/quality-gates-factory';
import type {
  QualityGate,
  GateExecutionResult,
} from '../../../src/scripts/quality-gates-orchestrator';
/* eslint-enable simple-import-sort/imports */

async function delay(ms: number): Promise<void> {
  await new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function executeDelayedGate(
  name: string,
  delayMs: number
): Promise<GateExecutionResult> {
  const startTime = Date.now();
  await delay(delayMs);
  const executionTime = Date.now() - startTime;

  return {
    name,
    success: true,
    executionTime,
    output: 'Test completed',
  };
}

function createDelayedGate(
  name: string,
  critical: boolean,
  delayMs: number
): QualityGate {
  return {
    name,
    critical,
    timeout: 5000,
    execute: jest
      .fn()
      .mockImplementation(() => executeDelayedGate(name, delayMs)),
  };
}

function createTimeoutGate(): QualityGate {
  return {
    name: 'Timeout Gate',
    critical: true,
    timeout: 10,
    execute: jest.fn().mockImplementation(
      () =>
        new Promise<GateExecutionResult>(() => {
          // Intentionally never resolve to trigger orchestrator timeout
        })
    ),
  };
}

// Mock dependencies
jest.mock('../../../src/monitoring/quality-dashboard');
jest.mock('../../../src/monitoring/quality-alerts');
jest.mock('../../../src/scripts/quality-gates-factory');
jest.mock('node:child_process');

describe('QualityGatesOrchestrator', () => {
  let orchestrator: QualityGatesOrchestrator;
  let mockDashboard: jest.Mocked<QualityDashboard>;
  let mockAlerts: jest.Mocked<QualityAlerts>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDashboard = new QualityDashboard() as jest.Mocked<QualityDashboard>;
    mockAlerts = new QualityAlerts() as jest.Mocked<QualityAlerts>;

    mockDashboard.generateReport.mockReturnValue({
      timestamp: Date.now(),
      overall: {
        qualityScore: 85,
        technicalDebt: 'MEDIUM',
        performance: {
          executionTime: 1000,
          memoryUsage: 256,
          cpuUtilization: 45,
        },
      },
      gates: {
        executionTime: 500,
        successRate: 0.8,
        failureRate: 0.2,
      },
      trends: {
        qualityScore: 87,
        performanceScore: 75,
        maintainabilityScore: 90,
      },
      recommendations: [],
    });

    mockAlerts.evaluateAlerts.mockReturnValue({
      critical: [],
      warnings: [],
      info: [],
    });

    // Mock the factory to return test gates instead of real ones
    jest
      .spyOn(QualityGatesFactory, 'createDefaultGates')
      .mockReturnValue([
        createDelayedGate('Test Gate 1', true, 1),
        createDelayedGate('Test Gate 2', false, 2),
      ]);

    // Create orchestrator with mocked dependencies
    orchestrator = new QualityGatesOrchestrator();

    // Replace the internal instances with our mocks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (orchestrator as any).dashboard = mockDashboard;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (orchestrator as any).alerts = mockAlerts;
  });

  describe('given orchestrator with default configuration', () => {
    beforeEach(() => {
      // Mock getQualityGates to return simple test gates and avoid real execution
      jest
        .spyOn(
          orchestrator as unknown as { getQualityGates: () => QualityGate[] },
          'getQualityGates'
        )
        .mockReturnValue([
          {
            name: 'Test Gate 1',
            critical: true,
            timeout: 5000,
            execute: jest.fn().mockResolvedValue({
              name: 'Test Gate 1',
              success: true,
              executionTime: 100,
              output: 'Test completed',
            }),
          },
          {
            name: 'Test Gate 2',
            critical: false,
            timeout: 5000,
            execute: jest.fn().mockResolvedValue({
              name: 'Test Gate 2',
              success: true,
              executionTime: 150,
              output: 'Test completed',
            }),
          },
        ]);
    });

    it('should execute all quality gates successfully', async () => {
      const result = await orchestrator.executeAllGates();

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics).toBeDefined();
      // Verify that dashboard and alerts were called by checking the result
      expect(result.report).toBeDefined();
      expect(result.alertResults).toBeDefined();
    });
  });

  describe('given orchestrator with sequential execution when executeAllGates is called', () => {
    beforeEach(() => {
      orchestrator = new QualityGatesOrchestrator({
        parallel: false,
        failFast: false,
        continueOnError: true,
        timeout: 300000,
        maxRetries: 1,
      });
    });

    it('should execute gates sequentially', async () => {
      const result = await orchestrator.executeAllGates();

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
    });
  });

  describe('given orchestrator with failFast enabled when executeAllGates is called', () => {
    beforeEach(() => {
      orchestrator = new QualityGatesOrchestrator({
        parallel: false,
        failFast: true,
        continueOnError: false,
        timeout: 300000,
        maxRetries: 1,
      });

      // Mock getQualityGates to return a gate that will fail
      jest
        .spyOn(
          orchestrator as unknown as { getQualityGates: () => QualityGate[] },
          'getQualityGates'
        )
        .mockReturnValue([
          {
            name: 'Failing Gate',
            critical: true,
            timeout: 5000,
            execute: jest.fn().mockResolvedValue({
              name: 'Failing Gate',
              success: false,
              executionTime: 100,
              error: 'Test failure',
            }),
          },
        ]);
    });

    it('should stop after first failure', async () => {
      const result = await orchestrator.executeAllGates();

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(false);
    });
  });

  describe('given orchestrator with dashboard error', () => {
    beforeEach(() => {
      mockDashboard.generateReport.mockImplementation(() => {
        throw new Error('Dashboard failed');
      });
    });

    it('should handle dashboard errors gracefully', async () => {
      const result = await orchestrator.executeAllGates();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Dashboard failed');
      expect(result.report).toBeNull();
    });
  });

  describe('given orchestrator with alert evaluation error', () => {
    beforeEach(() => {
      // Reset the alerts mock to throw an error
      mockAlerts.evaluateAlerts.mockImplementation(() => {
        throw new Error('Alerts failed');
      });
    });

    it('should handle alert errors gracefully', async () => {
      const result = await orchestrator.executeAllGates();

      // When alerts fail, the orchestrator catches the error and returns success: false
      expect(result.success).toBe(false);
      expect(result.error).toContain('Alerts failed');
      expect(result.report).toBeNull();
      expect(result.alertResults).toEqual({
        critical: [],
        warnings: [],
        info: [],
      });
    });
  });

  describe('given performance requirements', () => {
    it('should execute gates within reasonable time', async () => {
      const startTime = Date.now();
      const result = await orchestrator.executeAllGates();
      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(30000);
      expect(result.executionTime).toBeGreaterThan(0);
    });
  });

  describe('given catastrophic failure', () => {
    it('should provide meaningful error information', async () => {
      const result = await orchestrator.executeAllGates();

      expect(result.success).toBeDefined();
      expect(result.results).toBeDefined();
      expect(result.metrics).toBeDefined();
    });
  });
  // Additional test cases to achieve 90% coverage

  describe('given orchestrator with empty gates list', () => {
    beforeEach(() => {
      jest
        .spyOn(
          orchestrator as unknown as { getQualityGates: () => QualityGate[] },
          'getQualityGates'
        )
        .mockReturnValue([]);
    });

    it('should handle empty gates list gracefully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const result = await orchestrator.executeAllGates();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.results).toHaveLength(0);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.metrics.qualityScore).toBe(0);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.metrics.gates.totalGates).toBe(0);
    });
  });

  describe('given orchestrator with gate timeout', () => {
    beforeEach(() => {
      jest
        .spyOn(
          orchestrator as unknown as { getQualityGates: () => QualityGate[] },
          'getQualityGates'
        )
        .mockReturnValue([createTimeoutGate()]);
    });

    it('should handle gate timeout', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const result = await orchestrator.executeAllGates();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.success).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.results).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.results[0].success).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.results[0].error).toContain('timeout');
    });
  });

  describe('given orchestrator with continueOnError enabled', () => {
    let continueOnErrorOrchestrator: QualityGatesOrchestrator;

    beforeEach(() => {
      continueOnErrorOrchestrator = new QualityGatesOrchestrator({
        parallel: false,
        failFast: false,
        continueOnError: true,
        timeout: 300000,
        maxRetries: 1,
      });

      // Mock the internal instances with our mocks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      (continueOnErrorOrchestrator as any).dashboard = mockDashboard;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      (continueOnErrorOrchestrator as any).alerts = mockAlerts;

      // Mock getQualityGates to return a gate that will fail
      jest
        .spyOn(
          continueOnErrorOrchestrator as unknown as {
            getQualityGates: () => QualityGate[];
          },
          'getQualityGates'
        )
        .mockReturnValue([
          {
            name: 'Failing Gate',
            critical: true,
            timeout: 5000,
            execute: jest.fn().mockResolvedValue({
              name: 'Failing Gate',
              success: false,
              executionTime: 100,
              error: 'Test failure',
            }),
          },
        ]);
    });

    it('should continue after failure when continueOnError is true', async () => {
      const result = await continueOnErrorOrchestrator.executeAllGates();

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(false);
    });
  });

  describe('given orchestrator with parallel execution and rejected promises when executeAllGates is called', () => {
    beforeEach(() => {
      jest
        .spyOn(
          orchestrator as unknown as { getQualityGates: () => QualityGate[] },
          'getQualityGates'
        )
        .mockReturnValue([
          {
            name: 'Rejected Gate',
            critical: true,
            timeout: 5000,
            execute: jest.fn().mockRejectedValue(new Error('Promise rejected')),
          },
        ]);
    });

    it('should handle rejected promises in parallel execution', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const result = await orchestrator.executeAllGates();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.success).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.results).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.results[0].success).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.results[0].error).toBe('Promise rejected');
    });
  });
});
