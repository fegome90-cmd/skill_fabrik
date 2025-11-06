#!/usr/bin/env node

/**
 * Advanced Monitoring System for Skills Fabric Post-Hooks Pipeline
 * Real-time monitoring, alerting, and performance tracking
 */

import { readFile, writeFile, appendFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { performance } from 'perf_hooks';

const MONITORING_DIR = './monitoring-data';
const ALERTS_DIR = './monitoring-alerts';

/**
 * Alert thresholds and configurations
 */
const ALERT_THRESHOLDS = {
  performance: {
    singleFileMax: 3000,      // ms
    multiFileMax: 5000,       // ms
    multiRepoMax: 12000,      // ms
    complexPipelineMax: 15000 // ms
  },
  cache: {
    minHitRate: 50,           // percentage
    criticalMinHitRate: 30    // percentage
  },
  errors: {
    maxErrorRate: 5,          // percentage
    criticalMaxErrorRate: 10  // percentage
  },
  memory: {
    maxHeapUsage: 100,        // MB
    criticalMaxHeapUsage: 150 // MB
  }
};

/**
 * Monitoring metrics structure
 */
class MonitoringMetrics {
  constructor() {
    this.startTime = Date.now();
    this.totalRuns = 0;
    this.successfulRuns = 0;
    this.failedRuns = 0;
    this.performanceData = {
      singleFile: [],
      multiFile: [],
      multiRepo: [],
      errorResolution: [],
      complexPipeline: []
    };
    this.cachePerformance = [];
    this.errorRates = [];
    this.memoryUsage = [];
    this.alerts = [];
  }

  recordRun(result) {
    this.totalRuns++;

    if (result.success) {
      this.successfulRuns++;
    } else {
      this.failedRuns++;
    }

    // Record performance data
    if (result.scenario) {
      // Initialize array if it doesn't exist
      if (!this.performanceData[result.scenario]) {
        this.performanceData[result.scenario] = [];
      }

      this.performanceData[result.scenario].push({
        duration: result.duration,
        timestamp: result.timestamp,
        cacheHits: result.cacheHits || 0,
        memoryUsage: result.memoryUsage
      });
    }

    // Record cache performance
    if (result.cacheHits !== undefined) {
      this.cachePerformance.push({
        hitRate: result.cacheHits,
        timestamp: result.timestamp
      });
    }

    // Record memory usage
    if (result.memoryUsage) {
      this.memoryUsage.push({
        heapMB: Math.round(result.memoryUsage.heapUsed / 1024 / 1024),
        externalMB: Math.round(result.memoryUsage.external / 1024 / 1024),
        timestamp: result.timestamp
      });
    }
  }

  getSuccessRate() {
    return this.totalRuns > 0 ? Math.round((this.successfulRuns / this.totalRuns) * 100) : 0;
  }

  getAverageLatency(scenario) {
    const data = this.performanceData[scenario] || [];
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + item.duration, 0);
    return Math.round(sum / data.length);
  }

  getAverageCacheHitRate() {
    if (this.cachePerformance.length === 0) return 0;
    const sum = this.cachePerformance.reduce((acc, item) => acc + item.hitRate, 0);
    return Math.round(sum / this.cachePerformance.length);
  }

  getAverageMemoryUsage() {
    if (this.memoryUsage.length === 0) return { heap: 0, external: 0 };
    const heapSum = this.memoryUsage.reduce((acc, item) => acc + item.heapMB, 0);
    const externalSum = this.memoryUsage.reduce((acc, item) => acc + item.externalMB, 0);
    const count = this.memoryUsage.length;
    return {
      heap: Math.round(heapSum / count),
      external: Math.round(externalSum / count)
    };
  }
}

/**
 * Alert system
 */
class AlertSystem {
  constructor(thresholds) {
    this.thresholds = thresholds;
    this.activeAlerts = new Map();
  }

