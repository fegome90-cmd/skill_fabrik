import { QualityDashboard } from '../../../src/monitoring/quality-dashboard';
import {
  QualityMetrics,
  QualityReport,
  Recommendation,
} from '../../../src/types/quality';

describe('QualityDashboard', () => {
  let dashboard: QualityDashboard;
  let mockMetrics: QualityMetrics;

  beforeEach(() => {
    dashboard = new QualityDashboard();

    // Mock metrics for testing
    mockMetrics = {
      timestamp: Date.now(),
      qualityScore: 85,
      technicalDebt: 'LOW' as const,
      performance: {
        executionTime: 2500,
        memoryUsage: 128,
        cpuUtilization: 15,
      },
      gates: {
        executionTime: 1200,
        successRate: 0.92,
        failureRate: 0.08,
      },
      trends: {
        qualityScore: 0.8,
        performanceScore: 0.7,
        maintainabilityScore: 0.9,
      },
      eslintErrorRate: 0.02,
      averageExecutionTime: 180000,
      gateExecutions: [
        {
          gateName: 'TypeScript Gate',
          executionTime: 1500,
          success: true,
          timestamp: Date.now(),
        },
        {
          gateName: 'ESLint Gate',
          executionTime: 800,
          success: true,
          timestamp: Date.now(),
        },
      ],
    };
  });

  describe('generateReport', () => {
    it('should generate quality report with all required fields', () => {
      const report: QualityReport = dashboard.generateReport(mockMetrics);

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('overall');
      expect(report).toHaveProperty('gates');
      expect(report).toHaveProperty('trends');
      expect(report).toHaveProperty('recommendations');

      expect(report.overall).toHaveProperty('qualityScore');
      expect(report.overall).toHaveProperty('technicalDebt');
      expect(report.overall).toHaveProperty('performance');
    });

    it('should calculate quality score correctly', () => {
      const report: QualityReport = dashboard.generateReport(mockMetrics);

      expect(typeof report.overall.qualityScore).toBe('number');
      expect(report.overall.qualityScore).toBeGreaterThanOrEqual(0);
      expect(report.overall.qualityScore).toBeLessThanOrEqual(100);
    });

    it('should calculate technical debt level', () => {
      const report: QualityReport = dashboard.generateReport(mockMetrics);

      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(report.overall.technicalDebt);
    });

    it('should generate recommendations for high failure rate', () => {
      const highFailureMetrics = {
        ...mockMetrics,
        gates: {
          ...mockMetrics.gates,
          failureRate: 0.15, // Above 10% threshold
        },
      };

      const report: QualityReport =
        dashboard.generateReport(highFailureMetrics);

      const hasPerformanceRecommendation = report.recommendations.some(
        (rec: Recommendation) =>
          rec.type === 'PERFORMANCE' && rec.priority === 'HIGH'
      );

      expect(hasPerformanceRecommendation).toBe(true);
    });

    it('should generate recommendations for slow execution time', () => {
      const slowMetrics = {
        ...mockMetrics,
        averageExecutionTime: 400000, // Above 5 minutes
      };

      const report: QualityReport = dashboard.generateReport(slowMetrics);

      const hasSlowExecutionRecommendation = report.recommendations.some(
        (rec: Recommendation) =>
          rec.type === 'PERFORMANCE' && rec.priority === 'MEDIUM'
      );

      expect(hasSlowExecutionRecommendation).toBe(true);
    });

    it('should calculate performance metrics correctly', () => {
      const report: QualityReport = dashboard.generateReport(mockMetrics);

      expect(report.overall.performance).toHaveProperty('executionTime');
      expect(report.overall.performance).toHaveProperty('memoryUsage');
      expect(report.overall.performance).toHaveProperty('cpuUtilization');
    });
  });
});
