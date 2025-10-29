/**
 * MemTech Dashboard Server v2.1
 * Servidor web para mostrar dashboard en tiempo real
 */

import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MonitoringSystem } from './monitoring-system.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class DashboardServer {
  constructor(options = {}) {
    this.config = {
      port: options.port || 3000,
      host: options.host || 'localhost',
      dashboardPath: options.dashboardPath || join(__dirname, '../../dashboards'),
      ...options,
    };

    this.server = null;
    this.monitoring = null;
    this.isRunning = false;
  }

  async initialize() {
    console.log('🔧 Inicializando Dashboard Server...');

    // Inicializar sistema de monitoreo
    this.monitoring = new MonitoringSystem({
      enableMetrics: true,
      enableAlerts: true,
      enableDashboard: true,
      metricsInterval: 1000,
      dashboardInterval: 2000,
    });

    await this.monitoring.initialize();
    await this.monitoring.start();

    // Crear servidor HTTP
    this.server = createServer((req, res) => {
      this.handleRequest(req, res);
    });

    console.log('✅ Dashboard Server inicializado');
  }

  async start() {
    if (this.isRunning) {
      console.log('🔍 Dashboard Server ya está ejecutándose');
      return;
    }

    await this.initialize();

    return new Promise((resolve, reject) => {
      this.server.listen(this.config.port, this.config.host, err => {
        if (err) {
          console.error('❌ Error iniciando servidor:', err);
          reject(err);
          return;
        }

        this.isRunning = true;
        console.log(
          `🚀 Dashboard Server ejecutándose en http://${this.config.host}:${this.config.port}`
        );
        console.log(`📊 Dashboard: http://${this.config.host}:${this.config.port}/dashboard`);
        console.log(`📈 API: http://${this.config.host}:${this.config.port}/api/metrics`);
        console.log(`🔔 Alertas: http://${this.config.host}:${this.config.port}/api/alerts`);

        resolve();
      });
    });
  }

  async stop() {
    if (!this.isRunning) {
      console.log('🔍 Dashboard Server no está ejecutándose');
      return;
    }

    return new Promise(resolve => {
      this.server.close(() => {
        this.isRunning = false;
        console.log('🛑 Dashboard Server detenido');
        resolve();
      });
    });
  }

  async handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      if (pathname === '/') {
        await this.serveDashboard(res);
      } else if (pathname === '/dashboard') {
        await this.serveDashboard(res);
      } else if (pathname === '/api/metrics') {
        await this.serveMetrics(res);
      } else if (pathname === '/api/alerts') {
        await this.serveAlerts(res);
      } else if (pathname === '/api/health') {
        await this.serveHealth(res);
      } else if (pathname === '/api/status') {
        await this.serveStatus(res);
      } else if (pathname.startsWith('/static/')) {
        await this.serveStatic(req, res);
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
      // Usar dashboard estable
      const htmlPath = join(__dirname, 'stable-dashboard.html');
      const html = await readFile(htmlPath, 'utf8');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (error) {
      console.error('❌ Error sirviendo dashboard:', error);
      this.serve500(res, error);
    }
  }

  enhanceDashboard(html) {
    // Agregar auto-refresh y mejoras de UX
    const enhancedHtml = html.replace(
      '</body>',
      `
      <script>
        // Auto-refresh cada 5 segundos
        setInterval(async () => {
          try {
            const response = await fetch('/api/metrics');
            const data = await response.json();
            updateDashboard(data);
          } catch (error) {
            console.error('Error actualizando métricas:', error);
          }
        }, 5000);

        // Función para actualizar dashboard
        function updateDashboard(data) {
          // Actualizar métricas
          if (data.gauges) {
            updateElement('throughput', data.gauges.throughput + ' artifacts/seg');
            updateElement('memory_usage', data.gauges.memory_usage + 'MB');
            updateElement('active_connections', data.gauges.active_connections);
            updateElement('queue_size', data.gauges.queue_size);
          }
          
          if (data.counters) {
            updateElement('total_processed', data.counters.total_artifacts_processed);
            updateElement('successful', data.counters.successful_artifacts);
            updateElement('failed', data.counters.failed_artifacts);
          }
          
          // Actualizar timestamp
          updateElement('last_update', new Date().toLocaleString());
        }

        function updateElement(id, value) {
          const element = document.getElementById(id);
          if (element) {
            element.textContent = value;
          }
        }

        // Cargar métricas iniciales
        fetch('/api/metrics')
          .then(response => response.json())
          .then(data => updateDashboard(data))
          .catch(error => console.error('Error cargando métricas iniciales:', error));
      </script>
      </body>`
    );

    return enhancedHtml;
  }

  async serveMetrics(res) {
    try {
      const metrics = this.monitoring ? this.monitoring.getCurrentMetrics() : null;
      const health = this.monitoring ? this.monitoring.getHealthSummary() : null;

      // Si no hay métricas del sistema de monitoreo, usar métricas básicas del servidor
      if (!metrics) {
        const basicMetrics = {
          counters: {
            total_artifacts_processed: 0,
            successful_artifacts: 0,
            failed_artifacts: 0,
            admission_validations: 0,
          },
          gauges: {
            throughput: 0,
            response_time: 0,
            memory_usage: process.memoryUsage().heapUsed / 1024 / 1024,
            active_connections: 1,
            queue_size: 0,
          },
          histograms: {
            processing_time: { count: 0, avg: 0, p95: 0, p99: 0 },
            response_time: { count: 0, avg: 0, p95: 0, p99: 0 },
          },
        };

        const response = {
          timestamp: new Date().toISOString(),
          metrics: basicMetrics,
          health: health || { status: 'ok', uptime: process.uptime() },
          status: 'ok',
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
        return;
      }

      const response = {
        timestamp: new Date().toISOString(),
        metrics: metrics || {},
        health: health || {},
        status: 'ok',
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error('❌ Error sirviendo métricas:', error);
      const response = {
        timestamp: new Date().toISOString(),
        metrics: {},
        health: { status: 'error', uptime: 0 },
        status: 'error',
        error: error.message,
      };
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    }
  }

  async serveAlerts(res) {
    try {
      const alerts = this.monitoring ? this.monitoring.getActiveAlerts() : [];
      const alertStats = this.monitoring ? this.monitoring.getAlertStats() : {};

      const response = {
        timestamp: new Date().toISOString(),
        active_alerts: alerts || [],
        stats: alertStats || {},
        status: 'ok',
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error('❌ Error sirviendo alertas:', error);
      const response = {
        timestamp: new Date().toISOString(),
        active_alerts: [],
        stats: {},
        status: 'error',
        error: error.message,
      };
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    }
  }

  async serveHealth(res) {
    try {
      const health = this.monitoring ? this.monitoring.getHealthSummary() : null;

      const response = {
        timestamp: new Date().toISOString(),
        status: health?.status || 'ok',
        uptime: health?.uptime || process.uptime(),
        memory: process.memoryUsage(),
        version: '2.1.0',
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error('❌ Error sirviendo salud:', error);
      const response = {
        timestamp: new Date().toISOString(),
        status: 'error',
        uptime: 0,
        version: '2.1.0',
        error: error.message,
      };
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    }
  }

  async serveStatus(res) {
    const summary = this.monitoring.getSystemSummary();
    const report = this.monitoring.generateStatusReport();

    const response = {
      timestamp: new Date().toISOString(),
      summary: summary,
      report: report,
      status: 'ok',
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
  }

  async serveStatic(req, res) {
    // Servir archivos estáticos (CSS, JS, imágenes)
    const filePath = join(this.config.dashboardPath, req.url.replace('/static/', ''));

    try {
      const content = await readFile(filePath);
      const ext = filePath.split('.').pop();
      const contentType = this.getContentType(ext);

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (error) {
      this.serve404(res);
    }
  }

  getContentType(ext) {
    const types = {
      html: 'text/html',
      css: 'text/css',
      js: 'application/javascript',
      json: 'application/json',
      png: 'image/png',
      jpg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
    };
    return types[ext] || 'text/plain';
  }

  serve404(res) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>404 - Not Found</title></head>
      <body>
        <h1>404 - Página no encontrada</h1>
        <p>La página solicitada no existe.</p>
        <a href="/dashboard">Ir al Dashboard</a>
      </body>
      </html>
    `);
  }

  serve500(res, error) {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>500 - Error del Servidor</title></head>
      <body>
        <h1>500 - Error del Servidor</h1>
        <p>Ha ocurrido un error interno del servidor.</p>
        <pre>${error.message}</pre>
        <a href="/dashboard">Ir al Dashboard</a>
      </body>
      </html>
    `);
  }

  async cleanup() {
    if (this.monitoring) {
      await this.monitoring.cleanup();
    }

    if (this.server && this.isRunning) {
      await this.stop();
    }

    console.log('🧹 Dashboard Server limpiado');
  }
}

// Función para ejecutar el servidor
async function runDashboardServer() {
  const server = new DashboardServer({
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
  });

  try {
    await server.start();

    // Manejar señales de terminación
    process.on('SIGINT', async () => {
      console.log('\n🛑 Recibida señal SIGINT, deteniendo servidor...');
      await server.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Recibida señal SIGTERM, deteniendo servidor...');
      await server.cleanup();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error ejecutando servidor:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runDashboardServer().catch(console.error);
}

export default DashboardServer;
