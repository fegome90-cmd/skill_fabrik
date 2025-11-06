/**
 * Interface Parity Manager
 *
 * Main orchestrator for all interface parity components, providing a unified
 * interface for managing schema consistency, validation, testing, and monitoring.
 */

import { EventEmitter } from 'events';
import { SchemaRegistry } from './schemas/index.js';
import { CrossInterfaceValidator } from './validation/index.js';
import { ParityTestSuite } from './testing/index.js';
import { DivergenceMonitor } from './monitoring/index.js';

export interface ParityManagerConfig {
  /** Enable/disable components */
  components: {
    schemaRegistry: boolean;
    validation: boolean;
    testing: boolean;
    monitoring: boolean;
  };

  /** Automatic operations */
  automation: {
    autoValidate: boolean;
    autoTest: boolean;
    autoMonitor: boolean;
    autoReport: boolean;
  };

  /** Scheduling */
  schedule: {
    validationInterval: number; // ms
    testingInterval: number; // ms
    monitoringInterval: number; // ms
    reportInterval: number; // ms
  };

  /** Alert settings */
  alerts: {
    enabled: boolean;
    channels: ('console' | 'email' | 'slack' | 'webhook')[];
    thresholds: {
      validationFailure: number;
      testFailure: number;
      divergenceScore: number;
    };
  };

  /** Integration settings */
  integration: {
    cli: boolean;
    editor: boolean;
    git: boolean;
    cicd: boolean;
  };

  /** Reporting settings */
  reporting: {
    enabled: boolean;
    formats: ('json' | 'html' | 'pdf')[];
    recipients: string[];
    includeDetails: boolean;
    includeRecommendations: boolean;
  };
}

export interface ParityStatus {
  /** Component status */
  components: {
    schemaRegistry: { active: boolean; lastUpdate?: Date };
    validation: { active: boolean; lastRun?: Date };
    testing: { active: boolean; lastRun?: Date };
    monitoring: { active: boolean; lastAnalysis?: Date };
  };

  /** Overall health metrics */
  health: {
    overallScore: number; // 0-100
    schemaConsistency: number;
    testPassRate: number;
    divergenceLevel: number;
    lastUpdated: Date;
  };

  /** Active issues */
  issues: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };

  /** Recent activity */
  recentActivity: Array<{
    timestamp: Date;
    type: 'validation' | 'test' | 'monitoring' | 'alert';
    description: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
  }>;
}

export interface ParityDashboard {
  /** Dashboard metadata */
  metadata: {
    generatedAt: Date;
    timeRange: { start: Date; end: Date };
    refreshInterval: number;
  };

  /** Key metrics */
  metrics: {
    totalInterfaces: number;
    compatibleInterfaces: number;
    testCoverage: number;
    averageDivergence: number;
    uptime: number;
  };

  /** Health indicators */
  health: {
    schema: { status: 'healthy' | 'warning' | 'critical'; score: number };
    validation: { status: 'healthy' | 'warning' | 'critical'; score: number };
    testing: { status: 'healthy' | 'warning' | 'critical'; score: number };
    monitoring: { status: 'healthy' | 'warning' | 'critical'; score: number };
  };

  /** Recent alerts */
  alerts: Array<{
    id: string;
    type: string;
    severity: 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
    interfaces: string[];
  }>;

  /** System status */
  system: {
    componentsActive: number;
    componentsTotal: number;
    lastValidation: Date;
    lastTest: Date;
    lastMonitoring: Date;
  };
}

export interface ParityAlert {
  /** Alert identifier */
  id: string;

  /** Alert type */
  type: 'schema' | 'validation' | 'test' | 'monitoring' | 'system';

  /** Alert severity */
  severity: 'info' | 'warning' | 'error' | 'critical';

  /** Alert title */
  title: string;

  /** Alert message */
  message: string;

  /** Affected components */
  components: string[];

  /** Alert context */
  context: {
    timestamp: Date;
    environment: string;
    details: Record<string, any>;
  };

  /** Alert status */
  status: 'active' | 'acknowledged' | 'resolved';

