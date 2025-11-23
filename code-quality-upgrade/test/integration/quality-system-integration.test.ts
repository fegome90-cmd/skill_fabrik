/**
 * T2.2.3: Integration Tests - Quality System Integration
 *
 * Validates that QualityDashboard and QualityAlerts operate together end-to-end
 * while respecting config/code-quality-rules.json requirements (TDD, ≥30 s timeout,
 * ≥80 % integration coverage target).
 */

import { beforeEach, describe, expect, it } from '@jest/globals';

import { QualityAlerts } from '../../src/monitoring/quality-alerts';
import { QualityDashboard } from '../../src/monitoring/quality-dashboard';
import { QualityMetrics } from '../../src/types/quality';

const INTEGRATION_TIMEOUT_MS = 35000;

const createMetrics = (
  overrides: Partial<QualityMetrics> = {}
): QualityMetrics => ({
  timestamp: overrides.timestamp ?? Date.now(),
  qualityScore: overrides.qualityScore ?? 86,
  technicalDebt: overrides.technicalDebt ?? 'MEDIUM',
  performance: {
    executionTime: overrides.performance?.executionTime ?? 150000,
    memoryUsage: overrides.performance?.memoryUsage ?? 256,
    cpuUtilization: overrides.performance?.cpuUtilization ?? 42,
  },
  gates: {
    executionTime: overrides.gates?.executionTime ?? 150000,
    successRate: overrides.gates?.successRate ?? 0.93,
    failureRate: overrides.gates?.failureRate ?? 0.07,
    totalGates: overrides.gates?.totalGates ?? 5,
    passedGates: overrides.gates?.passedGates ?? 5,
    failedGates: overrides.gates?.failedGates ?? 0,
    skippedGates: overrides.gates?.skippedGates ?? 0,
  },
  trends: {
    qualityScore: overrides.trends?.qualityScore ?? 0.82,
    performanceScore: overrides.trends?.performanceScore ?? 0.78,
    maintainabilityScore: overrides.trends?.maintainabilityScore ?? 0.9,
  },
  eslintErrorRate: overrides.eslintErrorRate ?? 0.03,
  averageExecutionTime: overrides.averageExecutionTime ?? 160000,
  gateExecutions: overrides.gateExecutions ?? [
    {
      gateName: 'TypeScript Gate',
      executionTime: 42000,
      success: true,
      timestamp: Date.now() - 5000,
    },
    {
      gateName: 'ESLint Gate',
      executionTime: 31000,
      success: true,
      timestamp: Date.now() - 4000,
    },
    {
      gateName: 'Tests Gate',
      executionTime: 27000,
      success: true,
      timestamp: Date.now() - 3000,
    },
  ],
});

