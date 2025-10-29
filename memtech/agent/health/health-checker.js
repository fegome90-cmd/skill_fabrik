/**
 * MemTech Agent - Health Checker
 * Sistema de health checks para el MemTech Agent
 * T1.5 - Arquitectura del MemTech Agent
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class HealthChecker extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      enabled: options.enabled !== false,
      interval: options.interval || 10000,
      timeout: options.timeout || 5000,
      retries: options.retries || 3,
      retryDelay: options.retryDelay || 1000,
      ...options,
    };

    this.checks = new Map();
    this.results = new Map();
    this.isRunning = false;
    this.intervalId = null;
    this.isInitialized = false;
  }

  /**
   * Inicializar el sistema de health checks
   */
  async initialize() {
    try {
      console.log('🏥 Inicializando sistema de health checks...');

      // Registrar checks por defecto
      this.registerDefaultChecks();

      // Configurar eventos
      this.setupEventHandlers();

      this.isInitialized = true;
      console.log('✅ Sistema de health checks inicializado');

      this.emit('initialized');
    } catch (error) {
      console.error('❌ Error inicializando sistema de health checks:', error);
      this.emit('error', { type: 'initialization', error });
      throw error;
    }
  }

  /**
   * Registrar checks por defecto
   */
  registerDefaultChecks() {
    // Check de memoria
    this.registerCheck('memory', {
      name: 'Memory Health',
      description: 'Verificar estado de memoria del sistema',
      critical: true,
      execute: this.checkMemoryHealth.bind(this),
    });

    // Check de conectividad de base de datos
    this.registerCheck('database', {
      name: 'Database Connectivity',
      description: 'Verificar conectividad de bases de datos',
      critical: true,
      execute: this.checkDatabaseHealth.bind(this),
    });

    // Check de conectividad de Redis
    this.registerCheck('redis', {
      name: 'Redis Connectivity',
      description: 'Verificar conectividad de Redis',
      critical: true,
      execute: this.checkRedisHealth.bind(this),
    });

    // Check de conectividad de Qdrant
    this.registerCheck('qdrant', {
      name: 'Qdrant Connectivity',
      description: 'Verificar conectividad de Qdrant Cloud',
      critical: false,
      execute: this.checkQdrantHealth.bind(this),
    });

    // Check de plugins
    this.registerCheck('plugins', {
      name: 'Plugins Health',
      description: 'Verificar estado de plugins',
      critical: false,
      execute: this.checkPluginsHealth.bind(this),
    });

    // Check de sistema de archivos
    this.registerCheck('filesystem', {
      name: 'Filesystem Health',
      description: 'Verificar espacio en disco y permisos',
      critical: true,
      execute: this.checkFilesystemHealth.bind(this),
    });

    // Check de CPU
    this.registerCheck('cpu', {
      name: 'CPU Health',
      description: 'Verificar uso de CPU',
      critical: false,
      execute: this.checkCpuHealth.bind(this),
    });
  }

  /**
   * Configurar manejadores de eventos
   */
  setupEventHandlers() {
    this.on('checkFailed', (checkName, error) => {
      console.error(`❌ Health check falló: ${checkName}`, error.message);
    });

    this.on('checkPassed', (checkName, result) => {
      console.log(`✅ Health check pasó: ${checkName}`);
    });

    this.on('healthChanged', overallHealth => {
      console.log(`🏥 Estado de salud general: ${overallHealth}`);
    });
  }

  /**
   * Registrar un health check
   */
  registerCheck(name, check) {
    if (!check.name || !check.execute) {
      throw new Error('Health check debe tener name y execute');
    }

    this.checks.set(name, {
      name: check.name,
      description: check.description || '',
      critical: check.critical || false,
      execute: check.execute,
      timeout: check.timeout || this.config.timeout,
      retries: check.retries || this.config.retries,
    });

    console.log(`📋 Health check registrado: ${name}`);
  }

  /**
   * Ejecutar un health check específico
   */
  async runCheck(name, options = {}) {
    const check = this.checks.get(name);
    if (!check) {
      throw new Error(`Health check no encontrado: ${name}`);
    }

    const startTime = Date.now();
    let lastError = null;

    // Reintentar si es necesario
    for (let attempt = 1; attempt <= check.retries; attempt++) {
      try {
        const result = await Promise.race([
          check.execute(options),
          this.timeoutPromise(check.timeout),
        ]);

        const duration = Date.now() - startTime;
        const checkResult = {
          name,
          status: 'healthy',
          result,
          duration,
          timestamp: new Date().toISOString(),
          attempts: attempt,
        };

        this.results.set(name, checkResult);
        this.emit('checkPassed', name, checkResult);

        return checkResult;
      } catch (error) {
        lastError = error;

        if (attempt < check.retries) {
          console.warn(
            `⚠️ Health check ${name} falló (intento ${attempt}/${check.retries}), reintentando...`
          );
          await this.delay(check.retryDelay);
        }
      }
    }

    // Si todos los intentos fallaron
    const duration = Date.now() - startTime;
    const checkResult = {
      name,
      status: 'unhealthy',
      error: lastError.message,
      duration,
      timestamp: new Date().toISOString(),
      attempts: check.retries,
    };

    this.results.set(name, checkResult);
    this.emit('checkFailed', name, lastError);

    return checkResult;
  }

  /**
   * Ejecutar todos los health checks
   */
  async runAllChecks(options = {}) {
    if (!this.isInitialized) {
      throw new Error('HealthChecker no está inicializado');
    }

    console.log('🏥 Ejecutando todos los health checks...');

    const startTime = Date.now();
    const results = new Map();
    const promises = [];

    // Ejecutar todos los checks en paralelo
    for (const [name, check] of this.checks) {
      promises.push(
        this.runCheck(name, options).catch(error => ({
          name,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString(),
        }))
      );
    }

    const checkResults = await Promise.all(promises);

    // Procesar resultados
    for (const result of checkResults) {
      results.set(result.name, result);
    }

    const overallHealth = this.calculateOverallHealth(results);
    const duration = Date.now() - startTime;

    const summary = {
      timestamp: new Date().toISOString(),
      duration,
      overallHealth,
      totalChecks: results.size,
      healthyChecks: Array.from(results.values()).filter(r => r.status === 'healthy').length,
      unhealthyChecks: Array.from(results.values()).filter(r => r.status === 'unhealthy').length,
      results: Object.fromEntries(results),
    };

    this.emit('allChecksCompleted', summary);

    return summary;
  }

  /**
   * Iniciar monitoreo continuo
   */
  startMonitoring() {
    if (this.isRunning) {
      console.warn('⚠️ Health monitoring ya está ejecutándose');
      return;
    }

    if (!this.isInitialized) {
      throw new Error('HealthChecker no está inicializado');
    }

    console.log(`🏥 Iniciando monitoreo de salud (intervalo: ${this.config.interval}ms)`);

    this.isRunning = true;
    this.intervalId = setInterval(async () => {
      try {
        await this.runAllChecks();
      } catch (error) {
        console.error('❌ Error en monitoreo de salud:', error);
        this.emit('monitoringError', error);
      }
    }, this.config.interval);

    this.emit('monitoringStarted');
  }

  /**
   * Detener monitoreo continuo
   */
  stopMonitoring() {
    if (!this.isRunning) {
      console.warn('⚠️ Health monitoring no está ejecutándose');
      return;
    }

    console.log('🛑 Deteniendo monitoreo de salud');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    this.emit('monitoringStopped');
  }

  /**
   * Calcular salud general
   */
  calculateOverallHealth(results) {
    const checks = Array.from(results.values());
    const criticalChecks = checks.filter(c => this.checks.get(c.name)?.critical);
    const nonCriticalChecks = checks.filter(c => !this.checks.get(c.name)?.critical);

    // Si algún check crítico falla, la salud general es crítica
    const criticalFailures = criticalChecks.filter(c => c.status !== 'healthy');
    if (criticalFailures.length > 0) {
      return 'critical';
    }

    // Si más del 50% de checks no críticos fallan, es warning
    const nonCriticalFailures = nonCriticalChecks.filter(c => c.status !== 'healthy');
    if (nonCriticalFailures.length > nonCriticalChecks.length * 0.5) {
      return 'warning';
    }

    // Si hay algunos fallos, es degraded
    if (nonCriticalFailures.length > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Check de salud de memoria
   */
  async checkMemoryHealth() {
    const usage = process.memoryUsage();
    const heapUsagePercent = (usage.heapUsed / usage.heapTotal) * 100;
    const rssMB = usage.rss / 1024 / 1024;

    const thresholds = {
      heap: 90,
      rss: 1024, // 1GB
    };

    const issues = [];

    if (heapUsagePercent > thresholds.heap) {
      issues.push(`Heap usage alto: ${heapUsagePercent.toFixed(1)}%`);
    }

    if (rssMB > thresholds.rss) {
      issues.push(`RSS memory alto: ${rssMB.toFixed(1)}MB`);
    }

    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      heapUsagePercent,
      rss: usage.rss,
      rssMB,
      external: usage.external,
      issues,
      status: issues.length === 0 ? 'healthy' : 'warning',
    };
  }

  /**
   * Check de salud de base de datos
   */
  async checkDatabaseHealth() {
    const dbConfig = {
      host: process.env.PG_HOST || 'localhost',
      port: process.env.PG_PORT || '5433',
      database: process.env.PG_DATABASE || 'surprise_metrics',
    };

    try {
      // Simular conexión a PostgreSQL
      const isConnected = await this.testTcpConnection(dbConfig.host, dbConfig.port);

      if (!isConnected) {
        throw new Error(`No se puede conectar a PostgreSQL en ${dbConfig.host}:${dbConfig.port}`);
      }

      return {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        connected: true,
        status: 'healthy',
      };
    } catch (error) {
      throw new Error(`Database health check falló: ${error.message}`);
    }
  }

  /**
   * Check de salud de Redis
   */
  async checkRedisHealth() {
    const redisConfigs = [
      { name: 'Cache', host: 'localhost', port: 6379 },
      { name: 'Core', host: 'localhost', port: 6380 },
    ];

    const results = [];

    for (const config of redisConfigs) {
      try {
        const isConnected = await this.testTcpConnection(config.host, config.port);
        results.push({
          name: config.name,
          host: config.host,
          port: config.port,
          connected: isConnected,
          status: isConnected ? 'healthy' : 'unhealthy',
        });
      } catch (error) {
        results.push({
          name: config.name,
          host: config.host,
          port: config.port,
          connected: false,
          error: error.message,
          status: 'unhealthy',
        });
      }
    }

    const allConnected = results.every(r => r.connected);

    return {
      instances: results,
      allConnected,
      status: allConnected ? 'healthy' : 'unhealthy',
    };
  }

  /**
   * Check de salud de Qdrant
   */
  async checkQdrantHealth() {
    const qdrantUrl =
      process.env.QDRANT_URL ||
      'https://9e22d768-dc1a-4338-a713-4c6c37703dbb.us-west-1-0.aws.cloud.qdrant.io';
    const apiKey = process.env.QDRANT_CLUSTER_TOKEN;

    try {
      const response = await fetch(`${qdrantUrl}/readyz`, {
        method: 'GET',
        headers: {
          'api-key': apiKey,
        },
        timeout: 5000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        url: qdrantUrl,
        connected: true,
        status: data.status === 'ok' ? 'healthy' : 'unhealthy',
        response: data,
      };
    } catch (error) {
      throw new Error(`Qdrant health check falló: ${error.message}`);
    }
  }

  /**
   * Check de salud de plugins
   */
  async checkPluginsHealth() {
    // Simular verificación de plugins
    const pluginStatus = {
      'memory-analyzer': { loaded: true, healthy: true },
      'performance-monitor': { loaded: true, healthy: true },
      'diagnostic-tool': { loaded: true, healthy: true },
    };

    const loadedPlugins = Object.keys(pluginStatus).length;
    const healthyPlugins = Object.values(pluginStatus).filter(p => p.healthy).length;

    return {
      totalPlugins: loadedPlugins,
      healthyPlugins,
      unhealthyPlugins: loadedPlugins - healthyPlugins,
      plugins: pluginStatus,
      status: healthyPlugins === loadedPlugins ? 'healthy' : 'warning',
    };
  }

  /**
   * Check de salud del sistema de archivos
   */
  async checkFilesystemHealth() {
    try {
      const logDir = path.join(__dirname, '../logs');
      const configDir = path.join(__dirname, '../config');

      // Verificar que los directorios existen y son escribibles
      await fs.access(logDir, fs.constants.W_OK);
      await fs.access(configDir, fs.constants.R_OK);

      // Simular verificación de espacio en disco
      const diskUsage = {
        total: 100 * 1024 * 1024 * 1024, // 100GB
        used: 75 * 1024 * 1024 * 1024, // 75GB
        free: 25 * 1024 * 1024 * 1024, // 25GB
      };

      const freePercent = (diskUsage.free / diskUsage.total) * 100;
      const issues = [];

      if (freePercent < 10) {
        issues.push(`Espacio en disco bajo: ${freePercent.toFixed(1)}%`);
      }

      return {
        logDir: { exists: true, writable: true },
        configDir: { exists: true, readable: true },
        diskUsage,
        freePercent,
        issues,
        status: issues.length === 0 ? 'healthy' : 'warning',
      };
    } catch (error) {
      throw new Error(`Filesystem health check falló: ${error.message}`);
    }
  }

  /**
   * Check de salud de CPU
   */
  async checkCpuHealth() {
    // Simular verificación de CPU
    const cpuUsage = Math.random() * 100; // 0-100%
    const loadAverage = [0.5, 0.7, 0.8]; // 1min, 5min, 15min

    const issues = [];

    if (cpuUsage > 90) {
      issues.push(`CPU usage alto: ${cpuUsage.toFixed(1)}%`);
    }

    if (loadAverage[0] > 2.0) {
      issues.push(`Load average alto: ${loadAverage[0]}`);
    }

    return {
      usage: cpuUsage,
      loadAverage,
      issues,
      status: issues.length === 0 ? 'healthy' : 'warning',
    };
  }

  /**
   * Test de conexión TCP
   */
  async testTcpConnection(host, port) {
    const { createConnection } = await import('net');
    return new Promise(resolve => {
      const socket = createConnection({ host, port });

      const timeout = setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, 5000);

      socket.connect(port, host, () => {
        clearTimeout(timeout);
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
  }

  /**
   * Promise con timeout
   */
  timeoutPromise(ms) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), ms);
    });
  }

  /**
   * Delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtener estado actual de salud
   */
  getHealthStatus() {
    const results = Array.from(this.results.values());
    const overallHealth = this.calculateOverallHealth(this.results);

    return {
      overallHealth,
      isRunning: this.isRunning,
      totalChecks: this.checks.size,
      lastResults: results,
      summary: {
        healthy: results.filter(r => r.status === 'healthy').length,
        unhealthy: results.filter(r => r.status === 'unhealthy').length,
        critical: results.filter(r => this.checks.get(r.name)?.critical && r.status !== 'healthy')
          .length,
      },
    };
  }

  /**
   * Obtener estadísticas
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      totalChecks: this.checks.size,
      config: this.config,
      lastHealthStatus: this.getHealthStatus(),
    };
  }

  /**
   * Limpiar recursos
   */
  async cleanup() {
    console.log('🧹 Limpiando sistema de health checks...');

    this.stopMonitoring();
    this.checks.clear();
    this.results.clear();
    this.isInitialized = false;

    console.log('✅ Sistema de health checks limpiado');
  }
}

export default HealthChecker;
