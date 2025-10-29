/**
 * MONITOR AVANZADO DE REDIS
 * Monitoreo continuo de fragmentación, memoria y rendimiento
 * Versión: 1.0.0
 */

import Redis from 'ioredis';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RedisMonitor {
  constructor(options = {}) {
    this.config = {
      cacheUrl: options.cacheUrl || process.env.REDIS_URL_CACHE || 'redis://127.0.0.1:6379',
      coreUrl: options.coreUrl || process.env.REDIS_URL_CORE || 'redis://127.0.0.1:6381',
      interval: options.interval || 5000, // 5 segundos
      alertThresholds: {
        fragmentation: 1.5,
        memoryUsage: 0.8, // 80%
        hitRate: 0.7, // 70%
        responseTime: 100, // 100ms
      },
      logFile:
        options.logFile || path.join(__dirname, '..', '..', '..', 'logs', 'redis-monitor.log'),
      ...options,
    };

    this.connections = {
      cache: null,
      core: null,
    };

    this.metrics = {
      cache: {
        fragmentation: 0,
        memoryUsed: 0,
        memoryPeak: 0,
        hitRate: 0,
        responseTime: 0,
        keysCount: 0,
        lastUpdate: null,
      },
      core: {
        fragmentation: 0,
        memoryUsed: 0,
        memoryPeak: 0,
        hitRate: 0,
        responseTime: 0,
        keysCount: 0,
        lastUpdate: null,
      },
    };

    this.alerts = [];
    this.isRunning = false;
    this.intervalId = null;

    this.initializeConnections();
  }

  async initializeConnections() {
    try {
      // Crear directorio de logs si no existe
      const logDir = path.dirname(this.config.logFile);
      await fs.mkdir(logDir, { recursive: true });

      // Conectar a Redis Cache
      this.connections.cache = new Redis(this.config.cacheUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      // Conectar a Redis Core
      this.connections.core = new Redis(this.config.coreUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      // Conectar inmediatamente
      await this.connections.cache.connect();
      await this.connections.core.connect();

      console.log('✅ RedisMonitor inicializado correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar RedisMonitor:', error.message);
      throw error;
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ RedisMonitor ya está ejecutándose');
      return;
    }

    console.log('🚀 Iniciando monitoreo de Redis...');
    this.isRunning = true;

    // Monitoreo inicial
    await this.collectMetrics();

    // Configurar monitoreo periódico
    this.intervalId = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.checkAlerts();
        await this.logMetrics();
      } catch (error) {
        console.error('❌ Error en monitoreo:', error.message);
        await this.logError(error);
      }
    }, this.config.interval);

    console.log(`✅ Monitoreo iniciado (intervalo: ${this.config.interval}ms)`);
  }

  async stop() {
    if (!this.isRunning) {
      console.log('⚠️ RedisMonitor no está ejecutándose');
      return;
    }

    console.log('🛑 Deteniendo monitoreo de Redis...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Cerrar conexiones
    if (this.connections.cache) {
      this.connections.cache.disconnect();
    }
    if (this.connections.core) {
      this.connections.core.disconnect();
    }

    console.log('✅ Monitoreo detenido');
  }

  async collectMetrics() {
    const startTime = Date.now();

    try {
      // Recolectar métricas de Redis Cache
      await this.collectRedisMetrics('cache', this.connections.cache);

      // Recolectar métricas de Redis Core
      await this.collectRedisMetrics('core', this.connections.core);

      const duration = Date.now() - startTime;
      console.log(`📊 Métricas recolectadas en ${duration}ms`);
    } catch (error) {
      console.error('❌ Error al recolectar métricas:', error.message);
      throw error;
    }
  }

  async collectRedisMetrics(instance, connection) {
    try {
      const startTime = Date.now();

      // Verificar que la conexión existe
      if (!connection) {
        throw new Error(`Conexión ${instance} no inicializada`);
      }

      // Conectar si no está conectado
      if (connection.status !== 'ready') {
        await connection.connect();
      }

      // Ping para verificar conectividad
      await connection.ping();

      // Obtener información de memoria
      const memoryInfo = await connection.info('memory');
      const statsInfo = await connection.info('stats');
      const keyspaceInfo = await connection.info('keyspace');

      // Parsear información de memoria
      const memoryData = this.parseInfoOutput(memoryInfo);
      const statsData = this.parseInfoOutput(statsInfo);
      const keyspaceData = this.parseInfoOutput(keyspaceInfo);

      // Calcular métricas
      const fragmentation = memoryData.mem_fragmentation_ratio || 1.0;
      const memoryUsed = memoryData.used_memory || 0;
      const memoryPeak = memoryData.used_memory_peak || 0;
      const keysCount = this.getKeysCount(keyspaceData);

      // Calcular hit rate
      const hits = statsData.keyspace_hits || 0;
      const misses = statsData.keyspace_misses || 0;
      const hitRate = hits + misses > 0 ? hits / (hits + misses) : 0;

      // Tiempo de respuesta
      const responseTime = Date.now() - startTime;

      // Actualizar métricas
      this.metrics[instance] = {
        fragmentation: parseFloat(fragmentation.toFixed(3)),
        memoryUsed: memoryUsed,
        memoryPeak: memoryPeak,
        hitRate: parseFloat(hitRate.toFixed(3)),
        responseTime: responseTime,
        keysCount: keysCount,
        lastUpdate: new Date().toISOString(),
      };

      console.log(
        `📊 ${instance.toUpperCase()}: frag=${fragmentation.toFixed(2)}, mem=${(memoryUsed / 1024 / 1024).toFixed(1)}MB, hit=${(hitRate * 100).toFixed(1)}%`
      );
    } catch (error) {
      console.error(`❌ Error al recolectar métricas de ${instance}:`, error.message);
      throw error;
    }
  }

  parseInfoOutput(infoString) {
    const data = {};
    const lines = infoString.split('\n');

    for (const line of lines) {
      if (line.includes(':') && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        data[key.trim()] = value.trim();
      }
    }

    return data;
  }

  getKeysCount(keyspaceData) {
    let totalKeys = 0;

    for (const [db, info] of Object.entries(keyspaceData)) {
      if (db.startsWith('db')) {
        const keysMatch = info.match(/keys=(\d+)/);
        if (keysMatch) {
          totalKeys += parseInt(keysMatch[1]);
        }
      }
    }

    return totalKeys;
  }

  async checkAlerts() {
    const alerts = [];

    // Verificar alertas para Redis Cache
    const cacheAlerts = this.checkInstanceAlerts('cache', this.metrics.cache);
    alerts.push(...cacheAlerts);

    // Verificar alertas para Redis Core
    const coreAlerts = this.checkInstanceAlerts('core', this.metrics.core);
    alerts.push(...coreAlerts);

    // Procesar alertas
    for (const alert of alerts) {
      await this.processAlert(alert);
    }
  }

  checkInstanceAlerts(instance, metrics) {
    const alerts = [];
    const thresholds = this.config.alertThresholds;

    // Alerta de fragmentación
    if (metrics.fragmentation > thresholds.fragmentation) {
      alerts.push({
        instance,
        type: 'fragmentation',
        severity: 'HIGH',
        message: `Fragmentación alta en ${instance}: ${metrics.fragmentation} > ${thresholds.fragmentation}`,
        value: metrics.fragmentation,
        threshold: thresholds.fragmentation,
        timestamp: new Date().toISOString(),
      });
    }

    // Alerta de uso de memoria (si hay límite configurado)
    if (metrics.memoryPeak > 0) {
      const memoryUsage = metrics.memoryUsed / metrics.memoryPeak;
      if (memoryUsage > thresholds.memoryUsage) {
        alerts.push({
          instance,
          type: 'memory_usage',
          severity: 'HIGH',
          message: `Uso de memoria alto en ${instance}: ${(memoryUsage * 100).toFixed(1)}% > ${thresholds.memoryUsage * 100}%`,
          value: memoryUsage,
          threshold: thresholds.memoryUsage,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Alerta de hit rate bajo
    if (metrics.hitRate < thresholds.hitRate) {
      alerts.push({
        instance,
        type: 'hit_rate',
        severity: 'MEDIUM',
        message: `Hit rate bajo en ${instance}: ${(metrics.hitRate * 100).toFixed(1)}% < ${thresholds.hitRate * 100}%`,
        value: metrics.hitRate,
        threshold: thresholds.hitRate,
        timestamp: new Date().toISOString(),
      });
    }

    // Alerta de tiempo de respuesta alto
    if (metrics.responseTime > thresholds.responseTime) {
      alerts.push({
        instance,
        type: 'response_time',
        severity: 'MEDIUM',
        message: `Tiempo de respuesta alto en ${instance}: ${metrics.responseTime}ms > ${thresholds.responseTime}ms`,
        value: metrics.responseTime,
        threshold: thresholds.responseTime,
        timestamp: new Date().toISOString(),
      });
    }

    return alerts;
  }

  async processAlert(alert) {
    // Agregar a lista de alertas
    this.alerts.push(alert);

    // Mantener solo las últimas 100 alertas
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Log de alerta
    const alertMessage = `🚨 ALERTA ${alert.severity}: ${alert.message}`;
    console.log(alertMessage);

    // Escribir a archivo de log
    await this.logAlert(alert);

    // Aquí se pueden agregar más acciones como notificaciones por email, Slack, etc.
  }

  async logMetrics() {
    const logEntry = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      alerts: this.alerts.slice(-10), // Últimas 10 alertas
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    await fs.appendFile(this.config.logFile, logLine);
  }

  async logAlert(alert) {
    const alertLogFile = this.config.logFile.replace('.log', '-alerts.log');
    const alertLine = JSON.stringify(alert) + '\n';
    await fs.appendFile(alertLogFile, alertLine);
  }

  async logError(error) {
    const errorLogFile = this.config.logFile.replace('.log', '-errors.log');
    const errorEntry = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
    };
    const errorLine = JSON.stringify(errorEntry) + '\n';
    await fs.appendFile(errorLogFile, errorLine);
  }

  getMetrics() {
    return {
      timestamp: new Date().toISOString(),
      isRunning: this.isRunning,
      metrics: this.metrics,
      alerts: this.alerts.slice(-20), // Últimas 20 alertas
      config: {
        interval: this.config.interval,
        alertThresholds: this.config.alertThresholds,
      },
    };
  }

  getHealthStatus() {
    const status = {
      overall: 'healthy',
      instances: {},
      alerts: this.alerts.filter(a => a.timestamp > new Date(Date.now() - 300000).toISOString()), // Últimos 5 minutos
    };

    // Evaluar estado de cada instancia
    for (const [instance, metrics] of Object.entries(this.metrics)) {
      const instanceStatus = this.evaluateInstanceHealth(instance, metrics);
      status.instances[instance] = instanceStatus;

      if (instanceStatus.status === 'unhealthy') {
        status.overall = 'unhealthy';
      } else if (instanceStatus.status === 'warning' && status.overall === 'healthy') {
        status.overall = 'warning';
      }
    }

    return status;
  }

  evaluateInstanceHealth(instance, metrics) {
    const thresholds = this.config.alertThresholds;
    let status = 'healthy';
    const issues = [];

    if (metrics.fragmentation > thresholds.fragmentation) {
      status = 'unhealthy';
      issues.push(`Fragmentación alta: ${metrics.fragmentation}`);
    }

    if (metrics.hitRate < thresholds.hitRate) {
      status = status === 'healthy' ? 'warning' : status;
      issues.push(`Hit rate bajo: ${(metrics.hitRate * 100).toFixed(1)}%`);
    }

    if (metrics.responseTime > thresholds.responseTime) {
      status = status === 'healthy' ? 'warning' : status;
      issues.push(`Tiempo de respuesta alto: ${metrics.responseTime}ms`);
    }

    return {
      status,
      issues,
      lastUpdate: metrics.lastUpdate,
    };
  }

  async cleanup() {
    await this.stop();
    console.log('🧹 RedisMonitor limpiado');
  }
}

export default RedisMonitor;