  checkPerformanceAlerts(metrics) {
    const alerts = [];

    // Check single file performance
    const singleFileAvg = metrics.getAverageLatency('singleFile');
    if (singleFileAvg > this.thresholds.performance.singleFileMax) {
      alerts.push({
        type: 'PERFORMANCE',
        severity: singleFileAvg > this.thresholds.performance.singleFileMax * 1.5 ? 'CRITICAL' : 'WARNING',
        message: `Single file processing too slow: ${singleFileAvg}ms (threshold: ${this.thresholds.performance.singleFileMax}ms)`,
        timestamp: new Date().toISOString(),
        scenario: 'singleFile',
        value: singleFileAvg,
        threshold: this.thresholds.performance.singleFileMax
      });
    }

    // Check multi-repo performance
    const multiRepoAvg = metrics.getAverageLatency('multiRepo');
    if (multiRepoAvg > this.thresholds.performance.multiRepoMax) {
      alerts.push({
        type: 'PERFORMANCE',
        severity: multiRepoAvg > this.thresholds.performance.multiRepoMax * 1.5 ? 'CRITICAL' : 'WARNING',
        message: `Multi-repo processing too slow: ${multiRepoAvg}ms (threshold: ${this.thresholds.performance.multiRepoMax}ms)`,
        timestamp: new Date().toISOString(),
        scenario: 'multiRepo',
        value: multiRepoAvg,
        threshold: this.thresholds.performance.multiRepoMax
      });
    }

    // Check cache performance
    const cacheHitRate = metrics.getAverageCacheHitRate();
    if (cacheHitRate < this.thresholds.cache.criticalMinHitRate) {
      alerts.push({
        type: 'CACHE',
        severity: 'CRITICAL',
        message: `Cache hit rate critically low: ${cacheHitRate}% (threshold: ${this.thresholds.cache.criticalMinHitRate}%)`,
        timestamp: new Date().toISOString(),
        value: cacheHitRate,
        threshold: this.thresholds.cache.criticalMinHitRate
      });
    } else if (cacheHitRate < this.thresholds.cache.minHitRate) {
      alerts.push({
        type: 'CACHE',
        severity: 'WARNING',
        message: `Cache hit rate low: ${cacheHitRate}% (threshold: ${this.thresholds.cache.minHitRate}%)`,
        timestamp: new Date().toISOString(),
        value: cacheHitRate,
        threshold: this.thresholds.cache.minHitRate
      });
    }

    // Check memory usage
    const memoryUsage = metrics.getAverageMemoryUsage();
    if (memoryUsage.heap > this.thresholds.memory.criticalMaxHeapUsage) {
      alerts.push({
        type: 'MEMORY',
        severity: 'CRITICAL',
        message: `Memory usage critically high: ${memoryUsage.heap}MB heap (threshold: ${this.thresholds.memory.criticalMaxHeapUsage}MB)`,
        timestamp: new Date().toISOString(),
        value: memoryUsage.heap,
        threshold: this.thresholds.memory.criticalMaxHeapUsage
      });
    } else if (memoryUsage.heap > this.thresholds.memory.maxHeapUsage) {
      alerts.push({
        type: 'MEMORY',
        severity: 'WARNING',
        message: `Memory usage high: ${memoryUsage.heap}MB heap (threshold: ${this.thresholds.memory.maxHeapUsage}MB)`,
        timestamp: new Date().toISOString(),
        value: memoryUsage.heap,
        threshold: this.thresholds.memory.maxHeapUsage
      });
    }

    // Check success rate
    const successRate = metrics.getSuccessRate();
    if (successRate < 90) {
      alerts.push({
        type: 'RELIABILITY',
        severity: successRate < 80 ? 'CRITICAL' : 'WARNING',
        message: `Success rate low: ${successRate}% (threshold: 90%)`,
        timestamp: new Date().toISOString(),
        value: successRate,
        threshold: 90
      });
    }

    return alerts;
  }

  async saveAlert(alert) {
    try {
      await mkdir(ALERTS_DIR, { recursive: true });
      const alertFile = join(ALERTS_DIR, `alert-${Date.now()}-${alert.type.toLowerCase()}.json`);
      await writeFile(alertFile, JSON.stringify(alert, null, 2));
      console.log(`🚨 ALERT SAVED: ${alertFile}`);
    } catch (error) {
      console.error('Failed to save alert:', error);
    }
  }

  async processAlerts(alerts) {
    for (const alert of alerts) {
      const alertKey = `${alert.type}-${alert.severity}`;

      // Check if this is a new alert or escalation
      const existingAlert = this.activeAlerts.get(alertKey);
      if (!existingAlert || existingAlert.severity !== alert.severity) {
        console.log(`\n🚨 ${alert.severity} ALERT: ${alert.message}`);
        await this.saveAlert(alert);
        this.activeAlerts.set(alertKey, alert);
      }
    }
  }
}

/**
 * Monitoring dashboard generator
 */