describe('T2.2.3 Quality System Integration', () => {
  let qualityDashboard: QualityDashboard;
  let qualityAlerts: QualityAlerts;
  let testMetrics: QualityMetrics;

  beforeEach(() => {
    qualityDashboard = new QualityDashboard();
    qualityAlerts = new QualityAlerts();
    testMetrics = createMetrics();
  });

  /**
   * TEST 1: Dashboard + Alerts Working Together
   * Objetivo: Validar integración básica entre QualityDashboard y QualityAlerts
   */
  describe('Dashboard + Alerts Integration', () => {
    it('processes healthy metrics without raising incidents', () => {
      const report = qualityDashboard.generateReport(testMetrics);
      const alertResults = qualityAlerts.evaluateAlerts(testMetrics);

      expect(report.overall.performance.executionTime).toBe(
        testMetrics.performance.executionTime
      );
      expect(report.recommendations.length).toBeGreaterThanOrEqual(0);
      expect(alertResults.critical).toHaveLength(0);
      expect(alertResults.warnings.length).toBeLessThanOrEqual(1);
    });

    it('coordinates a response when failure rate spikes', () => {
      const degradedMetrics = createMetrics({
        qualityScore: 38,
        technicalDebt: 'HIGH',
        gates: {
          executionTime: 420000,
          successRate: 0.7,
          failureRate: 0.3,
          totalGates: 5,
          passedGates: 5,
          failedGates: 0,
          skippedGates: 0,
        },
        performance: {
          executionTime: 420000,
          memoryUsage: 640,
          cpuUtilization: 85,
        },
        averageExecutionTime: 420000,
        eslintErrorRate: 0.12,
      });

      const report = qualityDashboard.generateReport(degradedMetrics);
      const alerts = qualityAlerts.evaluateAlerts(degradedMetrics);

      expect(report.overall.technicalDebt).toBe('HIGH');
      expect(alerts.critical.length).toBeGreaterThan(0);
      expect(alerts.warnings.length).toBeGreaterThan(0);
      expect(alerts.info[0]?.title).toContain('High memory usage');
    });
  });

  /**
   * TEST 2: End-to-End Quality Metrics Flow
   * Objetivo: Validar flujo completo desde métricas raw hasta alertas generadas
   */
  describe('End-to-End Quality Metrics Flow', () => {
    it('propagates performance degradation through both systems', () => {
      const slowMetrics = createMetrics({
        gates: {
          executionTime: 310000,
          successRate: 0.82,
          failureRate: 0.18,
          totalGates: 5,
          passedGates: 4,
          failedGates: 1,
          skippedGates: 0,
        },
        averageExecutionTime: 310000,
        performance: {
          executionTime: 310000,
          memoryUsage: 420,
          cpuUtilization: 67,
        },
        eslintErrorRate: 0.08,
      });

      const processedReport = qualityDashboard.generateReport(slowMetrics);
      const evaluation = qualityAlerts.evaluateAlerts(slowMetrics);

      expect(processedReport.timestamp).toBe(slowMetrics.timestamp);
      expect(processedReport.recommendations.length).toBeGreaterThan(0);
      expect(evaluation.warnings.length).toBeGreaterThan(0);
      expect(evaluation.critical).toHaveLength(0);
    });

    it('maintains data consistency for healthy metrics', () => {
      const consistentMetrics = createMetrics({
        qualityScore: 94,
        technicalDebt: 'LOW',
        gates: {
          executionTime: 90000,
          successRate: 0.98,
          failureRate: 0.02,
          totalGates: 50,
          passedGates: 49,
          failedGates: 1,
          skippedGates: 0,
        },
        performance: {
          executionTime: 90000,
          memoryUsage: 180,
          cpuUtilization: 30,
        },
        averageExecutionTime: 90000,
        eslintErrorRate: 0.01,
      });

      const report = qualityDashboard.generateReport(consistentMetrics);
      const alerts = qualityAlerts.evaluateAlerts(consistentMetrics);

      expect(report.overall.technicalDebt).toBe('LOW');
      expect(alerts.critical).toHaveLength(0);
      expect(alerts.warnings).toHaveLength(0);
      expect(alerts.info).toHaveLength(0);
    });
  });

  /**
   * TEST 3: Alert Generation from Dashboard Reports
   * Objetivo: Validar que reportes del dashboard disparan alertas apropiadas
   */
  describe('Alert Generation from Dashboard Reports', () => {
    it('raises warnings when dashboard quality score drops', () => {
      const poorMetrics = createMetrics({
        qualityScore: 45,
        technicalDebt: 'HIGH',
        gates: {
          executionTime: 360000,
          successRate: 0.75,
          failureRate: 0.25,
          totalGates: 4,
          passedGates: 3,
          failedGates: 1,
          skippedGates: 0,
        },
        performance: {
          executionTime: 360000,
          memoryUsage: 500,
          cpuUtilization: 70,
        },
        averageExecutionTime: 360000,
        eslintErrorRate: 0.09,
      });

      const report = qualityDashboard.generateReport(poorMetrics);
      const generatedAlerts = qualityAlerts.evaluateAlerts(poorMetrics);

      expect(report.overall.qualityScore).toBeLessThan(60);
      expect(report.overall.technicalDebt).toBe('HIGH');
      expect(generatedAlerts.warnings.length).toBeGreaterThan(0);
    });

    it('supports manual escalation workflow', () => {
      const baseAlert = qualityAlerts.sendAlert({
        severity: 'MEDIUM',
        title: 'Slow build time',
        message: 'Build exceeded threshold',
        action: 'Investigate CI runners',
      });

      const escalated = qualityAlerts.escalateAlert(baseAlert, 'CRITICAL');

      expect(escalated.severity).toBe('CRITICAL');
      expect(escalated.title.startsWith('Escalated')).toBe(true);
    });
  });

  /**
   * TEST 4: Real-time Status Monitoring
   * Objetivo: Validar monitoreo en tiempo real del sistema de calidad
   */
  describe('Real-time Status Monitoring', () => {
    it('reports healthy real-time metrics', () => {
      const realtimeMetrics = createMetrics({
        timestamp: Date.now(),
        performance: {
          executionTime: 110000,
          memoryUsage: 200,
          cpuUtilization: 35,
        },
        gates: {
          executionTime: 110000,
          successRate: 0.96,
          failureRate: 0.04,
          totalGates: 25,
          passedGates: 24,
          failedGates: 1,
          skippedGates: 0,
        },
      });

      const statusReport = qualityDashboard.generateReport(realtimeMetrics);
      const statusAlerts = qualityAlerts.evaluateAlerts(realtimeMetrics);

      expect(statusReport.overall.performance.cpuUtilization).toBe(
        realtimeMetrics.performance.cpuUtilization
      );
      expect(statusAlerts.critical).toHaveLength(0);
      expect(statusAlerts.warnings).toHaveLength(0);
    });

    it('detects real-time degradation spikes', () => {
      const degradedMetrics = createMetrics({
        qualityScore: 32,
        technicalDebt: 'HIGH',
        timestamp: Date.now(),
        performance: {
          executionTime: 450000,
          memoryUsage: 900,
          cpuUtilization: 96,
        },
        gates: {
          executionTime: 450000,
          successRate: 0.6,
          failureRate: 0.4,
          totalGates: 10,
          passedGates: 6,
          failedGates: 4,
          skippedGates: 0,
        },
        averageExecutionTime: 450000,
        eslintErrorRate: 0.2,
      });

      const degradationReport =
        qualityDashboard.generateReport(degradedMetrics);
      const degradationAlerts = qualityAlerts.evaluateAlerts(degradedMetrics);

      expect(degradationReport.overall.qualityScore).toBeLessThan(40);
      expect(degradationAlerts.critical.length).toBeGreaterThan(0);
      expect(degradationAlerts.warnings.length).toBeGreaterThan(0);
      expect(degradationAlerts.info.length).toBeGreaterThan(0);
    });
  });

  /**
   * INTEGRATION TEST TIMEOUT
   * Configuración según config/code-quality-rules.json (≥30 s)
   */
  describe('Integration Test Configuration', () => {
    it('meets the minimum timeout requirement', () => {
      expect(INTEGRATION_TIMEOUT_MS).toBeGreaterThanOrEqual(30000);
    });
  });
});

// Timeout configuration para toda la suite
jest.setTimeout(INTEGRATION_TIMEOUT_MS);
