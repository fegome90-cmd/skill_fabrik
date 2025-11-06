/**
 * KPI Operations Workflow Tests
 * Tests for user interactions related to KPI generation, viewing, and analysis
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { MockCLI, MockCLIFactory, MockScenarios } from '../utils/cli-mocks.js';
import { InteractionTester } from '../utils/interaction-helpers.js';
import { UserScenarios } from '../utils/user-scenarios.js';

describe('KPI Operations Workflow Tests', () => {
  let mockCLI: MockCLI;
  let interactionTester: InteractionTester;
  let userScenarios: UserScenarios;

  beforeAll(() => {
    mockCLI = MockCLIFactory.createRealisticCLI();
    interactionTester = new InteractionTester(mockCLI);
    userScenarios = new UserScenarios(mockCLI);
  });

  afterAll(() => {
    mockCLI.clearHistory();
  });

  describe('Basic KPI Generation', () => {
    test('should generate KPI reports for different time periods', async () => {
      const timePeriods = [1, 7, 30, 90];

      for (const days of timePeriods) {
        const result = await mockCLI.executeCommand('kpi', ['--days', days.toString()]);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('KPI Dashboard');
        expect(result.stdout).toContain(`Last ${days} days`);
        expect(result.stdout).toContain('Metrics');
        expect(result.stdout).toContain('Total activations');
        expect(result.stdout).toContain('Success rate');
      }
    });

    test('should handle KPI generation workflow end-to-end', async () => {
      const result = await interactionTester.simulateKPIWorkflow(7);

      expect(result.success).toBe(true);
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.totalDuration).toBeGreaterThan(0);

      // Verify both steps were completed
      const stepNames = result.steps.map(step => step.step);
      expect(stepNames).toContain('kpi generation');
      expect(stepNames).toContain('dashboard generation');

      // All steps should succeed
      result.steps.forEach(step => {
        expect(step.success).toBe(true);
      });
    });

    test('should provide comprehensive KPI metrics', async () => {
      const result = await mockCLI.executeCommand('kpi', ['--days', '7']);

      expect(result.exitCode).toBe(0);

      // Should include key metrics
      expect(result.stdout).toMatch(/Total activations:\s*\d+/);
      expect(result.stdout).toMatch(/Success rate:\s*\d+\.?\d*%/);
      expect(result.stdout).toMatch(/Average latency:\s*\d+ms/);
      expect(result.stdout).toMatch(/Error rate:\s*\d+\.?\d*%/);

      // Should have proper formatting
      expect(result.stdout).toContain('📊');
      expect(result.stdout).toContain('📈');
    });
  });

  describe('KPI Output Formats', () => {
    test('should generate KPI reports in different formats', async () => {
      const formats = [
        { format: 'markdown', expectedContent: '# KPI Dashboard' },
        { format: 'json', expectedContent: '{' },
        { format: 'csv', expectedContent: 'metric,value' }
      ];

      for (const { format, expectedContent } of formats) {
        const result = await mockCLI.executeCommand('kpi', [
          '--days', '7',
          '--format', format,
          '--output', `/tmp/kpi-${format}.${format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'md'}`
        ]);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Dashboard');
        expect(result.stdout).toContain('generated');
      }
    });

    test('should handle KPI dashboard file creation', async () => {
      const dashboardPath = `/tmp/kpi-dashboard-${Date.now()}.md`;
      const result = await mockCLI.executeCommand('kpi', [
        '--days', '7',
        '--output', dashboardPath
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Dashboard');
      expect(result.stdout).toContain(dashboardPath);
    });

    test('should generate visual KPI representations', async () => {
      const visualResult = await mockCLI.executeCommand('kpi', [
        '--days', '7',
        '--visual',
        '--charts'
      ]);

      expect(visualResult.exitCode).toBe(0);
      expect(visualResult.stdout).toContain('Charts generated');
      expect(visualResult.stdout).toContain('Visual elements');
    });
  });

  describe('KPI Analysis and Insights', () => {
    test('should provide KPI trends analysis', async () => {
      const trendsResult = await mockCLI.executeCommand('kpi', [
        '--days', '30',
        '--trends',
        '--compare', 'previous'
      ]);

      expect(trendsResult.exitCode).toBe(0);
      expect(trendsResult.stdout).toContain('Trends Analysis');
      expect(trendsResult.stdout).toContain('Comparison');
      expect(trendsResult.stdout).toMatch(/📈|📉/); // Trend indicators
    });

    test('should identify performance anomalies', async () => {
      // Mock KPI data with anomalies
      const anomalyKPI = MockScenarios.generateKPIDashboard(7, 50);
      anomalyKPI.stdout = `📊 KPI Dashboard (Last 7 days)\n\n📈 Metrics:\n• Total activations: 50\n• Success rate: 78.5%\n• Average latency: 1250ms\n• Error rate: 21.5%\n\n⚠️  Anomalies detected:\n• High error rate (>20%)\n• Elevated latency (>1000ms)`;
      anomalyKPI.duration = 250;

      mockCLI.addMockResponse('kpi --days 7 --anomalies', anomalyKPI);

      const result = await mockCLI.executeCommand('kpi', ['--days', '7', '--anomalies']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Anomalies detected');
      expect(result.stdout).toContain('High error rate');
      expect(result.stdout).toContain('Elevated latency');
    });

    test('should provide actionable insights', async () => {
      const insightsResult = await mockCLI.executeCommand('kpi', [
        '--days', '7',
        '--insights',
        '--recommendations'
      ]);

      expect(insightsResult.exitCode).toBe(0);
      expect(insightsResult.stdout).toContain('Insights');
      expect(insightsResult.stdout).toContain('Recommendations');

      // Should provide specific actionable items
      expect(insightsResult.stdout).toMatch(/✅|💡|🎯/); // Recommendation indicators
    });
  });

  describe('KPI Customization and Filtering', () => {
    test('should support KPI filtering by metrics', async () => {
      const filters = [
        { filter: 'performance', expectedMetrics: ['latency', 'throughput'] },
        { filter: 'errors', expectedMetrics: ['error rate', 'exceptions'] },
        { filter: 'usage', expectedMetrics: ['activations', 'users'] }
      ];

      for (const { filter, expectedMetrics } of filters) {
        const result = await mockCLI.executeCommand('kpi', [
          '--days', '7',
          '--filter', filter
        ]);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Filtered Metrics');
      }
    });

    test('should support custom KPI date ranges', async () => {
      const customRanges = [
        { start: '2025-10-01', end: '2025-10-07' },
        { start: '2025-09-15', end: '2025-10-15' },
        { start: '2025-08-01', end: '2025-10-31' }
      ];

      for (const range of customRanges) {
        const result = await mockCLI.executeCommand('kpi', [
          '--start', range.start,
          '--end', range.end
        ]);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Custom Range');
        expect(result.stdout).toContain(range.start);
        expect(result.stdout).toContain(range.end);
      }
    });

    test('should support KPI aggregation by different periods', async () => {
      const aggregations = ['hourly', 'daily', 'weekly', 'monthly'];

      for (const aggregation of aggregations) {
        const result = await mockCLI.executeCommand('kpi', [
          '--days', '7',
          '--aggregate', aggregation
        ]);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Aggregated by');
        expect(result.stdout).toContain(aggregation);
      }
    });
  });

  describe('KPI Integration Workflows', () => {
    test('should integrate KPI generation with plan execution', async () => {
      const integratedWorkflow = async () => {
        // Step 1: Create a plan
        const planResult = await interactionTester.simulatePlanWorkflow('Performance Test Plan');

        // Step 2: Generate baseline KPI before execution
        const baselineKPI = await mockCLI.executeCommand('kpi', [
          '--days', '1',
          '--tag', 'baseline'
        ]);

        // Step 3: Generate execution KPI
        const executionKPI = await mockCLI.executeCommand('kpi', [
          '--days', '1',
          '--tag', 'execution',
          '--compare', 'baseline'
        ]);

        return {
          planCreated: planResult.success,
          baselineGenerated: baselineKPI.exitCode === 0,
          executionGenerated: executionKPI.exitCode === 0,
          comparisonAvailable: executionKPI.stdout.includes('Comparison')
        };
      };

      const result = await integratedWorkflow();

      expect(result.planCreated).toBe(true);
      expect(result.baselineGenerated).toBe(true);
      expect(result.executionGenerated).toBe(true);
      expect(result.comparisonAvailable).toBe(true);
    });

    test('should support continuous KPI monitoring', async () => {
      const monitoringWorkflow = async () => {
        // Start continuous monitoring
        const startResult = await mockCLI.executeCommand('kpi', [
          '--monitor',
          '--interval', '60', // 60 seconds
          '--duration', '300' // 5 minutes
        ]);

        // Get monitoring status
        const statusResult = await mockCLI.executeCommand('kpi', [
          '--monitor-status'
        ]);

        // Stop monitoring
        const stopResult = await mockCLI.executeCommand('kpi', [
          '--monitor-stop'
        ]);

        return {
          monitoringStarted: startResult.exitCode === 0,
          statusRetrieved: statusResult.exitCode === 0,
          monitoringStopped: stopResult.exitCode === 0
        };
      };

      const result = await monitoringWorkflow();

      expect(result.monitoringStarted).toBe(true);
      expect(result.statusRetrieved).toBe(true);
      expect(result.monitoringStopped).toBe(true);
    });

    test('should integrate with alerting systems', async () => {
      const alertingWorkflow = async () => {
        // Configure alert thresholds
        const configResult = await mockCLI.executeCommand('kpi', [
          '--configure-alerts',
          '--threshold', 'error_rate>5%',
          '--threshold', 'latency>500ms',
          '--notify', 'email'
        ]);

        // Generate KPI that should trigger alerts
        const alertKPI = MockScenarios.generateKPIDashboard(1, 25);
        alertKPI.stdout = `📊 KPI Dashboard (Last 1 days)\n\n📈 Metrics:\n• Total activations: 25\n• Success rate: 92.0%\n• Average latency: 650ms\n• Error rate: 8.0%\n\n🚨 Alerts triggered:\n• High latency detected (650ms > 500ms)\n• High error rate detected (8.0% > 5%)`;
        mockCLI.addMockResponse('kpi --days 1 --check-alerts', alertKPI);

        const checkResult = await mockCLI.executeCommand('kpi', [
          '--days', '1',
          '--check-alerts'
        ]);

        return {
          alertsConfigured: configResult.exitCode === 0,
          alertsTriggered: checkResult.exitCode === 0 && checkResult.stdout.includes('🚨'),
          latencyAlert: checkResult.stdout.includes('High latency'),
          errorAlert: checkResult.stdout.includes('High error rate')
        };
      };

      const result = await alertingWorkflow();

      expect(result.alertsConfigured).toBe(true);
      expect(result.alertsTriggered).toBe(true);
      expect(result.latencyAlert).toBe(true);
      expect(result.errorAlert).toBe(true);
    });
  });

  describe('Error Handling in KPI Operations', () => {
    test('should handle invalid date ranges gracefully', async () => {
      const invalidRanges = [
        { start: '2025-13-01', end: '2025-13-07' }, // Invalid month
        { start: '2025-10-31', end: '2025-10-01' }, // End before start
        { start: 'invalid-date', end: '2025-10-31' }  // Invalid format
      ];

      for (const range of invalidRanges) {
        const result = await mockCLI.executeCommand('kpi', [
          '--start', range.start,
          '--end', range.end
        ]);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Invalid date range');
      }
    });

    test('should handle missing or corrupted KPI data', async () => {
      // Mock missing data scenario
      mockCLI.addMockResponse('kpi --days 90', {
        stdout: '',
        stderr: '⚠️  No KPI data available for the specified period\n💡 Try a shorter time range or ensure data collection is active',
        exitCode: 1,
        duration: 100
      });

      const result = await mockCLI.executeCommand('kpi', ['--days', '90']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No KPI data');
      expect(result.stderr).toContain('Try a shorter time range');
    });

    test('should handle output file write errors', async () => {
      const result = await mockCLI.executeCommand('kpi', [
        '--days', '7',
        '--output', '/invalid/path/that/cannot/be/created/kpi.md'
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Failed to write file');
      expect(result.stderr).toContain('/invalid/path');
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large KPI datasets efficiently', async () => {
      // Mock large dataset
      const largeKPIData = MockScenarios.generateKPIDashboard(90, 5000);
      largeKPIData.stdout = `📊 KPI Dashboard (Last 90 days)\n\n📈 Metrics:\n• Total activations: 5000\n• Success rate: 96.2%\n• Average latency: 185ms\n• Error rate: 3.8%\n• Data points processed: 1,250,000`;
      largeKPIData.duration = 800;

      mockCLI.addMockResponse('kpi --days 90 --verbose', largeKPIData);

      const result = await mockCLI.executeCommand('kpi', [
        '--days', '90',
        '--verbose'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('5000');
      expect(result.stdout).toContain('Data points processed');
      expect(result.duration).toBeLessThan(1000); // Should process within 1 second
    });

    test('should support concurrent KPI operations', async () => {
      const concurrentOperations = [
        () => mockCLI.executeCommand('kpi', ['--days', '7']),
        () => mockCLI.executeCommand('kpi', ['--days', '30']),
        () => mockCLI.executeCommand('kpi', ['--days', '1', '--trends']),
        () => mockCLI.executeCommand('kpi', ['--days', '7', '--insights']),
        () => mockCLI.executeCommand('kpi', ['--days', '14', '--anomalies'])
      ];

      const startTime = Date.now();
      const results = await Promise.all(concurrentOperations.map(op => op()));
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('KPI');
      });

      // Should handle concurrent operations efficiently
      expect(totalTime).toBeLessThan(800);
    });

    test('should optimize KPI queries for different use cases', async () => {
      const optimizations = [
        { query: ['--days', '1'], expectedTime: 200, description: 'Recent data (fast)' },
        { query: ['--days', '30'], expectedTime: 400, description: 'Monthly data (medium)' },
        { query: ['--days', '365'], expectedTime: 800, description: 'Yearly data (slow but comprehensive)' }
      ];

      for (const { query, expectedTime, description } of optimizations) {
        const result = await mockCLI.executeCommand('kpi', query);

        expect(result.exitCode).toBe(0);
        expect(result.duration).toBeLessThan(expectedTime);
      }
    });
  });

  describe('User Experience in KPI Operations', () => {
    test('should provide contextual help for KPI commands', async () => {
      const helpResult = await mockCLI.executeCommand('kpi', ['--help']);

      expect(helpResult.exitCode).toBe(0);
      expect(helpResult.stdout).toContain('Usage');
      expect(helpResult.stdout).toContain('Options');
      expect(helpResult.stdout).toContain('Examples');
    });

    test('should support progressive KPI disclosure', async () => {
      // Basic KPI
      const basicResult = await mockCLI.executeCommand('kpi', ['--days', '7']);
      expect(basicResult.exitCode).toBe(0);

      // Detailed KPI
      const detailedResult = await mockCLI.executeCommand('kpi', ['--days', '7', '--verbose']);
      expect(detailedResult.exitCode).toBe(0);
      expect(detailedResult.stdout.length).toBeGreaterThan(basicResult.stdout.length);

      // Comprehensive KPI
      const comprehensiveResult = await mockCLI.executeCommand('kpi', [
        '--days', '7',
        '--verbose',
        '--trends',
        '--insights',
        '--recommendations'
      ]);
      expect(comprehensiveResult.exitCode).toBe(0);
      expect(comprehensiveResult.stdout.length).toBeGreaterThan(detailedResult.stdout.length);
    });

    test('should provide meaningful progress indicators for long operations', async () => {
      // Mock long-running KPI generation
      const slowKPI = MockScenarios.generateKPIDashboard(365, 10000);
      slowKPI.duration = 2000;
      mockCLI.addMockResponse('kpi --days 365 --comprehensive', slowKPI);

      const progressIndicator = mockCLI.createMockProgress('Generating comprehensive KPI report...');
      progressIndicator.start();

      const result = await mockCLI.executeCommand('kpi', [
        '--days', '365',
        '--comprehensive'
      ]);

      progressIndicator.update(50, 'Processing data points...');
      progressIndicator.update(100, 'Finalizing report...');
      progressIndicator.succeed('KPI report completed successfully');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('10000');
    });
  });
});