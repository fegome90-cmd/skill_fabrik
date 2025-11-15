/**
 * Quality Alerts System Tests
 * Following TDD: RED phase - Tests first
 */

import { QualityAlerts } from '../../../src/monitoring/quality-alerts';
import {
  Alert,
  AlertInput,
  AlertSeverity,
  QualityMetrics,
} from '../../../src/types/quality';

describe('QualityAlerts', () => {
  let qualityAlerts: QualityAlerts;

  beforeEach(() => {
    qualityAlerts = new QualityAlerts();
  });

  describe('evaluateAlerts', () => {
    it('should return none for normal metrics', () => {
      // Arrange
      const normalMetrics: QualityMetrics = {
        timestamp: Date.now(),
        qualityScore: 85,
        technicalDebt: 'LOW',
        performance: {
          executionTime: 120000,
          memoryUsage: 256,
          cpuUtilization: 45,
        },
        gates: {
          executionTime: 120000,
          successRate: 0.95,
          failureRate: 0.05,
        },
        trends: {
          qualityScore: 0.8,
          performanceScore: 0.7,
          maintainabilityScore: 0.9,
        },
        eslintErrorRate: 0.02,
        averageExecutionTime: 120000,
        gateExecutions: [],
      };

      // Act
      const result = qualityAlerts.evaluateAlerts(normalMetrics);

      // Assert
      expect(result.critical).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.info).toHaveLength(0);
    });

    it('should trigger critical for high failure rate', () => {
      // Arrange
      const criticalMetrics: QualityMetrics = {
        timestamp: Date.now(),
        qualityScore: 60,
        technicalDebt: 'HIGH',
        performance: {
          executionTime: 180000,
          memoryUsage: 400,
          cpuUtilization: 70,
        },
        gates: {
          executionTime: 180000,
          successRate: 0.7,
          failureRate: 0.3,
        },
        trends: {
          qualityScore: 0.6,
          performanceScore: 0.5,
          maintainabilityScore: 0.4,
        },
        eslintErrorRate: 0.08,
        averageExecutionTime: 180000,
        gateExecutions: [],
      };

      // Act
      const result = qualityAlerts.evaluateAlerts(criticalMetrics);

      // Assert
      expect(result.critical).toHaveLength(1);
      expect(result.critical[0].severity).toBe('CRITICAL');
      expect(result.critical[0].title).toContain(
        'High Quality Gates Failure Rate'
      );
      expect(result.critical[0].description).toContain('30.0%');
    });

    it('should trigger warning for slow execution', () => {
      // Arrange
      const slowMetrics: QualityMetrics = {
        timestamp: Date.now(),
        qualityScore: 75,
        technicalDebt: 'MEDIUM',
        performance: {
          executionTime: 360000,
          memoryUsage: 300,
          cpuUtilization: 55,
        },
        gates: {
          executionTime: 360000,
          successRate: 0.9,
          failureRate: 0.1,
        },
        trends: {
          qualityScore: 0.75,
          performanceScore: 0.6,
          maintainabilityScore: 0.8,
        },
        eslintErrorRate: 0.03,
        averageExecutionTime: 360000,
        gateExecutions: [],
      };

      // Act
      const result = qualityAlerts.evaluateAlerts(slowMetrics);

      // Assert
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].severity).toBe('MEDIUM');
      expect(result.warnings[0].title).toContain(
        'Quality gates execution time'
      );
      expect(result.warnings[0].description).toContain('6.0 minutes');
    });

    it('should trigger warning for high ESLint rate', () => {
      // Arrange
      const eslintMetrics: QualityMetrics = {
        timestamp: Date.now(),
        qualityScore: 70,
        technicalDebt: 'MEDIUM',
        performance: {
          executionTime: 150000,
          memoryUsage: 280,
          cpuUtilization: 50,
        },
        gates: {
          executionTime: 150000,
          successRate: 0.92,
          failureRate: 0.08,
        },
        trends: {
          qualityScore: 0.7,
          performanceScore: 0.75,
          maintainabilityScore: 0.65,
        },
        eslintErrorRate: 0.08,
        averageExecutionTime: 150000,
        gateExecutions: [],
      };

      // Act
      const result = qualityAlerts.evaluateAlerts(eslintMetrics);

      // Assert
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].severity).toBe('MEDIUM');
      expect(result.warnings[0].title).toContain('High ESLint error rate');
      expect(result.warnings[0].description).toContain('8.0%');
    });

    it('should trigger info for high memory', () => {
      // Arrange
      const memoryMetrics: QualityMetrics = {
        timestamp: Date.now(),
        qualityScore: 80,
        technicalDebt: 'LOW',
        performance: {
          executionTime: 180000,
          memoryUsage: 600,
          cpuUtilization: 60,
        },
        gates: {
          executionTime: 180000,
          successRate: 0.94,
          failureRate: 0.06,
        },
        trends: {
          qualityScore: 0.8,
          performanceScore: 0.7,
          maintainabilityScore: 0.85,
        },
        eslintErrorRate: 0.02,
        averageExecutionTime: 180000,
        gateExecutions: [],
      };

      // Act
      const result = qualityAlerts.evaluateAlerts(memoryMetrics);

      // Assert
      expect(result.info).toHaveLength(1);
      expect(result.info[0].severity).toBe('LOW');
      expect(result.info[0].title).toContain('High memory usage');
      expect(result.info[0].description).toContain('600MB');
    });

    it('should trigger critical for very high failure', () => {
      // Arrange
      const veryHighMetrics: QualityMetrics = {
        timestamp: Date.now(),
        qualityScore: 40,
        technicalDebt: 'HIGH',
        performance: {
          executionTime: 300000,
          memoryUsage: 800,
          cpuUtilization: 85,
        },
        gates: {
          executionTime: 300000,
          successRate: 0.6,
          failureRate: 0.4,
        },
        trends: {
          qualityScore: 0.4,
          performanceScore: 0.3,
          maintainabilityScore: 0.2,
        },
        eslintErrorRate: 0.15,
        averageExecutionTime: 300000,
        gateExecutions: [],
      };

      // Act
      const result = qualityAlerts.evaluateAlerts(veryHighMetrics);

      // Assert
      expect(result.critical).toHaveLength(1);
      expect(result.critical[0].severity).toBe('CRITICAL');
      expect(result.critical[0].description).toContain('40.0%');
    });

    it('should handle multiple alerts simultaneously', () => {
      // Arrange
      const multipleMetrics: QualityMetrics = {
        timestamp: Date.now(),
        qualityScore: 50,
        technicalDebt: 'HIGH',
        performance: {
          executionTime: 450000,
          memoryUsage: 700,
          cpuUtilization: 80,
        },
        gates: {
          executionTime: 450000,
          successRate: 0.65,
          failureRate: 0.35,
        },
        trends: {
          qualityScore: 0.5,
          performanceScore: 0.4,
          maintainabilityScore: 0.3,
        },
        eslintErrorRate: 0.12,
        averageExecutionTime: 450000,
        gateExecutions: [],
      };

      // Act
      const result = qualityAlerts.evaluateAlerts(multipleMetrics);

      // Assert
      expect(result.critical).toHaveLength(1); // High failure rate
      expect(result.warnings).toHaveLength(2); // Slow execution + ESLint rate
      expect(result.info).toHaveLength(1); // High memory
      expect(result.critical[0].title).toContain(
        'High Quality Gates Failure Rate'
      );
      expect(result.warnings[0].title).toContain('execution time');
      expect(result.warnings[1].title).toContain('ESLint error rate');
      expect(result.info[0].title).toContain('memory usage');
    });
  });

  describe('sendAlert', () => {
    it('should construct alert with all properties', () => {
      // Arrange
      const alertInput: AlertInput = {
        severity: 'HIGH',
        title: 'Test Alert',
        message: 'This is a test alert',
        action: 'Take immediate action',
      };

      // Act
      const alert = qualityAlerts.sendAlert(alertInput);

      // Assert
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('timestamp');
      expect(alert.severity).toBe('HIGH');
      expect(alert.title).toBe('Test Alert');
      expect(alert.message).toBe('This is a test alert');
      expect(alert.action).toBe('Take immediate action');
    });

    it('should generate unique IDs', () => {
      // Arrange
      const alertInput: AlertInput = {
        severity: 'INFO',
        title: 'Test Alert',
        message: 'Test message',
        action: 'No action needed',
      };

      // Act
      const alert1 = qualityAlerts.sendAlert(alertInput);
      const alert2 = qualityAlerts.sendAlert(alertInput);

      // Assert
      expect(alert1.id).not.toBe(alert2.id);
    });

    it('should handle all severity levels', () => {
      // Arrange
      const severities: AlertSeverity[] = [
        'CRITICAL',
        'HIGH',
        'MEDIUM',
        'LOW',
        'INFO',
      ];

      // Act & Assert
      severities.forEach(severity => {
        const alertInput: AlertInput = {
          severity,
          title: `Test ${severity}`,
          message: `Test message for ${severity}`,
          action: `Action for ${severity}`,
        };

        const alert = qualityAlerts.sendAlert(alertInput);
        expect(alert.severity).toBe(severity);
      });
    });
  });

  describe('escalateAlert', () => {
    it('should escalate severity appropriately', () => {
      // Arrange
      const lowAlert: Alert = {
        id: 'test-id-1',
        timestamp: Date.now(),
        severity: 'LOW',
        title: 'Low Priority Issue',
        message: 'Minor issue detected',
        description: 'Minor issue detected',
        action: 'Monitor for now',
      };

      // Act
      const escalated = qualityAlerts.escalateAlert(lowAlert, 'MEDIUM');

      // Assert
      expect(escalated.severity).toBe('MEDIUM');
      expect(escalated.title).toBe('Escalated: Low Priority Issue');
      expect(escalated.message).toBe('ESCALATED: Minor issue detected');
    });

    it('should create new alert with escalated severity', () => {
      // Arrange
      const originalAlert: Alert = {
        id: 'original-id',
        timestamp: Date.now() - 1000,
        severity: 'MEDIUM',
        title: 'Medium Issue',
        message: 'Medium severity issue',
        description: 'Medium severity issue',
        action: 'Review within 24 hours',
      };

      // Act
      const escalated = qualityAlerts.escalateAlert(originalAlert, 'HIGH');

      // Assert
      expect(escalated.id).not.toBe(originalAlert.id);
      expect(escalated.timestamp).toBeGreaterThan(originalAlert.timestamp);
      expect(escalated.severity).toBe('HIGH');
      expect(escalated.title).toContain('Escalated:');
    });
  });
});
