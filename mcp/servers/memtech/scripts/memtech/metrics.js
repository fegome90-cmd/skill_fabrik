/**
 * MemTech Metrics Module
 *
 * Módulo para generación y exposición de métricas Prometheus
 * Métricas de rendimiento, utilización y salud del sistema de memoria
 */

import fs from 'fs/promises';
import yaml from 'js-yaml';
import winston from 'winston';
import process from 'process';
import { setInterval } from 'timers';

// Configuración del logger
const logger = winston.createLogger({
  level: process?.env?.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

class MetricsManager {
  constructor(config = {}) {
    this.config = {
      port: config.port || 9090,
      endpoint: config.endpoint || '/metrics',
      namespace: config.namespace || 'memtech',
      subsystem: config.subsystem || 'memory',
      ...config,
    };

    this.metrics = {
      // Métricas de capas
      layer_items_total: new Map(),
      layer_size_bytes: new Map(),
      layer_utilization_ratio: new Map(),

      // Métricas de rendimiento
      operation_duration_seconds: new Map(),
      operation_errors_total: new Map(),
      operation_success_total: new Map(),

      // Métricas de router
      router_cache_size: 0,
      router_cache_hit_ratio: 0,
      router_request_duration_seconds: new Map(),

      // Métricas de salud
      system_health: 1,
      last_operation_timestamp: 0,

      // Métricas de procesamiento
      items_processed_total: new Map(),
      processing_queue_size: 0,
    };

    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      logger.info('Initializing Metrics Manager...');

      // Cargar configuración
      await this.loadConfig();

      // Inicializar métricas
      await this.initializeMetrics();

      // Inicializar servidor HTTP para métricas
      await this.initializeMetricsServer();

      this.initialized = true;
      logger.info('Metrics Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Metrics Manager:', error);
      throw error;
    }
  }

  async loadConfig() {
    try {
      const configPath = '.memtech/config.yaml';
      const configData = await fs.readFile(configPath, 'utf8');
      const config = yaml.load(configData);

      // Actualizar configuración con valores del archivo
      if (config.metrics) {
        this.config = {
          ...this.config,
          ...config.metrics,
        };
      }

      logger.info('Metrics configuration loaded successfully');
    } catch (error) {
      logger.warn('Failed to load metrics configuration, using defaults:', error);
    }
  }

  async initializeMetrics() {
    // Inicializar métricas de capas
    const layers = ['L0', 'L1', 'L2', 'L3'];

    for (const layer of layers) {
      this.metrics.layer_items_total.set(layer, 0);
      this.metrics.layer_size_bytes.set(layer, 0);
      this.metrics.layer_utilization_ratio.set(layer, 0);
      this.metrics.items_processed_total.set(layer, 0);
    }

    // Inicializar métricas de operaciones
    const operations = [
      'classification',
      'anchor_extraction',
      'distillation',
      'vectorization',
      'relations_building',
      'router_warmup',
      'promotion',
      'demotion',
      'prune',
    ];

    for (const operation of operations) {
      this.metrics.operation_duration_seconds.set(operation, 0);
      this.metrics.operation_errors_total.set(operation, 0);
      this.metrics.operation_success_total.set(operation, 0);
    }

    logger.info('Metrics initialized successfully');
  }

  async initializeMetricsServer() {
    if (!this.config.prometheus?.enabled) {
      logger.info('Prometheus metrics disabled');
      return;
    }

    try {
      // En una implementación real, esto inicializaría un servidor HTTP
      // Para esta simulación, solo registramos que se inicializaría
      logger.info(`Metrics server would be initialized on port ${this.config.port}`);
      logger.info(`Metrics endpoint: ${this.config.endpoint}`);
    } catch (error) {
      logger.error('Failed to initialize metrics server:', error);
      throw error;
    }
  }

  async updateLayerMetrics(layerName, metrics) {
    if (!this.metrics.layer_items_total.has(layerName)) {
      logger.warn(`Unknown layer: ${layerName}`);
      return;
    }

    // Actualizar métricas de capa
    this.metrics.layer_items_total.set(layerName, metrics.count || 0);
    this.metrics.layer_size_bytes.set(layerName, Math.floor((metrics.size_mb || 0) * 1024 * 1024));

    // Calcular utilización
    const layerConfig = await this.getLayerConfig(layerName);
    if (layerConfig) {
      const utilization = metrics.count / layerConfig.max_items;
      this.metrics.layer_utilization_ratio.set(layerName, utilization);
    }

    logger.debug(`Updated metrics for layer ${layerName}`);
  }

  async getLayerConfig(layerName) {
    try {
      const configPath = '.memtech/config.yaml';
      const configData = await fs.readFile(configPath, 'utf8');
      const config = yaml.load(configData);

      return config.layers[layerName] || null;
    } catch (error) {
      logger.warn(`Failed to get layer config for ${layerName}:`, error);
      return null;
    }
  }

  recordOperation(operation, duration, success = true) {
    // Registrar duración
    const currentDuration = this.metrics.operation_duration_seconds.get(operation) || 0;
    this.metrics.operation_duration_seconds.set(operation, currentDuration + duration);

    // Registrar éxito o error
    if (success) {
      const currentSuccess = this.metrics.operation_success_total.get(operation) || 0;
      this.metrics.operation_success_total.set(operation, currentSuccess + 1);
    } else {
      const currentErrors = this.metrics.operation_errors_total.get(operation) || 0;
      this.metrics.operation_errors_total.set(operation, currentErrors + 1);
    }

    // Actualizar timestamp de última operación
    this.metrics.last_operation_timestamp = Date.now() / 1000;

    logger.debug(`Recorded operation: ${operation}, duration: ${duration}s, success: ${success}`);
  }

  updateRouterMetrics(metrics) {
    this.metrics.router_cache_size = metrics.cache_items_loaded || 0;
    this.metrics.router_cache_hit_ratio = metrics.cache_hit_ratio || 0;

    logger.debug('Updated router metrics');
  }

  updateHealthStatus(healthy) {
    this.metrics.system_health = healthy ? 1 : 0;

    logger.debug(`Updated health status: ${healthy ? 'healthy' : 'unhealthy'}`);
  }

  updateProcessingQueueSize(size) {
    this.metrics.processing_queue_size = size;

    logger.debug(`Updated processing queue size: ${size}`);
  }

  incrementItemsProcessed(layer, count = 1) {
    const current = this.metrics.items_processed_total.get(layer) || 0;
    this.metrics.items_processed_total.set(layer, current + count);

    logger.debug(`Incremented processed items for layer ${layer}: ${count}`);
  }

  async generateMetricsOutput() {
    const timestamp = Date.now() / 1000;
    let output = '';

    // Generar métricas de capas
    output += this.generateLayerMetrics(timestamp);

    // Generar métricas de operaciones
    output += this.generateOperationMetrics(timestamp);

    // Generar métricas de router
    output += this.generateRouterMetrics(timestamp);

    // Generar métricas de salud
    output += this.generateHealthMetrics(timestamp);

    // Generar métricas de procesamiento
    output += this.generateProcessingMetrics(timestamp);

    return output;
  }

  generateLayerMetrics(timestamp) {
    let output = '';

    for (const [layer, count] of this.metrics.layer_items_total) {
      output += `# HELP ${this.config.namespace}_layer_items_total Number of items in memory layer\n`;
      output += `# TYPE ${this.config.namespace}_layer_items_total gauge\n`;
      output += `${this.config.namespace}_layer_items_total{layer="${layer}"} ${count} ${timestamp}\n`;
    }

    for (const [layer, sizeBytes] of this.metrics.layer_size_bytes) {
      output += `# HELP ${this.config.namespace}_layer_size_bytes Total size of items in memory layer\n`;
      output += `# TYPE ${this.config.namespace}_layer_size_bytes gauge\n`;
      output += `${this.config.namespace}_layer_size_bytes{layer="${layer}"} ${sizeBytes} ${timestamp}\n`;
    }

    for (const [layer, utilization] of this.metrics.layer_utilization_ratio) {
      output += `# HELP ${this.config.namespace}_layer_utilization_ratio Utilization ratio of memory layer\n`;
      output += `# TYPE ${this.config.namespace}_layer_utilization_ratio gauge\n`;
      output += `${this.config.namespace}_layer_utilization_ratio{layer="${layer}"} ${utilization} ${timestamp}\n`;
    }

    return output;
  }

  generateOperationMetrics(timestamp) {
    let output = '';

    for (const [operation, duration] of this.metrics.operation_duration_seconds) {
      output += `# HELP ${this.config.namespace}_operation_duration_seconds_total Total duration of operations\n`;
      output += `# TYPE ${this.config.namespace}_operation_duration_seconds_total counter\n`;
      output += `${this.config.namespace}_operation_duration_seconds_total{operation="${operation}"} ${duration} ${timestamp}\n`;
    }

    for (const [operation, success] of this.metrics.operation_success_total) {
      output += `# HELP ${this.config.namespace}_operation_success_total Total successful operations\n`;
      output += `# TYPE ${this.config.namespace}_operation_success_total counter\n`;
      output += `${this.config.namespace}_operation_success_total{operation="${operation}"} ${success} ${timestamp}\n`;
    }

    for (const [operation, errors] of this.metrics.operation_errors_total) {
      output += `# HELP ${this.config.namespace}_operation_errors_total Total failed operations\n`;
      output += `# TYPE ${this.config.namespace}_operation_errors_total counter\n`;
      output += `${this.config.namespace}_operation_errors_total{operation="${operation}"} ${errors} ${timestamp}\n`;
    }

    return output;
  }

  generateRouterMetrics(timestamp) {
    let output = '';

    output += `# HELP ${this.config.namespace}_router_cache_size Number of items in router cache\n`;
    output += `# TYPE ${this.config.namespace}_router_cache_size gauge\n`;
    output += `${this.config.namespace}_router_cache_size ${this.metrics.router_cache_size} ${timestamp}\n`;

    output += `# HELP ${this.config.namespace}_router_cache_hit_ratio Router cache hit ratio\n`;
    output += `# TYPE ${this.config.namespace}_router_cache_hit_ratio gauge\n`;
    output += `${this.config.namespace}_router_cache_hit_ratio ${this.metrics.router_cache_hit_ratio} ${timestamp}\n`;

    return output;
  }

  generateHealthMetrics(timestamp) {
    let output = '';

    output += `# HELP ${this.config.namespace}_system_health Overall system health status\n`;
    output += `# TYPE ${this.config.namespace}_system_health gauge\n`;
    output += `${this.config.namespace}_system_health ${this.metrics.system_health} ${timestamp}\n`;

    output += `# HELP ${this.config.namespace}_last_operation_timestamp_seconds Timestamp of last operation\n`;
    output += `# TYPE ${this.config.namespace}_last_operation_timestamp_seconds gauge\n`;
    output += `${this.config.namespace}_last_operation_timestamp_seconds ${this.metrics.last_operation_timestamp} ${timestamp}\n`;

    return output;
  }

  generateProcessingMetrics(timestamp) {
    let output = '';

    output += `# HELP ${this.config.namespace}_processing_queue_size Current processing queue size\n`;
    output += `# TYPE ${this.config.namespace}_processing_queue_size gauge\n`;
    output += `${this.config.namespace}_processing_queue_size ${this.metrics.processing_queue_size} ${timestamp}\n`;

    for (const [layer, count] of this.metrics.items_processed_total) {
      output += `# HELP ${this.config.namespace}_items_processed_total Total items processed\n`;
      output += `# TYPE ${this.config.namespace}_items_processed_total counter\n`;
      output += `${this.config.namespace}_items_processed_total{layer="${layer}"} ${count} ${timestamp}\n`;
    }

    return output;
  }

  async collectMetrics() {
    try {
      logger.info('Collecting metrics from system components...');

      // Actualizar métricas de capas desde manifest
      await this.updateMetricsFromManifest();

      // Actualizar métricas de router desde cache
      await this.updateMetricsFromRouterCache();

      // Actualizar métricas de salud
      await this.updateHealthMetrics();

      logger.info('Metrics collection completed');
    } catch (error) {
      logger.error('Error collecting metrics:', error);
    }
  }

  async updateMetricsFromManifest() {
    try {
      const manifestPath = '.memtech/manifests/manifest_latest.json';
      const manifestData = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestData);

      for (const [layerName, layerData] of Object.entries(manifest.layers)) {
        await this.updateLayerMetrics(layerName, layerData);
      }

      logger.debug('Updated metrics from manifest');
    } catch (error) {
      logger.warn('Failed to update metrics from manifest:', error);
    }
  }

  async updateMetricsFromRouterCache() {
    try {
      const routerCachePath = '.memtech/router.cache.json';
      const routerCacheData = await fs.readFile(routerCachePath, 'utf8');
      const routerCache = JSON.parse(routerCacheData);

      this.updateRouterMetrics(routerCache.metadata || {});

      logger.debug('Updated metrics from router cache');
    } catch (error) {
      logger.warn('Failed to update metrics from router cache:', error);
    }
  }

  async updateHealthMetrics() {
    try {
      // Verificar salud básica del sistema
      let healthy = true;

      // Verificar que los archivos clave existan
      const keyFiles = [
        '.memtech/config.yaml',
        '.memtech/manifests/manifest_latest.json',
        '.memtech/router.cache.json',
      ];

      for (const filePath of keyFiles) {
        try {
          await fs.access(filePath);
        } catch (error) {
          logger.warn(`Key file missing: ${filePath}`);
          healthy = false;
        }
      }

      // Verificar que no haya errores recientes
      const recentErrors = await this.checkRecentErrors();
      if (recentErrors > 5) {
        logger.warn(`High number of recent errors: ${recentErrors}`);
        healthy = false;
      }

      this.updateHealthStatus(healthy);
      logger.debug('Updated health metrics');
    } catch (error) {
      logger.warn('Failed to update health metrics:', error);
      this.updateHealthStatus(false);
    }
  }

  async checkRecentErrors() {
    try {
      // Contar errores en los últimos reports
      const operations = [
        'classification',
        'anchor_extraction',
        'distillation',
        'vectorization',
        'relations_building',
        'router_warmup',
      ];
      let totalErrors = 0;

      for (const operation of operations) {
        try {
          const reportPath = `.memtech/reports/${operation}_report_latest.json`;
          const reportData = await fs.readFile(reportPath, 'utf8');
          const report = JSON.parse(reportData);

          const errors =
            report.summary?.classification_errors ||
            report.summary?.extraction_errors ||
            report.summary?.distillation_errors ||
            report.summary?.vectorization_errors ||
            report.summary?.relation_errors ||
            0;

          totalErrors += errors;
        } catch (error) {
          // Ignorar errores al leer reports
        }
      }

      return totalErrors;
    } catch (error) {
      logger.warn('Failed to check recent errors:', error);
      return 0;
    }
  }

  async exposeMetrics() {
    try {
      // Recopilar métricas actualizadas
      await this.collectMetrics();

      // Generar salida de métricas
      const metricsOutput = await this.generateMetricsOutput();

      // En una implementación real, esto serviría las métricas via HTTP
      // Para esta simulación, guardamos en un archivo
      const metricsPath = '.memtech/metrics/prometheus_latest.metrics';
      await fs.writeFile(metricsPath, metricsOutput);

      logger.info(`Metrics exposed to: ${metricsPath}`);
      return metricsOutput;
    } catch (error) {
      logger.error('Error exposing metrics:', error);
      throw error;
    }
  }

  async startMetricsCollection(intervalMs = 60000) {
    logger.info(`Starting metrics collection with interval: ${intervalMs}ms`);

    // Configurar colección periódica
    setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.exposeMetrics();
      } catch (error) {
        logger.error('Error in periodic metrics collection:', error);
      }
    }, intervalMs);

    // Ejecutar colección inicial
    await this.collectMetrics();
    await this.exposeMetrics();
  }
}

export default MetricsManager;