class MonitoringDashboard {
  async generateReport(metrics, alerts) {
    const report = {
      summary: {
        generatedAt: new Date().toISOString(),
        totalRuns: metrics.totalRuns,
        successRate: metrics.getSuccessRate(),
        uptime: Math.round((Date.now() - metrics.startTime) / 1000 / 60), // minutes
        activeAlerts: alerts.filter(a => a.severity === 'CRITICAL').length
      },
      performance: {
        singleFile: {
          average: metrics.getAverageLatency('single-ts-file'),
          threshold: ALERT_THRESHOLDS.performance.singleFileMax,
          status: metrics.getAverageLatency('single-ts-file') <= ALERT_THRESHOLDS.performance.singleFileMax ? 'HEALTHY' : 'WARNING'
        },
        multiFile: {
          average: metrics.getAverageLatency('multiple-ts-files'),
          threshold: ALERT_THRESHOLDS.performance.multiFileMax,
          status: metrics.getAverageLatency('multiple-ts-files') <= ALERT_THRESHOLDS.performance.multiFileMax ? 'HEALTHY' : 'WARNING'
        },
        multiRepo: {
          average: metrics.getAverageLatency('multi-repo'),
          threshold: ALERT_THRESHOLDS.performance.multiRepoMax,
          status: metrics.getAverageLatency('multi-repo') <= ALERT_THRESHOLDS.performance.multiRepoMax ? 'HEALTHY' : 'WARNING'
        },
        complexPipeline: {
          average: metrics.getAverageLatency('complex-pipeline'),
          threshold: ALERT_THRESHOLDS.performance.complexPipelineMax,
          status: metrics.getAverageLatency('complex-pipeline') <= ALERT_THRESHOLDS.performance.complexPipelineMax ? 'HEALTHY' : 'WARNING'
        }
      },
      cache: {
        averageHitRate: metrics.getAverageCacheHitRate(),
        threshold: ALERT_THRESHOLDS.cache.minHitRate,
        status: metrics.getAverageCacheHitRate() >= ALERT_THRESHOLDS.cache.minHitRate ? 'HEALTHY' : 'WARNING'
      },
      memory: {
        average: metrics.getAverageMemoryUsage(),
        threshold: ALERT_THRESHOLDS.memory.maxHeapUsage,
        status: metrics.getAverageMemoryUsage().heap <= ALERT_THRESHOLDS.memory.maxHeapUsage ? 'HEALTHY' : 'WARNING'
      },
      alerts: alerts.slice(-10), // Last 10 alerts
      trends: this.calculateTrends(metrics)
    };

    return report;
  }

  calculateTrends(metrics) {
    // Calculate trends based on recent data
    const recentPerformance = metrics.performanceData.singleFile.slice(-10);
    const olderPerformance = metrics.performanceData.singleFile.slice(-20, -10);

    if (recentPerformance.length === 0 || olderPerformance.length === 0) {
      return { trend: 'STABLE', change: 0 };
    }

    const recentAvg = recentPerformance.reduce((sum, item) => sum + item.duration, 0) / recentPerformance.length;
    const olderAvg = olderPerformance.reduce((sum, item) => sum + item.duration, 0) / olderPerformance.length;
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    let trend = 'STABLE';
    if (Math.abs(change) > 10) {
      trend = change > 0 ? 'DEGRADING' : 'IMPROVING';
    }

    return { trend, change: Math.round(change) };
  }

  async saveDashboard(report) {
    try {
      await mkdir(MONITORING_DIR, { recursive: true });
      const dashboardFile = join(MONITORING_DIR, 'dashboard.json');
      await writeFile(dashboardFile, JSON.stringify(report, null, 2));

      // Also save a markdown version for easy viewing
      const markdownFile = join(MONITORING_DIR, 'dashboard.md');
      const markdown = this.generateMarkdownReport(report);
      await writeFile(markdownFile, markdown);

      console.log(`📊 Dashboard updated: ${dashboardFile}`);
    } catch (error) {
      console.error('Failed to save dashboard:', error);
    }
  }

  generateMarkdownReport(report) {
    return `# Skills Fabric Post-Hooks Monitoring Dashboard

Generated: ${report.summary.generatedAt}

## 📊 System Summary

- **Total Runs**: ${report.summary.totalRuns}
- **Success Rate**: ${report.summary.successRate}%
- **Uptime**: ${report.summary.uptime} minutes
- **Active Alerts**: ${report.summary.activeAlerts}

## 🚀 Performance Metrics

| Scenario | Average (ms) | Threshold (ms) | Status |
|----------|---------------|----------------|--------|
| Single File | ${report.performance.singleFile.average} | ${report.performance.singleFile.threshold} | ${report.performance.singleFile.status} |
| Multiple Files | ${report.performance.multiFile.average} | ${report.performance.multiFile.threshold} | ${report.performance.multiFile.status} |
| Multi-Repo | ${report.performance.multiRepo.average} | ${report.performance.multiRepo.threshold} | ${report.performance.multiRepo.status} |
| Complex Pipeline | ${report.performance.complexPipeline.average} | ${report.performance.complexPipeline.threshold} | ${report.performance.complexPipeline.status} |

## 💾 Cache Performance

- **Hit Rate**: ${report.cache.averageHitRate}% (threshold: ${report.cache.threshold}%)
- **Status**: ${report.cache.status}

## 🧠 Memory Usage

- **Heap**: ${report.memory.average.heap}MB (threshold: ${report.memory.threshold}MB)
- **External**: ${report.memory.average.external}MB
- **Status**: ${report.memory.status}

## 📈 Trends

- **Performance Trend**: ${report.trends.trend} (${report.trends.change > 0 ? '+' : ''}${report.trends.change}%)

## 🚨 Recent Alerts

${report.alerts.length > 0 ? report.alerts.map(alert =>
  `- **${alert.severity}** ${alert.message} (${alert.timestamp})`
).join('\n') : 'No recent alerts'}

---
*Last updated: ${new Date().toISOString()}*
`;
  }
}