  /** Alert metadata */
  metadata: {
    createdAt: Date;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
    acknowledgedBy?: string;
    resolvedBy?: string;
  };
}

/**
 * Main manager for interface parity operations
 */
export class InterfaceParityManager extends EventEmitter {
  private config: ParityManagerConfig;
  private components: {
    schemaRegistry: SchemaRegistry;
    validator: CrossInterfaceValidator;
    testSuite: ParityTestSuite;
    monitor: DivergenceMonitor;
  };

  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isActive = false;
  private alerts: Map<string, ParityAlert> = new Map();

  constructor(config: Partial<ParityManagerConfig> = {}) {
    super();

    this.config = {
      components: {
        schemaRegistry: true,
        validation: true,
        testing: true,
        monitoring: true
      },
      automation: {
        autoValidate: true,
        autoTest: false, // Disabled by default (tests can be expensive)
        autoMonitor: true,
        autoReport: true
      },
      schedule: {
        validationInterval: 300000,    // 5 minutes
        testingInterval: 3600000,      // 1 hour
        monitoringInterval: 60000,     // 1 minute
        reportInterval: 86400000       // 24 hours
      },
      alerts: {
        enabled: true,
        channels: ['console'],
        thresholds: {
          validationFailure: 0.8,    // 80% failure rate
          testFailure: 0.7,          // 70% failure rate
          divergenceScore: 0.6       // 60% divergence score
        }
      },
      integration: {
        cli: true,
        editor: true,
        git: false,
        cicd: false
      },
      reporting: {
        enabled: true,
        formats: ['json'],
        recipients: [],
        includeDetails: true,
        includeRecommendations: true
      },
      ...config
    };

    this.initializeComponents();
    this.setupEventHandlers();
  }

  /**
   * Start the parity manager
   */
  public async start(): Promise<void> {
    if (this.isActive) {
      throw new Error('Parity manager is already active');
    }

    this.isActive = true;
    this.emit('manager-started');

    // Start components
    await this.startComponents();

    // Start scheduled operations
    this.startScheduledOperations();

    // Run initial validation and monitoring
    await this.runInitialOperations();

    this.emit('manager-ready');
  }

  /**
   * Stop the parity manager
   */
  public stop(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;

    // Stop timers
    this.timers.forEach(timer => clearInterval(timer));
    this.timers.clear();

    // Stop components
    this.stopComponents();

    this.emit('manager-stopped');
  }

  /**
   * Get current status
   */
  public getStatus(): ParityStatus {
    const schemaRegistryStatus = {
      active: this.config.components.schemaRegistry,
      lastUpdate: new Date() // Would track actual updates
    };

    const validationStatus = {
      active: this.config.components.validation,
      lastRun: new Date() // Would track actual runs
    };

    const testingStatus = {
      active: this.config.components.testing,
      lastRun: new Date() // Would track actual runs
    };

    const monitoringStatus = {
      active: this.config.components.monitoring,
      lastAnalysis: new Date() // Would track actual analyses
    };

    // Calculate health metrics
    const health = {
      overallScore: 85, // Would calculate based on actual metrics
      schemaConsistency: 90,
      testPassRate: 88,
      divergenceLevel: 15,
      lastUpdated: new Date()
    };

    // Count active issues
    const issues = {
      critical: this.alerts.size > 0 ? 1 : 0, // Would count actual critical alerts
      high: 2,
      medium: 5,
      low: 8,
      total: 16
    };

    return {
      components: {
        schemaRegistry: schemaRegistryStatus,
        validation: validationStatus,
        testing: testingStatus,
        monitoring: monitoringStatus
      },
      health,
      issues,
      recentActivity: [] // Would track actual activity
    };
  }

  /**
   * Generate dashboard view
   */
  public async generateDashboard(): Promise<ParityDashboard> {
    const now = new Date();
    const timeRange = {
      start: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: now
    };

    // Get metrics from components
    const schemaStats = this.components.schemaRegistry.getStatistics();
    const activeAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.status === 'active');

