/**
 * Sistema de Monitoreo Avanzado
 * Sprint 15 - MemTech Agent
 * Monitoreo en tiempo real con alertas inteligentes
 */

class AdvancedMonitor {
  constructor() {
    this.metrics = new Map();
    this.alerts = new Map();
    this.thresholds = {
      memory: { warning: 80, critical: 90 },
      cpu: { warning: 70, critical: 85 },
      response_time: { warning: 200, critical: 500 },
      error_rate: { warning: 1, critical: 5 },
    };
    this.isRunning = false;
  }

  start() {
    console.log('🛡️ MEMTECH AGENT - Iniciando monitoreo avanzado...');
    this.isRunning = true;
    this.collectMetrics();
    this.checkAlerts();
    console.log('✅ Monitoreo avanzado iniciado');
  }

  stop() {
    console.log('🛡️ MEMTECH AGENT - Deteniendo monitoreo avanzado...');
    this.isRunning = false;
    console.log('✅ Monitoreo avanzado detenido');
  }

  collectMetrics() {
    if (!this.isRunning) return;

    const metrics = {
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cpu: process.cpuUsage(),
      response_time: this.getResponseTime(),
      error_rate: this.getErrorRate(),
    };

    this.metrics.set(Date.now(), metrics);
    console.log('📊 Métricas recolectadas:', metrics.timestamp);

    // Limpiar métricas antiguas (mantener solo últimas 100)
    if (this.metrics.size > 100) {
      const oldestKey = Math.min(...this.metrics.keys());
      this.metrics.delete(oldestKey);
    }

    setTimeout(() => this.collectMetrics(), 5000); // Cada 5 segundos
  }

  checkAlerts() {
    if (!this.isRunning) return;

    const latestMetrics = this.getLatestMetrics();
    if (!latestMetrics) {
      setTimeout(() => this.checkAlerts(), 10000);
      return;
    }

    this.checkMemoryAlert(latestMetrics);
    this.checkCpuAlert(latestMetrics);
    this.checkResponseTimeAlert(latestMetrics);
    this.checkErrorRateAlert(latestMetrics);

    setTimeout(() => this.checkAlerts(), 10000); // Cada 10 segundos
  }

  checkMemoryAlert(metrics) {
    const memoryUsage = (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100;

    if (memoryUsage >= this.thresholds.memory.critical) {
      this.triggerAlert('CRITICAL', 'Memory usage critical', { usage: memoryUsage });
    } else if (memoryUsage >= this.thresholds.memory.warning) {
      this.triggerAlert('WARNING', 'Memory usage high', { usage: memoryUsage });
    }
  }

  checkCpuAlert(metrics) {
    const cpuUsage = metrics.cpu.user / 1000000; // Convertir a segundos

    if (cpuUsage >= this.thresholds.cpu.critical) {
      this.triggerAlert('CRITICAL', 'CPU usage critical', { usage: cpuUsage });
    } else if (cpuUsage >= this.thresholds.cpu.warning) {
      this.triggerAlert('WARNING', 'CPU usage high', { usage: cpuUsage });
    }
  }

  checkResponseTimeAlert(metrics) {
    if (metrics.response_time >= this.thresholds.response_time.critical) {
      this.triggerAlert('CRITICAL', 'Response time critical', { time: metrics.response_time });
    } else if (metrics.response_time >= this.thresholds.response_time.warning) {
      this.triggerAlert('WARNING', 'Response time high', { time: metrics.response_time });
    }
  }

  checkErrorRateAlert(metrics) {
    if (metrics.error_rate >= this.thresholds.error_rate.critical) {
      this.triggerAlert('CRITICAL', 'Error rate critical', { rate: metrics.error_rate });
    } else if (metrics.error_rate >= this.thresholds.error_rate.warning) {
      this.triggerAlert('WARNING', 'Error rate high', { rate: metrics.error_rate });
    }
  }

  triggerAlert(level, message, data) {
    const alert = {
      id: Date.now(),
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    this.alerts.set(alert.id, alert);
    console.log(`🚨 ALERTA ${level}: ${message}`, data);

    // Limpiar alertas antiguas (mantener solo últimas 50)
    if (this.alerts.size > 50) {
      const oldestKey = Math.min(...this.alerts.keys());
      this.alerts.delete(oldestKey);
    }
  }

  getLatestMetrics() {
    if (this.metrics.size === 0) return null;
    const latestKey = Math.max(...this.metrics.keys());
    return this.metrics.get(latestKey);
  }

  getResponseTime() {
    // Simular tiempo de respuesta (en producción sería real)
    return Math.random() * 100 + 50; // 50-150ms
  }

  getErrorRate() {
    // Simular tasa de error (en producción sería real)
    return Math.random() * 2; // 0-2%
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      metricsCount: this.metrics.size,
      alertsCount: this.alerts.size,
      latestMetrics: this.getLatestMetrics(),
      recentAlerts: Array.from(this.alerts.values()).slice(-5),
    };
  }
}

export default AdvancedMonitor;
