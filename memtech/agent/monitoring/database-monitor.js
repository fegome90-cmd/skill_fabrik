/**
 * Database Monitor - Monitoreo específico de bases de datos
 * PostgreSQL, Redis, Qdrant
 */

import { EventEmitter } from 'events';
import { Client } from 'pg';
import Redis from 'ioredis';
import { QdrantClient } from '@qdrant/js-client-rest';

export class DatabaseMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      postgres: {
        host: config.postgres?.host || 'localhost',
        port: config.postgres?.port || 5432,
        database: config.postgres?.database || 'memtech',
        user: config.postgres?.user || 'postgres',
        password: config.postgres?.password || 'postgres',
        ...config.postgres,
      },
      redis: {
        host: config.redis?.host || 'localhost',
        port: config.redis?.port || 6379,
        password: config.redis?.password || '',
        ...config.redis,
      },
      qdrant: {
        url: config.qdrant?.url || 'http://localhost:6333',
        apiKey: config.qdrant?.apiKey || '',
        ...config.qdrant,
      },
      checkInterval: config.checkInterval || 10000, // 10 segundos
      timeout: config.timeout || 5000, // 5 segundos timeout
    };

    this.clients = {
      postgres: null,
      redis: null,
      qdrant: null,
    };

    this.status = {
      postgres: { status: 'unknown', lastCheck: null, error: null, metrics: {} },
      redis: { status: 'unknown', lastCheck: null, error: null, metrics: {} },
      qdrant: { status: 'unknown', lastCheck: null, error: null, metrics: {} },
    };

    this.isRunning = false;
    this.checkInterval = null;
  }

  async start() {
    if (this.isRunning) {
      console.log('🔍 Database Monitor ya está ejecutándose');
      return;
    }

    console.log('🚀 Iniciando Database Monitor...');

    try {
      await this.initializeClients();
      await this.performInitialCheck();

      this.isRunning = true;
      this.startPeriodicChecks();

      console.log('✅ Database Monitor iniciado');
      this.emit('started');
    } catch (error) {
      console.error('❌ Error iniciando Database Monitor:', error);
      this.emit('error', { type: 'startup', error });
    }
  }

  async stop() {
    if (!this.isRunning) {
      console.log('🔍 Database Monitor no está ejecutándose');
      return;
    }

    console.log('🛑 Deteniendo Database Monitor...');

    this.isRunning = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    await this.closeClients();

    console.log('✅ Database Monitor detenido');
    this.emit('stopped');
  }

  async initializeClients() {
    // PostgreSQL Client
    try {
      this.clients.postgres = new Client(this.config.postgres);
      await this.clients.postgres.connect();
      console.log('✅ PostgreSQL conectado');
    } catch (error) {
      console.log('⚠️ PostgreSQL no disponible:', error.message);
      this.clients.postgres = null;
    }

    // Redis Client
    try {
      this.clients.redis = new Redis(this.config.redis);
      await this.clients.redis.ping();
      console.log('✅ Redis conectado');
    } catch (error) {
      console.log('⚠️ Redis no disponible:', error.message);
      this.clients.redis = null;
    }

    // Qdrant Client
    try {
      this.clients.qdrant = new QdrantClient(this.config.qdrant);
      await this.clients.qdrant.getCollections();
      console.log('✅ Qdrant conectado');
    } catch (error) {
      console.log('⚠️ Qdrant no disponible:', error.message);
      this.clients.qdrant = null;
    }
  }

  async closeClients() {
    if (this.clients.postgres) {
      try {
        await this.clients.postgres.end();
      } catch (error) {
        console.error('Error cerrando PostgreSQL:', error);
      }
    }

    if (this.clients.redis) {
      try {
        await this.clients.redis.disconnect();
      } catch (error) {
        console.error('Error cerrando Redis:', error);
      }
    }

    // Qdrant no necesita cierre explícito
    this.clients.qdrant = null;
  }

  async performInitialCheck() {
    console.log('🔍 Realizando verificación inicial de bases de datos...');

    const checks = [this.checkPostgreSQL(), this.checkRedis(), this.checkQdrant()];

    await Promise.allSettled(checks);

    this.emit('initial_check_complete', this.status);
  }

  startPeriodicChecks() {
    this.checkInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.performHealthChecks();
      }
    }, this.config.checkInterval);
  }

  async performHealthChecks() {
    const checks = [this.checkPostgreSQL(), this.checkRedis(), this.checkQdrant()];

    await Promise.allSettled(checks);

    this.emit('health_check_complete', this.status);
  }

  async checkPostgreSQL() {
    const startTime = Date.now();

    try {
      if (!this.clients.postgres) {
        this.status.postgres = {
          status: 'disconnected',
          lastCheck: new Date().toISOString(),
          error: 'Client not initialized',
          metrics: {},
        };
        return;
      }

      // Verificar conexión básica
      const result = await Promise.race([
        this.clients.postgres.query('SELECT 1 as test, NOW() as timestamp'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.config.timeout)
        ),
      ]);

      // Obtener métricas detalladas
      const metrics = await this.getPostgreSQLMetrics();

      const responseTime = Date.now() - startTime;

      this.status.postgres = {
        status: 'connected',
        lastCheck: new Date().toISOString(),
        error: null,
        metrics: {
          ...metrics,
          responseTime,
          testQuery: result.rows[0]?.test === 1,
        },
      };
    } catch (error) {
      this.status.postgres = {
        status: 'error',
        lastCheck: new Date().toISOString(),
        error: error.message,
        metrics: { responseTime: Date.now() - startTime },
      };
    }
  }

  async getPostgreSQLMetrics() {
    if (!this.clients.postgres) return {};

    try {
      const queries = [
        // Conexiones activas
        "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active'",

        // Tamaño de la base de datos
        'SELECT pg_size_pretty(pg_database_size(current_database())) as db_size',

        // Tablas y registros
        'SELECT schemaname, tablename, n_tup_ins as inserts, n_tup_upd as updates, n_tup_del as deletes FROM pg_stat_user_tables ORDER BY n_tup_ins DESC LIMIT 5',

        // Índices
        "SELECT count(*) as index_count FROM pg_indexes WHERE schemaname = 'public'",

        // Locks
        'SELECT count(*) as lock_count FROM pg_locks WHERE granted = false',
      ];

      const results = await Promise.allSettled(
        queries.map(query => this.clients.postgres.query(query))
      );

      const metrics = {};

      if (results[0].status === 'fulfilled') {
        metrics.activeConnections = results[0].value.rows[0]?.active_connections || 0;
      }

      if (results[1].status === 'fulfilled') {
        metrics.databaseSize = results[1].value.rows[0]?.db_size || 'Unknown';
      }

      if (results[2].status === 'fulfilled') {
        metrics.tableStats = results[2].value.rows || [];
      }

      if (results[3].status === 'fulfilled') {
        metrics.indexCount = results[3].value.rows[0]?.index_count || 0;
      }

      if (results[4].status === 'fulfilled') {
        metrics.lockCount = results[4].value.rows[0]?.lock_count || 0;
      }

      return metrics;
    } catch (error) {
      return { error: error.message };
    }
  }

  async checkRedis() {
    const startTime = Date.now();

    try {
      if (!this.clients.redis) {
        this.status.redis = {
          status: 'disconnected',
          lastCheck: new Date().toISOString(),
          error: 'Client not initialized',
          metrics: {},
        };
        return;
      }

      // Verificar conexión básica
      const pong = await Promise.race([
        this.clients.redis.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.config.timeout)
        ),
      ]);

      // Obtener métricas detalladas
      const metrics = await this.getRedisMetrics();

      const responseTime = Date.now() - startTime;

      this.status.redis = {
        status: 'connected',
        lastCheck: new Date().toISOString(),
        error: null,
        metrics: {
          ...metrics,
          responseTime,
          ping: pong === 'PONG',
        },
      };
    } catch (error) {
      this.status.redis = {
        status: 'error',
        lastCheck: new Date().toISOString(),
        error: error.message,
        metrics: { responseTime: Date.now() - startTime },
      };
    }
  }

  async getRedisMetrics() {
    if (!this.clients.redis) return {};

    try {
      const info = await this.clients.redis.info();
      const dbSize = await this.clients.redis.dbsize();
      const memory = await this.clients.redis.memory('usage');

      // Parsear información del servidor
      const lines = info.split('\r\n');
      const serverInfo = {};

      lines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          serverInfo[key] = value;
        }
      });

      return {
        version: serverInfo.redis_version || 'Unknown',
        uptime: serverInfo.uptime_in_seconds || 0,
        connectedClients: serverInfo.connected_clients || 0,
        usedMemory: serverInfo.used_memory_human || 'Unknown',
        totalCommands: serverInfo.total_commands_processed || 0,
        keyspaceHits: serverInfo.keyspace_hits || 0,
        keyspaceMisses: serverInfo.keyspace_misses || 0,
        dbSize,
        memoryUsage: memory,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async checkQdrant() {
    const startTime = Date.now();

    try {
      if (!this.clients.qdrant) {
        this.status.qdrant = {
          status: 'disconnected',
          lastCheck: new Date().toISOString(),
          error: 'Client not initialized',
          metrics: {},
        };
        return;
      }

      // Verificar conexión básica
      const collections = await Promise.race([
        this.clients.qdrant.getCollections(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.config.timeout)
        ),
      ]);

      // Obtener métricas detalladas
      const metrics = await this.getQdrantMetrics();

      const responseTime = Date.now() - startTime;

      this.status.qdrant = {
        status: 'connected',
        lastCheck: new Date().toISOString(),
        error: null,
        metrics: {
          ...metrics,
          responseTime,
          collectionsCount: collections.collections?.length || 0,
        },
      };
    } catch (error) {
      this.status.qdrant = {
        status: 'error',
        lastCheck: new Date().toISOString(),
        error: error.message,
        metrics: { responseTime: Date.now() - startTime },
      };
    }
  }

  async getQdrantMetrics() {
    if (!this.clients.qdrant) return {};

    try {
      const collections = await this.clients.qdrant.getCollections();
      const clusterInfo = await this.clients.qdrant.getClusterInfo();

      let totalPoints = 0;
      let totalVectors = 0;

      if (collections.collections) {
        for (const collection of collections.collections) {
          try {
            const info = await this.clients.qdrant.getCollection(collection.name);
            totalPoints += info.points_count || 0;
            totalVectors += info.vectors_count || 0;
          } catch (error) {
            // Ignorar errores de colecciones individuales
          }
        }
      }

      return {
        collections:
          collections.collections?.map(c => ({
            name: c.name,
            status: c.status,
          })) || [],
        totalPoints,
        totalVectors,
        clusterInfo: clusterInfo || {},
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  getStatus() {
    return {
      timestamp: new Date().toISOString(),
      databases: this.status,
      overall: this.getOverallStatus(),
    };
  }

  getOverallStatus() {
    const statuses = Object.values(this.status).map(db => db.status);

    if (statuses.includes('error')) {
      return 'error';
    } else if (statuses.includes('disconnected')) {
      return 'warning';
    } else if (statuses.every(status => status === 'connected')) {
      return 'healthy';
    } else {
      return 'unknown';
    }
  }

  getHealthSummary() {
    const status = this.getStatus();
    const healthy = Object.values(this.status).filter(db => db.status === 'connected').length;
    const total = Object.keys(this.status).length;

    return {
      status: status.overall,
      healthy,
      total,
      databases: Object.entries(this.status).map(([name, db]) => ({
        name,
        status: db.status,
        lastCheck: db.lastCheck,
        responseTime: db.metrics?.responseTime || 0,
      })),
    };
  }
}
