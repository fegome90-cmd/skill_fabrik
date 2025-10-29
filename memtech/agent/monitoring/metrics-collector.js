/**
 * MemTech Metrics Collector v2.1
 * Recolecta métricas en tiempo real del sistema MemTech
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

export class MetricsCollector extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      collectionInterval: options.collectionInterval || 1000, // 1 segundo
      retentionPeriod: options.retentionPeriod || 3600000, // 1 hora
      maxMetrics: options.maxMetrics || 10000,
      enablePerformance: options.enablePerformance !== false,
      enableMemory: options.enableMemory !== false,
      enableSystem: options.enableSystem !== false,
      ...options,
    };

    this.metrics = {
      performance: new Map(),
      memory: new Map(),
      system: new Map(),
      custom: new Map(),
    };

    this.counters = {
      total_artifacts_processed: 0,
      successful_artifacts: 0,
      failed_artifacts: 0,
      admission_validations: 0,
      routing_decisions: 0,
      store_operations: 0,
      outbox_events: 0,
      errors: 0,
      warnings: 0,
    };

    this.gauges = {
      active_connections: 0,
      queue_size: 0,
      memory_usage: 0,
      cpu_usage: 0,
      response_time: 0,
      throughput: 0,
    };

    this.histograms = {
      processing_time: [],
      memory_usage: [],
      response_time: [],
      queue_processing_time: [],
    };

    this.isCollecting = false;
    this.collectionTimer = null;
    this.startTime = Date.now();
  }

  async initialize() {
    console.log('🔧 Inicializando Metrics Collector...');

    // Configurar event listeners para métricas automáticas
    this.setupEventListeners();

    // Iniciar recolección automática
    this.startCollection();

    console.log('✅ Metrics Collector inicializado');
  }

  setupEventListeners() {
    // Escuchar eventos del sistema MemTech
    process.on('exit', () => this.stopCollection());
    process.on('SIGINT', () => this.stopCollection());
    process.on('SIGTERM', () => this.stopCollection());
  }

  startCollection() {
    if (this.isCollecting) {
      console.log('🔍 Metrics Collector ya está recolectando');
      return;
    }

    this.isCollecting = true;
    this.collectionTimer = setInterval(() => {
      this.collectMetrics();
    }, this.config.collectionInterval);

    console.log(`📊 Recolección de métricas iniciada cada ${this.config.collectionInterval}ms`);
  }

  stopCollection() {
    if (!this.isCollecting) {
      return;
    }

    this.isCollecting = false;
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = null;
    }

    console.log('🛑 Recolección de métricas detenida');
  }

  collectMetrics() {
    const timestamp = Date.now();

    // Métricas de performance
    if (this.config.enablePerformance) {
      this.collectPerformanceMetrics(timestamp);
    }

    // Métricas de memoria
    if (this.config.enableMemory) {
      this.collectMemoryMetrics(timestamp);
    }

    // Métricas del sistema
    if (this.config.enableSystem) {
      this.collectSystemMetrics(timestamp);
    }

    // Limpiar métricas antiguas
    this.cleanupOldMetrics(timestamp);

    // Emitir evento de métricas recolectadas
    this.emit('metrics_collected', {
      timestamp,
      metrics: this.getCurrentMetrics(),
    });
  }

  collectPerformanceMetrics(timestamp) {
    const perfMetrics = {
      timestamp,
      uptime: Date.now() - this.startTime,
      throughput: this.calculateThroughput(),
      avg_processing_time: this.calculateAverageProcessingTime(),
      total_operations: this.counters.total_artifacts_processed,
      success_rate: this.calculateSuccessRate(),
    };

    this.metrics.performance.set(timestamp, perfMetrics);
  }

  collectMemoryMetrics(timestamp) {
    if (!process.memoryUsage) return;

    const memoryInfo = process.memoryUsage();
    const memoryMetrics = {
      timestamp,
      rss: memoryInfo.rss,
      heapTotal: memoryInfo.heapTotal,
      heapUsed: memoryInfo.heapUsed,
      external: memoryInfo.external,
      arrayBuffers: memoryInfo.arrayBuffers,
      memory_usage_mb: Math.round((memoryInfo.heapUsed / 1024 / 1024) * 100) / 100,
    };

    this.metrics.memory.set(timestamp, memoryMetrics);
    this.gauges.memory_usage = memoryMetrics.memory_usage_mb;
  }

  collectSystemMetrics(timestamp) {
    const systemMetrics = {
      timestamp,
      platform: process.platform,
      arch: process.arch,
      node_version: process.version,
      pid: process.pid,
      uptime: process.uptime(),
      active_connections: this.gauges.active_connections,
      queue_size: this.gauges.queue_size,
    };

    this.metrics.system.set(timestamp, systemMetrics);
  }

  // Métodos para registrar eventos específicos
  incrementCounter(counterName, value = 1) {
    if (this.counters.hasOwnProperty(counterName)) {
      this.counters[counterName] += value;
      this.emit('counter_incremented', {
        counter: counterName,
        value,
        total: this.counters[counterName],
      });
    }
  }

  setGauge(gaugeName, value) {
    if (this.gauges.hasOwnProperty(gaugeName)) {
      this.gauges[gaugeName] = value;
      this.emit('gauge_updated', { gauge: gaugeName, value });
    }
  }

  recordHistogram(histogramName, value) {
    if (this.histograms.hasOwnProperty(histogramName)) {
      this.histograms[histogramName].push({
        value,
        timestamp: Date.now(),
      });

      // Mantener solo los últimos valores
      if (this.histograms[histogramName].length > 1000) {
        this.histograms[histogramName] = this.histograms[histogramName].slice(-1000);
      }

      this.emit('histogram_recorded', { histogram: histogramName, value });
    }
  }

  recordCustomMetric(name, value, tags = {}) {
    const timestamp = Date.now();
    const metric = {
      name,
      value,
      tags,
      timestamp,
    };

    if (!this.metrics.custom.has(name)) {
      this.metrics.custom.set(name, []);
    }

    this.metrics.custom.get(name).push(metric);

    // Mantener solo los últimos valores
    const customMetrics = this.metrics.custom.get(name);
    if (customMetrics.length > 100) {
      this.metrics.custom.set(name, customMetrics.slice(-100));
    }

    this.emit('custom_metric_recorded', metric);
  }

  // Métodos de cálculo
  calculateThroughput() {
    const uptime = (Date.now() - this.startTime) / 1000; // en segundos
    return uptime > 0 ? this.counters.total_artifacts_processed / uptime : 0;
  }

  calculateSuccessRate() {
    const total = this.counters.total_artifacts_processed;
    return total > 0 ? (this.counters.successful_artifacts / total) * 100 : 0;
  }

  calculateAverageProcessingTime() {
    const times = this.histograms.processing_time;
    if (times.length === 0) return 0;

    const sum = times.reduce((acc, item) => acc + item.value, 0);
    return sum / times.length;
  }

  // Métodos de consulta
  getCurrentMetrics() {
    return {
      counters: { ...this.counters },
      gauges: { ...this.gauges },
      histograms: this.getHistogramStats(),
      custom: this.getCustomMetrics(),
      timestamp: Date.now(),
    };
  }

  getHistogramStats() {
    const stats = {};

    for (const [name, values] of Object.entries(this.histograms)) {
      if (values.length === 0) {
        stats[name] = { count: 0, min: 0, max: 0, avg: 0, p95: 0, p99: 0 };
        continue;
      }

      const sortedValues = values.map(v => v.value).sort((a, b) => a - b);
      const count = sortedValues.length;
      const min = sortedValues[0];
      const max = sortedValues[count - 1];
      const avg = sortedValues.reduce((sum, val) => sum + val, 0) / count;
      const p95Index = Math.floor(count * 0.95);
      const p99Index = Math.floor(count * 0.99);

      stats[name] = {
        count,
        min,
        max,
        avg: Math.round(avg * 100) / 100,
        p95: sortedValues[p95Index] || 0,
        p99: sortedValues[p99Index] || 0,
      };
    }

    return stats;
  }

  getCustomMetrics() {
    const custom = {};
    for (const [name, metrics] of this.metrics.custom.entries()) {
      custom[name] = metrics.slice(-10); // Últimos 10 valores
    }
    return custom;
  }

  getMetricsByTimeRange(startTime, endTime) {
    const filtered = {
      performance: new Map(),
      memory: new Map(),
      system: new Map(),
      custom: {},
    };

    // Filtrar métricas por rango de tiempo
    for (const [timestamp, metric] of this.metrics.performance.entries()) {
      if (timestamp >= startTime && timestamp <= endTime) {
        filtered.performance.set(timestamp, metric);
      }
    }

    for (const [timestamp, metric] of this.metrics.memory.entries()) {
      if (timestamp >= startTime && timestamp <= endTime) {
        filtered.memory.set(timestamp, metric);
      }
    }

    for (const [timestamp, metric] of this.metrics.system.entries()) {
      if (timestamp >= startTime && timestamp <= endTime) {
        filtered.system.set(timestamp, metric);
      }
    }

    return filtered;
  }

  cleanupOldMetrics(currentTime) {
    const cutoffTime = currentTime - this.config.retentionPeriod;

    // Limpiar métricas antiguas
    for (const metricType of ['performance', 'memory', 'system']) {
      const metricMap = this.metrics[metricType];
      for (const [timestamp] of metricMap.entries()) {
        if (timestamp < cutoffTime) {
          metricMap.delete(timestamp);
        }
      }
    }

    // Limpiar histogramas antiguos
    for (const [name, values] of Object.entries(this.histograms)) {
      this.histograms[name] = values.filter(item => item.timestamp > cutoffTime);
    }
  }

  // Métodos de utilidad para eventos específicos
  recordArtifactProcessed(artifactId, processingTime, success) {
    this.incrementCounter('total_artifacts_processed');

    if (success) {
      this.incrementCounter('successful_artifacts');
    } else {
      this.incrementCounter('failed_artifacts');
    }

    this.recordHistogram('processing_time', processingTime);

    this.emit('artifact_processed', {
      artifact_id: artifactId,
      processing_time: processingTime,
      success,
      timestamp: Date.now(),
    });
  }

  recordAdmissionValidation(artifactId, success, validationTime) {
    this.incrementCounter('admission_validations');
    this.recordHistogram('response_time', validationTime);

    this.emit('admission_validated', {
      artifact_id: artifactId,
      success,
      validation_time: validationTime,
      timestamp: Date.now(),
    });
  }

  recordRoutingDecision(artifactId, decision, routingTime) {
    this.incrementCounter('routing_decisions');
    this.recordHistogram('response_time', routingTime);

    this.emit('routing_decided', {
      artifact_id: artifactId,
      decision,
      routing_time: routingTime,
      timestamp: Date.now(),
    });
  }

  recordStoreOperation(storeName, operation, success, operationTime) {
    this.incrementCounter('store_operations');
    this.recordHistogram('response_time', operationTime);

    this.emit('store_operation', {
      store: storeName,
      operation,
      success,
      operation_time: operationTime,
      timestamp: Date.now(),
    });
  }

  recordError(error, context = {}) {
    this.incrementCounter('errors');

    this.emit('error_recorded', {
      error: error.message || error,
      context,
      timestamp: Date.now(),
    });
  }

  recordWarning(warning, context = {}) {
    this.incrementCounter('warnings');

    this.emit('warning_recorded', {
      warning,
      context,
      timestamp: Date.now(),
    });
  }

  // Método para obtener resumen de salud del sistema
  getHealthSummary() {
    const metrics = this.getCurrentMetrics();
    const uptime = Date.now() - this.startTime;

    return {
      status: this.determineSystemStatus(),
      uptime: Math.round(uptime / 1000),
      throughput: metrics.gauges.throughput,
      success_rate: this.calculateSuccessRate(),
      memory_usage: metrics.gauges.memory_usage,
      error_rate: this.calculateErrorRate(),
      active_connections: metrics.gauges.active_connections,
      queue_size: metrics.gauges.queue_size,
      timestamp: Date.now(),
    };
  }

  determineSystemStatus() {
    const successRate = this.calculateSuccessRate();
    const errorRate = this.calculateErrorRate();
    const memoryUsage = this.gauges.memory_usage;
    const totalProcessed = this.counters.total_artifacts_processed;

    // Si no hay datos procesados, el sistema está en estado inicial (ok)
    if (totalProcessed === 0) {
      return 'ok';
    }

    // Umbrales más realistas para un sistema de desarrollo
    if (successRate < 50 || errorRate > 50 || memoryUsage > 2000) {
      return 'critical';
    } else if (successRate < 70 || errorRate > 30 || memoryUsage > 1000) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  calculateErrorRate() {
    const total = this.counters.total_artifacts_processed;
    return total > 0 ? (this.counters.failed_artifacts / total) * 100 : 0;
  }

  async cleanup() {
    this.stopCollection();
    this.metrics = {
      performance: new Map(),
      memory: new Map(),
      system: new Map(),
      custom: new Map(),
    };
    console.log('🧹 Metrics Collector limpiado');
  }
}

export default MetricsCollector;
