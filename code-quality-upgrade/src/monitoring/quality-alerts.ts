/**
 * Quality Alerts System
 *
 * GREEN PHASE - Implementation to make tests pass
 *
 * This module provides intelligent alert generation and management
 * for quality system monitoring and escalation.
 */

import {
  Alert,
  AlertInput,
  AlertResults,
  AlertSeverity,
  QualityMetrics,
} from '../types/quality';

/**
 * QualityAlerts class for monitoring and alerting on quality metrics
 */
export class QualityAlerts {
  /**
   * Evaluate metrics and generate appropriate alerts based on thresholds
   */
  evaluateAlerts(metrics: QualityMetrics): AlertResults {
    const critical: Alert[] = [];
    const warnings: Alert[] = [];
    const info: Alert[] = [];

    // Critical alerts - High failure rate >10% (HIGH), >20% (CRITICAL)
    if (metrics.gates.failureRate > 0.2) {
      critical.push(
        this.createAlert(
          'CRITICAL',
          'High Quality Gates Failure Rate',
          `Quality Gates Failure Rate is critically high: ${(metrics.gates.failureRate * 100).toFixed(1)}%`,
          'Immediate investigation required. Review failing gates and fix underlying issues.'
        )
      );
    } else if (metrics.gates.failureRate > 0.1) {
      warnings.push(
        this.createAlert(
          'HIGH',
          'High Quality Gates Failure Rate',
          `Quality Gates Failure Rate is elevated: ${(metrics.gates.failureRate * 100).toFixed(1)}%`,
          'Investigation recommended. Review failing gates and address issues promptly.'
        )
      );
    }

    // Warning - Execution time >5 minutes (MEDIUM)
    if (metrics.averageExecutionTime > 300000) {
      warnings.push(
        this.createAlert(
          'MEDIUM',
          'Quality gates execution time',
          `Quality gates execution time is above threshold: ${(metrics.averageExecutionTime / 60000).toFixed(1)} minutes`,
          'Optimize gate execution or implement parallel processing to improve performance.'
        )
      );
    }

    // Warning - ESLint error rate >5% (MEDIUM)
    if (metrics.eslintErrorRate > 0.05) {
      warnings.push(
        this.createAlert(
          'MEDIUM',
          'High ESLint error rate',
          `High ESLint error rate detected: ${(metrics.eslintErrorRate * 100).toFixed(1)}%`,
          'Review ESLint configuration and provide team training on coding standards.'
        )
      );
    }

    // Info - Memory usage >512MB (LOW)
    if (metrics.performance.memoryUsage > 512) {
      info.push(
        this.createAlert(
          'LOW',
          'High memory usage',
          `Memory usage is elevated: ${metrics.performance.memoryUsage}MB`,
          'Optimize memory usage and check for memory leaks in the quality system.'
        )
      );
    }

    return {
      critical,
      warnings,
      info,
    };
  }

  /**
   * Create a new alert with unique ID and timestamp
   */
  sendAlert(alertInput: AlertInput): Alert {
    return {
      id: this.generateUniqueId(),
      timestamp: Date.now(),
      severity: alertInput.severity,
      title: alertInput.title,
      message: alertInput.message,
      description: alertInput.message,
      action: alertInput.action,
    };
  }

  /**
   * Escalate an existing alert to a higher severity level
   */
  escalateAlert(alert: Alert, newSeverity: AlertSeverity): Alert {
    return {
      id: this.generateUniqueId(),
      timestamp: Date.now(),
      severity: newSeverity,
      title: `Escalated: ${alert.title}`,
      message: `ESCALATED: ${alert.message}`,
      description: `ESCALATED: ${alert.description}`,
      action: alert.action,
    };
  }

  /**
   * Create an alert object
   */
  private createAlert(
    severity: AlertSeverity,
    title: string,
    description: string,
    action: string
  ): Alert {
    return {
      id: this.generateUniqueId(),
      timestamp: Date.now(),
      severity,
      title,
      message: description,
      description,
      action,
    };
  }

  /**
   * Generate a unique ID for alerts
   */
  private generateUniqueId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
