/**
 * MemTech Alert Manager v2.1
 * Sistema de alertas inteligentes para MemTech
 */

import { EventEmitter } from 'events';

export class AlertManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      alertCooldown: options.alertCooldown || 300000, // 5 minutos
      maxAlertsPerMinute: options.maxAlertsPerMinute || 10,
      enableSlack: options.enableSlack || false,
      enableEmail: options.enableEmail || false,
      enableWebhook: options.enableWebhook || false,
      ...options,
    };

    this.alerts = new Map();
    this.alertHistory = [];
    this.alertRules = new Map();
    this.cooldowns = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    console.log('🔧 Inicializando Alert Manager...');

    // Configurar reglas de alerta por defecto
    this.setupDefaultAlertRules();

    // Configurar event listeners
    this.setupEventListeners();

    this.isInitialized = true;
    console.log('✅ Alert Manager inicializado');
  }

  setupDefaultAlertRules() {
    // Regla de alta tasa de errores
    this.addAlertRule('high_error_rate', {
      condition: metrics => {
        const errorRate = this.calculateErrorRate(metrics);
        return errorRate > 10; // Más del 10% de errores
      },
      severity: 'critical',
      message: 'Alta tasa de errores detectada',
      cooldown: 300000, // 5 minutos
    });

    // Regla de baja tasa de éxito
    this.addAlertRule('low_success_rate', {
      condition: metrics => {
        const successRate = this.calculateSuccessRate(metrics);
        return successRate < 50; // Menos del 50% de éxito (más realista)
      },
      severity: 'warning',
      message: 'Baja tasa de éxito detectada',
      cooldown: 600000, // 10 minutos
    });

    // Regla de alto uso de memoria
    this.addAlertRule('high_memory_usage', {
      condition: metrics => {
        return metrics.gauges?.memory_usage > 500; // Más de 500MB
      },
      severity: 'warning',
      message: 'Alto uso de memoria detectado',
      cooldown: 300000, // 5 minutos
    });

    // Regla de cola llena
    this.addAlertRule('queue_full', {
      condition: metrics => {
        return metrics.gauges?.queue_size > 1000; // Más de 1000 items en cola
      },
      severity: 'critical',
      message: 'Cola de procesamiento llena',
      cooldown: 120000, // 2 minutos
    });

    // Regla de throughput bajo
    this.addAlertRule('low_throughput', {
      condition: metrics => {
        return metrics.gauges?.throughput < 0.1; // Menos de 0.1 artifacts/seg (más realista)
      },
      severity: 'warning',
      message: 'Throughput bajo detectado',
      cooldown: 600000, // 10 minutos
    });

    // Regla de tiempo de respuesta alto
    this.addAlertRule('high_response_time', {
      condition: metrics => {
        const avgResponseTime = this.calculateAverageResponseTime(metrics);
        return avgResponseTime > 5000; // Más de 5 segundos
      },
      severity: 'warning',
      message: 'Tiempo de respuesta alto detectado',
      cooldown: 300000, // 5 minutos
    });

    // Regla de conexiones activas altas
    this.addAlertRule('high_active_connections', {
      condition: metrics => {
        return metrics.gauges?.active_connections > 100; // Más de 100 conexiones
      },
      severity: 'warning',
      message: 'Muchas conexiones activas detectadas',
      cooldown: 300000, // 5 minutos
    });
  }

  setupEventListeners() {
    // Escuchar eventos del sistema
    process.on('uncaughtException', error => {
      this.triggerAlert('system_error', {
        severity: 'critical',
        message: 'Excepción no capturada',
        details: { error: error.message, stack: error.stack },
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.triggerAlert('unhandled_rejection', {
        severity: 'critical',
        message: 'Promesa rechazada no manejada',
        details: { reason: reason?.toString(), promise },
      });
    });
  }

  addAlertRule(ruleId, rule) {
    this.alertRules.set(ruleId, {
      id: ruleId,
      condition: rule.condition,
      severity: rule.severity || 'warning',
      message: rule.message,
      cooldown: rule.cooldown || this.config.alertCooldown,
      enabled: rule.enabled !== false,
      ...rule,
    });

    console.log(`📋 Regla de alerta agregada: ${ruleId}`);
  }

  removeAlertRule(ruleId) {
    this.alertRules.delete(ruleId);
    console.log(`🗑️ Regla de alerta removida: ${ruleId}`);
  }

  evaluateMetrics(metrics) {
    if (!this.isInitialized) {
      console.warn('⚠️ Alert Manager no inicializado');
      return;
    }

    const triggeredAlerts = [];

    for (const [ruleId, rule] of this.alertRules.entries()) {
      if (!rule.enabled) continue;

      try {
        if (rule.condition(metrics)) {
          const alert = this.createAlert(ruleId, rule, metrics);
          if (this.shouldTriggerAlert(alert)) {
            this.triggerAlert(ruleId, alert);
            triggeredAlerts.push(alert);
          }
        }
      } catch (error) {
        console.error(`❌ Error evaluando regla de alerta ${ruleId}:`, error);
      }
    }

    return triggeredAlerts;
  }

  createAlert(ruleId, rule, metrics) {
    return {
      id: `${ruleId}_${Date.now()}`,
      rule_id: ruleId,
      severity: rule.severity,
      message: rule.message,
      timestamp: Date.now(),
      metrics: this.extractRelevantMetrics(metrics),
      status: 'active',
    };
  }

  shouldTriggerAlert(alert) {
    const ruleId = alert.rule_id;
    const now = Date.now();

    // Verificar cooldown
    const lastAlert = this.cooldowns.get(ruleId);
    if (lastAlert && now - lastAlert < this.alertRules.get(ruleId).cooldown) {
      return false;
    }

    // Verificar límite de alertas por minuto
    const recentAlerts = this.alertHistory.filter(
      a => a.rule_id === ruleId && now - a.timestamp < 60000
    );

    if (recentAlerts.length >= this.config.maxAlertsPerMinute) {
      return false;
    }

    return true;
  }

  triggerAlert(ruleId, alert) {
    // Actualizar cooldown
    this.cooldowns.set(ruleId, Date.now());

    // Agregar a historial
    this.alertHistory.push(alert);

    // Mantener solo los últimos 1000 alertas
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }

    // Almacenar alerta activa
    this.alerts.set(alert.id, alert);

    // Emitir evento
    this.emit('alert_triggered', alert);

    // Enviar notificaciones
    this.sendNotifications(alert);

    console.log(`🚨 Alerta disparada: ${alert.message} (${alert.severity})`);
  }

  sendNotifications(alert) {
    const notifications = [];

    // Slack notification
    if (this.config.enableSlack) {
      notifications.push(this.sendSlackNotification(alert));
    }

    // Email notification
    if (this.config.enableEmail) {
      notifications.push(this.sendEmailNotification(alert));
    }

    // Webhook notification
    if (this.config.enableWebhook) {
      notifications.push(this.sendWebhookNotification(alert));
    }

    // Ejecutar todas las notificaciones en paralelo
    Promise.allSettled(notifications).then(results => {
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        console.warn(`⚠️ ${failed.length} notificaciones fallaron`);
      }
    });
  }

  async sendSlackNotification(alert) {
    // Implementación básica de Slack
    const message = {
      text: `🚨 *MemTech Alert*`,
      attachments: [
        {
          color: this.getSeverityColor(alert.severity),
          fields: [
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Message', value: alert.message, short: false },
            { title: 'Timestamp', value: new Date(alert.timestamp).toISOString(), short: true },
          ],
        },
      ],
    };

    console.log('📱 Slack notification:', JSON.stringify(message, null, 2));
    return Promise.resolve();
  }

  async sendEmailNotification(alert) {
    // Implementación básica de Email
    const subject = `MemTech Alert: ${alert.message}`;
    const body = `
      Severity: ${alert.severity}
      Message: ${alert.message}
      Timestamp: ${new Date(alert.timestamp).toISOString()}
      Metrics: ${JSON.stringify(alert.metrics, null, 2)}
    `;

    console.log('📧 Email notification:', { subject, body });
    return Promise.resolve();
  }

  async sendWebhookNotification(alert) {
    // Implementación básica de Webhook
    const payload = {
      alert_id: alert.id,
      rule_id: alert.rule_id,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.timestamp,
      metrics: alert.metrics,
    };

    console.log('🔗 Webhook notification:', JSON.stringify(payload, null, 2));
    return Promise.resolve();
  }

  getSeverityColor(severity) {
    const colors = {
      critical: 'danger',
      warning: 'warning',
      info: 'good',
    };
    return colors[severity] || 'good';
  }

  extractRelevantMetrics(metrics) {
    return {
      counters: metrics.counters || {},
      gauges: metrics.gauges || {},
      timestamp: metrics.timestamp || Date.now(),
    };
  }

  // Métodos de cálculo
  calculateErrorRate(metrics) {
    const total = metrics.counters?.total_artifacts_processed || 0;
    const failed = metrics.counters?.failed_artifacts || 0;
    return total > 0 ? (failed / total) * 100 : 0;
  }

  calculateSuccessRate(metrics) {
    const total = metrics.counters?.total_artifacts_processed || 0;
    const successful = metrics.counters?.successful_artifacts || 0;
    return total > 0 ? (successful / total) * 100 : 0;
  }

  calculateAverageResponseTime(metrics) {
    const histograms = metrics.histograms || {};
    const responseTimes = histograms.response_time || [];

    if (!Array.isArray(responseTimes) || responseTimes.length === 0) return 0;

    const sum = responseTimes.reduce((acc, item) => acc + item.value, 0);
    return sum / responseTimes.length;
  }

  // Métodos de consulta
  getActiveAlerts() {
    return Array.from(this.alerts.values()).filter(alert => alert.status === 'active');
  }

  getAlertHistory(limit = 100) {
    return this.alertHistory.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  getAlertsBySeverity(severity) {
    return this.alertHistory.filter(alert => alert.severity === severity);
  }

  getAlertsByTimeRange(startTime, endTime) {
    return this.alertHistory.filter(
      alert => alert.timestamp >= startTime && alert.timestamp <= endTime
    );
  }

  // Métodos de gestión
  acknowledgeAlert(alertId, userId = 'system') {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = 'acknowledged';
      alert.acknowledged_by = userId;
      alert.acknowledged_at = Date.now();

      this.emit('alert_acknowledged', alert);
      console.log(`✅ Alerta ${alertId} reconocida por ${userId}`);
    }
  }

  resolveAlert(alertId, userId = 'system') {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolved_by = userId;
      alert.resolved_at = Date.now();

      this.emit('alert_resolved', alert);
      console.log(`✅ Alerta ${alertId} resuelta por ${userId}`);
    }
  }

  getAlertStats() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    const recentAlerts = this.alertHistory.filter(alert => alert.timestamp > last24h);

    const stats = {
      total_alerts: this.alertHistory.length,
      active_alerts: this.getActiveAlerts().length,
      alerts_24h: recentAlerts.length,
      by_severity: {
        critical: recentAlerts.filter(a => a.severity === 'critical').length,
        warning: recentAlerts.filter(a => a.severity === 'warning').length,
        info: recentAlerts.filter(a => a.severity === 'info').length,
      },
      avg_alerts_per_hour: recentAlerts.length / 24,
      rules_configured: this.alertRules.size,
    };

    return stats;
  }

  async cleanup() {
    this.alerts.clear();
    this.alertHistory = [];
    this.cooldowns.clear();
    this.isInitialized = false;
    console.log('🧹 Alert Manager limpiado');
  }
}

export default AlertManager;
