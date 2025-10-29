/**
 * MemTech Monitoring System v2.1
 * Sistema de monitoreo integrado para MemTech
 */

import { EventEmitter } from 'events';
import { MetricsCollector } from './metrics-collector.js';
import { AlertManager } from './alert-manager.js';
import { DashboardGenerator } from './dashboard-generator.js';

export class MonitoringSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      enableMetrics: options.enableMetrics !== false,
      enableAlerts: options.enableAlerts !== false,
      enableDashboard: options.enableDashboard !== false,
      metricsInterval: options.metricsInterval || 1000,
      dashboardInterval: options.dashboardInterval || 5000,
      ...options,
    };

    this.components = {
      metrics: null,
      alerts: null,
      dashboard: null,
    };

    this.isInitialized = false;
    this.isRunning = false;
  }

  async initialize() {
    console.log('🔧 Inicializando Monitoring System...');

    try {
      // Inicializar Metrics Collector
      if (this.config.enableMetrics) {
        this.components.metrics = new MetricsCollector({
          collectionInterval: this.config.metricsInterval,
        });
        await this.components.metrics.initialize();
        this.setupMetricsListeners();
        console.log('✅ Metrics Collector inicializado');
      }

      // Inicializar Alert Manager
      if (this.config.enableAlerts) {
        this.components.alerts = new AlertManager();
        await this.components.alerts.initialize();
        this.setupAlertListeners();
        console.log('✅ Alert Manager inicializado');
      }

      // Inicializar Dashboard Generator
      if (this.config.enableDashboard) {
        this.components.dashboard = new DashboardGenerator({
          updateInterval: this.config.dashboardInterval,
        });
        await this.components.dashboard.initialize();
        this.setupDashboardListeners();
        console.log('✅ Dashboard Generator inicializado');
      }

      this.isInitialized = true;
      console.log('✅ Monitoring System inicializado');
    } catch (error) {
      console.error('❌ Error inicializando Monitoring System:', error);
      this.emit('error', { type: 'initialization', error });
      throw error;
    }
  }

  setupMetricsListeners() {
    if (!this.components.metrics) return;

    this.components.metrics.on('metrics_collected', data => {
      this.emit('metrics_collected', data);

      // Evaluar alertas si está habilitado
      if (this.components.alerts) {
        this.components.alerts.evaluateMetrics(data.metrics);
      }
    });

    this.components.metrics.on('artifact_processed', data => {
      this.emit('artifact_processed', data);
    });

    this.components.metrics.on('error_recorded', data => {
      this.emit('error_recorded', data);
    });

    // Manejar errores no capturados de forma más suave
    this.components.metrics.on('error', error => {
      console.warn('⚠️ Error en Metrics Collector:', error.message);
      // No emitir como error crítico, solo como warning
      this.recordWarning(`Metrics error: ${error.message}`, {
        component: 'metrics_collector',
        timestamp: Date.now(),
      });
    });
  }

  setupAlertListeners() {
    if (!this.components.alerts) return;

    this.components.alerts.on('alert_triggered', alert => {
      this.emit('alert_triggered', alert);
      console.log(`🚨 Alerta disparada: ${alert.message} (${alert.severity})`);
    });

    this.components.alerts.on('alert_acknowledged', alert => {
      this.emit('alert_acknowledged', alert);
    });

    this.components.alerts.on('alert_resolved', alert => {
      this.emit('alert_resolved', alert);
    });
  }

  setupDashboardListeners() {
    if (!this.components.dashboard) return;

    this.components.dashboard.on('dashboard_generated', data => {
      this.emit('dashboard_generated', data);
    });

    this.components.dashboard.on('error', error => {
      this.emit('dashboard_error', error);
    });
  }

  async start() {
    if (!this.isInitialized) {
      throw new Error('Monitoring System no inicializado. Llame a initialize() primero.');
    }

    if (this.isRunning) {
      console.log('🔍 Monitoring System ya está ejecutándose');
      return;
    }

    this.isRunning = true;
    this.emit('started');

    // Iniciar generación de dashboards con métricas en tiempo real
    if (this.components.dashboard && this.components.metrics) {
      this.startDashboardGeneration();
    }

    console.log('🚀 Monitoring System iniciado');
  }

  async stop() {
    if (!this.isRunning) {
      console.log('🔍 Monitoring System no está ejecutándose');
      return;
    }

    this.isRunning = false;
    this.emit('stopped');

    console.log('🛑 Monitoring System detenido');
  }

  startDashboardGeneration() {
    if (!this.components.dashboard || !this.components.metrics) return;

    // Generar dashboard inicial
    this.generateDashboard();

    // Configurar generación periódica (cada 30 segundos)
    setInterval(() => {
      if (this.isRunning) {
        this.generateDashboard();
      }
    }, this.config.dashboardInterval || 30000);
  }

  async generateDashboard() {
    if (!this.components.dashboard) return;

    try {
      let metrics = null;

      // Obtener métricas actuales si está disponible
      if (this.components.metrics) {
        metrics = this.components.metrics.getCurrentMetrics();
      }

      await this.components.dashboard.generateDashboards(metrics);
    } catch (error) {
      console.error('❌ Error generando dashboard:', error);
      this.emit('error', { type: 'dashboard_generation', error });
    }
  }

  // Métodos de conveniencia para registrar eventos
  recordArtifactProcessed(artifactId, processingTime, success) {
    if (this.components.metrics) {
      this.components.metrics.recordArtifactProcessed(artifactId, processingTime, success);
    }
  }

  recordAdmissionValidation(artifactId, success, validationTime) {
    if (this.components.metrics) {
      this.components.metrics.recordAdmissionValidation(artifactId, success, validationTime);
    }
  }

  recordRoutingDecision(artifactId, decision, routingTime) {
    if (this.components.metrics) {
      this.components.metrics.recordRoutingDecision(artifactId, decision, routingTime);
    }
  }

  recordStoreOperation(storeName, operation, success, operationTime) {
    if (this.components.metrics) {
      this.components.metrics.recordStoreOperation(storeName, operation, success, operationTime);
    }
  }

  recordError(error, context = {}) {
    if (this.components.metrics) {
      this.components.metrics.recordError(error, context);
    }
  }

  recordWarning(warning, context = {}) {
    if (this.components.metrics) {
      this.components.metrics.recordWarning(warning, context);
    }
  }

  // Métodos de consulta
  getCurrentMetrics() {
    if (this.components.metrics) {
      return this.components.metrics.getCurrentMetrics();
    }
    return null;
  }

  getHealthSummary() {
    if (this.components.metrics) {
      return this.components.metrics.getHealthSummary();
    }
    return null;
  }

  getActiveAlerts() {
    if (this.components.alerts) {
      return this.components.alerts.getActiveAlerts();
    }
    return [];
  }

  getAlertStats() {
    if (this.components.alerts) {
      return this.components.alerts.getAlertStats();
    }
    return null;
  }

  // Métodos de gestión de alertas
  acknowledgeAlert(alertId, userId = 'system') {
    if (this.components.alerts) {
      this.components.alerts.acknowledgeAlert(alertId, userId);
    }
  }

  resolveAlert(alertId, userId = 'system') {
    if (this.components.alerts) {
      this.components.alerts.resolveAlert(alertId, userId);
    }
  }

  // Métodos de configuración
  addAlertRule(ruleId, rule) {
    if (this.components.alerts) {
      this.components.alerts.addAlertRule(ruleId, rule);
    }
  }

  removeAlertRule(ruleId) {
    if (this.components.alerts) {
      this.components.alerts.removeAlertRule(ruleId);
    }
  }

  // Método para obtener resumen completo del sistema
  getSystemSummary() {
    const summary = {
      status: this.isRunning ? 'running' : 'stopped',
      initialized: this.isInitialized,
      components: {
        metrics: !!this.components.metrics,
        alerts: !!this.components.alerts,
        dashboard: !!this.components.dashboard,
      },
      timestamp: Date.now(),
    };

    // Agregar métricas si están disponibles
    if (this.components.metrics) {
      summary.metrics = this.components.metrics.getCurrentMetrics();
      summary.health = this.components.metrics.getHealthSummary();
    }

    // Agregar alertas si están disponibles
    if (this.components.alerts) {
      summary.alerts = {
        active: this.components.alerts.getActiveAlerts(),
        stats: this.components.alerts.getAlertStats(),
      };
    }

    return summary;
  }

  // Método para generar reporte de estado
  generateStatusReport() {
    const summary = this.getSystemSummary();
    const report = {
      timestamp: new Date().toISOString(),
      system: {
        status: summary.status,
        uptime: summary.health?.uptime || 0,
        version: '2.1.0',
      },
      performance: summary.metrics
        ? {
            throughput: summary.metrics.gauges?.throughput || 0,
            success_rate: this.calculateSuccessRate(summary.metrics),
            error_rate: this.calculateErrorRate(summary.metrics),
            memory_usage: summary.metrics.gauges?.memory_usage || 0,
          }
        : null,
      alerts: summary.alerts
        ? {
            active_count: summary.alerts.active.length,
            total_24h: summary.alerts.stats?.alerts_24h || 0,
            by_severity: summary.alerts.stats?.by_severity || {},
          }
        : null,
      recommendations: this.generateRecommendations(summary),
    };

    return report;
  }

  calculateSuccessRate(metrics) {
    const total = metrics.counters?.total_artifacts_processed || 0;
    const successful = metrics.counters?.successful_artifacts || 0;
    return total > 0 ? Math.round((successful / total) * 100 * 100) / 100 : 0;
  }

  calculateErrorRate(metrics) {
    const total = metrics.counters?.total_artifacts_processed || 0;
    const failed = metrics.counters?.failed_artifacts || 0;
    return total > 0 ? Math.round((failed / total) * 100 * 100) / 100 : 0;
  }

  generateRecommendations(summary) {
    const recommendations = [];

    if (summary.health?.status === 'critical') {
      recommendations.push('Sistema en estado crítico - revisar logs inmediatamente');
    }

    if (summary.health?.status === 'warning') {
      recommendations.push('Sistema en estado de advertencia - monitorear de cerca');
    }

    if (summary.metrics?.gauges?.memory_usage > 500) {
      recommendations.push('Alto uso de memoria - considerar optimización');
    }

    if (summary.metrics?.gauges?.queue_size > 100) {
      recommendations.push('Cola de procesamiento creciendo - revisar throughput');
    }

    if (summary.alerts?.active_count > 5) {
      recommendations.push('Muchas alertas activas - revisar configuración del sistema');
    }

    if (recommendations.length === 0) {
      recommendations.push('Sistema funcionando correctamente');
    }

    return recommendations;
  }

  async cleanup() {
    console.log('🧹 Limpiando Monitoring System...');

    // Detener sistema
    await this.stop();

    // Limpiar componentes
    if (this.components.metrics) {
      await this.components.metrics.cleanup();
    }

    if (this.components.alerts) {
      await this.components.alerts.cleanup();
    }

    if (this.components.dashboard) {
      await this.components.dashboard.cleanup();
    }

    this.components = {
      metrics: null,
      alerts: null,
      dashboard: null,
    };

    this.isInitialized = false;
    this.isRunning = false;

    console.log('✅ Monitoring System limpiado');
  }
}

export default MonitoringSystem;