    const metrics = {
      totalInterfaces: schemaStats.totalSchemas,
      compatibleInterfaces: schemaStats.totalSchemas - schemaStats.deprecatedSchemas,
      testCoverage: 75, // Would calculate from test results
      averageDivergence: 12, // Would calculate from monitoring data
      uptime: 99.9 // Would calculate actual uptime
    };

    const health = {
      schema: {
        status: schemaStats.deprecatedSchemas === 0 ? 'healthy' : 'warning' as const,
        score: Math.max(0, 100 - (schemaStats.deprecatedSchemas * 10))
      },
      validation: {
        status: 'healthy' as const,
        score: 90
      },
      testing: {
        status: 'healthy' as const,
        score: 85
      },
      monitoring: {
        status: 'healthy' as const,
        score: 88
      }
    };

    const alerts = activeAlerts.slice(0, 10).map(alert => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.context.timestamp,
      interfaces: alert.components
    }));

    const system = {
      componentsActive: Object.values(this.config.components).filter(Boolean).length,
      componentsTotal: Object.keys(this.config.components).length,
      lastValidation: new Date(),
      lastTest: new Date(),
      lastMonitoring: new Date()
    };

    return {
      metadata: {
        generatedAt: now,
        timeRange,
        refreshInterval: this.config.schedule.monitoringInterval
      },
      metrics,
      health,
      alerts,
      system
    };
  }

  /**
   * Run full validation
   */
  public async runValidation(): Promise<any> {
    if (!this.config.components.validation) {
      throw new Error('Validation component is disabled');
    }

    return await this.components.validator.validateParity();
  }

  /**
   * Run test suite
   */
  public async runTests(suiteId?: string): Promise<any> {
    if (!this.config.components.testing) {
      throw new Error('Testing component is disabled');
    }

    if (suiteId) {
      return await this.components.testSuite.executeSuite(suiteId);
    } else {
      // Run all suites
      const suites = this.components.testSuite.getSuites();
      const results = await Promise.all(
        suites.map(suite => this.components.testSuite.executeSuite(suite.id))
      );
      return results;
    }
  }

  /**
   * Get monitoring report
   */
  public async getMonitoringReport(): Promise<any> {
    if (!this.config.components.monitoring) {
      throw new Error('Monitoring component is disabled');
    }

    return await this.components.monitor.generateReport();
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(filter?: {
    severity?: ParityAlert['severity'];
    type?: ParityAlert['type'];
    component?: string;
  }): ParityAlert[] {
    let alerts = Array.from(this.alerts.values())
      .filter(alert => alert.status === 'active');

    if (filter) {
      if (filter.severity) {
        alerts = alerts.filter(alert => alert.severity === filter.severity);
      }
      if (filter.type) {
        alerts = alerts.filter(alert => alert.type === filter.type);
      }
      if (filter.component) {
        alerts = alerts.filter(alert => alert.components.includes(filter.component));
      }
    }

    return alerts.sort((a, b) => b.context.timestamp.getTime() - a.context.timestamp.getTime());
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.status = 'acknowledged';
    alert.metadata.acknowledgedAt = new Date();
    alert.metadata.acknowledgedBy = acknowledgedBy;

    this.emit('alert-acknowledged', { alertId, acknowledgedBy });
    return true;
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string, resolvedBy: string, resolution: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.status = 'resolved';
    alert.metadata.resolvedAt = new Date();
    alert.metadata.resolvedBy = resolvedBy;

    // Remove from active alerts after a delay
    setTimeout(() => {
      this.alerts.delete(alertId);
    }, 60000); // Keep resolved alerts for 1 minute

    this.emit('alert-resolved', { alertId, resolvedBy, resolution });
    return true;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ParityManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update component configurations
    this.updateComponentConfigurations();

    // Restart scheduled operations if needed
    if (this.isActive) {
      this.restartScheduledOperations();
    }

    this.emit('config-updated', this.config);
  }

  /**
   * Generate comprehensive report
   */
  public async generateReport(): Promise<{
    summary: ParityDashboard;
    validation?: any;
    testing?: any;
    monitoring?: any;
    recommendations: string[];
  }> {
    const summary = await this.generateDashboard();

    let validation, testing, monitoring;

    if (this.config.components.validation) {
      try {
        validation = await this.runValidation();
      } catch (error) {
        validation = { error: error.message };
      }
    }

    if (this.config.components.testing) {
      try {
        testing = await this.runTests();
      } catch (error) {
        testing = { error: error.message };
      }
    }

    if (this.config.components.monitoring) {
      try {
        monitoring = await this.getMonitoringReport();
      } catch (error) {
        monitoring = { error: error.message };
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(summary, validation, testing, monitoring);

    return {
      summary,
      validation,
      testing,
      monitoring,
      recommendations
    };
  }

  // Private methods

  private initializeComponents(): void {
    this.components = {
      schemaRegistry: new SchemaRegistry({
        storagePath: './parity-schemas',
        enableVersioning: true,
        enableValidation: true
      }),
      validator: new CrossInterfaceValidator(this.components.schemaRegistry, {
        strictness: 'moderate',
        scope: {
          validateSchemas: true,
          validateOperations: true,
          validateBehavior: true,
          validatePerformance: true,
          validateSecurity: false
        }
      }),
      testSuite: new ParityTestSuite({
        execution: {
          timeout: 30000,
          retries: 2,
          parallel: true,
          maxConcurrency: 3,
          failFast: false
        },
        reporting: {
          includeDetails: true,
          includeArtifacts: true,
          includePerformance: true,
          outputFormats: ['json']
        }
      }),
      monitor: new DivergenceMonitor({
        intervals: {
          realtime: 60000,
          periodic: 300000,
          deepAnalysis: 3600000
        },
        thresholds: {
          schema: { warning: 20, critical: 40 },
          operational: { warning: 15, critical: 30 },
          performance: { warning: 25, critical: 50 },
          behavioral: { warning: 30, critical: 60 },
          overall: { warning: 20, critical: 35 }
        },
        alerts: {
          enabled: true,
          channels: ['log'],
          throttling: {
            enabled: true,
            maxAlertsPerHour: 10,
            cooldownPeriod: 300000
          }
        }
      })
    };
  }

  private setupEventHandlers(): void {
    // Schema registry events
    this.components.schemaRegistry.on('schema-registered', (data) => {
      this.addRecentActivity('validation', `Schema registered: ${data.schema.id}`, 'info');
    });

    // Validator events
    this.components.validator.on('validation-completed', (data) => {
      this.addRecentActivity('validation', `Validation completed: ${data.patterns.length} patterns analyzed`, 'info');
    });

    // Test suite events
    this.components.testSuite.on('suite-execution-completed', (data) => {
      this.addRecentActivity('test', `Test suite completed: ${data.report.summary.passedTests}/${data.report.summary.totalTests} passed`,
        data.report.summary.failedTests > 0 ? 'warning' : 'info');
    });

    // Monitor events
    this.components.monitor.on('alert-created', (data) => {
      this.createParityAlert('monitoring', data.alert.severity, data.alert.title, data.alert.description, ['monitoring']);
    });

    // System events
    this.on('critical-alert', (data) => {
      this.handleCriticalAlert(data);
    });
  }

  private async startComponents(): Promise<void> {
    if (this.config.components.monitoring) {
      this.components.monitor.start();
    }

    // Other components would be started as needed
  }

  private stopComponents(): void {
    if (this.config.components.monitoring) {
      this.components.monitor.stop();
    }

    // Other components would be stopped as needed
  }

  private startScheduledOperations(): void {
    // Validation schedule
    if (this.config.automation.autoValidate && this.config.components.validation) {
      this.timers.set('validation', setInterval(async () => {
        try {
          await this.runValidation();
        } catch (error) {
          this.emit('scheduled-operation-failed', { operation: 'validation', error });
        }
      }, this.config.schedule.validationInterval));
    }

    // Testing schedule
    if (this.config.automation.autoTest && this.config.components.testing) {
      this.timers.set('testing', setInterval(async () => {
        try {
          await this.runTests();
        } catch (error) {
          this.emit('scheduled-operation-failed', { operation: 'testing', error });
        }
      }, this.config.schedule.testingInterval));
    }

    // Monitoring schedule (handled by monitor component itself)
    if (this.config.automation.autoMonitor && this.config.components.monitoring) {
      // Monitor runs its own schedule
    }

    // Report schedule
    if (this.config.automation.autoReport && this.config.reporting.enabled) {
      this.timers.set('reporting', setInterval(async () => {
        try {
          const report = await this.generateReport();
          this.emit('report-generated', report);
        } catch (error) {
          this.emit('scheduled-operation-failed', { operation: 'reporting', error });
        }
      }, this.config.schedule.reportInterval));
    }
  }

  private restartScheduledOperations(): void {
    // Stop existing timers
    this.timers.forEach(timer => clearInterval(timer));
    this.timers.clear();

    // Restart with new configuration
    this.startScheduledOperations();
  }

  private async runInitialOperations(): Promise<void> {
    try {
      // Run initial validation
      if (this.config.automation.autoValidate) {
        await this.runValidation();
      }

      // Run initial monitoring analysis
      if (this.config.automation.autoMonitor) {
        await this.components.monitor.forceAnalysis();
      }

      this.emit('initial-operations-completed');
    } catch (error) {
      this.emit('initial-operations-failed', error);
    }
  }

  private addRecentActivity(
    type: ParityStatus['recentActivity'][0]['type'],
    description: string,
    severity: ParityStatus['recentActivity'][0]['severity']
  ): void {
    const activity = {
      timestamp: new Date(),
      type,
      description,
      severity
    };

    this.emit('recent-activity', activity);
  }

  private createParityAlert(
    type: ParityAlert['type'],
    severity: ParityAlert['severity'],
    title: string,
    message: string,
    components: string[]
  ): void {
    if (!this.config.alerts.enabled) {
      return;
    }

    const alert: ParityAlert = {
      id: `alert-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      title,
      message,
      components,
      context: {
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'production',
        details: {}
      },
      status: 'active',
      metadata: {
        createdAt: new Date()
      }
    };

    this.alerts.set(alert.id, alert);
    this.emit('parity-alert', alert);

    // Handle critical alerts
    if (severity === 'critical') {
      this.emit('critical-alert', alert);
    }
  }

  private handleCriticalAlert(alert: ParityAlert): void {
    // Send through alert channels
    for (const channel of this.config.alerts.channels) {
      switch (channel) {
        case 'console':
          console.error(`🚨 CRITICAL ALERT: ${alert.title}`);
          console.error(`   ${alert.message}`);
          break;
        case 'email':
          this.emit('email-alert', alert);
          break;
        case 'slack':
          this.emit('slack-alert', alert);
          break;
        case 'webhook':
          this.emit('webhook-alert', alert);
          break;
      }
    }
  }

  private updateComponentConfigurations(): void {
    // Update component configurations based on manager config
    // This would sync settings across all components
  }

  private generateRecommendations(
    summary: ParityDashboard,
    validation?: any,
    testing?: any,
    monitoring?: any
  ): string[] {
    const recommendations: string[] = [];

    // Analyze health indicators
    Object.entries(summary.health).forEach(([component, health]) => {
      if (health.status === 'critical') {
        recommendations.push(`Critical issues detected in ${component} - immediate attention required`);
      } else if (health.status === 'warning') {
        recommendations.push(`Performance degradation in ${component} - investigate and optimize`);
      }
    });

    // Analyze metrics
    if (summary.metrics.testCoverage < 80) {
      recommendations.push('Increase test coverage to ensure reliability');
    }

    if (summary.metrics.averageDivergence > 20) {
      recommendations.push('Address interface divergence to maintain compatibility');
    }

    // Component-specific recommendations
    if (validation && !validation.valid) {
      recommendations.push('Resolve validation issues to ensure interface compatibility');
    }

    if (testing && testing.summary && testing.summary.failedTests > 0) {
      recommendations.push('Fix failing tests to maintain code quality');
    }

    if (monitoring && monitoring.summary && monitoring.summary.criticalIssues > 0) {
      recommendations.push('Address critical monitoring alerts immediately');
    }

    if (recommendations.length === 0) {
      recommendations.push('All systems operating within normal parameters');
    }

    return recommendations;
  }
}