/**
 * Main monitoring system
 */
class MonitoringSystem {
  constructor() {
    this.metrics = new MonitoringMetrics();
    this.alertSystem = new AlertSystem(ALERT_THRESHOLDS);
    this.dashboard = new MonitoringDashboard();
    this.isRunning = false;
  }

  async start() {
    console.log('🚀 Starting Skills Fabric Post-Hooks Monitoring System\n');

    this.isRunning = true;

    // Initialize directories
    await mkdir(MONITORING_DIR, { recursive: true });
    await mkdir(ALERTS_DIR, { recursive: true });

    // Start monitoring loop
    this.monitoringLoop();
  }

  async monitoringLoop() {
    while (this.isRunning) {
      try {
        // Check for new baseline results
        await this.checkLatestResults();

        // Generate alerts
        const alerts = this.alertSystem.checkPerformanceAlerts(this.metrics);
        if (alerts.length > 0) {
          await this.alertSystem.processAlerts(alerts);
        }

        // Update dashboard
        const report = await this.dashboard.generateReport(this.metrics, alerts);
        await this.dashboard.saveDashboard(report);

        // Log current status
        this.logCurrentStatus();

      } catch (error) {
        console.error('Monitoring loop error:', error);
      }

      // Wait before next check (30 seconds)
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }

  async checkLatestResults() {
    try {
      const baselineFile = join(MONITORING_DIR, '../performance-baseline-results/baseline-latest.json');
      const data = await readFile(baselineFile, 'utf8');
      const baseline = JSON.parse(data);

      console.log(`📊 Processing baseline: ${baseline.testType} with ${baseline.totalTests} tests`);

      // Process each scenario's metrics
      if (baseline.scenarios) {
        for (const [scenarioName, scenarioData] of Object.entries(baseline.scenarios)) {
          if (scenarioData && scenarioData.latency && scenarioData.memory) {
            const result = {
              scenario: scenarioName,
              success: scenarioData.successRate === 100,
              duration: scenarioData.latency.avg,
              timestamp: new Date().toISOString(),
              cacheHits: scenarioData.features?.avgCacheHits || 0,
              memoryUsage: {
                heapUsed: (scenarioData.memory.avgHeapUsed || 0) * 1024 * 1024,
                external: (scenarioData.memory.avgExternal || 0) * 1024 * 1024
              }
            };

            console.log(`📈 Recording ${scenarioName}: ${result.duration}ms, ${result.success ? 'SUCCESS' : 'FAILED'}`);
            this.metrics.recordRun(result);
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ No baseline results available: ${error.message}`);
    }
  }

  logCurrentStatus() {
    const successRate = this.metrics.getSuccessRate();
    const avgLatency = this.metrics.getAverageLatency('singleFile');
    const cacheHitRate = this.metrics.getAverageCacheHitRate();
    const memoryUsage = this.metrics.getAverageMemoryUsage();

    console.log(`\n📊 Status Update [${new Date().toISOString()}]`);
    console.log(`   ✅ Success Rate: ${successRate}%`);
    console.log(`   ⚡ Avg Latency: ${avgLatency}ms`);
    console.log(`   💾 Cache Hit Rate: ${cacheHitRate}%`);
    console.log(`   🧠 Memory: ${memoryUsage.heap}MB heap`);
  }

  stop() {
    this.isRunning = false;
    console.log('\n🛑 Monitoring system stopped');
  }
}

/**
 * Main execution
 */
async function main() {
  const monitoring = new MonitoringSystem();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    monitoring.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    monitoring.stop();
    process.exit(0);
  });

  await monitoring.start();
}

// Run the monitoring system
main().catch(error => {
  console.error('💥 Monitoring system failed:', error);
  process.exit(1);
});