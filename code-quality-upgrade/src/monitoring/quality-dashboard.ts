import {
  OverallQuality,
  QualityMetrics,
  QualityReport,
  Recommendation,
} from '../types/quality';

/**
 * Quality Dashboard for advanced analytics and monitoring
 * Provides real-time quality metrics, performance tracking, and automated recommendations
 */
export class QualityDashboard {
  /**
   * Generate comprehensive quality report from metrics
   */
  generateReport(metrics: QualityMetrics): QualityReport {
    const overall = this.calculateOverallMetrics(metrics);
    const recommendations = this.generateRecommendations(metrics);

    return {
      timestamp: Date.now(),
      overall,
      gates: {
        executionTime: metrics.gates.executionTime,
        successRate: metrics.gates.successRate,
        failureRate: metrics.gates.failureRate,
      },
      trends: metrics.trends,
      recommendations,
    };
  }

  /**
   * Calculate overall quality metrics
   */
  private calculateOverallMetrics(metrics: QualityMetrics): OverallQuality {
    const qualityScore = this.calculateQualityScore(metrics);
    const technicalDebt = this.calculateTechnicalDebt(metrics);

    return {
      qualityScore,
      technicalDebt,
      performance: {
        executionTime: metrics.performance.executionTime,
        memoryUsage: metrics.performance.memoryUsage,
        cpuUtilization: metrics.performance.cpuUtilization,
      },
    };
  }

  /**
   * Calculate quality score based on multiple factors
   */
  private calculateQualityScore(metrics: QualityMetrics): number {
    // Simple quality score calculation
    const successRateWeight = 0.4;
    const eslintRateWeight = 0.3;
    const performanceWeight = 0.3;

    // Extract values to avoid TypeScript errors
    const failureRate = metrics.gates.failureRate;
    const eslintRate = metrics.eslintErrorRate;
    const avgTime = metrics.averageExecutionTime;

    // Quality factors
    const successScore = Math.max(0, (1 - failureRate) * 100);
    const eslintScore = Math.max(0, (1 - eslintRate * 10) * 100);
    const performanceScore = Math.max(0, (1 - avgTime / 600000) * 100);

    return Math.round(
      successScore * successRateWeight +
        eslintScore * eslintRateWeight +
        performanceScore * performanceWeight
    );
  }

  /**
   * Calculate technical debt level
   */
  private calculateTechnicalDebt(
    metrics: QualityMetrics
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    // Extract values to avoid TypeScript errors
    const failureRate = metrics.gates.failureRate;
    const eslintRate = metrics.eslintErrorRate;
    const avgTime = metrics.averageExecutionTime;

    const debtScore =
      failureRate * 10 + eslintRate * 5 + (avgTime / 600000) * 5;

    if (debtScore > 5) {
      return 'HIGH';
    } else if (debtScore > 2) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  /**
   * Generate automated recommendations based on metrics
   */
  private generateRecommendations(metrics: QualityMetrics): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Extract values to avoid TypeScript errors
    const failureRate = metrics.gates.failureRate;
    const avgTime = metrics.averageExecutionTime;
    const eslintRate = metrics.eslintErrorRate;
    const memoryUsage = metrics.performance.memoryUsage;

    // High failure rate recommendation
    if (failureRate > 0.1) {
      recommendations.push({
        type: 'PERFORMANCE',
        priority: 'HIGH',
        description: `High Quality Gates Failure Rate: ${(failureRate * 100).toFixed(1)}%`,
        action:
          'Immediate investigation required. Review failing gates and fix underlying issues.',
      });
    }

    // Slow execution time recommendation
    if (avgTime > 300000) {
      recommendations.push({
        type: 'PERFORMANCE',
        priority: 'MEDIUM',
        description: `Quality gates execution time is above threshold: ${(avgTime / 60000).toFixed(1)} minutes`,
        action:
          'Optimize gate execution or implement parallel processing to improve performance.',
      });
    }

    // ESLint error rate recommendation
    if (eslintRate > 0.05) {
      recommendations.push({
        type: 'QUALITY',
        priority: 'MEDIUM',
        description: `High ESLint error rate: ${(eslintRate * 100).toFixed(1)}%`,
        action:
          'Review ESLint configuration and provide team training on coding standards.',
      });
    }

    // Memory usage recommendation
    if (memoryUsage > 512) {
      recommendations.push({
        type: 'PERFORMANCE',
        priority: 'LOW',
        description: `High memory usage: ${memoryUsage}MB`,
        action:
          'Optimize memory usage and check for memory leaks in the quality system.',
      });
    }

    return recommendations;
  }
}
