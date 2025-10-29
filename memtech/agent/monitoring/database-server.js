/**
 * Database Server - Servidor específico para monitoreo de bases de datos
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DatabaseMonitor } from './database-monitor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class DatabaseServer {
  constructor(config = {}) {
    this.config = {
      port: config.port || 3001,
      host: config.host || 'localhost',
      ...config,
    };

    this.server = null;
    this.databaseMonitor = null;
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      console.log('🔍 Database Server ya está ejecutándose');
      return;
    }

    console.log('🚀 Iniciando Database Server...');

    try {
      // Inicializar monitor de bases de datos
      this.databaseMonitor = new DatabaseMonitor({
        postgres: {
          host: process.env.POSTGRES_HOST || 'localhost',
          port: process.env.POSTGRES_PORT || 5432,
          database: process.env.POSTGRES_DB || 'memtech',
          user: process.env.POSTGRES_USER || 'postgres',
          password: process.env.POSTGRES_PASSWORD || 'postgres',
        },
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD || '',
        },
        qdrant: {
          url: process.env.QDRANT_URL || 'http://localhost:6333',
          apiKey: process.env.QDRANT_API_KEY || '',
        },
        checkInterval: 10000, // 10 segundos
      });

      await this.databaseMonitor.start();

      // Crear servidor HTTP
      this.server = createServer((req, res) => {
        this.handleRequest(req, res);
      });

      // Iniciar servidor
      await new Promise((resolve, reject) => {
        this.server.listen(this.config.port, this.config.host, err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      this.isRunning = true;

      console.log('✅ Database Server iniciado');
      console.log(`🌐 Dashboard: http://${this.config.host}:${this.config.port}/dashboard`);
      console.log(`📊 API: http://${this.config.host}:${this.config.port}/api/databases`);

      // Configurar manejo de señales
      this.setupSignalHandlers();
    } catch (error) {
      console.error('❌ Error iniciando Database Server:', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) {
      console.log('🔍 Database Server no está ejecutándose');
      return;
    }

    console.log('🛑 Deteniendo Database Server...');

    this.isRunning = false;

    if (this.databaseMonitor) {
      await this.databaseMonitor.stop();
    }

    if (this.server) {
      await new Promise(resolve => {
        this.server.close(resolve);
      });
    }

    console.log('✅ Database Server detenido');
  }

  setupCORS(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  async handleRequest(req, res) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathname = url.pathname;

      // Configurar CORS
      this.setupCORS(res);

      // Manejar preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Rutas
      if (pathname === '/dashboard' || pathname === '/') {
        await this.serveDashboard(res);
      } else if (pathname === '/api/databases') {
        await this.serveDatabases(res);
      } else if (pathname === '/api/health') {
        await this.serveHealth(res);
      } else if (pathname === '/api/status') {
        await this.serveStatus(res);
      } else {
        this.serve404(res);
      }
    } catch (error) {
      console.error('❌ Error manejando request:', error);
      this.serve500(res, error);
    }
  }

  async serveDashboard(res) {
    try {
      const dashboardPath = join(__dirname, 'database-dashboard.html');
      const html = readFileSync(dashboardPath, 'utf8');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (error) {
      console.error('❌ Error sirviendo dashboard:', error);
      this.serve500(res, error);
    }
  }

  async serveDatabases(res) {
    try {
      if (!this.databaseMonitor) {
        const response = {
          timestamp: new Date().toISOString(),
          databases: {},
          overall: 'unknown',
          error: 'Database monitor not initialized',
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
        return;
      }

      const status = this.databaseMonitor.getStatus();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status, null, 2));
    } catch (error) {
      console.error('❌ Error sirviendo databases:', error);
      const response = {
        timestamp: new Date().toISOString(),
        databases: {},
        overall: 'error',
        error: error.message,
      };

      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    }
  }

  async serveHealth(res) {
    try {
      if (!this.databaseMonitor) {
        const response = {
          status: 'unknown',
          timestamp: new Date().toISOString(),
          uptime: 0,
          databases: {},
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
        return;
      }

      const health = this.databaseMonitor.getHealthSummary();
      const response = {
        ...health,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error('❌ Error sirviendo health:', error);
      const response = {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: 0,
        error: error.message,
      };

      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    }
  }

  async serveStatus(res) {
    try {
      if (!this.databaseMonitor) {
        const response = {
          status: 'unknown',
          timestamp: new Date().toISOString(),
          databases: {},
          overall: 'unknown',
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
        return;
      }

      const status = this.databaseMonitor.getStatus();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status, null, 2));
    } catch (error) {
      console.error('❌ Error sirviendo status:', error);
      const response = {
        status: 'error',
        timestamp: new Date().toISOString(),
        databases: {},
        overall: 'error',
        error: error.message,
      };

      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    }
  }

  serve404(res) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify(
        {
          error: '404 - Página no encontrada',
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    );
  }

  serve500(res, error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify(
        {
          error: '500 - Error interno del servidor',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    );
  }

  setupSignalHandlers() {
    process.on('SIGINT', async () => {
      console.log('\n🛑 Recibida señal SIGINT, deteniendo servidor...');
      await this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Recibida señal SIGTERM, deteniendo servidor...');
      await this.stop();
      process.exit(0);
    });
  }

  async cleanup() {
    console.log('🧹 Limpiando Database Server...');
    await this.stop();
    console.log('✅ Database Server limpiado');
  }
}
